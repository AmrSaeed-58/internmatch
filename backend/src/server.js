require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const employerRoutes = require('./routes/employerRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const messageRoutes = require('./routes/messageRoutes');
const skillRoutes = require('./routes/skillRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// --- Middleware ---
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  // Expose Content-Disposition so the frontend can read the original
  // filename/extension when downloading resumes, CSV reports, etc.
  exposedHeaders: ['Content-Disposition'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Ensure upload subdirectories exist
['resumes', 'profiles', 'logos'].forEach((dir) => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'InternMatch API is running' });
});

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// --- Central Error Handler ---
app.use(errorHandler);

// --- Socket.IO Authentication & Events ---
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT user_id, full_name, role, is_active, token_version FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return next(new Error('User not found'));
    }

    const user = rows[0];

    if (!user.is_active) {
      return next(new Error('Account deactivated'));
    }

    if (user.token_version !== decoded.tokenVersion) {
      return next(new Error('Session expired'));
    }

    socket.userId = user.user_id;
    socket.userRole = user.role;
    socket.userName = user.full_name;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join user-specific room for multi-tab support
  socket.join(`user:${socket.userId}`);

  socket.on('message:send', async ({ conversationId, content }) => {
    if (!content || !content.trim() || !conversationId) return;

    try {
      // Verify participant
      const [conv] = await pool.execute(
        'SELECT student_user_id, employer_user_id FROM conversation WHERE conversation_id = ?',
        [String(conversationId)]
      );
      if (conv.length === 0) return;

      const { student_user_id, employer_user_id } = conv[0];
      if (student_user_id !== socket.userId && employer_user_id !== socket.userId) return;

      const otherUserId = student_user_id === socket.userId ? employer_user_id : student_user_id;
      const [otherUser] = await pool.execute(
        'SELECT is_active FROM users WHERE user_id = ?',
        [String(otherUserId)]
      );
      if (otherUser.length === 0 || !otherUser[0].is_active) return;

      // Save message
      const [result] = await pool.execute(
        'INSERT INTO message (conversation_id, sender_user_id, content) VALUES (?, ?, ?)',
        [String(conversationId), String(socket.userId), content.trim()]
      );

      const messageData = {
        messageId: result.insertId,
        conversationId,
        senderUserId: socket.userId,
        senderName: socket.userName,
        content: content.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Send to both parties (including sender for multi-tab)
      io.to(`user:${socket.userId}`).to(`user:${otherUserId}`).emit('message:receive', messageData);

      // Create + push notification
      pool.execute(
        `INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
         VALUES (?, 'new_message', 'New Message', ?, ?, 'conversation')`,
        [String(otherUserId), `New message from ${socket.userName}`, String(conversationId)]
      ).catch(() => {});

      io.to(`user:${otherUserId}`).emit('notification:new', {
        type: 'new_message',
        title: 'New Message',
        message: `New message from ${socket.userName}`,
        referenceId: conversationId,
        referenceType: 'conversation',
      });
    } catch (err) {
      console.error('[Socket.IO] message:send error:', err.message);
    }
  });

  socket.on('message:read', async ({ conversationId }) => {
    if (!conversationId) return;
    try {
      const [conv] = await pool.execute(
        'SELECT student_user_id, employer_user_id FROM conversation WHERE conversation_id = ?',
        [String(conversationId)]
      );
      if (conv.length === 0) return;

      const { student_user_id, employer_user_id } = conv[0];
      if (student_user_id !== socket.userId && employer_user_id !== socket.userId) return;

      await pool.execute(
        'UPDATE message SET is_read = 1 WHERE conversation_id = ? AND sender_user_id != ? AND is_read = 0',
        [String(conversationId), String(socket.userId)]
      );

      const otherUserId = student_user_id === socket.userId ? employer_user_id : student_user_id;
      io.to(`user:${otherUserId}`).emit('message:read', { conversationId });
    } catch (err) {
      console.error('[Socket.IO] message:read error:', err.message);
    }
  });

  // Resolve the other party's user id from a conversation, then forward
  // the typing event to their personal room. Earlier code emitted to
  // `user:${conversationId}` which is never a real user room.
  async function emitTyping(eventName, conversationId) {
    if (!conversationId) return;
    try {
      const [conv] = await pool.execute(
        'SELECT student_user_id, employer_user_id FROM conversation WHERE conversation_id = ?',
        [String(conversationId)]
      );
      if (conv.length === 0) return;
      const { student_user_id, employer_user_id } = conv[0];
      if (student_user_id !== socket.userId && employer_user_id !== socket.userId) return;
      const otherUserId = student_user_id === socket.userId ? employer_user_id : student_user_id;
      io.to(`user:${otherUserId}`).emit(eventName, {
        conversationId,
        userId: socket.userId,
      });
    } catch (err) {
      console.error(`[Socket.IO] ${eventName} error:`, err.message);
    }
  }

  socket.on('typing:start', ({ conversationId }) => emitTyping('typing:start', conversationId));
  socket.on('typing:stop', ({ conversationId }) => emitTyping('typing:stop', conversationId));

  socket.on('disconnect', () => {
    // Room cleanup is automatic
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`InternMatch API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = { app, server, io };

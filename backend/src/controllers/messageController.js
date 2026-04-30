const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createNotification } = require('../utils/notificationService');

/**
 * GET /api/messages/conversations
 * List all conversations for the current user.
 */
const getConversations = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const participantCol = role === 'student' ? 'student_user_id' : 'employer_user_id';
  const otherCol = role === 'student' ? 'employer_user_id' : 'student_user_id';

  // Count
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM conversation WHERE ${participantCol} = ?`,
    [String(userId)]
  );
  const total = countRows[0].total;

  // Conversations with last message + unread count + other user info
  const [conversations] = await pool.execute(
    `SELECT
       c.conversation_id, c.student_user_id, c.employer_user_id,
       c.context_type, c.context_key, c.internship_id, c.created_at,
       u_other.full_name AS other_full_name,
       u_other.user_id AS other_user_id,
       u_other.is_active AS other_is_active,
       CASE
         WHEN ? = 'student' THEN e.company_name
         ELSE NULL
       END AS other_company_name,
       i.title AS internship_title,
       (SELECT m.content FROM message m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT m.created_at FROM message m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
       (SELECT COUNT(*) FROM message m WHERE m.conversation_id = c.conversation_id AND m.is_read = 0 AND m.sender_user_id != ?) AS unread_count
     FROM conversation c
     JOIN users u_other ON u_other.user_id = c.${otherCol}
     LEFT JOIN employer e ON e.user_id = c.employer_user_id
     LEFT JOIN internship i ON i.internship_id = c.internship_id
     WHERE c.${participantCol} = ?
     ORDER BY last_message_at DESC, c.created_at DESC
     LIMIT ? OFFSET ?`,
    [role, String(userId), String(userId), String(limitNum), String(offset)]
  );

  const data = conversations.map((c) => ({
    conversationId: c.conversation_id,
    contextType: c.context_type,
    contextKey: c.context_key,
    internshipTitle: c.internship_title,
    createdAt: c.created_at,
    lastMessage: c.last_message || '',
    lastMessageAt: c.last_message_at || c.created_at,
    unreadCount: c.unread_count,
    otherUser: {
      userId: c.other_user_id,
      fullName: c.other_full_name,
      companyName: c.other_company_name,
      isActive: !!c.other_is_active,
    },
  }));

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

/**
 * POST /api/messages/conversations
 * Create or get existing conversation.
 */
const createConversation = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  const { otherUserId, internshipId } = req.body;

  if (!otherUserId) {
    throw new AppError('otherUserId is required', 400);
  }

  // Determine student and employer IDs
  let studentUserId, employerUserId;
  if (role === 'student') {
    studentUserId = userId;
    employerUserId = otherUserId;
  } else if (role === 'employer') {
    studentUserId = otherUserId;
    employerUserId = userId;
  } else {
    throw new AppError('Only students and employers can create conversations', 403);
  }

  // Verify the other user exists, is active, and has the correct role
  const expectedRole = role === 'student' ? 'employer' : 'student';
  const [otherUser] = await pool.execute(
    'SELECT user_id, is_active, role FROM users WHERE user_id = ? AND role = ?',
    [String(otherUserId), expectedRole]
  );

  if (otherUser.length === 0) {
    throw new AppError('User not found', 404);
  }

  if (!otherUser[0].is_active) {
    throw new AppError("This user's account is currently unavailable", 400);
  }

  // Determine context
  let contextType = 'general';
  let contextKey = 0;
  let linkedInternshipId = null;

  if (internshipId) {
    const [intern] = await pool.execute(
      'SELECT internship_id FROM internship WHERE internship_id = ?',
      [String(internshipId)]
    );
    if (intern.length > 0) {
      contextType = 'internship';
      contextKey = internshipId;
      linkedInternshipId = internshipId;
    }
  }

  // Check if conversation already exists
  const [existing] = await pool.execute(
    `SELECT conversation_id FROM conversation
     WHERE student_user_id = ? AND employer_user_id = ? AND context_type = ? AND context_key = ?`,
    [String(studentUserId), String(employerUserId), contextType, String(contextKey)]
  );

  if (existing.length > 0) {
    return res.json({
      success: true,
      data: { conversationId: existing[0].conversation_id, isNew: false },
    });
  }

  // Create new conversation
  const [result] = await pool.execute(
    `INSERT INTO conversation (student_user_id, employer_user_id, internship_id, context_type, context_key)
     VALUES (?, ?, ?, ?, ?)`,
    [String(studentUserId), String(employerUserId), linkedInternshipId ? String(linkedInternshipId) : null, contextType, String(contextKey)]
  );

  res.status(201).json({
    success: true,
    data: { conversationId: result.insertId, isNew: true },
  });
});

/**
 * GET /api/messages/conversations/:id/messages
 * Get messages in a conversation.
 */
const getMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  // Verify participant
  const [conv] = await pool.execute(
    'SELECT conversation_id, student_user_id, employer_user_id FROM conversation WHERE conversation_id = ?',
    [String(id)]
  );

  if (conv.length === 0) {
    throw new AppError('Conversation not found', 404);
  }

  if (conv[0].student_user_id !== userId && conv[0].employer_user_id !== userId) {
    throw new AppError('You are not a participant in this conversation', 403);
  }

  // Count
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM message WHERE conversation_id = ?',
    [String(id)]
  );
  const total = countRows[0].total;

  // Messages (newest first for pagination, reverse for display)
  const [messages] = await pool.execute(
    `SELECT m.message_id, m.sender_user_id, m.content, m.is_read, m.created_at,
            u.full_name AS sender_name
     FROM message m
     LEFT JOIN users u ON u.user_id = m.sender_user_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC
     LIMIT ? OFFSET ?`,
    [String(id), String(limitNum), String(offset)]
  );

  const data = messages.map((m) => ({
    messageId: m.message_id,
    senderUserId: m.sender_user_id,
    senderName: m.sender_name,
    content: m.content,
    isRead: !!m.is_read,
    createdAt: m.created_at,
  }));

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

/**
 * POST /api/messages/conversations/:id/messages
 * Send a message.
 */
const sendMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400);
  }

  if (content.trim().length > 2000) {
    throw new AppError('Message too long (max 2000 characters)', 400);
  }

  // Verify participant
  const [conv] = await pool.execute(
    'SELECT conversation_id, student_user_id, employer_user_id FROM conversation WHERE conversation_id = ?',
    [String(id)]
  );

  if (conv.length === 0) {
    throw new AppError('Conversation not found', 404);
  }

  const { student_user_id, employer_user_id } = conv[0];

  if (student_user_id !== userId && employer_user_id !== userId) {
    throw new AppError('You are not a participant in this conversation', 403);
  }

  // Check if the other party is active
  const otherUserId = student_user_id === userId ? employer_user_id : student_user_id;
  const [otherUser] = await pool.execute(
    'SELECT is_active FROM users WHERE user_id = ?',
    [String(otherUserId)]
  );

  if (otherUser.length === 0 || !otherUser[0].is_active) {
    throw new AppError("Cannot send messages — this user's account is currently unavailable", 400);
  }

  // Insert message
  const [result] = await pool.execute(
    'INSERT INTO message (conversation_id, sender_user_id, content) VALUES (?, ?, ?)',
    [String(id), String(userId), content.trim()]
  );

  const messageData = {
    messageId: result.insertId,
    conversationId: parseInt(id, 10),
    senderUserId: userId,
    senderName: req.user.fullName,
    content: content.trim(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // Emit via Socket.IO to both parties — recipient receives the new message,
  // sender's other tabs receive it too so they stay in sync.
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${userId}`).to(`user:${otherUserId}`).emit('message:receive', messageData);
  }

  // Create notification (with preference-based email) for the other user
  createNotification({
    userId: otherUserId,
    type: 'new_message',
    title: 'New Message',
    message: `New message from ${req.user.fullName}`,
    referenceId: parseInt(id, 10),
    referenceType: 'conversation',
    io,
  }).catch(() => {});

  res.status(201).json({ success: true, data: messageData });
});

/**
 * PUT /api/messages/conversations/:id/read
 * Mark all messages in conversation as read.
 */
const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  // Verify participant
  const [conv] = await pool.execute(
    'SELECT conversation_id, student_user_id, employer_user_id FROM conversation WHERE conversation_id = ?',
    [String(id)]
  );

  if (conv.length === 0) {
    throw new AppError('Conversation not found', 404);
  }

  if (conv[0].student_user_id !== userId && conv[0].employer_user_id !== userId) {
    throw new AppError('You are not a participant in this conversation', 403);
  }

  // Mark messages from the OTHER user as read
  await pool.execute(
    'UPDATE message SET is_read = 1 WHERE conversation_id = ? AND sender_user_id != ? AND is_read = 0',
    [String(id), String(userId)]
  );

  // Emit read receipt via Socket.IO
  const otherUserId = conv[0].student_user_id === userId ? conv[0].employer_user_id : conv[0].student_user_id;
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${otherUserId}`).emit('message:read', { conversationId: parseInt(id, 10) });
  }

  res.json({ success: true, message: 'Messages marked as read' });
});

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
};

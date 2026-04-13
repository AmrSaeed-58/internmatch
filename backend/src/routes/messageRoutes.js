const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.createConversation);
router.get('/conversations/:id/messages', messageController.getMessages);
router.post('/conversations/:id/messages', messageController.sendMessage);
router.put('/conversations/:id/read', messageController.markAsRead);

module.exports = router;

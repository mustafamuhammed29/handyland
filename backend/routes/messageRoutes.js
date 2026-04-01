const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// @desc    Submit a new message
// @route   POST /api/messages
// @access  Public (Optional Auth)
router.post('/', optionalProtect, messageController.submitMessage);

// @desc    Get user's messages
// @route   GET /api/messages/my-messages
// @access  Private
router.get('/my-messages', protect, messageController.getMyMessages);

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, authorize('admin'), messageController.getAllMessages);

// @desc    Admin sends a proactive message to a customer
// @route   POST /api/messages/admin/send
// @access  Private/Admin
router.post('/admin/send', protect, authorize('admin'), messageController.adminSendMessage);

// @desc    Admin bulk-sends a message to multiple customers
// @route   POST /api/messages/admin/bulk
// @access  Private/Admin
router.post('/admin/bulk', protect, authorize('admin'), messageController.adminBulkSend);

// @desc    Update message status
// @route   PUT /api/messages/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), messageController.updateMessageStatus);

// @desc    Reply to a message
// @route   POST /api/messages/:id/reply
// @access  Private (Admin or Message Owner)
router.post('/:id/reply', protect, messageController.replyMessage);

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), messageController.deleteMessage);

module.exports = router;

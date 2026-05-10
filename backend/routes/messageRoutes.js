const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// @desc    Submit a new message
// @route   POST /api/messages
// @access  Public (Optional Auth)
// router.post('/', optionalProtect, messageController.submitMessage);
// router.get('/my-messages', protect, messageController.getMyMessages);
// router.get('/', protect, authorize('admin'), messageController.getAllMessages);
// router.post('/admin/send', protect, authorize('admin'), messageController.adminSendMessage);
// router.post('/admin/bulk', protect, authorize('admin'), messageController.adminBulkSend);
// router.put('/:id', protect, authorize('admin'), messageController.updateMessageStatus);
// router.post('/:id/reply', protect, messageController.replyMessage);
// router.delete('/:id', protect, authorize('admin'), messageController.deleteMessage);

module.exports = router;

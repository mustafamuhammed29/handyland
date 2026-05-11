const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// @desc    Submit a new message
// @route   POST /api/messages
// @access  Public (Optional Auth)
router.post('/', optionalProtect, messageController.createMessage);
router.get('/my-messages', protect, messageController.getMessages);
router.get('/', protect, authorize('admin'), messageController.getMessages);
router.put('/:id', protect, authorize('admin'), messageController.updateMessageStatus);
router.post('/:id/reply', protect, messageController.replyToMessage);
router.delete('/:id', protect, authorize('admin'), messageController.deleteMessage);

module.exports = router;

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// @desc    Submit a new message
// @route   POST /api/messages
// @access  Public (Optional Auth)
router.post('/', optionalProtect, async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const userId = req.user ? req.user._id : null;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newMessage = await Message.create({
            user: userId,
            name,
            email,
            message
        });

        res.status(201).json({ success: true, message: 'Message sent successfully', data: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get user's messages
// @route   GET /api/messages/my-messages
// @access  Private
router.get('/my-messages', protect, async (req, res) => {
    try {
        const messages = await Message.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const messages = await Message.find({ isArchived: false }).sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update message status
// @route   PUT /api/messages/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (message) {
            message.status = req.body.status || message.status;
            message.isArchived = req.body.isArchived !== undefined ? req.body.isArchived : message.isArchived;

            const updatedMessage = await Message.findByIdAndUpdate(req.params.id, message, { new: true });
            res.json(updatedMessage);
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Reply to a message
// @route   POST /api/messages/:id/reply
// @access  Private (Admin or Message Owner)
router.post('/:id/reply', protect, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check ownership
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && message.user?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized logic' });
        }

        const reply = {
            message: req.body.message,
            isAdmin
        };

        if (isAdmin) message.status = 'replied';

        message.replies.push(reply);
        await message.save();

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (message) {
            await message.deleteOne();
            res.json({ message: 'Message removed' });
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

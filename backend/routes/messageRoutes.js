const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/auth');

// @desc    Submit a new message
// @route   POST /api/messages
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newMessage = await Message.create({
            name,
            email,
            message
        });

        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const messages = await Message.find({ isArchived: false }).sort({ createdAt: -1 });
        res.json(messages);
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

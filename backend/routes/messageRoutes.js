const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { notify } = require('../utils/notificationService');

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

        // Check for existing active ticket if user is logged in
        if (userId) {
            const activeTicket = await Message.findOne({
                user: userId,
                status: { $ne: 'closed' }
            });

            if (activeTicket) {
                return res.status(400).json({
                    success: false,
                    message: 'You currently have an active support ticket. Please reply to your existing ticket or wait for an admin to resolve it before opening a new one.'
                });
            }
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

// @desc    Admin sends a proactive message to a customer
// @route   POST /api/messages/admin/send
// @access  Private/Admin
router.post('/admin/send', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId, name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'name, email, and message are required' });
        }
        const newMessage = await Message.create({
            user: userId || null,
            name,
            email,
            // The message field is the admin's opening message
            // initiatedByAdmin=true tells the UI to render this as an admin bubble, not a customer bubble
            message,
            initiatedByAdmin: true,
            status: 'replied',
            replies: [] // no duplication — the message field IS the admin's message
        });
        res.status(201).json({ success: true, data: newMessage });

        // Notify customer in background (non-blocking)
        if (userId) {
            User.findById(userId).select('notificationPrefs email name').then(customer => {
                if (!customer) return;
                notify({
                    userId: customer._id,
                    userEmail: customer.email,
                    userName: customer.name,
                    message: 'You have a new message from the Support Team.',
                    type: 'info',
                    link: '/dashboard',
                    category: 'orderUpdates',
                    subject: 'New message from HandyLand Support',
                    prefs: customer.notificationPrefs
                });
            }).catch(() => { });
        }
    } catch (error) {
        console.error('Admin send error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Admin bulk-sends a message to multiple customers
// @route   POST /api/messages/admin/bulk
// @access  Private/Admin
router.post('/admin/bulk', protect, authorize('admin'), async (req, res) => {
    try {
        const { recipients, message } = req.body;
        if (!recipients || !recipients.length || !message) {
            return res.status(400).json({ success: false, message: 'recipients and message are required' });
        }
        const created = await Promise.all(
            recipients.map(r => Message.create({
                user: r.userId || null,
                name: r.name,
                email: r.email,
                message,
                initiatedByAdmin: true,
                status: 'replied',
                replies: [] // no duplication
            }))
        );
        res.status(201).json({ success: true, count: created.length, data: created });

        // Notify each recipient in background
        recipients.forEach(r => {
            if (!r.userId) return;
            User.findById(r.userId).select('notificationPrefs email name').then(customer => {
                if (!customer) return;
                notify({
                    userId: customer._id,
                    userEmail: customer.email,
                    userName: customer.name,
                    message: 'You have a new message from the Support Team.',
                    type: 'info',
                    link: '/dashboard',
                    category: 'orderUpdates',
                    subject: 'New message from HandyLand Support',
                    prefs: customer.notificationPrefs
                });
            }).catch(() => { });
        });
    } catch (error) {
        console.error('Bulk send error:', error);
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

        if (message.status === 'closed') {
            return res.status(400).json({ message: 'Cannot reply to a closed ticket. Please open a new one.' });
        }

        const reply = {
            message: req.body.message,
            isAdmin
        };

        if (isAdmin) message.status = 'replied';

        message.replies.push(reply);
        await message.save();

        // Notify the customer when admin replies
        if (isAdmin && message.user) {
            User.findById(message.user).select('notificationPrefs email name').then(customer => {
                if (!customer) return;
                notify({
                    userId: customer._id,
                    userEmail: customer.email,
                    userName: customer.name,
                    message: `Support replied to your message: "${req.body.message.substring(0, 60)}${req.body.message.length > 60 ? '…' : ''}"`,
                    type: 'info',
                    link: '/dashboard',
                    category: 'orderUpdates',
                    subject: 'Support Team replied to your message',
                    prefs: customer.notificationPrefs
                });
            }).catch(() => { });
        }

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

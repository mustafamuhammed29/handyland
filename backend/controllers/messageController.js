const Message = require('../models/Message');
const User = require('../models/User');
const { notify } = require('../utils/notificationService');
const { emitAdminNotification } = require('../utils/socket');

// @desc    Submit a new message
// @route   POST /api/messages
// @access  Public (Optional Auth)
exports.submitMessage = async (req, res) => {
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

        // 🔔 Notify admins in real-time
        emitAdminNotification('new_message', {
            title: 'Neue Nachricht',
            body: `${name}: "${message.substring(0, 80)}${message.length > 80 ? '…' : ''}"`,
            icon: '💬',
            link: '/messages',
            senderName: name,
            senderEmail: email,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's messages
// @route   GET /api/messages/my-messages
// @access  Private
exports.getMyMessages = async (req, res) => {
    try {
        const messages = await Message.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find({ isArchived: false }).sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin sends a proactive message to a customer
// @route   POST /api/messages/admin/send
// @access  Private/Admin
exports.adminSendMessage = async (req, res) => {
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
                if (!customer) {return;}
                notify({
                    userId: customer._id,
                    userEmail: customer.email,
                    userName: customer.name,
                    message: 'Sie haben eine neue Nachricht vom Support-Team erhalten.',
                    type: 'info',
                    link: '/dashboard',
                    category: 'orderUpdates',
                    subject: 'Neue Nachricht vom HandyLand Support',
                    prefs: customer.notificationPrefs
                });
            }).catch(() => { });
        }
    } catch (error) {
        console.error('Admin send error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin bulk-sends a message to multiple customers
// @route   POST /api/messages/admin/bulk
// @access  Private/Admin
exports.adminBulkSend = async (req, res) => {
    try {
        const { recipients, message } = req.body;
        if (!recipients || !recipients.length || !message) {
            return res.status(400).json({ success: false, message: 'recipients and message are required' });
        }
        const results = await Promise.allSettled(
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
        const created = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        res.status(201).json({ success: true, count: created.length, data: created });

        // Notify each recipient in background
        recipients.forEach(r => {
            if (!r.userId) {return;}
            User.findById(r.userId).select('notificationPrefs email name').then(customer => {
                if (!customer) {return;}
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
};

// @desc    Update message status
// @route   PUT /api/messages/:id
// @access  Private/Admin
exports.updateMessageStatus = async (req, res) => {
    try {
        const updateData = {};
        if (req.body.status) {updateData.status = req.body.status;}
        if (req.body.isArchived !== undefined) {updateData.isArchived = req.body.isArchived;}

        const updatedMessage = await Message.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (updatedMessage) {
            res.json(updatedMessage);
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reply to a message
// @route   POST /api/messages/:id/reply
// @access  Private (Admin or Message Owner)
exports.replyMessage = async (req, res) => {
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

        if (isAdmin) {message.status = 'replied';}

        message.replies.push(reply);
        await message.save();

        // Notify the customer when admin replies
        if (isAdmin && message.user) {
            User.findById(message.user).select('notificationPrefs email name').then(customer => {
                if (!customer) {return;}
                notify({
                    userId: customer._id,
                    userEmail: customer.email,
                    userName: customer.name,
                    message: `Support hat auf Ihre Nachricht geantwortet: "${req.body.message.substring(0, 60)}${req.body.message.length > 60 ? '…' : ''}"`,
                    type: 'info',
                    link: '/dashboard',
                    category: 'orderUpdates',
                    subject: 'Support-Team hat auf Ihre Nachricht geantwortet',
                    prefs: customer.notificationPrefs
                });
            }).catch(() => { });
        } else if (!isAdmin) {
            // Notify admins when customer replies
            emitAdminNotification('new_message', {
                title: 'New Reply',
                body: `${message.name}: "${req.body.message.substring(0, 80)}${req.body.message.length > 80 ? '…' : ''}"`,
                icon: '💬',
                link: '/messages',
                senderName: message.name,
                senderEmail: message.email,
                threadId: message._id
            });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
exports.deleteMessage = async (req, res) => {
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
};

const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    message: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    message: {
        type: String,
        required: true
    },
    replies: [replySchema],
    status: {
        type: String,
        enum: ['unread', 'read', 'replied', 'closed'],
        default: 'unread'
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    initiatedByAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for inbox queries
messageSchema.index({ status: 1, isArchived: 1, createdAt: -1 }); // Admin inbox filtering
messageSchema.index({ user: 1, createdAt: -1 });                   // Customer message history
messageSchema.index({ email: 1 });                                  // Guest user lookups

module.exports = mongoose.model('Message', messageSchema);

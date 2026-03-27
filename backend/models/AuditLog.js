const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    },
    action: {
        type: String, // 'POST', 'PUT', 'DELETE'
        required: true
    },
    resource: {
        type: String, // Endpoint URL e.g., '/api/products/123'
        required: true
    },
    payload: {
        type: Object, // Optional: The req.body (omitting passwords/sensitive data)
    },
    ipAddress: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '90d' // Automatically delete logs older than 90 days to save space
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

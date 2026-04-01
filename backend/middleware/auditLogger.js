const AuditLog = require('../models/AuditLog');

const auditLogger = async (req, res, next) => {
    // We only log if req.user exists, is admin, and method modifies data
    if (req.user && req.user.role === 'admin' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {

        // Clone and sanitize body payload
        const payload = { ...req.body };
        delete payload.password;
        delete payload.currentPassword;
        delete payload.newPassword;

        // Hide sensitive payment keys if they are somehow updated
        if (payload.payment) {
             delete payload.payment;
        }

        try {
            // We do not wait for the DB to save the log so it doesn't slow down the response
            AuditLog.create({
                adminId: req.user._id,
                adminEmail: req.user.email,
                action: req.method,
                resource: req.originalUrl,
                payload: Object.keys(payload).length > 0 ? payload : undefined,
                ipAddress: req.ip || req.connection.remoteAddress
            });
        } catch (error) {
            console.error('Failed to save audit log:', error);
        }
    }
    next();
};

module.exports = auditLogger;

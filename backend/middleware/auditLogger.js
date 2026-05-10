const { supabaseAdmin } = require('../config/supabase');

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
            supabaseAdmin.from('audit_logs').insert({
                admin_id: req.user._id || req.user.id,
                admin_email: req.user.email,
                action: req.method,
                resource: req.originalUrl,
                payload: Object.keys(payload).length > 0 ? payload : null,
                ip_address: req.ip || req.connection.remoteAddress
            }).then(({error}) => {
                if (error) console.error('Failed to save audit log to Supabase:', error);
            });
        } catch (error) {
            console.error('Failed to trigger audit log:', error);
        }
    }
    next();
};

module.exports = auditLogger;

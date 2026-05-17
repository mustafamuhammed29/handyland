const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');

const MAINTENANCE_FLAG = path.join(__dirname, '../MAINTENANCE_MODE');

exports.maintenanceGate = async (req, res, next) => {
    // Skip: health, auth (all endpoints), admin status, maintenance info, translations, and public promo
    const bypass = ['/health', '/auth', '/status', '/maintenance-info', '/translations', '/coupons/latest-promo'];
    if (bypass.some(p => req.path.startsWith(p))) {
        return next();
    }

    if (fs.existsSync(MAINTENANCE_FLAG)) {
        // Admins bypass maintenance mode
        try {
            const token = (req.cookies && req.cookies.adminToken) || (req.cookies && req.cookies.accessToken);
            if (token) {
                const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                if (user && !error) {
                    const { data: userProfile } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single();
                    if (userProfile && userProfile.role === 'admin') {
                        return next(); // Admin bypassed
                    }
                }
            }
        } catch (err) {
            console.error('Maintenance Mode Bypass Error:', err.message);
        }

        let title = 'Wartungsarbeiten';
        let message = 'The site is currently undergoing maintenance. Please check back soon.';
        let estimatedTime = '';
        try {
            const data = JSON.parse(fs.readFileSync(MAINTENANCE_FLAG, 'utf8'));
            if(data.title) {title = data.title;}
            if(data.message) {message = data.message;}
            if(data.estimatedTime) {estimatedTime = data.estimatedTime;}
        } catch(e) { /* ignore parse error */ }

        return res.status(503).json({
            success: false,
            maintenance: true,
            title,
            message,
            estimatedTime
        });
    }
    next();
};

exports.maintenanceInfo = (req, res) => {
    if (fs.existsSync(MAINTENANCE_FLAG)) {
        let title = 'Wartungsarbeiten';
        let message = 'The site is currently undergoing maintenance. Please check back soon.';
        let estimatedTime = '';
        let statusText1 = 'System wird diagnostiziert...';
        let statusText2 = 'Neue Reparaturen werden angewendet...';
        try {
            const data = JSON.parse(fs.readFileSync(MAINTENANCE_FLAG, 'utf8'));
            if(data.title) {title = data.title;}
            if(data.message) {message = data.message;}
            if(data.estimatedTime) {estimatedTime = data.estimatedTime;}
            if(data.statusText1) {statusText1 = data.statusText1;}
            if(data.statusText2) {statusText2 = data.statusText2;}
        } catch(e) { /* ignore parse error */ }

        return res.json({ maintenance: true, title, message, estimatedTime, statusText1, statusText2 });
    }
    res.json({ maintenance: false });
};

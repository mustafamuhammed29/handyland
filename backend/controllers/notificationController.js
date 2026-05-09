/**
 * backend/controllers/notificationController.js
 * Notifications using Supabase (with Realtime capability)
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// ── @route GET /api/notifications ────────────────────────────
exports.getNotifications = async (req, res, next) => {
    try {
        const { limit = 20, unreadOnly } = req.query;

        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (unreadOnly === 'true') query = query.eq('read', false);

        const { data, error } = await query;
        if (error) throw error;

        const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('read', false);

        return res.status(200).json({ success: true, data, unreadCount });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/notifications/:id/read ───────────────────
exports.markAsRead = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        return res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/notifications/mark-all-read ───────────────
exports.markAllAsRead = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('user_id', req.user.id)
            .eq('read', false);

        if (error) throw error;
        return res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/notifications/:id ─────────────────────
exports.deleteNotification = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        return res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Internal helper — used by other controllers to create notifications
exports.createNotification = async (userId, message, type = 'info', link = null) => {
    try {
        await supabaseAdmin.from('notifications').insert({ user_id: userId, message, type, link });
    } catch (err) {
        console.error('Notification error:', err.message);
    }
};

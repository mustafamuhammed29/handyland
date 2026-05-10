/**
 * backend/controllers/auditController.js
 * Audit logs management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/audit
exports.getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, action, userId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('audit_logs').select('*, users(name, email)', { count: 'exact' });

        if (action) query = query.eq('action', action);
        if (userId) query = query.eq('user_id', userId);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
    } catch (error) { next(error); }
};

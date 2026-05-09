/**
 * backend/controllers/userController.js
 * User management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { uploadSingle, processAndUpload } = require('../middleware/upload');

// ── @route GET /api/users (Admin) ────────────────────────────
exports.getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, search, isActive } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('users')
            .select('id, name, email, role, is_active, is_verified, balance, loyalty_points, membership_level, created_at, avatar, phone, preferred_language', { count: 'exact' });

        if (role) query = query.eq('role', role);
        if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.status(200).json({
            success: true,
            count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/users/:id (Admin) ────────────────────────
exports.getUser = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/users/:id (Admin) ────────────────────────
exports.updateUser = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'role', 'is_active', 'balance', 'loyalty_points', 'membership_level', 'phone'];
        const updateData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/users/:id (Admin) ─────────────────────
exports.deleteUser = async (req, res, next) => {
    try {
        // Delete from Supabase Auth (cascade deletes profile via FK)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/users/avatar ────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const url = await processAndUpload(
            req.file.buffer,
            'avatars',
            req.user.id, // folder = user's ID
            'avatar',
            { width: 300, height: 300, quality: 85 }
        );

        await supabaseAdmin.from('users').update({ avatar: url }).eq('id', req.user.id);

        return res.status(200).json({ success: true, data: { avatar: url } });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/users/stats (Admin) ──────────────────────
exports.getUserStats = async (req, res, next) => {
    try {
        const { count: total } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
        const { count: active } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true);
        const { count: verified } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true);
        const { count: admins } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');

        return res.status(200).json({ success: true, data: { total, active, verified, admins } });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/users/:id/balance (Admin) ────────────────
exports.updateBalance = async (req, res, next) => {
    try {
        const { amount, operation } = req.body; // operation: 'add' | 'subtract' | 'set'

        const { data: user } = await supabaseAdmin.from('users').select('balance').eq('id', req.params.id).single();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let newBalance;
        if (operation === 'add') newBalance = Number(user.balance) + Number(amount);
        else if (operation === 'subtract') newBalance = Math.max(0, Number(user.balance) - Number(amount));
        else newBalance = Number(amount);

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

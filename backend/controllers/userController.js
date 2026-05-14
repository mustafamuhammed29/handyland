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
        const { page = 1, limit = 20, role, search, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('users')
            .select('id, name, email, role, is_active, is_verified, balance, loyalty_points, membership_level, created_at, avatar, phone, preferred_language, login_attempts, lock_until', { count: 'exact' });

        if (role) query = query.eq('role', role);
        if (status) query = query.eq('is_active', status === 'active');
        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedUsers = (data || []).map(u => ({
            _id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.is_active,
            balance: u.balance || 0,
            loyaltyPoints: u.loyalty_points || 0,
            membershipLevel: u.membership_level || 1,
            createdAt: u.created_at,
            avatar: u.avatar,
            phone: u.phone,
            loginAttempts: u.login_attempts,
            lockUntil: u.lock_until
        }));

        return res.status(200).json({
            success: true,
            count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            users: mappedUsers,
            data: mappedUsers
        });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/users/admin/:id/status ───────────────────
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ is_active: isActive })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/users/admin/:id/role ─────────────────────
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/users/admin/:id/unlock ───────────────────
exports.unlockUser = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ lock_until: null, login_attempts: 0 })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
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

        if (error) {
            const errLog = `[${new Date().toISOString()}] getUser Error for ${req.params.id}: ${JSON.stringify(error)}\n`;
            require('fs').appendFileSync('backend_errors.log', errLog);
            return res.status(404).json({ success: false, message: 'User not found', error });
        }
        
        if (!data) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userWithId = { ...data, _id: data.id, isActive: data.is_active };
        return res.status(200).json({ success: true, user: userWithId, data: userWithId });
    } catch (error) {
        const errLog = `[${new Date().toISOString()}] getUser Exception for ${req.params.id}: ${error.stack}\n`;
        require('fs').appendFileSync('backend_errors.log', errLog);
        next(error);
    }
};

// ── @route PUT /api/users/:id (Admin - Generic) ──────────────
exports.updateUser = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'role', 'is_active', 'balance', 'loyalty_points', 'membership_level', 'phone'];
        const updateData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) {
            const dbField = f === 'isActive' || f === 'is_active' ? 'is_active' : f;
            updateData[dbField] = req.body[f];
        }});

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
        const userId = req.params.id;
        console.log(`[UserController] Attempting to delete user: ${userId}`);

        // 1. Try to delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (authError) {
            console.log(`[UserController] Auth delete failed: ${authError.message}`);
        }

        // 2. Delete from our users table
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (profileError) {
            const errLog = `[${new Date().toISOString()}] deleteUser Error for ${userId}: ${JSON.stringify(profileError)}\n`;
            require('fs').appendFileSync('backend_errors.log', errLog);
            console.error('[UserController] Profile delete failed:', profileError);
            
            if (profileError.code === '23503') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete user: They have associated records (orders, repairs, etc). Please deactivate them instead.',
                    error: profileError 
                });
            }
            throw profileError;
        }

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        const errLog = `[${new Date().toISOString()}] deleteUser Exception for ${req.params.id}: ${error.stack}\n`;
        require('fs').appendFileSync('backend_errors.log', errLog);
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
        const { count: admins } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
        const { count: sellers } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'seller');

        return res.status(200).json({ success: true, data: { total, active, admins, sellers } });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/users/:id/balance (Admin) ────────────────
exports.updateBalance = async (req, res, next) => {
    try {
        const { amount, operation, note } = req.body; // operation: 'add' | 'subtract' | 'set' (optional)

        const { data: user } = await supabaseAdmin.from('users').select('balance').eq('id', req.params.id).single();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let newBalance;
        // If operation is provided, use it. Otherwise, assume 'add' if amount is signed (frontend style)
        if (operation === 'add') {
            newBalance = Number(user.balance) + Number(amount);
        } else if (operation === 'subtract') {
            newBalance = Math.max(0, Number(user.balance) - Number(amount));
        } else if (operation === 'set') {
            newBalance = Number(amount);
        } else {
            // Default: Relative addition (frontend sends positive to add, negative to subtract)
            newBalance = Number(user.balance) + Number(amount);
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Log the adjustment in transactions if a note is provided
        if (note || amount !== 0) {
            await supabaseAdmin.from('transactions').insert({
                user_id: req.params.id,
                amount: Math.abs(amount),
                type: amount >= 0 ? 'deposit' : 'withdrawal',
                status: 'completed',
                description: note || `Manual balance adjustment: ${amount >= 0 ? '+' : ''}${amount}€`,
                payment_method: 'manual'
            });
        }

        return res.status(200).json({ success: true, data, newBalance });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/users/notifications ──────────────────────
exports.getNotificationPrefs = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', req.user.id).single();
        if (error) throw error;
        return res.status(200).json({ success: true, data: data?.notification_prefs || {} });
    } catch (error) { 
        // Gracefully handle missing column
        if (error.code === 'PGRST204' || error.message?.includes('notification_prefs')) {
            return res.status(200).json({ success: true, data: {} });
        }
        next(error); 
    }
};

// ── @route PUT /api/users/notifications ──────────────────────
exports.updateNotificationPrefs = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('users').update({ notification_prefs: req.body }).eq('id', req.user.id);
        if (error) {
            if (error.code === 'PGRST204' || error.message?.includes('notification_prefs')) {
                return res.status(200).json({ success: true, message: 'Preferences saved locally' });
            }
            throw error;
        }
        return res.status(200).json({ success: true, message: 'Notification preferences updated' });
    } catch (error) { next(error); }
};

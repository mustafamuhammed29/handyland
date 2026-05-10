/**
 * backend/controllers/authController.js
 * Authentication controller using Supabase Auth
 * Replaces: bcryptjs, JWT manual, RefreshToken model
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const nodemailer = require('nodemailer');

// ── Cookie helper ─────────────────────────────────────────────
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Must be true for sameSite 'none'
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

const sendTokenResponse = (res, session, user, appType = 'frontend') => {
    const cookieName = appType === 'admin' ? 'adminToken' : 'accessToken';
    const refreshName = appType === 'admin' ? 'adminRefreshToken' : 'refreshToken';

    res.cookie(cookieName, session.access_token, cookieOptions);
    res.cookie(refreshName, session.refresh_token, {
        ...cookieOptions,
        maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
    });

    return {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        avatar: user.avatar,
        preferredLanguage: user.preferred_language,
        balance: user.balance,
        loyaltyPoints: user.loyalty_points,
        membershipLevel: user.membership_level,
        twoFactorEnabled: user.two_factor_enabled
    };
};

// ── @route POST /api/auth/register ────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }

        // Create user in Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: process.env.REQUIRE_EMAIL_VERIFICATION !== 'true',
            user_metadata: { name }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            throw error;
        }

        // Update name in our users table (trigger creates the row)
        await supabaseAdmin
            .from('users')
            .update({ name })
            .eq('id', data.user.id);

        // If email verification required, don't sign in yet
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            // Send verification email via Supabase (built-in)
            await supabaseAdmin.auth.admin.generateLink({
                type: 'signup',
                email,
                options: { redirectTo: `${process.env.FRONTEND_URL}/verify-email` }
            });

            return res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.'
            });
        }

        // Auto sign in
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        const userData = sendTokenResponse(res, signInData.session, userProfile);

        return res.status(201).json({ success: true, user: userData, data: userData });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/auth/login ───────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Sign in with Supabase
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

        if (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                invalidCredentials: true
            });
        }

        // Fetch profile
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !userProfile) {
            return res.status(401).json({ success: false, message: 'User profile not found' });
        }

        if (!userProfile.is_active) {
            return res.status(403).json({ success: false, message: 'Account is deactivated', accountDeactivated: true });
        }

        // 2FA check
        if (userProfile.two_factor_enabled) {
            // Return partial success — frontend will prompt for OTP
            return res.status(200).json({
                success: true,
                twoFactorRequired: true,
                tempToken: data.session.access_token,
                userId: data.user.id
            });
        }

        const appType = req.headers['x-app-type'] || 'frontend';
        const userData = sendTokenResponse(res, data.session, userProfile, appType);

        // Reset login attempts (Supabase handles lockout natively)
        await supabaseAdmin
            .from('users')
            .update({ login_attempts: 0, lock_until: null })
            .eq('id', data.user.id);

        return res.status(200).json({ success: true, user: userData, data: userData });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/auth/logout ──────────────────────────────
exports.logout = async (req, res, next) => {
    try {
        if (req.supabaseToken) {
            await supabaseAdmin.auth.admin.signOut(req.supabaseToken);
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('adminToken');
        res.clearCookie('adminRefreshToken');

        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/auth/refresh-token ──────────────────────
exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.cookies?.adminRefreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'No refresh token', requireAuth: true });
        }

        const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });

        if (error || !data.session) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(401).json({ success: false, message: 'Refresh token expired', requireAuth: true });
        }

        const appType = req.headers['x-app-type'] || 'frontend';
        const cookieName = appType === 'admin' ? 'adminToken' : 'accessToken';
        res.cookie(cookieName, data.session.access_token, cookieOptions);

        return res.status(200).json({
            success: true,
            accessToken: data.session.access_token
        });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/auth/me ───────────────────────────────────
exports.getMe = async (req, res, next) => {
    try {
        const { data: userProfile, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role, is_verified, avatar, preferred_language, balance, loyalty_points, membership_level, two_factor_enabled, notif_order_updates, notif_repair_status, notif_promotions, notif_newsletter, phone, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !userProfile) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userWithId = { ...userProfile, _id: userProfile.id };
        return res.status(200).json({ success: true, user: userWithId, data: userWithId });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/auth/forgot-password ─────────────────────
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Supabase handles the reset email natively
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`
        });

        // Always return success (don't leak if email exists)
        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/auth/reset-password ──────────────────────
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        // Exchange the recovery token for a session
        const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(token);

        if (error) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Update password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            data.user.id,
            { password }
        );

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/auth/update-password ─────────────────────
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Verify current password first
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
            email: userData.user.email,
            password: currentPassword
        });

        if (verifyError) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update to new password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: newPassword });
        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/auth/verify-email ────────────────────────
// Supabase handles email verification automatically.
// This endpoint is for backward-compat with the old frontend flow.
exports.verifyEmail = async (req, res, next) => {
    try {
        // Supabase email links redirect with token_hash & type params
        // The frontend handles the actual verification via supabase-js
        // This backend endpoint just confirms the user is now verified
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('is_verified')
            .eq('id', req.user.id)
            .single();

        return res.status(200).json({
            success: true,
            isVerified: userProfile?.is_verified || false,
            message: 'Email verification status checked'
        });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/auth/update-profile ──────────────────────
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, preferredLanguage, notificationPrefs } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (preferredLanguage) updateData.preferred_language = preferredLanguage;
        if (notificationPrefs) {
            if (notificationPrefs.orderUpdates !== undefined) updateData.notif_order_updates = notificationPrefs.orderUpdates;
            if (notificationPrefs.repairStatus !== undefined) updateData.notif_repair_status = notificationPrefs.repairStatus;
            if (notificationPrefs.promotions !== undefined) updateData.notif_promotions = notificationPrefs.promotions;
            if (notificationPrefs.newsletter !== undefined) updateData.notif_newsletter = notificationPrefs.newsletter;
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        const userWithId = { ...data, _id: data.id };
        return res.status(200).json({ success: true, user: userWithId, data: userWithId });
    } catch (error) {
        next(error);
    }
};

exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const { data: userProfile } = await supabaseAdmin.from('users').select('*').eq('id', data.user.id).single();
        if (!userProfile || userProfile.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const userData = sendTokenResponse(res, data.session, userProfile, 'admin');
        return res.status(200).json({ success: true, user: userData, data: userData });
    } catch (error) { next(error); }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('users').select('*');
        if (error) throw error;
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) { next(error); }
};

exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { error } = await supabaseAdmin.auth.resend({ type: 'signup', email });
        if (error) throw error;
        res.status(200).json({ success: true, message: 'Verification email sent!' });
    } catch (error) { next(error); }
};

exports.checkEmailAvailability = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { data } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
        res.status(200).json({ success: true, available: !data });
    } catch (error) { next(error); }
};

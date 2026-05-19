/**
 * backend/controllers/authController.js
 * Authentication controller using Supabase Auth
 * Replaces: bcryptjs, JWT manual, RefreshToken model
 */
'use strict';

const { supabaseAdmin, createAuthClient } = require('../config/supabase');
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
            if (error.message.includes('already registered') || error.code === 'email_exists') {
                // Self-Healing Logic: Check if user is in DB. If not, try to recover ID and fix DB.
                const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
                if (!existingUser) {
                    console.warn(`⚠️ Orphaned user detected for ${email}. Suggesting recovery.`);
                    return res.status(400).json({ 
                        success: false, 
                        message: 'This email is partially registered. Please use "Forgot Password" to receive a link and activate your account.' 
                    });
                }
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            throw error;
        }

        // Manually upsert the user row (trigger may not have fired yet)
        try {
            await supabaseAdmin
                .from('users')
                .upsert({
                    id: data.user.id,
                    email,
                    name,
                    role: 'user',
                    is_verified: process.env.REQUIRE_EMAIL_VERIFICATION !== 'true',
                    is_active: true
                }, { onConflict: 'id' });
        } catch (dbError) {
            console.error('⚠️ DB Upsert failed:', dbError.message);
        }

        // If email verification required, don't sign in yet
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            const { sendTemplateEmail } = require('../utils/emailService');
            try {
                const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'signup',
                    email,
                    options: { redirectTo: `${process.env.FRONTEND_URL}/verify-email` }
                });

                if (!linkError && linkData?.properties?.action_link) {
                    await sendTemplateEmail(email, 'verify_email', {
                        verificationUrl: linkData.properties.action_link,
                        userName: name
                    });
                    console.log('✅ Verification email sent via custom SMTP');
                } else {
                    console.warn('⚠️ generateLink failed for registration fallback');
                }
            } catch (err) {
                console.error('❌ Verification flow error:', err.message);
            }

            return res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.'
            });
        }

        // Auto sign in
        const { data: signInData, error: signInError } = await createAuthClient().auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Fetch profile (row guaranteed to exist now after upsert)
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        // Fallback if profile still somehow missing
        const profileData = userProfile || {
            id: data.user.id,
            email,
            name,
            role: 'user',
            is_verified: true
        };

        // Fetch user addresses
        const { data: addresses } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('user_id', data.user.id)
            .order('is_default', { ascending: false });

        // Map camelCase for frontend
        const mappedAddresses = (addresses || []).map(addr => ({
            _id: addr.id,
            id: addr.id,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code || addr.zip_code, // fallback if schema uses zip_code
            zipCode: addr.zip_code || addr.postal_code,
            country: addr.country,
            phone: addr.phone,
            isDefault: addr.is_default
        }));

        profileData.addresses = mappedAddresses;

        const userData = sendTokenResponse(res, signInData.session, profileData);

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
        const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });

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

        require('fs').appendFileSync('debug_login.log', JSON.stringify({ id: data.user?.id, err: profileError, user: !!userProfile }) + '\n');
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

        // Fetch user addresses
        const { data: addresses } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('user_id', data.user.id)
            .order('is_default', { ascending: false });

        // Map camelCase for frontend
        const mappedAddresses = (addresses || []).map(addr => ({
            _id: addr.id,
            id: addr.id,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code || addr.zip_code, // fallback if schema uses zip_code
            zipCode: addr.zip_code || addr.postal_code,
            country: addr.country,
            phone: addr.phone,
            isDefault: addr.is_default
        }));

        userProfile.addresses = mappedAddresses;

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
        let token;
        
        // Extract token from cookies or authorization header
        if (req.cookies?.accessToken) token = req.cookies.accessToken;
        else if (req.cookies?.adminToken) token = req.cookies.adminToken;
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Only try to sign out from Supabase if we have a token
        if (token) {
            try {
                await supabaseAdmin.auth.admin.signOut(token);
            } catch (signOutError) {
                // Ignore sign out errors (token might already be expired/invalid)
                console.warn('Supabase sign out failed during logout (expected if token expired):', signOutError.message);
            }
        }

        // Must pass the same options used when setting the cookie (minus maxAge)
        // or modern browsers will silently refuse to delete the cookie
        const clearOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        };
        res.clearCookie('accessToken', clearOpts);
        res.clearCookie('refreshToken', clearOpts);
        res.clearCookie('adminToken', clearOpts);
        res.clearCookie('adminRefreshToken', clearOpts);

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
            const clearOpts = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            };
            res.clearCookie('accessToken', clearOpts);
            res.clearCookie('refreshToken', clearOpts);
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

        // Fetch user addresses
        const { data: addresses } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('user_id', req.user.id)
            .order('is_default', { ascending: false });

        // Map camelCase for frontend
        const mappedAddresses = (addresses || []).map(addr => ({
            _id: addr.id,
            id: addr.id,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code || addr.zip_code, // fallback if schema uses zip_code
            zipCode: addr.zip_code || addr.postal_code,
            country: addr.country,
            phone: addr.phone,
            isDefault: addr.is_default
        }));

        const userWithId = { ...userProfile, _id: userProfile.id, addresses: mappedAddresses };
        return res.status(200).json({ success: true, user: userWithId, data: userWithId });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/auth/forgot-password ─────────────────────
exports.forgotPassword = async (req, res, next) => {
    try {
        const { sendTemplateEmail, sendEmail } = require('../utils/emailService');
        const crypto = require('crypto');
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // 1. Check if user exists in OUR database (this always works)
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, name, email')
            .eq('email', email)
            .maybeSingle();

        if (!user) {
            // Don't reveal if email exists — always return success
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        // 2. Generate our own reset token (always reliable, bypasses Supabase Auth issues)
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        // Store HASH of token in DB — never store plain text tokens
        // The user receives the plain token via email; we only compare hashes
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await supabaseAdmin
            .from('settings')
            .upsert({
                key: `reset_token_${user.id}`,
                value: JSON.stringify({ token: tokenHash, expires: tokenExpiry })
            }, { onConflict: 'key' });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&type=custom&uid=${user.id}`;
        console.log('🔐 Generated reset token for:', email);

        // 4. Send the email via our SMTP (this always works now!)
        const sent = await sendTemplateEmail(email, 'reset_password', {
            resetUrl: resetUrl,
            userName: user.name || email.split('@')[0]
        });

        if (!sent) {
            // Fallback: send a simple email without template
            await sendEmail({
                email,
                subject: 'HandyLand - Password Reset',
                html: `<h2>Password Reset</h2><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
                message: `Reset your password: ${resetUrl}`
            });
        }

        console.log('✅ Password reset email sent for:', email);

        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    } catch (error) {
        console.error('❌ forgotPassword error:', error.message);
        // Still return success to not leak info, but log the error
        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }
};

// ── @route PUT /api/auth/reset-password ──────────────────────
exports.resetPassword = async (req, res, next) => {
    try {
        // Support both: PUT body token AND legacy POST /:token param
        const token = req.body.token || req.params.token;
        const { password, type, uid } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        // Handle our custom manual tokens
        if (type === 'custom' && uid) {
            // Verify token from settings table
            const { data: setting } = await supabaseAdmin
                .from('settings')
                .select('value')
                .eq('key', `reset_token_${uid}`)
                .maybeSingle();

            if (!setting) {
                return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
            }

            const tokenData = JSON.parse(setting.value);
            // Compare hash of incoming token with stored hash
            const incomingHash = crypto.createHash('sha256').update(token).digest('hex');
            if (tokenData.token !== incomingHash || new Date(tokenData.expires) < new Date()) {
                return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
            }

            // Update password via Supabase Admin
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(uid, { password });
            
            if (updateError) {
                console.warn('⚠️ updateUserById failed (likely corrupted migration user):', updateError.message);
                
                // Fallback: Get user email, delete old Auth record, recreate with new password
                const { data: userRow } = await supabaseAdmin.from('users').select('email, name').eq('id', uid).single();
                if (!userRow) throw new Error('User not found in database');

                // Delete corrupted Auth user
                try { await supabaseAdmin.auth.admin.deleteUser(uid); } catch (e) { /* may also fail, continue */ }

                // Recreate with new password
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: userRow.email,
                    password,
                    email_confirm: true,
                    user_metadata: { name: userRow.name }
                });

                if (createError) throw createError;

                // Update the users table to point to the new Auth ID
                if (newUser.user.id !== uid) {
                    await supabaseAdmin.from('users').update({ id: newUser.user.id }).eq('id', uid);
                }

                console.log('✅ User recreated with new password successfully');
            }

            // Clean up the token
            await supabaseAdmin.from('settings').delete().eq('key', `reset_token_${uid}`);

            return res.status(200).json({ success: true, message: 'Password reset successful' });
        }

        // Handle Supabase native recovery tokens
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
        const { error: verifyError } = await createAuthClient().auth.signInWithPassword({
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
        const { name, phone, preferredLanguage, notificationPrefs, avatar } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (preferredLanguage !== undefined) updateData.preferred_language = preferredLanguage;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (notificationPrefs) {
            if (notificationPrefs.orderUpdates !== undefined) updateData.notif_order_updates = notificationPrefs.orderUpdates;
            if (notificationPrefs.repairStatus !== undefined) updateData.notif_repair_status = notificationPrefs.repairStatus;
            if (notificationPrefs.promotions !== undefined) updateData.notif_promotions = notificationPrefs.promotions;
            if (notificationPrefs.newsletter !== undefined) updateData.notif_newsletter = notificationPrefs.newsletter;
        }

        // If nothing to update, just return current user
        if (Object.keys(updateData).length === 0) {
            const { data: currentUser } = await supabaseAdmin.from('users').select('*').eq('id', req.user.id).single();
            const userWithId = { ...currentUser, _id: currentUser.id };
            return res.status(200).json({ success: true, user: userWithId, data: userWithId });
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            console.error('❌ updateProfile DB error:', error.message, error.details);
            throw error;
        }

        const userWithId = { ...data, _id: data.id };
        return res.status(200).json({ success: true, user: userWithId, data: userWithId });
    } catch (error) {
        console.error('❌ updateProfile error:', error.message);
        next(error);
    }
};

exports.adminLogin = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        if (email) email = email.trim().toLowerCase();
        
        const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });
        if (error) {
            console.error('Admin Login Error:', error.message);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

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
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        // 1. Check in public profiles table
        const { data: profile } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
        
        if (profile) {
            return res.status(200).json({ success: true, available: false });
        }

        // 2. Check in Supabase Auth (to be sure)
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = users.find(u => u.email === email);

        res.status(200).json({ success: true, available: !authUser });
    } catch (error) { 
        console.error('Check email error:', error);
        next(error); 
    }
};

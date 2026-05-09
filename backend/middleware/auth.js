/**
 * backend/middleware/auth.js
 * Authentication middleware using Supabase Auth
 * Replaces JWT manual verification
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const auditLogger = require('./auditLogger');

/**
 * Protect routes — verify Supabase JWT token
 */
exports.protect = async (req, res, next) => {
    const appType = req.headers['x-app-type'];
    let token;

    // Extract token from Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (appType === 'admin') {
        token = req.cookies?.adminToken;
    } else if (appType === 'frontend') {
        token = req.cookies?.accessToken;
    } else {
        token = req.cookies?.accessToken || req.cookies?.adminToken;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            requireAuth: true
        });
    }

    try {
        // Verify token with Supabase (validates signature + expiry)
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !supabaseUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                tokenExpired: true
            });
        }

        // Fetch user profile from our users table
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role, is_active, is_verified, balance, loyalty_points, membership_level, preferred_language, two_factor_enabled')
            .eq('id', supabaseUser.id)
            .single();

        if (profileError || !userProfile) {
            return res.status(401).json({
                success: false,
                message: 'User profile not found',
                userNotFound: true
            });
        }

        // Check active status
        if (userProfile.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'User account is deactivated',
                accountDeactivated: true
            });
        }

        // Check email verification
        if (!userProfile.is_verified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email to access this resource',
                emailNotVerified: true
            });
        }

        // Attach user to request (compatible with old req.user shape)
        req.user = {
            _id: userProfile.id,
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            isActive: userProfile.is_active,
            isVerified: userProfile.is_verified,
            balance: userProfile.balance,
            loyaltyPoints: userProfile.loyalty_points,
            membershipLevel: userProfile.membership_level,
            preferredLanguage: userProfile.preferred_language,
            twoFactorEnabled: userProfile.two_factor_enabled
        };

        req.supabaseToken = token;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token validation failed',
            error: error.message
        });
    }
};

/**
 * Grant access to specific roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Please login to access this resource'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
                currentRole: req.user.role,
                requiredRoles: roles
            });
        }

        // Trigger audit logger for admin actions
        if (req.user.role === 'admin') {
            auditLogger(req, res, () => {});
        }

        next();
    };
};

/**
 * Optional authentication (Guest/User shared routes)
 */
exports.optionalProtect = async (req, res, next) => {
    const appType = req.headers['x-app-type'];
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (appType === 'admin') {
        token = req.cookies?.adminToken;
    } else if (appType === 'frontend') {
        token = req.cookies?.accessToken;
    } else {
        token = req.cookies?.accessToken || req.cookies?.adminToken;
    }

    if (!token) return next(); // Proceed as guest

    try {
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !supabaseUser) return next(); // Invalid token → guest

        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role, is_active, is_verified, balance, loyalty_points, membership_level, preferred_language')
            .eq('id', supabaseUser.id)
            .single();

        if (userProfile) {
            req.user = {
                _id: userProfile.id,
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                role: userProfile.role,
                isActive: userProfile.is_active,
                isVerified: userProfile.is_verified,
                balance: userProfile.balance,
                loyaltyPoints: userProfile.loyalty_points,
                membershipLevel: userProfile.membership_level,
                preferredLanguage: userProfile.preferred_language
            };
            req.supabaseToken = token;
        }

        next();
    } catch {
        next(); // Any error → proceed as guest
    }
};

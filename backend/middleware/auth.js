const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    let token;

    // DEBUG LOGGING
    console.log('🔐 Auth Middleware Started');

    // Check for Authorization header first (Admin Panel prioritizes this)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('✓ Token found in Authorization header');
    }
    // Fallback to cookie (Customer Frontend utilizes this)
    else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
        console.log('✓ Token found in cookies');
    }

    // Make sure token exists
    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            requireAuth: true
        });
    }

    try {
        // Verify token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✓ Token verified for user ID:', decoded.id);

        // Explicit token expiration check
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            console.log('❌ Token expired at:', new Date(decoded.exp * 1000));
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                tokenExpired: true,
                expiredAt: decoded.exp
            });
        }

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.log('❌ User not found in database');
            return res.status(401).json({
                success: false,
                message: 'User not found - account may have been deleted',
                userNotFound: true
            });
        }

        // Check if account is active
        if (req.user.isActive === false) { // Strict check for false
            console.log('❌ User account is deactivated');
            return res.status(403).json({
                success: false,
                message: 'User account is deactivated',
                accountDeactivated: true
            });
        }

        // Optional: Allow unverified users to access certain routes
        if (req.user.isVerified === false && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            console.log('⚠️  User email not verified');
            return res.status(403).json({
                success: false,
                message: 'Please verify your email to access this resource',
                emailNotVerified: true
            });
        }

        console.log('✓ Authentication successful for:', req.user.email);
        next();
    } catch (error) {
        console.error('❌ Auth Middleware Error:', error.message);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format',
                invalidToken: true
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                tokenExpired: true
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token validation failed',
            error: error.message
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        console.log(`🔐 Checking authorization for roles: [${roles.join(', ')}]`);
        console.log(`👤 Current user role: ${req.user?.role || 'undefined'}`);

        if (!req.user) {
            console.log('❌ No user found in request object');
            return res.status(401).json({
                success: false,
                message: 'Please login to access this resource'
            });
        }

        if (!roles.includes(req.user.role)) {
            console.log(`❌ Authorization failed: User role '${req.user.role}' not in allowed roles`);
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
                currentRole: req.user.role,
                requiredRoles: roles
            });
        }

        console.log('✓ Authorization successful');
        next();
    };
};

// Optional authentication (for Guest/User shared routes)
exports.optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        // console.log('⚠️  No token provided - proceeding as guest');
        return next(); // Proceed as guest
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        // console.log('✓ Optional auth successful for:', req.user?.email);
        next();
    } catch (error) {
        // console.log('⚠️  Optional auth failed - proceeding as guest');
        // Proceed as guest instead of returning error
        next();
    }
};

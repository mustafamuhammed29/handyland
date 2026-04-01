const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auditLogger = require('./auditLogger');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    const appType = req.headers['x-app-type'];
    let token;

    // Check for Authorization header first (Some tools/postman might use this)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // If request explicitly comes from admin panel, ONLY look for adminToken
    else if (appType === 'admin') {
        token = req.cookies && req.cookies.adminToken;
    }
    // If request explicitly comes from frontend panel, ONLY look for accessToken
    else if (appType === 'frontend') {
        token = req.cookies && req.cookies.accessToken;
    }
    // Fallback for legacy requests without header (prioritize adminToken for safety)
    else {
        if (req.cookies && req.cookies.adminToken) {token = req.cookies.adminToken;}
        else if (req.cookies && req.cookies.accessToken) {token = req.cookies.accessToken;}
    }

    // Make sure token exists
    if (!token) {
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

        // Explicit token expiration check
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
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
            return res.status(401).json({
                success: false,
                message: 'User not found - account may have been deleted',
                userNotFound: true
            });
        }

        // Check if account is active
        if (req.user.isActive === false) { // Strict check for false
            return res.status(403).json({
                success: false,
                message: 'User account is deactivated',
                accountDeactivated: true
            });
        }

        // Optional: Allow unverified users to access certain routes
        if (req.user.isVerified === false && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email to access this resource',
                emailNotVerified: true
            });
        }

        next();
    } catch (error) {

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
        if (!req.user) {
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

        // Trigger audit logger asynchronously if the user is an admin
        if (req.user.role === 'admin') {
            auditLogger(req, res, () => {});
        }

        next();
    };
};

// Optional authentication (for Guest/User shared routes)
exports.optionalProtect = async (req, res, next) => {
    const appType = req.headers['x-app-type'];
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (appType === 'admin') {
        token = req.cookies && req.cookies.adminToken;
    } else if (appType === 'frontend') {
        token = req.cookies && req.cookies.accessToken;
    } else {
        if (req.cookies && req.cookies.adminToken) {token = req.cookies.adminToken;}
        else if (req.cookies && req.cookies.accessToken) {token = req.cookies.accessToken;}
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

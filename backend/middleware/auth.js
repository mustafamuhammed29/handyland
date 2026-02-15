const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check token expiry explicitly
        if (decoded.exp) {
            const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
            if (expiresIn < 300) { // Less than 5 minutes
                console.warn(`[Auth] Token for user ${decoded.id} expires in ${expiresIn}s`);
            }
        } else if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({
                success: false,
                message: 'Token missing expiry claim'
            });
        }

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        // if (!req.user.isVerified) { // Optional: Enforce verification for all protected routes?
        //     return res.status(401).json({ message: 'Please verify your email' });
        // }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            error: error.message
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
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
        return next(); // Proceed as guest
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        // If token invalid, return 401 to prevent accidental guest checkout for logged-in users with broken sessions
        return res.status(401).json({
            success: false,
            message: 'Invalid authorization token',
            error: error.message
        });
    }
};

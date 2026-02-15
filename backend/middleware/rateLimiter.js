const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

// Auth endpoints limiter - strict (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 5 : 100, // Strict in production, relaxed in dev
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests
    skipSuccessfulRequests: true
});

// General API limiter - moderate
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // 100 requests per window in prod, 1000 in dev
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Password reset limiter - very strict
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProduction ? 3 : 50, // 3 requests per hour in prod, 50 in dev
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authLimiter,
    apiLimiter,
    passwordResetLimiter
};

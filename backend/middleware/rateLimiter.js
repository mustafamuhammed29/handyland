const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

// Auth endpoints limiter - strict (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 5 : 500, // Strict in production, relaxed in dev
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests so users can log in multiple times if needed, 
    // but failed attempts count against the limit.
    skipSuccessfulRequests: true
});

// General API limiter - moderate
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 5000, // 100 requests per window in prod, 5000 in dev
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

// Payment endpoint limiter - strict
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 15 : 500, // 15 requests per 15 minutes in prod
    message: {
        success: false,
        message: 'Too many payment requests from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// OTP sending limiter - very strict (prevents SMS spam/billing abuse)
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProduction ? 5 : 50, // 5 OTP sends per hour in prod
    message: {
        success: false,
        message: 'Too many verification code requests. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Valuation calculator limiter - moderate (prevents scraping/DB spam)
const valuationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 30 : 500, // 30 requests per 15 minutes in prod
    message: {
        success: false,
        message: 'Too many device valuation requests. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authLimiter,
    apiLimiter,
    passwordResetLimiter,
    paymentLimiter,
    otpLimiter,
    valuationLimiter
};


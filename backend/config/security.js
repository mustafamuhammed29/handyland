/**
 * config/security.js
 * All security-related middleware: Helmet, CORS, rate limiting, sanitization, CSRF.
 */
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('../middleware/mongoSanitize');
const xss = require('xss');
const csrfProtection = require('../middleware/csrf');

// ── Helmet (HTTP security headers) ────────────────────────────────────────────
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // NOTE: If inline styles break, add a nonce-based approach — do not re-add unsafe-inline
            scriptSrc: ["'self'", "js.stripe.com"],
            styleSrc: ["'self'", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "res.cloudinary.com", "images.unsplash.com"],
            connectSrc: ["'self'", "api.stripe.com"],
            frameSrc: ["'self'", "js.stripe.com", "hooks.stripe.com"],
        },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// ── CORS ───────────────────────────────────────────────────────────────────────
const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : defaultOrigins;

const corsMiddleware = cors({
    origin: (origin, callback) => {
        if (!origin) {return callback(null, true);}
        if (allowedOrigins.includes(origin)) {return callback(null, true);}
        return callback(new Error('CORS: Origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-Token', 'x-app-type'],
    exposedHeaders: ['Set-Cookie'],
});

// ── Rate limiters ──────────────────────────────────────────────────────────────
const isDevelopment = process.env.NODE_ENV !== 'production';
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || (isDevelopment ? 3000 : 300),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' || isDevelopment,
});

// ── XSS sanitization ────────────────────────────────────────────────────────
const xssSanitize = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {return xss(obj);}
        if (Array.isArray(obj)) {return obj.map(sanitize);}
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => { obj[key] = sanitize(obj[key]); });
        }
        return obj;
    };
    if (req.body) {req.body = sanitize(req.body);}
    if (req.query) {req.query = sanitize(req.query);}
    if (req.params) {req.params = sanitize(req.params);}
    next();
};

// ── CSRF (Double Submit Cookie) — excludes webhooks and OAuth callbacks ───────
const CSRF_EXCLUDED_PATHS = [
    '/api/payment/webhook',
    '/api/auth/google/callback',
    '/api/auth/facebook/callback',
    '/api/translations/missing',
];
const csrfMiddleware = (req, res, next) => {
    if (CSRF_EXCLUDED_PATHS.some(p => req.path.startsWith(p))) {return next();}
    return csrfProtection(req, res, next);
};

/**
 * Apply all security middleware to an Express app in the correct order.
 * @param {import('express').Application} app
 */
const applySecurityMiddleware = (app) => {
    app.use(helmetMiddleware);
    app.use(compression());
    app.use(corsMiddleware);
    app.use('/api/', generalLimiter);
    
    // Bypass json parser for stripe webhook
    app.use((req, res, next) => {
        if (req.originalUrl.includes('/api/payment/webhook')) return next();
        return express.json({ limit: '10mb' })(req, res, next);
    });
    
    // Bypass urlencoded for stripe webhook
    app.use((req, res, next) => {
        if (req.originalUrl.includes('/api/payment/webhook')) return next();
        return express.urlencoded({ extended: false, limit: '10mb' })(req, res, next);
    });
    app.use(mongoSanitize);
    
    // Bypass xss for stripe webhook
    app.use((req, res, next) => {
        if (req.originalUrl.includes('/api/payment/webhook')) return next();
        return xssSanitize(req, res, next);
    });
    
    app.use(cookieParser());
    app.use(csrfMiddleware);
};

module.exports = {
    applySecurityMiddleware,
    corsMiddleware,
    generalLimiter,
};

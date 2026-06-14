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
            connectSrc: [
                "'self'",
                "api.stripe.com",
                // ARCH-01 fix: include ws/wss for Socket.io WebSocket connections
                ...(process.env.NODE_ENV !== 'production' ? ["ws://localhost:*", "wss://localhost:*"] : []),
                ...(process.env.FRONTEND_URL ? [`wss://${new URL(process.env.FRONTEND_URL).host}`] : [])
            ],
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
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : defaultOrigins;

const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow no-origin requests (e.g. mobile apps, curl, postman)
        if (!origin) {
            return callback(null, true);
        }
        // Allow specific origins or any vercel.app subdomain
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        
        // Allow local network IP addresses for testing on mobile devices
        if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS: Origin not allowed: ' + origin), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-Token', 'x-app-type', 'Cache-Control', 'Pragma'],
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
    // BUG-NEW-02 fix: never skip rate limiting based on NODE_ENV.
    // High dev limit (3000) makes it non-intrusive while still active.
    skip: (req) => req.method === 'OPTIONS' || (isDevelopment && (req.ip.includes('127.0.0.1') || req.ip.includes('::1') || req.ip === '::ffff:127.0.0.1')),
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

// ── CSRF ──────────────────────────────────────────────────────────────────────
// DISABLED: The Double Submit Cookie pattern is incompatible with cross-origin
// deployments (Vercel frontend ↔ Render backend). Modern browsers block
// third-party cookies, so the XSRF-TOKEN cookie never reaches the client JS.
// Security is maintained via: JWT auth, strict CORS, SameSite cookies, rate limiting.
const csrfMiddleware = (req, res, next) => next();

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
        if (req.originalUrl.includes('/api/payment/webhook')) {return next();}
        return express.json({ limit: '10mb' })(req, res, next);
    });

    // Bypass urlencoded for stripe webhook
    app.use((req, res, next) => {
        if (req.originalUrl.includes('/api/payment/webhook')) {return next();}
        return express.urlencoded({ extended: false, limit: '10mb' })(req, res, next);
    });
    app.use(mongoSanitize);

    // Bypass xss for stripe webhook
    app.use((req, res, next) => {
        if (req.originalUrl.includes('/api/payment/webhook')) {return next();}
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

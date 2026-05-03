/**
 * server.js — Entry point.
 * Creates the HTTP server, connects to DB, and starts listening.
 * All middleware and routes are delegated to config/security.js and routes/index.js.
 */
'use strict';

const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  // BUG-NEW-04 fix: 100% sampling in production causes performance overhead and high Sentry cost.
  // Use 10% in production and full sampling in dev for debugging.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const validateEnv = require('./config/validateEnv');
validateEnv();

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { passport } = require('./config/passport');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Environment ────────────────────────────────────────────────────────────────
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
if (!process.env.NODE_ENV) {process.env.NODE_ENV = 'development';}

// ── Security middleware (helmet, cors, rate limit, xss, csrf) ──────────────────
const { applySecurityMiddleware } = require('./config/security');
applySecurityMiddleware(app);

// ── Request logging ────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Passport (Social OAuth) ────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Static uploads (dev only) ──────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {fs.mkdirSync(uploadDir, { recursive: true });}

if (process.env.NODE_ENV === 'development') {
    app.use('/uploads', express.static(uploadDir));
} else {
    // In production, block direct access to local uploads directory (force Cloudinary)
    app.use('/uploads', (req, res) => res.status(403).json({ success: false, message: 'Forbidden: Local uploads disabled in production.' }));
}

// ARCH-02 fix: Only expose Swagger docs in non-production environments.
// In production, API documentation should be protected or disabled.
if (process.env.NODE_ENV !== 'production') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpecs = require('./config/swagger');
    app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
}

// ── Maintenance Mode Middleware ─────────────────────────────────────────────────
// If MAINTENANCE_MODE file exists (written by healthCheck.js on failure),
// all non-admin API requests get a 503. Frontend reads this to redirect to /maintenance.
const MAINTENANCE_FLAG = path.join(__dirname, 'MAINTENANCE_MODE');
app.use('/api', async (req, res, next) => {
    // Skip: health, auth (all endpoints), admin status, maintenance info, translations, and public promo
    const bypass = ['/health', '/auth', '/status', '/maintenance-info', '/translations', '/coupons/latest-promo'];
    if (bypass.some(p => req.path.startsWith(p))) {return next();}

    if (fs.existsSync(MAINTENANCE_FLAG)) {
        // Admins bypass maintenance mode
        try {
            const token = (req.cookies && req.cookies.adminToken) || (req.cookies && req.cookies.accessToken);
            if (token) {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const User = require('./models/User');
                const user = await User.findById(decoded.id);
                if (user && user.role === 'admin') {
                    return next(); // Admin bypassed
                }
            }
        } catch (err) {
            console.error('Maintenance Mode Bypass Error:', err.message);
        }

        let title = 'Wartungsarbeiten';
        let message = 'The site is currently undergoing maintenance. Please check back soon.';
        let estimatedTime = '';
        try {
            const data = JSON.parse(fs.readFileSync(MAINTENANCE_FLAG, 'utf8'));
            if(data.title) {title = data.title;}
            if(data.message) {message = data.message;}
            if(data.estimatedTime) {estimatedTime = data.estimatedTime;}
        } catch(e) { /* ignore parse error */ }

        return res.status(503).json({
            success: false,
            maintenance: true,
            title,
            message,
            estimatedTime
        });
    }
    next();
});

app.get('/api/maintenance-info', (req, res) => {
    if (fs.existsSync(MAINTENANCE_FLAG)) {
        let title = 'Wartungsarbeiten';
        let message = 'The site is currently undergoing maintenance. Please check back soon.';
        let estimatedTime = '';
        let statusText1 = 'System wird diagnostiziert...';
        let statusText2 = 'Neue Reparaturen werden angewendet...';
        try {
            const data = JSON.parse(fs.readFileSync(MAINTENANCE_FLAG, 'utf8'));
            if(data.title) {title = data.title;}
            if(data.message) {message = data.message;}
            if(data.estimatedTime) {estimatedTime = data.estimatedTime;}
            if(data.statusText1) {statusText1 = data.statusText1;}
            if(data.statusText2) {statusText2 = data.statusText2;}
        } catch(e) { /* ignore parse error */ }

        return res.json({ maintenance: true, title, message, estimatedTime, statusText1, statusText2 });
    }
    res.json({ maintenance: false });
});

// ── Feature routes (all 30+ routes via index) ──────────────────────────────────
app.use('/api', require('./routes/index'));

// ── Root & health ──────────────────────────────────────────────────────────────
// ARCH-03/04 fix: Minimal info in production — don't leak docs URL or uptime.
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/health', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {throw new Error('Database not connected');}
        await mongoose.connection.db.admin().ping();
        // Omit uptime in production — it reveals deployment timing
        const payload = { status: 'ok', timestamp: new Date().toISOString() };
        if (process.env.NODE_ENV !== 'production') {payload.uptime = process.uptime();}
        res.status(200).json(payload);
    } catch (error) {
        res.status(503).json({ status: 'error' });
    }
});

// ── /api/health — used by healthCheck.js script ────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {throw new Error('Database not connected');}
        await mongoose.connection.db.admin().ping();
        res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'error', message: error.message });
    }
});


const { protect, authorize } = require('./middleware/auth');
app.get('/api/status', protect, authorize('admin'), (req, res) => {
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: { state: dbStates[mongoose.connection.readyState] || 'unknown' },
        memory: process.memoryUsage(),
    });
});

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const { initSocket } = require('./utils/socket');
initSocket(server);

// ── Token cleanup (every 6 hours) ─────────────────────────────────────────────
const RefreshToken = require('./models/RefreshToken');
const cleanupExpiredTokens = async () => {
    try {
        const result = await RefreshToken.deleteMany({ expiryDate: { $lt: new Date() } });
        if (result.deletedCount > 0) {logger.info(`🧹 Cleaned up ${result.deletedCount} expired refresh tokens`);}
    } catch (error) {
        logger.error(`Token cleanup error: ${error.message}`);
    }
};
setInterval(cleanupExpiredTokens, 6 * 60 * 60 * 1000);

// ── Background CRON Jobs ──────────────────────────────────────────────────────
const startBackupJob = require('./utils/backupJob');
const startCartRecoveryJob = require('./utils/cartRecoveryJob');

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
    logger.info(`\n⚡ ${signal} received — shutting down gracefully...`);
    server.close(async () => {
        logger.info('✅ HTTP server closed — no new connections accepted.');
        try {
            await mongoose.connection.close(false);
            logger.info('✅ MongoDB connection closed cleanly.');
        } catch (err) {
            logger.error('❌ Error closing MongoDB connection:', err.message);
        }
        process.exit(0);
    });

    // Force-kill if graceful close takes too long (10 seconds)
    setTimeout(() => {
        logger.error('❌ Forced shutdown after 10s timeout.');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker / Render / PM2
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));  // Ctrl+C

// Catch unhandled promise rejections to prevent silent failures
process.on('unhandledRejection', (reason, promise) => {
    logger.error('⚠️ Unhandled Promise Rejection:', { reason: reason?.message || reason });
    // Don't crash in development — just log it
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('unhandledRejection');
    }
});

// ── Boot ───────────────────────────────────────────────────────────────────────
connectDB().then(async () => {
    // Initialize dynamic social strategies
    const { initSocialStrategies } = require('./config/passport');
    await initSocialStrategies();

    cleanupExpiredTokens();
    startBackupJob();
    startCartRecoveryJob();
    server.listen(PORT, () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
        logger.info(`📊 Admin Panel:  http://localhost:3001`);
        logger.info(`🌐 Frontend:     http://localhost:3000`);
        logger.info(`🔐 Environment:  ${process.env.NODE_ENV}`);
    });
});

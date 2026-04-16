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
app.use('/uploads', express.static(uploadDir));

// ARCH-02 fix: Only expose Swagger docs in non-production environments.
// In production, API documentation should be protected or disabled.
if (process.env.NODE_ENV !== 'production') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpecs = require('./config/swagger');
    app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
}

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

// ── Maintenance Mode Middleware ─────────────────────────────────────────────────
// If MAINTENANCE_MODE file exists (written by healthCheck.js on failure),
// all non-admin API requests get a 503. Frontend reads this to redirect to /maintenance.
const MAINTENANCE_FLAG = path.join(__dirname, 'MAINTENANCE_MODE');
app.use('/api', (req, res, next) => {
    // Skip: health check itself, auth endpoints, and admin status
    const bypass = ['/health', '/auth/login', '/auth/csrf', '/status'];
    if (bypass.some(p => req.path.startsWith(p))) return next();

    if (fs.existsSync(MAINTENANCE_FLAG)) {
        return res.status(503).json({
            success: false,
            maintenance: true,
            message: 'The site is currently undergoing maintenance. Please check back soon.'
        });
    }
    next();
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

// ── Boot ───────────────────────────────────────────────────────────────────────
connectDB().then(() => {
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

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
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const { supabaseAdmin } = require('./config/supabase');

const validateEnv = require('./config/validateEnv');
validateEnv();

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy (Render, Cloudflare, Nginx) so req.ip returns the real client IP.
// Without this, rate limiting blocks ALL users behind the proxy as one.
app.set('trust proxy', 1);

// ── Environment ────────────────────────────────────────────────────────────────
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
if (!process.env.NODE_ENV) {process.env.NODE_ENV = 'development';}

// ── Security middleware (helmet, cors, rate limit, xss, csrf) ──────────────────
const { applySecurityMiddleware } = require('./config/security');
applySecurityMiddleware(app);

// ── Request logging ────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Passport (Social OAuth) ────────────────────────────────────────────────────
// Passport has been removed in favor of Supabase Auth

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
const { maintenanceGate, maintenanceInfo } = require('./middleware/maintenanceMiddleware');
app.use('/api', maintenanceGate);
app.get('/api/maintenance-info', maintenanceInfo);

// ── Feature routes (all 30+ routes via index) ──────────────────────────────────
app.use('/api', require('./routes/index'));

// ── Root & health ──────────────────────────────────────────────────────────────
// ARCH-03/04 fix: Minimal info in production — don't leak docs URL or uptime.
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/health', async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('users').select('id').limit(1);
        if (error) throw new Error('Database not connected');
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
        const { error } = await supabaseAdmin.from('users').select('id').limit(1);
        if (error) throw new Error('Database not connected');
        res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'error', message: error.message });
    }
});


const { protect, authorize } = require('./middleware/auth');
app.get('/api/status', protect, authorize('admin'), (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: { state: 'connected' },
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

// Backup and Cart Recovery jobs have been disabled as they require Supabase-specific rewrites.

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
    logger.info(`\n⚡ ${signal} received — shutting down gracefully...`);
    server.close(() => {
        logger.info('✅ HTTP server closed — no new connections accepted.');
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
const startServer = async () => {
    try {
        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
            logger.info(`📊 Admin Panel:  http://localhost:3001`);
            logger.info(`🌐 Frontend:     http://localhost:3000`);
            logger.info(`🔐 Environment:  ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
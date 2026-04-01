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
  tracesSampleRate: 1.0,
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

// ── Swagger docs ───────────────────────────────────────────────────────────────
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ── Feature routes (all 30+ routes via index) ──────────────────────────────────
app.use('/api', require('./routes/index'));

// ── Root & health ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: 'HandyLand Backend API',
        version: '1.0.0',
        docs: '/api/api-docs',
        health: '/health',
    });
});

app.get('/health', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {throw new Error('Database not connected');}
        await mongoose.connection.db.admin().ping();
        res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
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

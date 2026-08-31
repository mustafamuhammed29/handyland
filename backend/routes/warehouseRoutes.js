/**
 * backend/routes/warehouseRoutes.js
 * Internal warehouse management routes — Admin access only
 */
'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const warehouseController = require('../controllers/warehouseController');

const isProduction = process.env.NODE_ENV === 'production';

// Rate limiter for admin warehouse write operations
const warehouseWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 300 : 5000,
    message: {
        success: false,
        error: 'WAREHOUSE_RATE_LIMITED',
        message: 'Too many warehouse write requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for admin warehouse read queries
const warehouseReadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 1000 : 10000,
    message: {
        success: false,
        error: 'WAREHOUSE_RATE_LIMITED',
        message: 'Too many warehouse read requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Protect all warehouse routes with strict authentication and admin authorization
router.use(protect);
router.use(authorize('admin'));

// GET /api/warehouse/parts — Paginated catalog with aggregated warehouse balances
router.get('/parts', warehouseReadLimiter, warehouseController.getParts);

// GET /api/warehouse/locations — Physical locations list
router.get('/locations', warehouseReadLimiter, warehouseController.getLocations);

// GET /api/warehouse/movements — Append-only movement ledger history
router.get('/movements', warehouseReadLimiter, warehouseController.getMovements);

// GET /api/warehouse/stats — Internal warehouse KPIs
router.get('/stats', warehouseReadLimiter, warehouseController.getStats);

// POST /api/warehouse/movements — Atomically record stock movement
router.post('/movements', warehouseWriteLimiter, warehouseController.createMovement);

module.exports = router;

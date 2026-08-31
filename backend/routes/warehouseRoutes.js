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

// Narrowly scoped rate limiter for admin warehouse write operations
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

// Protect all warehouse routes with strict authentication and admin authorization
router.use(protect);
router.use(authorize('admin'));

// POST /api/warehouse/movements — Atomically record stock movement
router.post('/movements', warehouseWriteLimiter, warehouseController.createMovement);

module.exports = router;

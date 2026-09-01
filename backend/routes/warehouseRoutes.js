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

// POST /api/warehouse/parts — Create canonical repair part
router.post('/parts', warehouseWriteLimiter, warehouseController.createPart);

// PATCH /api/warehouse/parts/:partId — Update repair part catalog metadata
router.patch('/parts/:partId', warehouseWriteLimiter, warehouseController.updatePart);

// POST /api/warehouse/parts/:partId/discontinue — Safely discontinue empty repair part
router.post('/parts/:partId/discontinue', warehouseWriteLimiter, warehouseController.discontinuePart);

// GET /api/warehouse/locations — Physical locations list
router.get('/locations', warehouseReadLimiter, warehouseController.getLocations);

// POST /api/warehouse/locations — Create physical warehouse location
router.post('/locations', warehouseWriteLimiter, warehouseController.createLocation);

// PATCH /api/warehouse/locations/:locationId — Update physical warehouse location metadata
router.patch('/locations/:locationId', warehouseWriteLimiter, warehouseController.updateLocation);

// POST /api/warehouse/locations/:locationId/deactivate — Safely deactivate empty warehouse location
router.post('/locations/:locationId/deactivate', warehouseWriteLimiter, warehouseController.deactivateLocation);

// GET /api/warehouse/movements — Append-only movement ledger history
router.get('/movements', warehouseReadLimiter, warehouseController.getMovements);

// GET /api/warehouse/stats — Internal warehouse KPIs
router.get('/stats', warehouseReadLimiter, warehouseController.getStats);

// POST /api/warehouse/movements — Atomically record stock movement
router.post('/movements', warehouseWriteLimiter, warehouseController.createMovement);

// ── Device Model Management (Phase 3A) ──────────────────────────────────────
// GET /api/warehouse/models — List device models
router.get('/models', warehouseReadLimiter, warehouseController.getModels);

// POST /api/warehouse/models — Create device model
router.post('/models', warehouseWriteLimiter, warehouseController.createModel);

// PATCH /api/warehouse/models/:modelId — Update device model metadata
router.patch('/models/:modelId', warehouseWriteLimiter, warehouseController.updateModel);

// POST /api/warehouse/models/:modelId/deactivate — Soft deactivate device model
router.post('/models/:modelId/deactivate', warehouseWriteLimiter, warehouseController.deactivateModel);

// POST /api/warehouse/models/:modelId/reactivate — Reactivate device model
router.post('/models/:modelId/reactivate', warehouseWriteLimiter, warehouseController.reactivateModel);

// GET /api/warehouse/models/:modelId/parts — List parts linked to device model
router.get('/models/:modelId/parts', warehouseReadLimiter, warehouseController.getModelParts);

// GET /api/warehouse/models/:modelId/discontinue-parts/preview — Preview discontinuation eligibility
router.get('/models/:modelId/discontinue-parts/preview', warehouseReadLimiter, warehouseController.previewDiscontinueModelParts);

// POST /api/warehouse/models/:modelId/discontinue-parts — Batch discontinue zero-stock parts linked to model
router.post('/models/:modelId/discontinue-parts', warehouseWriteLimiter, warehouseController.discontinueModelParts);

module.exports = router;

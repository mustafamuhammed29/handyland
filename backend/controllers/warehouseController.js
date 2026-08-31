/**
 * backend/controllers/warehouseController.js
 * Controller for internal warehouse management, stock movements, read APIs, and location management.
 */
'use strict';

const { executeWarehouseMovement, WarehouseServiceError } = require('../services/warehouseMovementService');
const {
    getWarehouseParts,
    getWarehouseLocations,
    getWarehouseMovements,
    getWarehouseStats
} = require('../services/warehouseReadService');
const {
    createWarehouseLocation,
    updateWarehouseLocation,
    deactivateWarehouseLocation
} = require('../services/warehouseLocationService');

/**
 * @route POST /api/warehouse/movements
 * @desc Atomically records an internal warehouse repair-part movement
 * @access Private (Admin only)
 */
exports.createMovement = async (req, res, next) => {
    try {
        const actorId = req.user?.id;
        if (!actorId) {
            return res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authentication context missing'
            });
        }

        const result = await executeWarehouseMovement(req.body, actorId);

        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route GET /api/warehouse/parts
 * @desc Returns paginated repair parts with aggregated warehouse balances
 * @access Private (Admin only)
 */
exports.getParts = async (req, res, next) => {
    try {
        const result = await getWarehouseParts(req.query);
        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route GET /api/warehouse/locations
 * @desc Returns physical warehouse locations
 * @access Private (Admin only)
 */
exports.getLocations = async (req, res, next) => {
    try {
        const result = await getWarehouseLocations(req.query);
        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route GET /api/warehouse/movements
 * @desc Returns paginated append-only movement ledger history
 * @access Private (Admin only)
 */
exports.getMovements = async (req, res, next) => {
    try {
        const result = await getWarehouseMovements(req.query);
        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route GET /api/warehouse/stats
 * @desc Returns aggregated internal warehouse KPIs
 * @access Private (Admin only)
 */
exports.getStats = async (req, res, next) => {
    try {
        const result = await getWarehouseStats(req.query);
        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route POST /api/warehouse/locations
 * @desc Creates a new physical warehouse location
 * @access Private (Admin only)
 */
exports.createLocation = async (req, res, next) => {
    try {
        const result = await createWarehouseLocation(req.body);
        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route PATCH /api/warehouse/locations/:locationId
 * @desc Updates metadata for an existing warehouse location
 * @access Private (Admin only)
 */
exports.updateLocation = async (req, res, next) => {
    try {
        const { locationId } = req.params;
        const result = await updateWarehouseLocation(locationId, req.body);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @route POST /api/warehouse/locations/:locationId/deactivate
 * @desc Safely deactivates an empty warehouse location
 * @access Private (Admin only)
 */
exports.deactivateLocation = async (req, res, next) => {
    try {
        const { locationId } = req.params;
        const result = await deactivateWarehouseLocation(locationId, req.body);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof WarehouseServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        next(error);
    }
};

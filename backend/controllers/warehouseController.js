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
const {
    createWarehousePart,
    updateWarehousePart,
    discontinueWarehousePart
} = require('../services/warehouseCatalogService');
const {
    getDeviceModels,
    createDeviceModel,
    updateDeviceModel,
    deactivateDeviceModel,
    reactivateDeviceModel,
    getDeviceModelParts,
    previewDiscontinueModelParts,
    discontinueDeviceModelParts
} = require('../services/warehouseModelService');

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

/**
 * @route POST /api/warehouse/parts
 * @desc Creates a new canonical repair part in warehouse catalog
 * @access Private (Admin only)
 */
exports.createPart = async (req, res, next) => {
    try {
        const result = await createWarehousePart(req.body);
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
 * @route PATCH /api/warehouse/parts/:partId
 * @desc Updates metadata for an existing repair part
 * @access Private (Admin only)
 */
exports.updatePart = async (req, res, next) => {
    try {
        const { partId } = req.params;
        const result = await updateWarehousePart(partId, req.body);
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
 * @route POST /api/warehouse/parts/:partId/discontinue
 * @desc Safely discontinues an empty repair part
 * @access Private (Admin only)
 */
exports.discontinuePart = async (req, res, next) => {
    try {
        const { partId } = req.params;
        const result = await discontinueWarehousePart(partId, req.body);
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
 * @route GET /api/warehouse/models
 * @desc Returns device models list with optional brand/active filtering
 * @access Private (Admin only)
 */
exports.getModels = async (req, res, next) => {
    try {
        const result = await getDeviceModels(req.query);
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
 * @route POST /api/warehouse/models
 * @desc Creates a new first-class device model
 * @access Private (Admin only)
 */
exports.createModel = async (req, res, next) => {
    try {
        const result = await createDeviceModel(req.body);
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
 * @route PATCH /api/warehouse/models/:modelId
 * @desc Updates metadata for an existing device model
 * @access Private (Admin only)
 */
exports.updateModel = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const result = await updateDeviceModel(modelId, req.body);
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
 * @route POST /api/warehouse/models/:modelId/deactivate
 * @desc Safely deactivates a device model
 * @access Private (Admin only)
 */
exports.deactivateModel = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const result = await deactivateDeviceModel(modelId);
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
 * @route POST /api/warehouse/models/:modelId/reactivate
 * @desc Reactivates a device model
 * @access Private (Admin only)
 */
exports.reactivateModel = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const result = await reactivateDeviceModel(modelId);
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
 * @route GET /api/warehouse/models/:modelId/parts
 * @desc Returns repair parts linked to a device model
 * @access Private (Admin only)
 */
exports.getModelParts = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const result = await getDeviceModelParts(modelId);
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
 * @route GET /api/warehouse/models/:modelId/discontinue-parts/preview
 * @desc Previews part counts and stock blockers before model parts discontinuation
 * @access Private (Admin only)
 */
exports.previewDiscontinueModelParts = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const result = await previewDiscontinueModelParts(modelId);
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
 * @route POST /api/warehouse/models/:modelId/discontinue-parts
 * @desc Atomically discontinues all zero-stock parts linked to a model
 * @access Private (Admin only)
 */
exports.discontinueModelParts = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        const result = await discontinueDeviceModelParts(modelId);
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

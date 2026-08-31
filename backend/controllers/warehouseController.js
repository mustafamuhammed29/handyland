/**
 * backend/controllers/warehouseController.js
 * Controller for internal warehouse management and stock movements.
 */
'use strict';

const { executeWarehouseMovement, WarehouseServiceError } = require('../services/warehouseMovementService');

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

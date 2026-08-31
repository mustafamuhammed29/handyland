/**
 * backend/services/warehouseMovementService.js
 * Domain service for atomic internal repair-parts warehouse movements.
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUPPORTED_MOVEMENT_TYPES = Object.freeze([
    'RECEIVE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'TRANSFER',
    'DAMAGE',
    'SUPPLIER_RETURN'
]);

const MAX_QUANTITY = 100000;
const MAX_REASON_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;

class WarehouseServiceError extends Error {
    constructor(statusCode, errorCode, message) {
        super(message);
        this.name = 'WarehouseServiceError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

/**
 * Validates and sanitizes movement request payload.
 *
 * @param {object} payload - Incoming request body
 * @param {string} actorId - Sanitized user ID derived from auth session
 * @returns {object} Normalized parameters
 */
function validateMovementInput(payload, actorId) {
    if (!payload || typeof payload !== 'object') {
        throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Invalid request body');
    }

    // Reject client-supplied actor or lifecycle overrides
    if (
        payload.repairTicketId !== undefined ||
        payload.purchaseOrderId !== undefined ||
        payload.performedBy !== undefined ||
        payload.actorId !== undefined ||
        payload.availableQuantity !== undefined ||
        payload.quantityOnHand !== undefined ||
        payload.costPrice !== undefined ||
        payload.sellPrice !== undefined
    ) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Request contains disallowed fields');
    }

    const {
        repairPartId,
        movementType,
        quantity,
        sourceLocationId,
        destinationLocationId,
        reason,
        notes
    } = payload;

    // 1. Repair Part ID validation
    if (!repairPartId || typeof repairPartId !== 'string' || !UUID_REGEX.test(repairPartId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Valid repairPartId UUID is required');
    }

    // 2. Movement Type validation
    if (!movementType || typeof movementType !== 'string' || !SUPPORTED_MOVEMENT_TYPES.includes(movementType)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Unsupported movementType');
    }

    // 3. Quantity validation
    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty <= 0 || numQty > MAX_QUANTITY) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', `Quantity must be a positive integer <= ${MAX_QUANTITY}`);
    }

    // 4. Source and Destination Location validation
    if (sourceLocationId !== undefined && sourceLocationId !== null) {
        if (typeof sourceLocationId !== 'string' || !UUID_REGEX.test(sourceLocationId)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Invalid sourceLocationId UUID');
        }
    }

    if (destinationLocationId !== undefined && destinationLocationId !== null) {
        if (typeof destinationLocationId !== 'string' || !UUID_REGEX.test(destinationLocationId)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Invalid destinationLocationId UUID');
        }
    }

    // Enforce source/destination combination rules per movement type
    if (movementType === 'RECEIVE' || movementType === 'ADJUSTMENT_IN') {
        if (!destinationLocationId || sourceLocationId) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', `${movementType} requires destinationLocationId and no sourceLocationId`);
        }
    } else if (movementType === 'ADJUSTMENT_OUT' || movementType === 'DAMAGE' || movementType === 'SUPPLIER_RETURN') {
        if (!sourceLocationId || destinationLocationId) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', `${movementType} requires sourceLocationId and no destinationLocationId`);
        }
    } else if (movementType === 'TRANSFER') {
        if (!sourceLocationId || !destinationLocationId) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'TRANSFER requires both sourceLocationId and destinationLocationId');
        }
        if (sourceLocationId === destinationLocationId) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Source and destination locations must be distinct for TRANSFER');
        }
    }

    // 5. Reason validation
    let sanitizedReason = null;
    if (reason !== undefined && reason !== null) {
        if (typeof reason !== 'string') {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Reason must be a string');
        }
        sanitizedReason = reason.trim();
        if (sanitizedReason.length > MAX_REASON_LENGTH) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', `Reason cannot exceed ${MAX_REASON_LENGTH} characters`);
        }
    }

    // Mandatory reason check for adjustments, damage, supplier return
    if (['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN'].includes(movementType)) {
        if (!sanitizedReason || sanitizedReason.length === 0) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', `A non-empty reason is required for ${movementType}`);
        }
    }

    // 6. Notes validation
    let sanitizedNotes = null;
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string') {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Notes must be a string');
        }
        sanitizedNotes = notes.trim();
        if (sanitizedNotes.length > MAX_NOTES_LENGTH) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`);
        }
    }

    // 7. Actor ID validation
    if (!actorId || typeof actorId !== 'string' || !UUID_REGEX.test(actorId)) {
        throw new WarehouseServiceError(401, 'WAREHOUSE_UNAUTHORIZED', 'Invalid or missing actor context');
    }

    return {
        repairPartId,
        movementType,
        quantity: numQty,
        sourceLocationId: sourceLocationId || null,
        destinationLocationId: destinationLocationId || null,
        performedBy: actorId,
        reason: sanitizedReason,
        notes: sanitizedNotes
    };
}

/**
 * Maps database exceptions from the atomic RPC to stable, safe domain errors.
 *
 * @param {Error|object} error - Raw error from Supabase RPC
 * @returns {WarehouseServiceError} Mapped domain error
 */
function mapDatabaseError(error) {
    const rawMsg = String(error?.message || error?.details || '');

    if (rawMsg.includes('INSUFFICIENT_AVAILABLE_STOCK')) {
        return new WarehouseServiceError(409, 'WAREHOUSE_INSUFFICIENT_STOCK', 'Insufficient available stock at source location');
    }

    if (
        rawMsg.includes('PART_NOT_FOUND') ||
        rawMsg.includes('PART_NOT_ACTIVE') ||
        rawMsg.includes('SOURCE_LOCATION_NOT_ACTIVE') ||
        rawMsg.includes('DESTINATION_LOCATION_NOT_ACTIVE') ||
        rawMsg.includes('SOURCE_BALANCE_NOT_FOUND')
    ) {
        return new WarehouseServiceError(409, 'WAREHOUSE_PART_OR_LOCATION_NOT_AVAILABLE', 'The requested repair part or warehouse location is not available');
    }

    if (
        rawMsg.includes('UNSUPPORTED_MOVEMENT_TYPE') ||
        rawMsg.includes('INVALID_QUANTITY') ||
        rawMsg.includes('INVALID_LOCATION_COMBINATION') ||
        rawMsg.includes('REASON_REQUIRED')
    ) {
        return new WarehouseServiceError(400, 'WAREHOUSE_MOVEMENT_INVALID', 'Invalid warehouse movement request');
    }

    if (rawMsg.includes('deadlock') || rawMsg.includes('serialization') || rawMsg.includes('40P01') || rawMsg.includes('40001')) {
        return new WarehouseServiceError(409, 'WAREHOUSE_MOVEMENT_CONFLICT', 'Warehouse transaction conflict detected. Please retry.');
    }

    // Default safe fallback without exposing database details or SQL
    return new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Warehouse movement service is temporarily unavailable');
}

/**
 * Executes a single atomic warehouse movement via the private PostgreSQL RPC.
 *
 * @param {object} payload - Incoming request body
 * @param {string} actorId - Authenticated admin user UUID
 * @returns {Promise<object>} Sanitized movement result
 */
async function executeWarehouseMovement(payload, actorId) {
    const validated = validateMovementInput(payload, actorId);

    const { data, error } = await supabaseAdmin.rpc('apply_part_stock_movement', {
        p_repair_part_id: validated.repairPartId,
        p_movement_type: validated.movementType,
        p_quantity: validated.quantity,
        p_source_location_id: validated.sourceLocationId,
        p_destination_location_id: validated.destinationLocationId,
        p_performed_by: validated.performedBy,
        p_reason: validated.reason,
        p_notes: validated.notes
    });

    if (error) {
        throw mapDatabaseError(error);
    }

    if (!data || typeof data !== 'object') {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Unexpected response from warehouse movement processor');
    }

    // Return strictly sanitized result — NEVER echo internal notes or costs
    return {
        movementId: data.movementId,
        repairPartId: data.repairPartId,
        movementType: data.movementType,
        quantity: data.quantity,
        sourceLocationId: data.sourceLocationId || null,
        destinationLocationId: data.destinationLocationId || null,
        sourceAvailableQuantity: data.sourceAvailableQuantity !== undefined ? data.sourceAvailableQuantity : null,
        destinationAvailableQuantity: data.destinationAvailableQuantity !== undefined ? data.destinationAvailableQuantity : null,
        createdAt: data.createdAt
    };
}

module.exports = {
    WarehouseServiceError,
    validateMovementInput,
    mapDatabaseError,
    executeWarehouseMovement,
    SUPPORTED_MOVEMENT_TYPES,
    MAX_QUANTITY
};

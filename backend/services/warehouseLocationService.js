/**
 * backend/services/warehouseLocationService.js
 * Domain service for managing physical warehouse locations (Phase 2B).
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { WarehouseServiceError } = require('./warehouseMovementService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCATION_CODE_REGEX = /^[A-Z0-9_\-\.\/]{1,80}$/;

const ALLOWED_CREATE_FIELDS = Object.freeze([
    'locationCode',
    'zone',
    'rack',
    'shelf',
    'bin',
    'description'
]);

const ALLOWED_PATCH_FIELDS = Object.freeze([
    'zone',
    'rack',
    'shelf',
    'bin',
    'description'
]);

const FORBIDDEN_PATCH_FIELDS = Object.freeze([
    'locationCode',
    'location_code',
    'isActive',
    'is_active',
    'id',
    'stock',
    'balance',
    'cost',
    'price',
    'supplier',
    'actor'
]);

/**
 * Validates that only allowed fields exist in a payload.
 */
function assertExactPayloadFields(body, allowedFields) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'Payload must be a JSON object');
    }

    const receivedKeys = Object.keys(body);
    for (const key of receivedKeys) {
        if (!allowedFields.includes(key)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', `Unsupported field in payload: ${key}`);
        }
    }
}

/**
 * Sanitizes a warehouse location record for API response whitelist.
 */
function sanitizeLocation(loc) {
    return {
        id: loc.id,
        locationCode: loc.location_code || loc.locationCode,
        zone: loc.zone,
        rack: loc.rack || null,
        shelf: loc.shelf || null,
        bin: loc.bin || null,
        description: loc.description || null,
        isActive: Boolean(loc.is_active !== undefined ? loc.is_active : loc.isActive)
    };
}

/**
 * POST /api/warehouse/locations
 * Creates a new physical warehouse location.
 */
async function createWarehouseLocation(body) {
    assertExactPayloadFields(body, ALLOWED_CREATE_FIELDS);

    const { locationCode, zone, rack, shelf, bin, description } = body;

    // 1. Validate locationCode
    if (!locationCode || typeof locationCode !== 'string' || !locationCode.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'locationCode is required and cannot be empty');
    }

    const normalizedCode = locationCode.trim().toUpperCase();
    if (normalizedCode.length > 80 || !LOCATION_CODE_REGEX.test(normalizedCode)) {
        throw new WarehouseServiceError(
            400,
            'WAREHOUSE_INVALID_PAYLOAD',
            'locationCode must be 1-80 characters and contain only uppercase alphanumeric characters, dashes, underscores, dots, or slashes'
        );
    }

    // 2. Validate zone
    if (!zone || typeof zone !== 'string' || !zone.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'zone is required and cannot be empty');
    }
    const trimmedZone = zone.trim();
    if (trimmedZone.length > 80) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'zone must not exceed 80 characters');
    }

    // 3. Validate rack, shelf, bin
    if (rack !== undefined && rack !== null && (typeof rack !== 'string' || rack.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'rack must be a string up to 80 characters');
    }
    if (shelf !== undefined && shelf !== null && (typeof shelf !== 'string' || shelf.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'shelf must be a string up to 80 characters');
    }
    if (bin !== undefined && bin !== null && (typeof bin !== 'string' || bin.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'bin must be a string up to 80 characters');
    }

    // 4. Validate description
    if (description !== undefined && description !== null && (typeof description !== 'string' || description.trim().length > 500)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'description must be a string up to 500 characters');
    }

    // 5. Insert into warehouse_locations
    const insertPayload = {
        location_code: normalizedCode,
        zone: trimmedZone,
        rack: rack ? rack.trim() : null,
        shelf: shelf ? shelf.trim() : null,
        bin: bin ? bin.trim() : null,
        description: description ? description.trim() : null,
        is_active: true
    };

    const { data, error } = await supabaseAdmin
        .from('warehouse_locations')
        .insert(insertPayload)
        .select('id, location_code, zone, rack, shelf, bin, description, is_active')
        .single();

    if (error) {
        if (error.code === '23505' || (error.message && error.message.includes('unique'))) {
            throw new WarehouseServiceError(409, 'WAREHOUSE_LOCATION_CODE_EXISTS', 'Warehouse location code already exists');
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to create warehouse location');
    }

    return sanitizeLocation(data);
}

/**
 * PATCH /api/warehouse/locations/:locationId
 * Updates metadata for an existing warehouse location (locationCode is immutable).
 */
async function updateWarehouseLocation(locationId, body) {
    if (!locationId || typeof locationId !== 'string' || !UUID_REGEX.test(locationId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid locationId UUID');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_EMPTY_PAYLOAD', 'PATCH payload must contain at least one update field');
    }

    const receivedKeys = Object.keys(body);
    for (const key of receivedKeys) {
        if (FORBIDDEN_PATCH_FIELDS.includes(key)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_IMMUTABLE_FIELD', `Field '${key}' cannot be modified`);
        }
        if (!ALLOWED_PATCH_FIELDS.includes(key)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', `Unsupported field in payload: ${key}`);
        }
    }

    // Check location exists
    const { data: existing, error: findError } = await supabaseAdmin
        .from('warehouse_locations')
        .select('id, is_active')
        .eq('id', locationId)
        .single();

    if (findError || !existing) {
        throw new WarehouseServiceError(404, 'WAREHOUSE_LOCATION_NOT_FOUND', 'Warehouse location not found');
    }

    const updatePayload = {};

    if (body.zone !== undefined) {
        if (typeof body.zone !== 'string' || !body.zone.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'zone cannot be empty');
        }
        const trimmed = body.zone.trim();
        if (trimmed.length > 80) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'zone must not exceed 80 characters');
        }
        updatePayload.zone = trimmed;
    }

    if (body.rack !== undefined) {
        if (body.rack !== null && (typeof body.rack !== 'string' || body.rack.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'rack must be a string up to 80 characters');
        }
        updatePayload.rack = body.rack ? body.rack.trim() : null;
    }

    if (body.shelf !== undefined) {
        if (body.shelf !== null && (typeof body.shelf !== 'string' || body.shelf.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'shelf must be a string up to 80 characters');
        }
        updatePayload.shelf = body.shelf ? body.shelf.trim() : null;
    }

    if (body.bin !== undefined) {
        if (body.bin !== null && (typeof body.bin !== 'string' || body.bin.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'bin must be a string up to 80 characters');
        }
        updatePayload.bin = body.bin ? body.bin.trim() : null;
    }

    if (body.description !== undefined) {
        if (body.description !== null && (typeof body.description !== 'string' || body.description.trim().length > 500)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'description must be a string up to 500 characters');
        }
        updatePayload.description = body.description ? body.description.trim() : null;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('warehouse_locations')
        .update(updatePayload)
        .eq('id', locationId)
        .select('id, location_code, zone, rack, shelf, bin, description, is_active')
        .single();

    if (updateError || !updated) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to update warehouse location');
    }

    return sanitizeLocation(updated);
}

/**
 * POST /api/warehouse/locations/:locationId/deactivate
 * Atomically deactivates an empty warehouse location via Migration 020 RPC.
 */
async function deactivateWarehouseLocation(locationId, body) {
    if (!locationId || typeof locationId !== 'string' || !UUID_REGEX.test(locationId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid locationId UUID');
    }

    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'Deactivate endpoint does not accept a request body');
    }

    // Execute atomic PostgreSQL function (Migration 020)
    const { data, error } = await supabaseAdmin.rpc('deactivate_warehouse_location', {
        p_location_id: locationId
    });

    if (error) {
        const errorMsg = error.message || '';
        const errorCode = error.code || '';

        if (errorMsg.includes('WAREHOUSE_LOCATION_NOT_FOUND') || errorCode === 'P0002') {
            throw new WarehouseServiceError(404, 'WAREHOUSE_LOCATION_NOT_FOUND', 'Warehouse location not found');
        }

        if (errorMsg.includes('WAREHOUSE_LOCATION_NOT_EMPTY') || errorCode === 'P0001') {
            throw new WarehouseServiceError(
                409,
                'WAREHOUSE_LOCATION_NOT_EMPTY',
                'Cannot deactivate warehouse location with non-zero part stock balances'
            );
        }

        if (errorCode === '40P01' || errorCode === '40001' || errorMsg.includes('deadlock') || errorMsg.includes('serialization')) {
            throw new WarehouseServiceError(
                409,
                'WAREHOUSE_LOCATION_CONFLICT',
                'Warehouse location operation encountered a concurrent conflict. Please retry.'
            );
        }

        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to deactivate warehouse location');
    }

    return sanitizeLocation(data);
}

module.exports = {
    createWarehouseLocation,
    updateWarehouseLocation,
    deactivateWarehouseLocation
};

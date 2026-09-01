/**
 * backend/services/warehouseCatalogService.js
 * Domain service for managing internal repair-parts catalog metadata (Phase 2C).
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { WarehouseServiceError } = require('./warehouseMovementService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SKU_REGEX = /^[A-Z0-9_\-\.\/]{1,80}$/;
const BARCODE_REGEX = /^[A-Z0-9_\-\.\/]{1,80}$/;

const ALLOWED_CREATE_FIELDS = Object.freeze([
    'name',
    'sku',
    'category',
    'compatibleDevices',
    'brand',
    'deviceFamily',
    'partType',
    'quality',
    'barcode',
    'minStock',
    'deviceModelId'
]);

const ALLOWED_PATCH_FIELDS = Object.freeze([
    'name',
    'category',
    'compatibleDevices',
    'brand',
    'deviceFamily',
    'partType',
    'quality',
    'barcode',
    'minStock'
]);

const FORBIDDEN_PATCH_FIELDS = Object.freeze([
    'sku',
    'status',
    'isActive',
    'is_active',
    'stock',
    'quantity',
    'quantityOnHand',
    'quantityReserved',
    'quantityDefective',
    'quantityInspection',
    'costPrice',
    'cost_price',
    'sellPrice',
    'sell_price',
    'supplierId',
    'supplier_id',
    'notes',
    'imageUrl',
    'image_url',
    'id',
    'created_at',
    'updated_at',
    'actor',
    'performedBy',
    'repairTicketId',
    'purchaseOrderId'
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
 * Sanitizes and deduplicates compatible devices list.
 */
function sanitizeCompatibleDevices(devices) {
    if (!Array.isArray(devices)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'compatibleDevices must be an array of strings');
    }

    if (devices.length > 50) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'compatibleDevices array cannot exceed 50 items');
    }

    const seen = new Set();
    const result = [];

    for (const item of devices) {
        if (typeof item !== 'string' || !item.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'Each compatible device must be a non-empty string');
        }
        const trimmed = item.trim();
        if (trimmed.length > 80) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'Compatible device name must not exceed 80 characters');
        }

        const lowerKey = trimmed.toLowerCase();
        if (!seen.has(lowerKey)) {
            seen.add(lowerKey);
            result.push(trimmed);
        }
    }

    return result;
}

/**
 * Sanitizes a repair part record for API response whitelist.
 */
function sanitizePart(p) {
    return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode || null,
        category: p.category || null,
        compatibleDevices: p.compatible_devices || p.compatibleDevices || [],
        brand: p.brand || null,
        deviceFamily: p.device_family || p.deviceFamily || null,
        partType: p.part_type || p.partType || null,
        quality: p.quality || null,
        status: p.status || (p.is_active ? 'active' : 'discontinued'),
        isActive: Boolean(p.is_active !== undefined ? p.is_active : p.isActive),
        minStock: Number(p.min_stock !== undefined ? p.min_stock : p.minStock) || 0,
        imageUrl: p.image_url || p.imageUrl || null
    };
}

/**
 * POST /api/warehouse/parts
 * Creates a new canonical repair part in the warehouse catalog.
 */
async function createWarehousePart(body) {
    assertExactPayloadFields(body, ALLOWED_CREATE_FIELDS);

    const {
        name,
        sku,
        category,
        compatibleDevices,
        brand,
        deviceFamily,
        partType,
        quality,
        barcode,
        minStock
    } = body;

    // 1. Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'name is required and cannot be empty');
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 120) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'name must not exceed 120 characters');
    }

    // 2. Validate sku
    if (!sku || typeof sku !== 'string' || !sku.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'sku is required and cannot be empty');
    }
    const normalizedSku = sku.trim().toUpperCase();
    if (normalizedSku.length > 80 || !SKU_REGEX.test(normalizedSku)) {
        throw new WarehouseServiceError(
            400,
            'WAREHOUSE_INVALID_PAYLOAD',
            'sku must be 1-80 characters and contain only uppercase alphanumeric characters, dashes, underscores, dots, or slashes'
        );
    }

    // 3. Validate barcode (optional)
    let normalizedBarcode = null;
    if (barcode !== undefined && barcode !== null) {
        if (typeof barcode !== 'string' || !barcode.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'barcode must be a non-empty string when provided');
        }
        normalizedBarcode = barcode.trim().toUpperCase();
        if (normalizedBarcode.length > 80 || !BARCODE_REGEX.test(normalizedBarcode)) {
            throw new WarehouseServiceError(
                400,
                'WAREHOUSE_INVALID_PAYLOAD',
                'barcode must be 1-80 characters and contain only uppercase alphanumeric characters, dashes, underscores, dots, or slashes'
            );
        }
    }

    // 4. Validate category, brand, deviceFamily, partType, quality
    if (category !== undefined && category !== null && (typeof category !== 'string' || category.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'category must be a string up to 80 characters');
    }
    if (brand !== undefined && brand !== null && (typeof brand !== 'string' || brand.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'brand must be a string up to 80 characters');
    }
    if (deviceFamily !== undefined && deviceFamily !== null && (typeof deviceFamily !== 'string' || deviceFamily.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'deviceFamily must not exceed 80 characters');
    }
    if (partType !== undefined && partType !== null && (typeof partType !== 'string' || partType.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'partType must not exceed 80 characters');
    }
    if (quality !== undefined && quality !== null && (typeof quality !== 'string' || quality.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'quality must not exceed 80 characters');
    }

    // 5. Validate compatibleDevices
    let normalizedDevices = [];
    if (compatibleDevices !== undefined && compatibleDevices !== null) {
        normalizedDevices = sanitizeCompatibleDevices(compatibleDevices);
    }

    // 6. Validate deviceModelId (optional model relation link)
    let targetModel = null;
    if (body.deviceModelId !== undefined && body.deviceModelId !== null) {
        if (typeof body.deviceModelId !== 'string' || !UUID_REGEX.test(body.deviceModelId)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid deviceModelId UUID');
        }

        const { data: modelRow, error: modelErr } = await supabaseAdmin
            .from('device_models')
            .select('id, brand, model_name, device_family, is_active')
            .eq('id', body.deviceModelId)
            .single();

        if (modelErr || !modelRow) {
            throw new WarehouseServiceError(404, 'WAREHOUSE_MODEL_NOT_FOUND', 'Target device model not found');
        }

        if (modelRow.is_active === false) {
            throw new WarehouseServiceError(409, 'WAREHOUSE_MODEL_INACTIVE', 'This device model is inactive.');
        }

        targetModel = modelRow;
        if (!normalizedDevices.includes(targetModel.model_name)) {
            normalizedDevices.push(targetModel.model_name);
        }
    }

    // 7. Validate minStock
    let parsedMinStock = 2;
    if (minStock !== undefined && minStock !== null) {
        const num = Number(minStock);
        if (!Number.isInteger(num) || num < 0 || num > 100000) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'minStock must be an integer between 0 and 100000');
        }
        parsedMinStock = num;
    }

    // 8. Insert into repair_parts
    const insertPayload = {
        name: trimmedName,
        sku: normalizedSku,
        barcode: normalizedBarcode,
        category: category ? category.trim() : null,
        brand: brand ? brand.trim() : (targetModel ? targetModel.brand : null),
        device_family: deviceFamily ? deviceFamily.trim() : (targetModel ? targetModel.device_family : null),
        part_type: partType ? partType.trim() : null,
        quality: quality ? quality.trim() : null,
        compatible_devices: normalizedDevices,
        min_stock: parsedMinStock,
        stock: 0,
        status: 'active',
        is_active: true
    };

    const { data, error } = await supabaseAdmin
        .from('repair_parts')
        .insert(insertPayload)
        .select(
            'id, name, sku, barcode, category, compatible_devices, brand, device_family, part_type, quality, status, is_active, min_stock, image_url'
        )
        .single();

    if (error) {
        const errorMsg = (error.message || '').toLowerCase();
        if (error.code === '23505' || errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
            if (errorMsg.includes('barcode') || (error.details && error.details.includes('barcode'))) {
                throw new WarehouseServiceError(409, 'WAREHOUSE_PART_BARCODE_EXISTS', 'Warehouse repair part barcode already exists');
            }
            throw new WarehouseServiceError(409, 'WAREHOUSE_PART_SKU_EXISTS', 'Warehouse repair part SKU already exists');
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to create repair part catalog item');
    }

    // 9. If targetModel was supplied, link relation in repair_part_compatible_models
    if (targetModel && data?.id) {
        await supabaseAdmin
            .from('repair_part_compatible_models')
            .insert({
                repair_part_id: data.id,
                device_model_id: targetModel.id,
                is_primary: true
            });
    }

    return sanitizePart(data);
}

/**
 * PATCH /api/warehouse/parts/:partId
 * Updates metadata for an existing repair part (SKU is immutable).
 */
async function updateWarehousePart(partId, body) {
    if (!partId || typeof partId !== 'string' || !UUID_REGEX.test(partId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid partId UUID');
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

    // Check repair part exists
    const { data: existing, error: findError } = await supabaseAdmin
        .from('repair_parts')
        .select('id, status, is_active')
        .eq('id', partId)
        .single();

    if (findError || !existing) {
        throw new WarehouseServiceError(404, 'WAREHOUSE_PART_NOT_FOUND', 'Warehouse repair part not found');
    }

    const updatePayload = {};

    if (body.name !== undefined) {
        if (typeof body.name !== 'string' || !body.name.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'name cannot be empty');
        }
        const trimmed = body.name.trim();
        if (trimmed.length > 120) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'name must not exceed 120 characters');
        }
        updatePayload.name = trimmed;
    }

    if (body.barcode !== undefined) {
        if (body.barcode === null || body.barcode === '') {
            updatePayload.barcode = null;
        } else {
            if (typeof body.barcode !== 'string' || !body.barcode.trim()) {
                throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'barcode must be a non-empty string');
            }
            const normalized = body.barcode.trim().toUpperCase();
            if (normalized.length > 80 || !BARCODE_REGEX.test(normalized)) {
                throw new WarehouseServiceError(
                    400,
                    'WAREHOUSE_INVALID_PAYLOAD',
                    'barcode must be 1-80 characters and contain only uppercase alphanumeric characters, dashes, underscores, dots, or slashes'
                );
            }
            updatePayload.barcode = normalized;
        }
    }

    if (body.category !== undefined) {
        if (body.category !== null && (typeof body.category !== 'string' || body.category.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'category must be a string up to 80 characters');
        }
        updatePayload.category = body.category ? body.category.trim() : null;
    }

    if (body.brand !== undefined) {
        if (body.brand !== null && (typeof body.brand !== 'string' || body.brand.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'brand must be a string up to 80 characters');
        }
        updatePayload.brand = body.brand ? body.brand.trim() : null;
    }

    if (body.deviceFamily !== undefined) {
        if (body.deviceFamily !== null && (typeof body.deviceFamily !== 'string' || body.deviceFamily.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'deviceFamily must not exceed 80 characters');
        }
        updatePayload.device_family = body.deviceFamily ? body.deviceFamily.trim() : null;
    }

    if (body.partType !== undefined) {
        if (body.partType !== null && (typeof body.partType !== 'string' || body.partType.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'partType must not exceed 80 characters');
        }
        updatePayload.part_type = body.partType ? body.partType.trim() : null;
    }

    if (body.quality !== undefined) {
        if (body.quality !== null && (typeof body.quality !== 'string' || body.quality.trim().length > 80)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'quality must not exceed 80 characters');
        }
        updatePayload.quality = body.quality ? body.quality.trim() : null;
    }

    if (body.compatibleDevices !== undefined) {
        if (body.compatibleDevices === null) {
            updatePayload.compatible_devices = [];
        } else {
            updatePayload.compatible_devices = sanitizeCompatibleDevices(body.compatibleDevices);
        }
    }

    if (body.minStock !== undefined) {
        const num = Number(body.minStock);
        if (!Number.isInteger(num) || num < 0 || num > 100000) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'minStock must be an integer between 0 and 100000');
        }
        updatePayload.min_stock = num;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('repair_parts')
        .update(updatePayload)
        .eq('id', partId)
        .select(
            'id, name, sku, barcode, category, compatible_devices, brand, device_family, part_type, quality, status, is_active, min_stock, image_url'
        )
        .single();

    if (updateError || !updated) {
        const errorMsg = (updateError?.message || '').toLowerCase();
        if (updateError?.code === '23505' || errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
            throw new WarehouseServiceError(409, 'WAREHOUSE_PART_BARCODE_EXISTS', 'Warehouse repair part barcode already exists');
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to update repair part');
    }

    return sanitizePart(updated);
}

/**
 * POST /api/warehouse/parts/:partId/discontinue
 * Atomically discontinues an empty repair part via Migration 021 RPC.
 */
async function discontinueWarehousePart(partId, body) {
    if (!partId || typeof partId !== 'string' || !UUID_REGEX.test(partId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid partId UUID');
    }

    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'Discontinue endpoint does not accept a request body');
    }

    // Execute atomic PostgreSQL function (Migration 021)
    const { data, error } = await supabaseAdmin.rpc('discontinue_repair_part', {
        p_part_id: partId
    });

    if (error) {
        const errorMsg = error.message || '';
        const errorCode = error.code || '';

        if (errorMsg.includes('WAREHOUSE_PART_NOT_FOUND') || errorCode === 'P0002') {
            throw new WarehouseServiceError(404, 'WAREHOUSE_PART_NOT_FOUND', 'Warehouse repair part not found');
        }

        if (errorMsg.includes('WAREHOUSE_PART_HAS_STOCK') || errorCode === 'P0001') {
            throw new WarehouseServiceError(
                409,
                'WAREHOUSE_PART_HAS_STOCK',
                'Cannot discontinue repair part with non-zero warehouse stock balances'
            );
        }

        if (errorCode === '40P01' || errorCode === '40001' || errorMsg.includes('deadlock') || errorMsg.includes('serialization')) {
            throw new WarehouseServiceError(
                409,
                'WAREHOUSE_PART_CONFLICT',
                'Warehouse repair part operation encountered a concurrent conflict. Please retry.'
            );
        }

        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to discontinue repair part');
    }

    const sanitized = sanitizePart(data);
    return {
        ...sanitized,
        alreadyDiscontinued: Boolean(data.already_discontinued)
    };
}

module.exports = {
    createWarehousePart,
    updateWarehousePart,
    discontinueWarehousePart,
    sanitizePart
};

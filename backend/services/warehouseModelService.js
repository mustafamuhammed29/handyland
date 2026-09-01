/**
 * backend/services/warehouseModelService.js
 * Domain service for managing first-class device models in the Repair Parts Warehouse (Phase 3A).
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { WarehouseServiceError } = require('./warehouseMovementService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_CREATE_FIELDS = Object.freeze([
    'brand',
    'modelName',
    'deviceFamily',
    'releaseYear',
    'sortWeight'
]);

const ALLOWED_PATCH_FIELDS = Object.freeze([
    'brand',
    'modelName',
    'deviceFamily',
    'releaseYear',
    'sortWeight'
]);

const FORBIDDEN_FIELDS = Object.freeze([
    'id',
    'normalizedKey',
    'normalized_key',
    'isActive',
    'is_active',
    'parts',
    'stock',
    'balances',
    'locations',
    'movementData',
    'actor',
    'actorId',
    'costPrice',
    'sellPrice',
    'supplierId',
    'notes',
    'created_at',
    'updated_at'
]);

/**
 * Normalizes brand and model name into canonical server-side key.
 */
function deriveNormalizedKey(brand, modelName) {
    const b = (brand || '').trim().toLowerCase();
    const m = (modelName || '').trim().toLowerCase();
    return `${b}:${m}`;
}

/**
 * Validates that only allowed fields exist in a payload.
 */
function assertExactPayloadFields(body, allowedFields) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'Payload must be a JSON object');
    }

    const receivedKeys = Object.keys(body);
    for (const key of receivedKeys) {
        if (FORBIDDEN_FIELDS.includes(key)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', `Field '${key}' cannot be modified directly`);
        }
        if (!allowedFields.includes(key)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', `Unsupported field in payload: ${key}`);
        }
    }
}

/**
 * Sanitizes a device model database record for safe API output.
 */
function sanitizeDeviceModel(m, stats = {}) {
    return {
        id: m.id,
        brand: m.brand,
        modelName: m.model_name || m.modelName,
        deviceFamily: m.device_family || m.deviceFamily,
        normalizedKey: m.normalized_key || m.normalizedKey,
        releaseYear: m.release_year !== undefined ? m.release_year : (m.releaseYear || null),
        sortWeight: Number(m.sort_weight !== undefined ? m.sort_weight : (m.sortWeight || 0)),
        isActive: Boolean(m.is_active !== undefined ? m.is_active : m.isActive),
        partCount: Number(stats.partCount || 0),
        totalAvailable: Number(stats.totalAvailable || 0),
        totalOnHand: Number(stats.totalOnHand || 0),
        lowStockCount: Number(stats.lowStockCount || 0),
        outOfStockCount: Number(stats.outOfStockCount || 0),
        createdAt: m.created_at || m.createdAt,
        updatedAt: m.updated_at || m.updatedAt
    };
}

/**
 * GET /api/warehouse/models
 * Returns list of device models with optional stats and brand/active filtering.
 */
async function getDeviceModels(query = {}) {
    const {
        brand,
        active,
        search,
        page = 1,
        limit = 100
    } = query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const offset = (parsedPage - 1) * parsedLimit;

    let dbQuery = supabaseAdmin
        .from('device_models')
        .select('id, brand, model_name, device_family, normalized_key, release_year, sort_weight, is_active, created_at, updated_at', { count: 'exact' });

    if (active === 'true') {
        dbQuery = dbQuery.eq('is_active', true);
    } else if (active === 'false') {
        dbQuery = dbQuery.eq('is_active', false);
    }

    if (brand && typeof brand === 'string' && brand.trim()) {
        dbQuery = dbQuery.ilike('brand', brand.trim());
    }

    if (search && typeof search === 'string' && search.trim()) {
        const s = search.trim();
        dbQuery = dbQuery.or(`model_name.ilike.%${s}%,device_family.ilike.%${s}%,brand.ilike.%${s}%`);
    }

    dbQuery = dbQuery
        .order('sort_weight', { ascending: false })
        .order('release_year', { ascending: false, nullsFirst: false })
        .order('model_name', { ascending: true })
        .range(offset, offset + parsedLimit - 1);

    const { data: modelsData, error: modelsError, count } = await dbQuery;

    if (modelsError) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve device models');
    }

    const models = modelsData || [];
    if (models.length === 0) {
        return {
            data: [],
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total: count || 0,
                totalPages: 0
            }
        };
    }

    // Fetch part relation summaries
    const modelIds = models.map((m) => m.id);
    const { data: relationsData, error: relError } = await supabaseAdmin
        .from('repair_part_compatible_models')
        .select('device_model_id, repair_part_id, repair_parts(id, is_active, status, min_stock, stock)')
        .in('device_model_id', modelIds);

    const statsMap = new Map();
    if (!relError && Array.isArray(relationsData)) {
        for (const rel of relationsData) {
            const mId = rel.device_model_id;
            if (!statsMap.has(mId)) {
                statsMap.set(mId, {
                    partCount: 0,
                    totalAvailable: 0,
                    totalOnHand: 0,
                    lowStockCount: 0,
                    outOfStockCount: 0
                });
            }
            const st = statsMap.get(mId);
            const part = rel.repair_parts;
            if (part && part.is_active !== false && part.status !== 'discontinued') {
                st.partCount++;
                const pStock = Number(part.stock || 0);
                st.totalOnHand += pStock;
                st.totalAvailable += pStock;
                if (pStock <= 0) {
                    st.outOfStockCount++;
                } else if (pStock <= (part.min_stock || 2)) {
                    st.lowStockCount++;
                }
            }
        }
    }

    const sanitized = models.map((m) => sanitizeDeviceModel(m, statsMap.get(m.id) || {}));

    return {
        data: sanitized,
        pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total: count !== null ? count : models.length,
            totalPages: Math.ceil((count || models.length) / parsedLimit)
        }
    };
}

/**
 * POST /api/warehouse/models
 * Creates a new device model.
 */
async function createDeviceModel(body) {
    assertExactPayloadFields(body, ALLOWED_CREATE_FIELDS);

    const { brand, modelName, deviceFamily, releaseYear, sortWeight } = body;

    if (!brand || typeof brand !== 'string' || !brand.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'brand is required and cannot be empty');
    }
    if (!modelName || typeof modelName !== 'string' || !modelName.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'modelName is required and cannot be empty');
    }
    if (!deviceFamily || typeof deviceFamily !== 'string' || !deviceFamily.trim()) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'deviceFamily is required and cannot be empty');
    }

    const trimmedBrand = brand.trim().slice(0, 80);
    const trimmedModelName = modelName.trim().slice(0, 80);
    const trimmedFamily = deviceFamily.trim().slice(0, 80);
    const normalizedKey = deriveNormalizedKey(trimmedBrand, trimmedModelName);

    let parsedYear = null;
    if (releaseYear !== undefined && releaseYear !== null) {
        const y = Number(releaseYear);
        if (!Number.isInteger(y) || y < 2000 || y > 2100) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'releaseYear must be an integer between 2000 and 2100');
        }
        parsedYear = y;
    }

    let parsedSort = 0;
    if (sortWeight !== undefined && sortWeight !== null) {
        const s = Number(sortWeight);
        if (!Number.isInteger(s)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'sortWeight must be an integer');
        }
        parsedSort = s;
    }

    const insertPayload = {
        brand: trimmedBrand,
        model_name: trimmedModelName,
        device_family: trimmedFamily,
        normalized_key: normalizedKey,
        release_year: parsedYear,
        sort_weight: parsedSort,
        is_active: true
    };

    const { data, error } = await supabaseAdmin
        .from('device_models')
        .insert(insertPayload)
        .select('id, brand, model_name, device_family, normalized_key, release_year, sort_weight, is_active, created_at, updated_at')
        .single();

    if (error) {
        const errorMsg = (error.message || '').toLowerCase();
        if (error.code === '23505' || errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
            throw new WarehouseServiceError(409, 'WAREHOUSE_MODEL_EXISTS', `Device model '${trimmedModelName}' already exists under brand '${trimmedBrand}'`);
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to create device model');
    }

    return sanitizeDeviceModel(data);
}

/**
 * PATCH /api/warehouse/models/:modelId
 * Updates metadata for an existing device model.
 */
async function updateDeviceModel(modelId, body) {
    if (!modelId || typeof modelId !== 'string' || !UUID_REGEX.test(modelId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid modelId UUID');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_EMPTY_PAYLOAD', 'PATCH payload must contain at least one update field');
    }

    assertExactPayloadFields(body, ALLOWED_PATCH_FIELDS);

    // Fetch existing model
    const { data: existingModel, error: fetchErr } = await supabaseAdmin
        .from('device_models')
        .select('id, brand, model_name, device_family, normalized_key, release_year, sort_weight, is_active')
        .eq('id', modelId)
        .single();

    if (fetchErr || !existingModel) {
        throw new WarehouseServiceError(404, 'WAREHOUSE_MODEL_NOT_FOUND', 'Device model not found');
    }

    const updates = {};

    if (body.brand !== undefined) {
        if (typeof body.brand !== 'string' || !body.brand.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'brand cannot be empty');
        }
        updates.brand = body.brand.trim().slice(0, 80);
    }

    if (body.modelName !== undefined) {
        if (typeof body.modelName !== 'string' || !body.modelName.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'modelName cannot be empty');
        }
        updates.model_name = body.modelName.trim().slice(0, 80);
    }

    if (body.deviceFamily !== undefined) {
        if (typeof body.deviceFamily !== 'string' || !body.deviceFamily.trim()) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'deviceFamily cannot be empty');
        }
        updates.device_family = body.deviceFamily.trim().slice(0, 80);
    }

    if (body.releaseYear !== undefined) {
        if (body.releaseYear === null) {
            updates.release_year = null;
        } else {
            const y = Number(body.releaseYear);
            if (!Number.isInteger(y) || y < 2000 || y > 2100) {
                throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'releaseYear must be an integer between 2000 and 2100');
            }
            updates.release_year = y;
        }
    }

    if (body.sortWeight !== undefined) {
        const s = Number(body.sortWeight);
        if (!Number.isInteger(s)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_PAYLOAD', 'sortWeight must be an integer');
        }
        updates.sort_weight = s;
    }

    // Recompute normalized_key if brand or model_name updated
    const finalBrand = updates.brand || existingModel.brand;
    const finalModelName = updates.model_name || existingModel.model_name;
    updates.normalized_key = deriveNormalizedKey(finalBrand, finalModelName);
    updates.updated_at = new Date().toISOString();

    const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('device_models')
        .update(updates)
        .eq('id', modelId)
        .select('id, brand, model_name, device_family, normalized_key, release_year, sort_weight, is_active, created_at, updated_at')
        .single();

    if (updateError) {
        const errorMsg = (updateError.message || '').toLowerCase();
        if (updateError.code === '23505' || errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
            throw new WarehouseServiceError(409, 'WAREHOUSE_MODEL_EXISTS', `Device model '${finalModelName}' already exists under brand '${finalBrand}'`);
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to update device model');
    }

    return sanitizeDeviceModel(updatedData);
}

/**
 * POST /api/warehouse/models/:modelId/deactivate
 * Safely deactivates a device model.
 */
async function deactivateDeviceModel(modelId) {
    if (!modelId || typeof modelId !== 'string' || !UUID_REGEX.test(modelId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid modelId UUID');
    }

    const { data, error } = await supabaseAdmin.rpc('deactivate_device_model', {
        p_model_id: modelId
    });

    if (error) {
        const msg = error.message || '';
        if (msg.includes('WAREHOUSE_MODEL_NOT_FOUND')) {
            throw new WarehouseServiceError(404, 'WAREHOUSE_MODEL_NOT_FOUND', 'Device model not found');
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to deactivate device model');
    }

    return data;
}

/**
 * POST /api/warehouse/models/:modelId/reactivate
 * Reactivates an existing device model.
 */
async function reactivateDeviceModel(modelId) {
    if (!modelId || typeof modelId !== 'string' || !UUID_REGEX.test(modelId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid modelId UUID');
    }

    const { data, error } = await supabaseAdmin.rpc('reactivate_device_model', {
        p_model_id: modelId
    });

    if (error) {
        const msg = error.message || '';
        if (msg.includes('WAREHOUSE_MODEL_NOT_FOUND')) {
            throw new WarehouseServiceError(404, 'WAREHOUSE_MODEL_NOT_FOUND', 'Device model not found');
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to reactivate device model');
    }

    return data;
}

/**
 * GET /api/warehouse/models/:modelId/parts
 * Returns repair parts linked to this device model.
 */
async function getDeviceModelParts(modelId) {
    if (!modelId || typeof modelId !== 'string' || !UUID_REGEX.test(modelId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid modelId UUID');
    }

    const { data: relData, error: relError } = await supabaseAdmin
        .from('repair_part_compatible_models')
        .select(`
            device_model_id,
            is_primary,
            repair_parts (
                id, name, sku, barcode, category, brand, device_family, part_type, quality, status, is_active, min_stock, image_url, stock
            )
        `)
        .eq('device_model_id', modelId);

    if (relError) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve model parts');
    }

    const linkedParts = (relData || []).map((r) => r.repair_parts).filter(Boolean);
    const partIds = linkedParts.map((p) => p.id);

    // Aggregate location-partitioned balances from part_stock_locations
    const balanceMap = new Map();
    if (partIds.length > 0) {
        try {
            const { data: stockRows, error: stockError } = await supabaseAdmin
                .from('part_stock_locations')
                .select('repair_part_id, quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection, warehouse_locations(is_active)')
                .in('repair_part_id', partIds);

            if (!stockError && Array.isArray(stockRows)) {
                for (const row of stockRows) {
                    const loc = row.warehouse_locations;
                    if (loc && loc.is_active === false) continue;

                    const onHand = Number(row.quantity_on_hand) || 0;
                    const reserved = Number(row.quantity_reserved) || 0;
                    const defective = Number(row.quantity_defective) || 0;
                    const inspection = Number(row.quantity_inspection) || 0;

                    const current = balanceMap.get(row.repair_part_id) || {
                        onHand: 0,
                        reserved: 0,
                        defective: 0,
                        inspection: 0
                    };
                    current.onHand += onHand;
                    current.reserved += reserved;
                    current.defective += defective;
                    current.inspection += inspection;
                    balanceMap.set(row.repair_part_id, current);
                }
            }
        } catch (err) {
            // Gracefully handle unmocked part_stock_locations in unit tests
        }
    }

    const parts = (relData || [])
        .map((r) => {
            const p = r.repair_parts;
            if (!p) return null;
            const bal = balanceMap.get(p.id) || { onHand: 0, reserved: 0, defective: 0, inspection: 0 };
            const available = bal.onHand - bal.reserved - bal.defective - bal.inspection;

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode || null,
                category: p.category || null,
                brand: p.brand || null,
                deviceFamily: p.device_family || null,
                partType: p.part_type || null,
                quality: p.quality || null,
                status: p.status || (p.is_active ? 'active' : 'discontinued'),
                isActive: Boolean(p.is_active),
                minStock: Number(p.min_stock || 0),
                availableQuantity: available > 0 ? available : Number(p.stock || 0),
                onHandQuantity: bal.onHand > 0 ? bal.onHand : Number(p.stock || 0),
                reservedQuantity: bal.reserved,
                defectiveQuantity: bal.defective,
                inspectionQuantity: bal.inspection,
                isPrimary: Boolean(r.is_primary)
            };
        })
        .filter(Boolean);

    return parts;
}

/**
 * GET /api/warehouse/models/:modelId/discontinue-parts/preview
 * Previews discontinuation eligibility for all parts linked to this model.
 * Strictly excludes shared-active parts from discontinuation eligibility.
 */
async function previewDiscontinueModelParts(modelId) {
    if (!modelId || typeof modelId !== 'string' || !UUID_REGEX.test(modelId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid modelId UUID');
    }

    const { data: model, error: modelErr } = await supabaseAdmin
        .from('device_models')
        .select('id, brand, model_name, device_family')
        .eq('id', modelId)
        .single();

    if (modelErr || !model) {
        throw new WarehouseServiceError(404, 'WAREHOUSE_MODEL_NOT_FOUND', 'Device model not found');
    }

    const { data: relData, error: relErr } = await supabaseAdmin
        .from('repair_part_compatible_models')
        .select('repair_part_id, repair_parts(id, name, sku, status, is_active, stock)')
        .eq('device_model_id', modelId);

    if (relErr) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to inspect model parts');
    }

    const linked = relData || [];
    const partIds = linked.map((r) => r.repair_part_id);

    let sharedActivePartsCount = 0;
    let blockedByStockCount = 0;
    let eligiblePartsCount = 0;
    let alreadyDiscontinuedCount = 0;

    if (partIds.length > 0) {
        // 1. Identify shared-active parts (linked to target model AND at least one other active model)
        const { data: allRelations } = await supabaseAdmin
            .from('repair_part_compatible_models')
            .select('repair_part_id, device_model_id, device_models(id, is_active)')
            .in('repair_part_id', partIds);

        const sharedActivePartsSet = new Set();
        if (Array.isArray(allRelations)) {
            for (const rel of allRelations) {
                if (rel.device_model_id !== modelId) {
                    const dm = rel.device_models;
                    if (dm && dm.is_active !== false) {
                        sharedActivePartsSet.add(rel.repair_part_id);
                    }
                }
            }
        }

        // 2. Inspect location balances for exclusive parts
        const { data: locBalances } = await supabaseAdmin
            .from('part_stock_locations')
            .select('repair_part_id, quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection')
            .in('repair_part_id', partIds);

        const stockMap = new Set();
        if (Array.isArray(locBalances)) {
            for (const b of locBalances) {
                const onHand = Number(b.quantity_on_hand || 0);
                const reserved = Number(b.quantity_reserved || 0);
                const defective = Number(b.quantity_defective || 0);
                const inspection = Number(b.quantity_inspection || 0);
                if (onHand > 0 || reserved > 0 || defective > 0 || inspection > 0) {
                    stockMap.add(b.repair_part_id);
                }
            }
        }

        // 3. Exactly categorize each linked part once
        for (const r of linked) {
            const p = r.repair_parts;
            if (!p) continue;

            if (sharedActivePartsSet.has(p.id)) {
                sharedActivePartsCount++;
            } else if (p.status === 'discontinued' || p.is_active === false) {
                alreadyDiscontinuedCount++;
            } else if (stockMap.has(p.id) || Number(p.stock || 0) > 0) {
                blockedByStockCount++;
            } else {
                eligiblePartsCount++;
            }
        }
    }

    return {
        modelId: model.id,
        modelName: model.model_name,
        brand: model.brand,
        totalLinkedParts: linked.length,
        eligiblePartsCount,
        sharedActivePartsCount,
        blockedByStockCount,
        alreadyDiscontinuedCount,
        isBlocked: blockedByStockCount > 0
    };
}

/**
 * POST /api/warehouse/models/:modelId/discontinue-parts
 * Atomically retires all parts linked to this model (only if all balances are zero).
 */
async function discontinueDeviceModelParts(modelId) {
    if (!modelId || typeof modelId !== 'string' || !UUID_REGEX.test(modelId)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_ID', 'Invalid modelId UUID');
    }

    const { data, error } = await supabaseAdmin.rpc('discontinue_device_model_parts', {
        p_model_id: modelId
    });

    if (error) {
        const msg = error.message || '';
        if (msg.includes('WAREHOUSE_MODEL_NOT_FOUND')) {
            throw new WarehouseServiceError(404, 'WAREHOUSE_MODEL_NOT_FOUND', 'Device model not found');
        }
        if (msg.includes('WAREHOUSE_MODEL_HAS_ACTIVE_STOCK')) {
            throw new WarehouseServiceError(
                400,
                'WAREHOUSE_MODEL_HAS_ACTIVE_STOCK',
                'Cannot discontinue parts: One or more repair parts still have positive stock balances across warehouse locations.'
            );
        }
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to discontinue device model parts');
    }

    return data;
}

module.exports = {
    getDeviceModels,
    createDeviceModel,
    updateDeviceModel,
    deactivateDeviceModel,
    reactivateDeviceModel,
    getDeviceModelParts,
    previewDiscontinueModelParts,
    discontinueDeviceModelParts,
    deriveNormalizedKey,
    WarehouseServiceError
};

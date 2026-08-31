/**
 * backend/services/warehouseReadService.js
 * Domain service for secure, read-only queries against the internal repair-parts warehouse.
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { WarehouseServiceError } = require('./warehouseMovementService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALL_MOVEMENT_TYPES = Object.freeze([
    'RECEIVE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'RESERVE',
    'RELEASE',
    'CONSUME',
    'RETURN_FROM_REPAIR',
    'TRANSFER',
    'DAMAGE',
    'SUPPLIER_RETURN'
]);

const ALLOWED_PARTS_QUERY_PARAMS = Object.freeze([
    'page',
    'limit',
    'search',
    'brand',
    'deviceFamily',
    'partType',
    'quality',
    'status',
    'locationId',
    'lowStock',
    'includeInactiveLocations'
]);

const ALLOWED_LOCATIONS_QUERY_PARAMS = Object.freeze([
    'active',
    'zone',
    'search'
]);

const ALLOWED_MOVEMENTS_QUERY_PARAMS = Object.freeze([
    'page',
    'limit',
    'repairPartId',
    'movementType',
    'sourceLocationId',
    'destinationLocationId',
    'performedBy',
    'from',
    'to',
    'search'
]);

/**
 * Validates pagination parameters.
 */
function parsePagination(query, defaultLimit = 25, maxLimit = 100) {
    let page = 1;
    let limit = defaultLimit;

    if (query.page !== undefined) {
        const parsedPage = Number(query.page);
        if (!Number.isInteger(parsedPage) || parsedPage < 1 || parsedPage > 10000) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Page must be an integer between 1 and 10000');
        }
        page = parsedPage;
    }

    if (query.limit !== undefined) {
        const parsedLimit = Number(query.limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', `Limit must be an integer between 1 and ${maxLimit}`);
        }
        limit = parsedLimit;
    }

    return { page, limit, offset: (page - 1) * limit };
}

/**
 * Validates that no unrecognized query parameters exist in the request.
 */
function assertAllowedQueryParams(query, allowedParams) {
    if (!query || typeof query !== 'object') return;
    const receivedKeys = Object.keys(query);
    for (const key of receivedKeys) {
        if (!allowedParams.includes(key)) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', `Unsupported query parameter: ${key}`);
        }
    }
}

/**
 * GET /api/warehouse/parts
 * Paginated repair parts catalog with aggregated warehouse location balances.
 */
async function getWarehouseParts(query = {}) {
    assertAllowedQueryParams(query, ALLOWED_PARTS_QUERY_PARAMS);

    const { page, limit, offset } = parsePagination(query, 25, 100);

    const {
        search,
        brand,
        deviceFamily,
        partType,
        quality,
        status,
        locationId,
        lowStock,
        includeInactiveLocations
    } = query;

    // Validate filters
    if (search && (typeof search !== 'string' || search.trim().length > 100)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Search term must not exceed 100 characters');
    }
    if (brand && (typeof brand !== 'string' || brand.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Brand must not exceed 80 characters');
    }
    if (deviceFamily && (typeof deviceFamily !== 'string' || deviceFamily.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'deviceFamily must not exceed 80 characters');
    }
    if (partType && (typeof partType !== 'string' || partType.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'partType must not exceed 80 characters');
    }
    if (quality && (typeof quality !== 'string' || quality.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Quality must not exceed 80 characters');
    }
    if (status && status !== 'active' && status !== 'discontinued') {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Status must be active or discontinued');
    }
    if (locationId && (!UUID_REGEX.test(locationId) || typeof locationId !== 'string')) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid locationId UUID');
    }
    if (lowStock !== undefined && lowStock !== 'true' && lowStock !== 'false') {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'lowStock must be true or false');
    }
    if (includeInactiveLocations !== undefined && includeInactiveLocations !== 'true' && includeInactiveLocations !== 'false') {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'includeInactiveLocations must be true or false');
    }

    const filterActiveLocationsOnly = includeInactiveLocations !== 'true';

    // 1. Build repair_parts query with explicit columns
    let partsQuery = supabaseAdmin
        .from('repair_parts')
        .select(
            'id, name, sku, barcode, category, compatible_devices, brand, device_family, part_type, quality, status, is_active, min_stock, sell_price, image_url'
        );

    if (status) {
        partsQuery = partsQuery.eq('status', status);
    }
    if (brand) {
        partsQuery = partsQuery.ilike('brand', brand.trim());
    }
    if (deviceFamily) {
        partsQuery = partsQuery.ilike('device_family', deviceFamily.trim());
    }
    if (partType) {
        partsQuery = partsQuery.ilike('part_type', partType.trim());
    }
    if (quality) {
        partsQuery = partsQuery.ilike('quality', quality.trim());
    }
    if (search) {
        const trimmedSearch = search.trim();
        partsQuery = partsQuery.or(
            `name.ilike.%${trimmedSearch}%,sku.ilike.%${trimmedSearch}%,barcode.ilike.%${trimmedSearch}%,brand.ilike.%${trimmedSearch}%,device_family.ilike.%${trimmedSearch}%,part_type.ilike.%${trimmedSearch}%`
        );
    }

    const { data: parts, error: partsError } = await partsQuery;
    if (partsError) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve repair parts catalog');
    }

    if (!parts || parts.length === 0) {
        return {
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
        };
    }

    const partIds = parts.map(p => p.id);

    // 2. Query balances from part_stock_locations joined with warehouse_locations
    let stockQuery = supabaseAdmin
        .from('part_stock_locations')
        .select('repair_part_id, warehouse_location_id, quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection, warehouse_locations(id, is_active)');

    if (partIds.length <= 50) {
        stockQuery = stockQuery.in('repair_part_id', partIds);
    }

    if (locationId) {
        stockQuery = stockQuery.eq('warehouse_location_id', locationId);
    }

    const { data: stockRows, error: stockError } = await stockQuery;
    if (stockError) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve warehouse stock balances');
    }

    // 3. Aggregate balances per repair_part_id
    const balanceMap = new Map();
    if (stockRows) {
        for (const row of stockRows) {
            const loc = row.warehouse_locations;
            if (filterActiveLocationsOnly && loc && loc.is_active === false) {
                continue; // Skip inactive locations when filtering for active
            }

            const onHand = Number(row.quantity_on_hand) || 0;
            const reserved = Number(row.quantity_reserved) || 0;
            const defective = Number(row.quantity_defective) || 0;
            const inspection = Number(row.quantity_inspection) || 0;

            // Strict data-integrity check: location partitions must not exceed on-hand
            if (onHand - reserved - defective - inspection < 0) {
                throw new WarehouseServiceError(503, 'WAREHOUSE_DATA_INTEGRITY_ERROR', 'Warehouse balance data integrity violation detected');
            }

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

    // 4. Combine part info with aggregated balances (without clamping negative values)
    let aggregatedParts = parts.map(p => {
        const bal = balanceMap.get(p.id) || { onHand: 0, reserved: 0, defective: 0, inspection: 0 };
        const available = bal.onHand - bal.reserved - bal.defective - bal.inspection;

        if (available < 0) {
            throw new WarehouseServiceError(503, 'WAREHOUSE_DATA_INTEGRITY_ERROR', 'Warehouse balance data integrity violation detected');
        }

        return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode || null,
            category: p.category || null,
            compatibleDevices: p.compatible_devices || [],
            brand: p.brand || null,
            deviceFamily: p.device_family || null,
            partType: p.part_type || null,
            quality: p.quality || null,
            status: p.status || 'active',
            isActive: Boolean(p.is_active),
            minStock: Number(p.min_stock) || 0,
            sellPrice: Number(p.sell_price) || 0,
            imageUrl: p.image_url || null,
            onHandQuantity: bal.onHand,
            reservedQuantity: bal.reserved,
            defectiveQuantity: bal.defective,
            inspectionQuantity: bal.inspection,
            availableQuantity: available
        };
    });

    // 5. Apply lowStock filter if requested
    if (lowStock === 'true') {
        aggregatedParts = aggregatedParts.filter(p => p.availableQuantity <= p.minStock);
    }

    // 6. Deterministic Sort: name ASC, id ASC
    aggregatedParts.sort((a, b) => {
        const nameComp = (a.name || '').localeCompare(b.name || '');
        if (nameComp !== 0) return nameComp;
        return (a.id || '').localeCompare(b.id || '');
    });

    // 7. Paginate
    const total = aggregatedParts.length;
    const totalPages = Math.ceil(total / limit);
    const pagedData = aggregatedParts.slice(offset, offset + limit);

    return {
        data: pagedData,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
}

/**
 * GET /api/warehouse/locations
 * Returns list of physical warehouse locations.
 */
async function getWarehouseLocations(query = {}) {
    assertAllowedQueryParams(query, ALLOWED_LOCATIONS_QUERY_PARAMS);

    const { active = 'true', zone, search } = query;

    if (active !== 'true' && active !== 'false') {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Active filter must be true or false');
    }
    if (zone && (typeof zone !== 'string' || zone.trim().length > 80)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Zone must not exceed 80 characters');
    }
    if (search && (typeof search !== 'string' || search.trim().length > 100)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Search must not exceed 100 characters');
    }

    let q = supabaseAdmin
        .from('warehouse_locations')
        .select('id, location_code, zone, rack, shelf, bin, description, is_active')
        .eq('is_active', active === 'true')
        .order('zone', { ascending: true })
        .order('location_code', { ascending: true });

    if (zone) {
        q = q.ilike('zone', zone.trim());
    }
    if (search) {
        const s = search.trim();
        q = q.or(`location_code.ilike.%${s}%,zone.ilike.%${s}%,rack.ilike.%${s}%,shelf.ilike.%${s}%,bin.ilike.%${s}%,description.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve warehouse locations');
    }

    const sanitizedData = (data || []).map(loc => ({
        id: loc.id,
        locationCode: loc.location_code,
        zone: loc.zone,
        rack: loc.rack || null,
        shelf: loc.shelf || null,
        bin: loc.bin || null,
        description: loc.description || null,
        isActive: Boolean(loc.is_active)
    }));

    return {
        data: sanitizedData
    };
}

/**
 * GET /api/warehouse/movements
 * Returns paginated append-only movement ledger history.
 */
async function getWarehouseMovements(query = {}) {
    // Explicitly reject includeNotes
    if (query.includeNotes !== undefined) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'includeNotes parameter is not allowed');
    }

    assertAllowedQueryParams(query, ALLOWED_MOVEMENTS_QUERY_PARAMS);

    const { page, limit, offset } = parsePagination(query, 25, 100);

    const {
        repairPartId,
        movementType,
        sourceLocationId,
        destinationLocationId,
        performedBy,
        from,
        to,
        search
    } = query;

    // Validate UUIDs
    if (repairPartId && (!UUID_REGEX.test(repairPartId) || typeof repairPartId !== 'string')) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid repairPartId UUID');
    }
    if (sourceLocationId && (!UUID_REGEX.test(sourceLocationId) || typeof sourceLocationId !== 'string')) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid sourceLocationId UUID');
    }
    if (destinationLocationId && (!UUID_REGEX.test(destinationLocationId) || typeof destinationLocationId !== 'string')) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid destinationLocationId UUID');
    }
    if (performedBy && (!UUID_REGEX.test(performedBy) || typeof performedBy !== 'string')) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid performedBy UUID');
    }

    // Validate movementType
    if (movementType && !ALL_MOVEMENT_TYPES.includes(movementType)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Unsupported movementType');
    }

    // Validate search length
    if (search && (typeof search !== 'string' || search.trim().length > 100)) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Search must not exceed 100 characters');
    }

    // Validate Date range
    let fromDate = null;
    let toDate = null;

    if (from) {
        fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid "from" ISO date');
        }
    }

    if (to) {
        toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Invalid "to" ISO date');
        }
    }

    if (fromDate && toDate) {
        if (fromDate > toDate) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', '"from" date cannot be after "to" date');
        }
        const diffMs = toDate.getTime() - fromDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 366) {
            throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Date range cannot exceed 366 days');
        }
    }

    // Build query with explicit select whitelist
    let q = supabaseAdmin
        .from('part_stock_movements')
        .select(
            `id, movement_type, quantity, reason, performed_by, created_at,
             repair_parts(id, name, sku, barcode),
             source_location:warehouse_locations!part_stock_movements_source_location_id_fkey(id, location_code),
             destination_location:warehouse_locations!part_stock_movements_destination_location_id_fkey(id, location_code)`,
            { count: 'exact' }
        );

    if (repairPartId) {
        q = q.eq('repair_part_id', repairPartId);
    }
    if (movementType) {
        q = q.eq('movement_type', movementType);
    }
    if (sourceLocationId) {
        q = q.eq('source_location_id', sourceLocationId);
    }
    if (destinationLocationId) {
        q = q.eq('destination_location_id', destinationLocationId);
    }
    if (performedBy) {
        q = q.eq('performed_by', performedBy);
    }
    if (from) {
        q = q.gte('created_at', fromDate.toISOString());
    }
    if (to) {
        q = q.lte('created_at', toDate.toISOString());
    }

    // Deterministic ordering: created_at DESC, id DESC
    q = q.order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rows, error, count } = await q;
    if (error) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve warehouse movements history');
    }

    // Safely resolve actor display names without cross-schema foreign key hints
    let actorMap = new Map();
    const missingActorIds = Array.from(new Set(
        (rows || [])
            .filter(r => r.performed_by && (!r.actor || !r.actor.name))
            .map(r => r.performed_by)
            .filter(Boolean)
    ));

    if (missingActorIds.length > 0) {
        try {
            const userQuery = supabaseAdmin
                .from('users')
                .select('id, name');
            if (typeof userQuery.in === 'function') {
                const { data: users } = await userQuery.in('id', missingActorIds);
                (users || []).forEach(u => actorMap.set(u.id, u.name));
            }
        } catch (_) {
            // Graceful fallback if user resolution fails
        }
    }

    let sanitizedData = (rows || []).map(row => {
        const part = row.repair_parts || {};
        const srcLoc = row.source_location || null;
        const dstLoc = row.destination_location || null;
        const actorId = row.performed_by || (row.actor && row.actor.id) || null;
        const actorName = actorId ? (actorMap.get(actorId) || (row.actor && row.actor.name) || null) : null;

        return {
            id: row.id,
            movementType: row.movement_type,
            quantity: Number(row.quantity) || 0,
            createdAt: row.created_at,
            repairPart: {
                id: part.id || null,
                name: part.name || '',
                sku: part.sku || '',
                barcode: part.barcode || null
            },
            sourceLocation: srcLoc ? { id: srcLoc.id, locationCode: srcLoc.location_code } : null,
            destinationLocation: dstLoc ? { id: dstLoc.id, locationCode: dstLoc.location_code } : null,
            performedBy: actorId ? { id: actorId, displayName: actorName } : null,
            reason: row.reason || null
        };
    });

    if (search) {
        const s = search.trim().toLowerCase();
        sanitizedData = sanitizedData.filter(m => {
            const p = m.repairPart;
            return (
                (p.name && p.name.toLowerCase().includes(s)) ||
                (p.sku && p.sku.toLowerCase().includes(s)) ||
                (p.barcode && p.barcode.toLowerCase().includes(s))
            );
        });
    }

    const total = count !== null && count !== undefined ? count : sanitizedData.length;
    const totalPages = Math.ceil(total / limit);

    return {
        data: sanitizedData,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
}

/**
 * GET /api/warehouse/stats
 * Returns aggregated internal KPIs.
 */
async function getWarehouseStats(query = {}) {
    // Reject any query parameters
    if (query && Object.keys(query).length > 0) {
        throw new WarehouseServiceError(400, 'WAREHOUSE_INVALID_QUERY', 'Stats endpoint does not accept query parameters');
    }

    // 1. Fetch active repair parts
    const { data: activeParts, error: partsError } = await supabaseAdmin
        .from('repair_parts')
        .select('id, min_stock, is_active, status')
        .eq('is_active', true)
        .neq('status', 'discontinued');

    if (partsError) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve repair parts statistics');
    }

    const activePartCount = activeParts ? activeParts.length : 0;
    const activePartIds = (activeParts || []).map(p => p.id);

    // 2. Fetch active warehouse locations
    const { data: activeLocations, error: locError } = await supabaseAdmin
        .from('warehouse_locations')
        .select('id')
        .eq('is_active', true);

    if (locError) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to retrieve warehouse locations statistics');
    }

    const activeLocationCount = activeLocations ? activeLocations.length : 0;
    const activeLocationIds = (activeLocations || []).map(l => l.id);

    let totalOnHandQuantity = 0;
    let totalReservedQuantity = 0;
    let totalDefectiveQuantity = 0;
    let totalInspectionQuantity = 0;
    let lowStockPartCount = 0;

    if (activePartCount > 0 && activeLocationIds.length > 0) {
        const activePartIdSet = new Set(activePartIds);
        const { data: stockBalances, error: stockError } = await supabaseAdmin
            .from('part_stock_locations')
            .select('repair_part_id, warehouse_location_id, quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection')
            .in('warehouse_location_id', activeLocationIds);

        if (stockError) {
            throw new WarehouseServiceError(503, 'WAREHOUSE_SERVICE_UNAVAILABLE', 'Failed to aggregate warehouse balances statistics');
        }

        const partAvailableMap = new Map();

        if (stockBalances) {
            for (const row of stockBalances) {
                if (!activePartIdSet.has(row.repair_part_id)) {
                    continue;
                }
                const onHand = Number(row.quantity_on_hand) || 0;
                const reserved = Number(row.quantity_reserved) || 0;
                const defective = Number(row.quantity_defective) || 0;
                const inspection = Number(row.quantity_inspection) || 0;

                const rowAvail = onHand - reserved - defective - inspection;
                if (rowAvail < 0) {
                    throw new WarehouseServiceError(503, 'WAREHOUSE_DATA_INTEGRITY_ERROR', 'Warehouse balance data integrity violation detected');
                }

                totalOnHandQuantity += onHand;
                totalReservedQuantity += reserved;
                totalDefectiveQuantity += defective;
                totalInspectionQuantity += inspection;

                const currAvail = partAvailableMap.get(row.repair_part_id) || 0;
                partAvailableMap.set(row.repair_part_id, currAvail + rowAvail);
            }
        }

        for (const part of activeParts || []) {
            const avail = partAvailableMap.get(part.id) || 0;
            if (avail < 0) {
                throw new WarehouseServiceError(503, 'WAREHOUSE_DATA_INTEGRITY_ERROR', 'Warehouse balance data integrity violation detected');
            }
            const minStock = Number(part.min_stock) || 0;
            if (avail <= minStock) {
                lowStockPartCount += 1;
            }
        }
    }

    const totalAvailableQuantity = totalOnHandQuantity - totalReservedQuantity - totalDefectiveQuantity - totalInspectionQuantity;
    if (totalAvailableQuantity < 0) {
        throw new WarehouseServiceError(503, 'WAREHOUSE_DATA_INTEGRITY_ERROR', 'Warehouse balance data integrity violation detected');
    }

    return {
        data: {
            activePartCount,
            totalOnHandQuantity,
            totalAvailableQuantity,
            totalReservedQuantity,
            totalDefectiveQuantity,
            totalInspectionQuantity,
            lowStockPartCount,
            activeLocationCount
        }
    };
}

module.exports = {
    getWarehouseParts,
    getWarehouseLocations,
    getWarehouseMovements,
    getWarehouseStats,
    parsePagination
};

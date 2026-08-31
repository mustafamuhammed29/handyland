/**
 * backend/tests/warehouse_read.test.js
 * Unit and integration tests for Phase 1C secure warehouse read APIs.
 */
'use strict';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { supabaseAdmin } = require('../config/supabase');
const warehouseRoutes = require('../routes/warehouseRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/warehouse', warehouseRoutes);

const VALID_PART_ID_1 = '11111111-1111-4111-8111-111111111111';
const VALID_PART_ID_2 = '22222222-2222-4222-8222-222222222222';
const VALID_LOC_ID_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_LOC_ID_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_USER_ID = '88888888-8888-4888-8888-888888888888';

describe('Warehouse Read APIs (Phase 1C)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function mockAuthUser(userId, role = 'admin', isActive = true) {
        supabaseAdmin.auth.getUser.mockResolvedValue({
            data: { user: { id: userId, email: 'admin@handyland.de' } },
            error: null
        });

        supabaseAdmin.from.mockImplementation((table) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: userId,
                            name: 'Warehouse Admin',
                            email: 'admin@handyland.de',
                            role,
                            is_active: isActive,
                            is_verified: true
                        },
                        error: null
                    })
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                neq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                gt: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                then: (resolve) => resolve({ data: [], error: null })
            };
        });
    }

    describe('Global Authentication & Role Protection', () => {
        const endpoints = [
            { method: 'get', path: '/api/warehouse/parts' },
            { method: 'get', path: '/api/warehouse/locations' },
            { method: 'get', path: '/api/warehouse/movements' },
            { method: 'get', path: '/api/warehouse/stats' }
        ];

        endpoints.forEach(({ method, path }) => {
            it(`should reject unauthenticated request with 401 for ${path}`, async () => {
                const res = await request(app)[method](path);
                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
            });

            it(`should reject non-admin request with 403 for ${path}`, async () => {
                mockAuthUser(CUSTOMER_USER_ID, 'customer');
                const res = await request(app)[method](path).set('Authorization', 'Bearer customer-token');
                expect(res.status).toBe(403);
                expect(res.body.success).toBe(false);
            });
        });
    });

    describe('GET /api/warehouse/parts', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should reject unknown query parameters', async () => {
            const res = await request(app)
                .get('/api/warehouse/parts?unknownField=test')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_QUERY');
        });

        it('should reject invalid pagination parameters', async () => {
            const invalidParams = ['?page=0', '?page=-1', '?page=10001', '?limit=0', '?limit=101', '?page=abc'];
            for (const param of invalidParams) {
                const res = await request(app)
                    .get(`/api/warehouse/parts${param}`)
                    .set('Authorization', 'Bearer token');
                expect(res.status).toBe(400);
                expect(res.body.error).toBe('WAREHOUSE_INVALID_QUERY');
            }
        });

        it('should reject invalid locationId UUID or invalid status', async () => {
            const resLoc = await request(app)
                .get('/api/warehouse/parts?locationId=invalid-uuid')
                .set('Authorization', 'Bearer token');
            expect(resLoc.status).toBe(400);

            const resStatus = await request(app)
                .get('/api/warehouse/parts?status=invalid_status')
                .set('Authorization', 'Bearer token');
            expect(resStatus.status).toBe(400);
        });

        it('should aggregate location balances and return sanitized whitelist', async () => {
            const mockParts = [
                {
                    id: VALID_PART_ID_1,
                    name: 'iPhone 13 Display OLED OEM',
                    sku: 'IP13-DISP-OEM',
                    barcode: '123456789012',
                    category: 'Screens',
                    compatible_devices: ['iPhone 13'],
                    brand: 'Apple',
                    device_family: 'iPhone 13',
                    part_type: 'Display',
                    quality: 'OEM',
                    status: 'active',
                    is_active: true,
                    min_stock: 5,
                    sell_price: 129.99,
                    cost_price: 60.00, // Should NOT be in response
                    image_url: 'https://test.com/ip13.jpg'
                }
            ];

            const mockStockRows = [
                {
                    repair_part_id: VALID_PART_ID_1,
                    warehouse_location_id: VALID_LOC_ID_1,
                    quantity_on_hand: 10,
                    quantity_reserved: 2,
                    quantity_defective: 1,
                    quantity_inspection: 0,
                    warehouse_locations: { id: VALID_LOC_ID_1, is_active: true }
                }
            ];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: ADMIN_USER_ID, role: 'admin', is_active: true },
                            error: null
                        })
                    };
                }
                if (table === 'repair_parts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        ilike: jest.fn().mockReturnThis(),
                        or: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockParts, error: null })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockStockRows, error: null })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    then: (resolve) => resolve({ data: [], error: null })
                };
            });

            const res = await request(app)
                .get('/api/warehouse/parts')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);

            const part = res.body.data[0];
            expect(part.id).toBe(VALID_PART_ID_1);
            expect(part.name).toBe('iPhone 13 Display OLED OEM');
            expect(part.onHandQuantity).toBe(10);
            expect(part.reservedQuantity).toBe(2);
            expect(part.defectiveQuantity).toBe(1);
            expect(part.inspectionQuantity).toBe(0);
            expect(part.availableQuantity).toBe(7); // 10 - 2 - 1 - 0 = 7

            // Ensure sensitive fields are excluded
            expect(part.cost_price).toBeUndefined();
            expect(part.costPrice).toBeUndefined();
            expect(part.notes).toBeUndefined();
            expect(part.supplier_id).toBeUndefined();

            // Pagination envelope
            expect(res.body.pagination).toEqual({
                page: 1,
                limit: 25,
                total: 1,
                totalPages: 1
            });
        });

        it('should return 503 WAREHOUSE_DATA_INTEGRITY_ERROR when derived availability is negative without clamping to zero', async () => {
            const mockParts = [
                {
                    id: VALID_PART_ID_1,
                    name: 'Corrupted Balance Part',
                    sku: 'CORRUPT-01',
                    is_active: true,
                    status: 'active',
                    min_stock: 2
                }
            ];

            // Corrupted stock row: reserved + defective > on_hand
            const mockCorruptedStock = [
                {
                    repair_part_id: VALID_PART_ID_1,
                    warehouse_location_id: VALID_LOC_ID_1,
                    quantity_on_hand: 5,
                    quantity_reserved: 10,
                    quantity_defective: 0,
                    quantity_inspection: 0,
                    warehouse_locations: { id: VALID_LOC_ID_1, is_active: true }
                }
            ];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: ADMIN_USER_ID, role: 'admin', is_active: true },
                            error: null
                        })
                    };
                }
                if (table === 'repair_parts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockParts, error: null })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockCorruptedStock, error: null })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    then: (resolve) => resolve({ data: [], error: null })
                };
            });

            const res = await request(app)
                .get('/api/warehouse/parts')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(503);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('WAREHOUSE_DATA_INTEGRITY_ERROR');
            expect(res.body.message).not.toContain('CORRUPT-01');
            expect(res.body.message).not.toContain('quantity_reserved');
        });
    });

    describe('GET /api/warehouse/locations', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should reject unknown query parameters', async () => {
            const res = await request(app)
                .get('/api/warehouse/locations?invalidParam=true')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_QUERY');
        });

        it('should return physical location whitelist with deterministic order', async () => {
            const mockLocations = [
                {
                    id: VALID_LOC_ID_1,
                    location_code: 'A-01-01',
                    zone: 'Zone A',
                    rack: '01',
                    shelf: '01',
                    bin: '01',
                    description: 'Main display storage',
                    is_active: true
                }
            ];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: ADMIN_USER_ID, role: 'admin', is_active: true },
                            error: null
                        })
                    };
                }
                if (table === 'warehouse_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        ilike: jest.fn().mockReturnThis(),
                        or: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockLocations, error: null })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    then: (resolve) => resolve({ data: [], error: null })
                };
            });

            const res = await request(app)
                .get('/api/warehouse/locations')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);

            const loc = res.body.data[0];
            expect(loc.id).toBe(VALID_LOC_ID_1);
            expect(loc.locationCode).toBe('A-01-01');
            expect(loc.zone).toBe('Zone A');
            expect(loc.isActive).toBe(true);

            // Verify no cost, stock total, or private notes in response
            expect(loc.notes).toBeUndefined();
            expect(loc.cost).toBeUndefined();
            expect(loc.stock).toBeUndefined();
        });
    });

    describe('GET /api/warehouse/movements', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should reject includeNotes with stable 400 validation error', async () => {
            const res = await request(app)
                .get('/api/warehouse/movements?includeNotes=true')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_QUERY');
        });

        it('should reject malformed UUIDs and unsupported movement types', async () => {
            const resBadPart = await request(app)
                .get('/api/warehouse/movements?repairPartId=bad-uuid')
                .set('Authorization', 'Bearer token');
            expect(resBadPart.status).toBe(400);

            const resBadType = await request(app)
                .get('/api/warehouse/movements?movementType=INVALID_TYPE')
                .set('Authorization', 'Bearer token');
            expect(resBadType.status).toBe(400);
        });

        it('should reject invalid dates, from > to, and date range > 366 days', async () => {
            const resBadDate = await request(app)
                .get('/api/warehouse/movements?from=not-a-date')
                .set('Authorization', 'Bearer token');
            expect(resBadDate.status).toBe(400);

            const resInverted = await request(app)
                .get('/api/warehouse/movements?from=2026-06-01T00:00:00Z&to=2026-01-01T00:00:00Z')
                .set('Authorization', 'Bearer token');
            expect(resInverted.status).toBe(400);

            const resTooLong = await request(app)
                .get('/api/warehouse/movements?from=2024-01-01T00:00:00Z&to=2026-01-01T00:00:00Z')
                .set('Authorization', 'Bearer token');
            expect(resTooLong.status).toBe(400);
        });

        it('should return movement ledger history matching exact whitelist', async () => {
            const mockMovements = [
                {
                    id: '33333333-3333-4333-8333-333333333333',
                    movement_type: 'TRANSFER',
                    quantity: 2,
                    reason: 'Relocating to active bin',
                    notes: 'Internal confidential note', // Must NOT be returned
                    created_at: '2026-08-31T20:15:00Z',
                    repair_parts: {
                        id: VALID_PART_ID_1,
                        name: 'iPhone 13 Display OLED OEM',
                        sku: 'IP13-DISP-OEM',
                        barcode: '123456789012'
                    },
                    source_location: {
                        id: VALID_LOC_ID_1,
                        location_code: 'A-01-01'
                    },
                    destination_location: {
                        id: VALID_LOC_ID_2,
                        location_code: 'B-02-01'
                    },
                    actor: {
                        id: ADMIN_USER_ID,
                        name: 'Warehouse Admin'
                    }
                }
            ];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: ADMIN_USER_ID, role: 'admin', is_active: true },
                            error: null
                        })
                    };
                }
                if (table === 'part_stock_movements') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        gte: jest.fn().mockReturnThis(),
                        lte: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        range: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockMovements, count: 1, error: null })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    then: (resolve) => resolve({ data: [], error: null })
                };
            });

            const res = await request(app)
                .get('/api/warehouse/movements')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);

            const m = res.body.data[0];
            expect(m.id).toBe('33333333-3333-4333-8333-333333333333');
            expect(m.movementType).toBe('TRANSFER');
            expect(m.quantity).toBe(2);
            expect(m.reason).toBe('Relocating to active bin');
            expect(m.notes).toBeUndefined(); // Verify notes excluded
            expect(m.repairPart).toEqual({
                id: VALID_PART_ID_1,
                name: 'iPhone 13 Display OLED OEM',
                sku: 'IP13-DISP-OEM',
                barcode: '123456789012'
            });
            expect(m.sourceLocation).toEqual({
                id: VALID_LOC_ID_1,
                locationCode: 'A-01-01'
            });
            expect(m.destinationLocation).toEqual({
                id: VALID_LOC_ID_2,
                locationCode: 'B-02-01'
            });
            expect(m.performedBy).toEqual({
                id: ADMIN_USER_ID,
                displayName: 'Warehouse Admin'
            });

            // Pagination envelope
            expect(res.body.pagination).toEqual({
                page: 1,
                limit: 25,
                total: 1,
                totalPages: 1
            });
        });
    });

    describe('GET /api/warehouse/stats', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should reject any query parameters with 400', async () => {
            const res = await request(app)
                .get('/api/warehouse/stats?unexpected=param')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_QUERY');
        });

        it('should compute and return exactly the eight approved KPI fields with non-negative counts', async () => {
            const mockActiveParts = [
                { id: VALID_PART_ID_1, min_stock: 5, is_active: true, status: 'active' },
                { id: VALID_PART_ID_2, min_stock: 10, is_active: true, status: 'active' }
            ];

            const mockActiveLocations = [
                { id: VALID_LOC_ID_1 },
                { id: VALID_LOC_ID_2 }
            ];

            const mockStockBalances = [
                {
                    repair_part_id: VALID_PART_ID_1,
                    warehouse_location_id: VALID_LOC_ID_1,
                    quantity_on_hand: 20,
                    quantity_reserved: 2,
                    quantity_defective: 1,
                    quantity_inspection: 1
                },
                {
                    repair_part_id: VALID_PART_ID_2,
                    warehouse_location_id: VALID_LOC_ID_2,
                    quantity_on_hand: 8,
                    quantity_reserved: 0,
                    quantity_defective: 0,
                    quantity_inspection: 0
                }
            ];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: ADMIN_USER_ID, role: 'admin', is_active: true },
                            error: null
                        })
                    };
                }
                if (table === 'repair_parts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        neq: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockActiveParts, error: null })
                    };
                }
                if (table === 'warehouse_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockActiveLocations, error: null })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockStockBalances, error: null })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    then: (resolve) => resolve({ data: [], error: null })
                };
            });

            const res = await request(app)
                .get('/api/warehouse/stats')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const data = res.body.data;
            expect(Object.keys(data).sort()).toEqual([
                'activeLocationCount',
                'activePartCount',
                'lowStockPartCount',
                'totalAvailableQuantity',
                'totalDefectiveQuantity',
                'totalInspectionQuantity',
                'totalOnHandQuantity',
                'totalReservedQuantity'
            ].sort());

            expect(data.activePartCount).toBe(2);
            expect(data.activeLocationCount).toBe(2);
            expect(data.totalOnHandQuantity).toBe(28); // 20 + 8
            expect(data.totalReservedQuantity).toBe(2); // 2 + 0
            expect(data.totalDefectiveQuantity).toBe(1); // 1 + 0
            expect(data.totalInspectionQuantity).toBe(1); // 1 + 0
            expect(data.totalAvailableQuantity).toBe(24); // 28 - 2 - 1 - 1 = 24
            expect(data.lowStockPartCount).toBe(1); // Part 2 has avail 8 <= min_stock 10

            // Ensure no financial/cost totals
            expect(data.totalCost).toBeUndefined();
            expect(data.totalValue).toBeUndefined();
            expect(data.totalRevenue).toBeUndefined();

            // Verify movement RPC was never invoked
            expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
        });

        it('should return 503 WAREHOUSE_DATA_INTEGRITY_ERROR when stats aggregate a negative availability without clamping', async () => {
            const mockActiveParts = [
                { id: VALID_PART_ID_1, min_stock: 5, is_active: true, status: 'active' }
            ];
            const mockActiveLocations = [
                { id: VALID_LOC_ID_1 }
            ];
            const mockCorruptedBalances = [
                {
                    repair_part_id: VALID_PART_ID_1,
                    warehouse_location_id: VALID_LOC_ID_1,
                    quantity_on_hand: 5,
                    quantity_reserved: 10,
                    quantity_defective: 0,
                    quantity_inspection: 0
                }
            ];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: ADMIN_USER_ID, role: 'admin', is_active: true },
                            error: null
                        })
                    };
                }
                if (table === 'repair_parts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        neq: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockActiveParts, error: null })
                    };
                }
                if (table === 'warehouse_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockActiveLocations, error: null })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockReturnThis(),
                        then: (resolve) => resolve({ data: mockCorruptedBalances, error: null })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    then: (resolve) => resolve({ data: [], error: null })
                };
            });

            const res = await request(app)
                .get('/api/warehouse/stats')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(503);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('WAREHOUSE_DATA_INTEGRITY_ERROR');
        });
    });
});

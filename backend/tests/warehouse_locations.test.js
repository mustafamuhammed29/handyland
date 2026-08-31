/**
 * backend/tests/warehouse_locations.test.js
 * Unit and integration tests for Phase 2B secure warehouse location management with Migration 020 RPC.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { supabaseAdmin } = require('../config/supabase');
const warehouseRoutes = require('../routes/warehouseRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/warehouse', warehouseRoutes);

const VALID_LOC_ID_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_LOC_ID_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_USER_ID = '88888888-8888-4888-8888-888888888888';

describe('Warehouse Location Management (Phase 2B & Migration 020)', () => {
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
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                then: (resolve) => resolve({ data: [], error: null })
            };
        });
    }

    describe('Migration 020 SQL Static Verification', () => {
        it('should have Migration 020 adhering to strict security and atomicity constraints', () => {
            const migrationPath = path.join(__dirname, '../../supabase/migrations/020_deactivate_warehouse_location_rpc.sql');
            expect(fs.existsSync(migrationPath)).toBe(true);

            const sql = fs.readFileSync(migrationPath, 'utf8');

            // 1. Must NOT use SECURITY DEFINER
            expect(sql).not.toContain('SECURITY DEFINER');

            // 2. Must pin search_path to public
            expect(sql).toContain('SET search_path = public');

            // 3. Must use SELECT ... FOR UPDATE on warehouse_locations
            expect(sql).toContain('SELECT id, location_code, zone, rack, shelf, bin, description, is_active');
            expect(sql).toContain('FOR UPDATE');

            // 4. Must check non-zero balances in part_stock_locations
            expect(sql).toContain('quantity_on_hand > 0');
            expect(sql).toContain('quantity_reserved > 0');
            expect(sql).toContain('quantity_defective > 0');
            expect(sql).toContain('quantity_inspection > 0');

            // 5. Must update is_active = false
            expect(sql).toContain('SET is_active = false');

            // 6. Must revoke from public and grant to service_role only
            expect(sql).toContain('REVOKE ALL ON FUNCTION public.deactivate_warehouse_location(UUID) FROM PUBLIC, anon, authenticated;');
            expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.deactivate_warehouse_location(UUID) TO service_role;');
        });
    });

    describe('Authentication & Authorization', () => {
        it('should reject unauthenticated requests with 401', async () => {
            const resPost = await request(app).post('/api/warehouse/locations').send({ locationCode: 'A-01', zone: 'Zone A' });
            expect(resPost.status).toBe(401);

            const resPatch = await request(app).patch(`/api/warehouse/locations/${VALID_LOC_ID_1}`).send({ zone: 'New Zone' });
            expect(resPatch.status).toBe(401);

            const resDeact = await request(app).post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`);
            expect(resDeact.status).toBe(401);
        });

        it('should reject non-admin users with 403', async () => {
            mockAuthUser(CUSTOMER_USER_ID, 'customer');

            const resPost = await request(app)
                .post('/api/warehouse/locations')
                .set('Authorization', 'Bearer token')
                .send({ locationCode: 'A-01', zone: 'Zone A' });
            expect(resPost.status).toBe(403);

            const resPatch = await request(app)
                .patch(`/api/warehouse/locations/${VALID_LOC_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ zone: 'New Zone' });
            expect(resPatch.status).toBe(403);

            const resDeact = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`)
                .set('Authorization', 'Bearer token');
            expect(resDeact.status).toBe(403);
        });
    });

    describe('POST /api/warehouse/locations (Create Location)', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should normalize locationCode to uppercase and insert valid location', async () => {
            const createdRecord = {
                id: VALID_LOC_ID_1,
                location_code: 'A-01-S02-B04',
                zone: 'Zone A',
                rack: '01',
                shelf: 'S02',
                bin: 'B04',
                description: 'Displays bin',
                is_active: true
            };

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
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: createdRecord, error: null })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/locations')
                .set('Authorization', 'Bearer token')
                .send({
                    locationCode: '  a-01-s02-b04  ',
                    zone: 'Zone A',
                    rack: '01',
                    shelf: 'S02',
                    bin: 'B04',
                    description: 'Displays bin'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual({
                id: VALID_LOC_ID_1,
                locationCode: 'A-01-S02-B04',
                zone: 'Zone A',
                rack: '01',
                shelf: 'S02',
                bin: 'B04',
                description: 'Displays bin',
                isActive: true
            });
        });

        it('should reject missing or empty locationCode and zone', async () => {
            const resNoCode = await request(app)
                .post('/api/warehouse/locations')
                .set('Authorization', 'Bearer token')
                .send({ zone: 'Zone A' });
            expect(resNoCode.status).toBe(400);
            expect(resNoCode.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');

            const resNoZone = await request(app)
                .post('/api/warehouse/locations')
                .set('Authorization', 'Bearer token')
                .send({ locationCode: 'A-01' });
            expect(resNoZone.status).toBe(400);
            expect(resNoZone.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });

        it('should reject unknown fields in creation payload', async () => {
            const res = await request(app)
                .post('/api/warehouse/locations')
                .set('Authorization', 'Bearer token')
                .send({
                    locationCode: 'A-01',
                    zone: 'Zone A',
                    unknownField: 'test'
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });

        it('should handle duplicate locationCode as 409 conflict', async () => {
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
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: '23505', message: 'duplicate key value violates unique constraint' }
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/locations')
                .set('Authorization', 'Bearer token')
                .send({
                    locationCode: 'A-01-01',
                    zone: 'Zone A'
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_LOCATION_CODE_EXISTS');
        });
    });

    describe('PATCH /api/warehouse/locations/:locationId (Update Metadata)', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should update location metadata and return sanitized whitelist', async () => {
            const updatedRecord = {
                id: VALID_LOC_ID_1,
                location_code: 'A-01-01',
                zone: 'Zone B',
                rack: '02',
                shelf: 'S03',
                bin: 'B01',
                description: 'Updated description',
                is_active: true
            };

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
                        update: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: updatedRecord, error: null })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .patch(`/api/warehouse/locations/${VALID_LOC_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({
                    zone: 'Zone B',
                    rack: '02',
                    shelf: 'S03',
                    bin: 'B01',
                    description: 'Updated description'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.locationCode).toBe('A-01-01');
            expect(res.body.data.zone).toBe('Zone B');
        });

        it('should reject empty patch with 400 WAREHOUSE_EMPTY_PAYLOAD', async () => {
            const res = await request(app)
                .patch(`/api/warehouse/locations/${VALID_LOC_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_EMPTY_PAYLOAD');
        });

        it('should reject immutable locationCode in PATCH with 400 WAREHOUSE_IMMUTABLE_FIELD', async () => {
            const res = await request(app)
                .patch(`/api/warehouse/locations/${VALID_LOC_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ locationCode: 'NEW-CODE' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_IMMUTABLE_FIELD');
        });

        it('should reject isActive in PATCH with 400 WAREHOUSE_IMMUTABLE_FIELD', async () => {
            const res = await request(app)
                .patch(`/api/warehouse/locations/${VALID_LOC_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ isActive: false });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_IMMUTABLE_FIELD');
        });

        it('should reject non-UUID locationId with 400', async () => {
            const res = await request(app)
                .patch('/api/warehouse/locations/not-a-uuid')
                .set('Authorization', 'Bearer token')
                .send({ zone: 'Zone A' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_ID');
        });
    });

    describe('POST /api/warehouse/locations/:locationId/deactivate (Atomic RPC)', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should perform exactly one RPC call and return deactivated location', async () => {
            const rpcResult = {
                id: VALID_LOC_ID_1,
                location_code: 'A-01-01',
                zone: 'Zone A',
                rack: '01',
                shelf: 'S01',
                bin: 'B01',
                description: 'Screen shelf',
                is_active: false,
                already_inactive: false
            };

            supabaseAdmin.rpc.mockResolvedValue({
                data: rpcResult,
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual({
                id: VALID_LOC_ID_1,
                locationCode: 'A-01-01',
                zone: 'Zone A',
                rack: '01',
                shelf: 'S01',
                bin: 'B01',
                description: 'Screen shelf',
                isActive: false
            });

            // Verify single atomic RPC call
            expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1);
            expect(supabaseAdmin.rpc).toHaveBeenCalledWith('deactivate_warehouse_location', {
                p_location_id: VALID_LOC_ID_1
            });
        });

        it('should map WAREHOUSE_LOCATION_NOT_EMPTY RPC error to 409', async () => {
            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'WAREHOUSE_LOCATION_NOT_EMPTY', code: 'P0001' }
            });

            const res = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_LOCATION_NOT_EMPTY');
        });

        it('should map WAREHOUSE_LOCATION_NOT_FOUND RPC error to 404', async () => {
            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'WAREHOUSE_LOCATION_NOT_FOUND', code: 'P0002' }
            });

            const res = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('WAREHOUSE_LOCATION_NOT_FOUND');
        });

        it('should map concurrent deadlock / conflict error to 409 WAREHOUSE_LOCATION_CONFLICT', async () => {
            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'deadlock detected', code: '40P01' }
            });

            const res = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_LOCATION_CONFLICT');
        });

        it('should return idempotent 200 result when already inactive', async () => {
            const rpcResult = {
                id: VALID_LOC_ID_2,
                location_code: 'B-02-01',
                zone: 'Zone B',
                rack: null,
                shelf: null,
                bin: null,
                description: null,
                is_active: false,
                already_inactive: true
            };

            supabaseAdmin.rpc.mockResolvedValue({
                data: rpcResult,
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_2}/deactivate`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isActive).toBe(false);
        });

        it('should reject deactivation when a request body is sent', async () => {
            const res = await request(app)
                .post(`/api/warehouse/locations/${VALID_LOC_ID_1}/deactivate`)
                .set('Authorization', 'Bearer token')
                .send({ unexpected: 'body' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });
    });
});

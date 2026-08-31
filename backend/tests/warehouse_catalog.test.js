/**
 * backend/tests/warehouse_catalog.test.js
 * Unit and integration tests for Phase 2C secure repair-parts catalog management with Migration 021 RPC.
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

const VALID_PART_ID_1 = '11111111-1111-4111-8111-111111111111';
const VALID_PART_ID_2 = '22222222-2222-4222-8222-222222222222';
const ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_USER_ID = '88888888-8888-4888-8888-888888888888';

describe('Warehouse Repair Parts Catalog Management (Phase 2C & Migration 021)', () => {
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

    describe('Migration 021 SQL Static Verification', () => {
        it('should adhere to strict security, atomicity, and concurrency constraints', () => {
            const migrationPath = path.join(__dirname, '../../supabase/migrations/021_discontinue_repair_part_rpc.sql');
            expect(fs.existsSync(migrationPath)).toBe(true);

            const sql = fs.readFileSync(migrationPath, 'utf8');

            // 1. Must NOT use SECURITY DEFINER
            expect(sql).not.toContain('SECURITY DEFINER');

            // 2. Must pin search_path to public
            expect(sql).toContain('SET search_path = public');

            // 3. Must lock repair_parts row FOR UPDATE
            expect(sql).toContain('FROM public.repair_parts');
            expect(sql).toContain('FOR UPDATE');

            // 4. Must check all balance buckets for non-zero stock
            expect(sql).toContain('quantity_on_hand > 0');
            expect(sql).toContain('quantity_reserved > 0');
            expect(sql).toContain('quantity_defective > 0');
            expect(sql).toContain('quantity_inspection > 0');

            // 5. Must mutate status and is_active atomically
            expect(sql).toContain("status = 'discontinued'");
            expect(sql).toContain('is_active = false');

            // 6. Must NOT mutate balances or insert movements
            expect(sql).not.toContain('INSERT INTO public.part_stock_movements');
            expect(sql).not.toContain('UPDATE public.part_stock_locations');

            // 7. Must revoke from public and grant to service_role only
            expect(sql).toContain('REVOKE ALL ON FUNCTION public.discontinue_repair_part(UUID) FROM PUBLIC, anon, authenticated;');
            expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.discontinue_repair_part(UUID) TO service_role;');

            // 8. Must explain serialization with Migration 019 shared locks
            expect(sql).toContain('FOR SHARE');
            expect(sql).toContain('apply_part_stock_movement');
        });
    });

    describe('Authentication & Authorization', () => {
        it('should reject unauthenticated requests with 401', async () => {
            const resPost = await request(app).post('/api/warehouse/parts').send({ name: 'Screen', sku: 'SCR-01' });
            expect(resPost.status).toBe(401);

            const resPatch = await request(app).patch(`/api/warehouse/parts/${VALID_PART_ID_1}`).send({ name: 'New Name' });
            expect(resPatch.status).toBe(401);

            const resDisc = await request(app).post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`);
            expect(resDisc.status).toBe(401);
        });

        it('should reject non-admin users with 403', async () => {
            mockAuthUser(CUSTOMER_USER_ID, 'customer');

            const resPost = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({ name: 'Screen', sku: 'SCR-01' });
            expect(resPost.status).toBe(403);

            const resPatch = await request(app)
                .patch(`/api/warehouse/parts/${VALID_PART_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ name: 'New Name' });
            expect(resPatch.status).toBe(403);

            const resDisc = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`)
                .set('Authorization', 'Bearer token');
            expect(resDisc.status).toBe(403);
        });
    });

    describe('POST /api/warehouse/parts (Create Part)', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should normalize SKU, deduplicate compatibleDevices, default minStock, and create active part', async () => {
            const createdRecord = {
                id: VALID_PART_ID_1,
                name: 'iPhone 13 Pro OLED Screen',
                sku: 'SCR-IPH13P-OLED',
                barcode: 'BAR-12345',
                category: 'Screens',
                compatible_devices: ['iPhone 13 Pro', 'iPhone 13 Pro Max'],
                brand: 'Apple',
                device_family: 'iPhone 13',
                part_type: 'Display',
                quality: 'Original (OEM)',
                status: 'active',
                is_active: true,
                min_stock: 2,
                image_url: null
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
                if (table === 'repair_parts') {
                    return {
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: createdRecord, error: null })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({
                    name: '  iPhone 13 Pro OLED Screen  ',
                    sku: '  scr-iph13p-oled  ',
                    barcode: '  bar-12345  ',
                    category: 'Screens',
                    compatibleDevices: ['iPhone 13 Pro', 'iphone 13 pro', 'iPhone 13 Pro Max'],
                    brand: 'Apple',
                    deviceFamily: 'iPhone 13',
                    partType: 'Display',
                    quality: 'Original (OEM)'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual({
                id: VALID_PART_ID_1,
                name: 'iPhone 13 Pro OLED Screen',
                sku: 'SCR-IPH13P-OLED',
                barcode: 'BAR-12345',
                category: 'Screens',
                compatibleDevices: ['iPhone 13 Pro', 'iPhone 13 Pro Max'],
                brand: 'Apple',
                deviceFamily: 'iPhone 13',
                partType: 'Display',
                quality: 'Original (OEM)',
                status: 'active',
                isActive: true,
                minStock: 2,
                imageUrl: null
            });
        });

        it('should reject missing name or sku with 400', async () => {
            const resNoName = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({ sku: 'SCR-01' });
            expect(resNoName.status).toBe(400);
            expect(resNoName.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');

            const resNoSku = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({ name: 'Screen' });
            expect(resNoSku.status).toBe(400);
            expect(resNoSku.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });

        it('should reject forbidden fields (stock, costPrice, sellPrice, supplierId, etc.) with 400', async () => {
            const resStock = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({
                    name: 'Screen',
                    sku: 'SCR-01',
                    stock: 10
                });
            expect(resStock.status).toBe(400);
            expect(resStock.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');

            const resCost = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({
                    name: 'Screen',
                    sku: 'SCR-01',
                    costPrice: 50
                });
            expect(resCost.status).toBe(400);
            expect(resCost.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });

        it('should handle duplicate SKU with 409 WAREHOUSE_PART_SKU_EXISTS', async () => {
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
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: '23505', message: 'duplicate key value violates unique constraint repair_parts_sku_key' }
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({
                    name: 'Screen',
                    sku: 'DUPLICATE-SKU'
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_PART_SKU_EXISTS');
        });

        it('should handle duplicate barcode with 409 WAREHOUSE_PART_BARCODE_EXISTS', async () => {
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
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: '23505', message: 'duplicate key value violates unique constraint idx_repair_parts_barcode_unique' }
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer token')
                .send({
                    name: 'Screen',
                    sku: 'NEW-SKU',
                    barcode: 'BAR-EXISTS'
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_PART_BARCODE_EXISTS');
        });
    });

    describe('PATCH /api/warehouse/parts/:partId (Update Metadata)', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should update metadata cleanly and return sanitized whitelist', async () => {
            const updatedRecord = {
                id: VALID_PART_ID_1,
                name: 'iPhone 13 Pro OLED Screen Updated',
                sku: 'SCR-IPH13P-OLED',
                barcode: 'BAR-99999',
                category: 'Displays',
                compatible_devices: ['iPhone 13 Pro'],
                brand: 'Apple OEM',
                device_family: 'iPhone 13',
                part_type: 'Display',
                quality: 'Refurbished',
                status: 'active',
                is_active: true,
                min_stock: 5,
                image_url: null
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
                if (table === 'repair_parts') {
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
                .patch(`/api/warehouse/parts/${VALID_PART_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({
                    name: 'iPhone 13 Pro OLED Screen Updated',
                    barcode: 'BAR-99999',
                    category: 'Displays',
                    brand: 'Apple OEM',
                    quality: 'Refurbished',
                    minStock: 5
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('iPhone 13 Pro OLED Screen Updated');
            expect(res.body.data.sku).toBe('SCR-IPH13P-OLED');
            expect(res.body.data.minStock).toBe(5);
        });

        it('should reject empty patch body with 400 WAREHOUSE_EMPTY_PAYLOAD', async () => {
            const res = await request(app)
                .patch(`/api/warehouse/parts/${VALID_PART_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_EMPTY_PAYLOAD');
        });

        it('should reject immutable sku in PATCH with 400 WAREHOUSE_IMMUTABLE_FIELD', async () => {
            const res = await request(app)
                .patch(`/api/warehouse/parts/${VALID_PART_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ sku: 'NEW-SKU-VALUE' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_IMMUTABLE_FIELD');
        });

        it('should reject status and isActive in PATCH with 400 WAREHOUSE_IMMUTABLE_FIELD', async () => {
            const resStatus = await request(app)
                .patch(`/api/warehouse/parts/${VALID_PART_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ status: 'discontinued' });
            expect(resStatus.status).toBe(400);
            expect(resStatus.body.error).toBe('WAREHOUSE_IMMUTABLE_FIELD');

            const resActive = await request(app)
                .patch(`/api/warehouse/parts/${VALID_PART_ID_1}`)
                .set('Authorization', 'Bearer token')
                .send({ isActive: false });
            expect(resActive.status).toBe(400);
            expect(resActive.body.error).toBe('WAREHOUSE_IMMUTABLE_FIELD');
        });

        it('should reject non-UUID partId with 400 WAREHOUSE_INVALID_ID', async () => {
            const res = await request(app)
                .patch('/api/warehouse/parts/not-a-uuid')
                .set('Authorization', 'Bearer token')
                .send({ name: 'Screen' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_ID');
        });
    });

    describe('POST /api/warehouse/parts/:partId/discontinue (Atomic RPC)', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should perform exactly one RPC call and return discontinued part', async () => {
            const rpcResult = {
                id: VALID_PART_ID_1,
                name: 'iPhone 13 Pro OLED Screen',
                sku: 'SCR-IPH13P-OLED',
                category: 'Screens',
                compatible_devices: ['iPhone 13 Pro'],
                brand: 'Apple',
                device_family: 'iPhone 13',
                part_type: 'Display',
                quality: 'Original (OEM)',
                barcode: 'BAR-12345',
                image_url: null,
                status: 'discontinued',
                is_active: false,
                min_stock: 2,
                already_discontinued: false
            };

            supabaseAdmin.rpc.mockResolvedValue({
                data: rpcResult,
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('discontinued');
            expect(res.body.data.isActive).toBe(false);
            expect(res.body.data.alreadyDiscontinued).toBe(false);

            expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1);
            expect(supabaseAdmin.rpc).toHaveBeenCalledWith('discontinue_repair_part', {
                p_part_id: VALID_PART_ID_1
            });
        });

        it('should map WAREHOUSE_PART_HAS_STOCK RPC error to 409', async () => {
            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'WAREHOUSE_PART_HAS_STOCK', code: 'P0001' }
            });

            const res = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_PART_HAS_STOCK');
        });

        it('should map WAREHOUSE_PART_NOT_FOUND RPC error to 404', async () => {
            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'WAREHOUSE_PART_NOT_FOUND', code: 'P0002' }
            });

            const res = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('WAREHOUSE_PART_NOT_FOUND');
        });

        it('should map concurrent conflict/deadlock to 409 WAREHOUSE_PART_CONFLICT', async () => {
            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'deadlock detected', code: '40P01' }
            });

            const res = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_PART_CONFLICT');
        });

        it('should return idempotent 200 result when already discontinued', async () => {
            const rpcResult = {
                id: VALID_PART_ID_2,
                name: 'Legacy Battery',
                sku: 'BAT-LEGACY-01',
                category: 'Batteries',
                compatible_devices: [],
                brand: null,
                device_family: null,
                part_type: null,
                quality: null,
                barcode: null,
                image_url: null,
                status: 'discontinued',
                is_active: false,
                min_stock: 0,
                already_discontinued: true
            };

            supabaseAdmin.rpc.mockResolvedValue({
                data: rpcResult,
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_2}/discontinue`)
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('discontinued');
            expect(res.body.data.alreadyDiscontinued).toBe(true);
        });

        it('should reject discontinue request when request body is sent', async () => {
            const res = await request(app)
                .post(`/api/warehouse/parts/${VALID_PART_ID_1}/discontinue`)
                .set('Authorization', 'Bearer token')
                .send({ invalid: 'payload' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });
    });
});

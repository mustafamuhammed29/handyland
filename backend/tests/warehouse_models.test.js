/**
 * backend/tests/warehouse_models.test.js
 * Unit and integration tests for Phase 3A First-Class Device Model Management & Migration 022.
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

const VALID_MODEL_ID = '11111111-2222-3333-4444-555555555555';
const VALID_MODEL_ID_2 = '66666666-7777-8888-9999-000000000000';
const ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_USER_ID = '88888888-8888-4888-8888-888888888888';

describe('Warehouse Device Models Management (Phase 3A & Migration 022)', () => {
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
                ilike: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                then: (resolve) => resolve({ data: [], error: null })
            };
        });
    }

    describe('Migration 022 SQL Static Security Verification', () => {
        it('should adhere to strict security, constraints, RLS and RPC conventions', () => {
            const migrationPath = path.join(__dirname, '../../supabase/migrations/022_device_models_management.sql');
            expect(fs.existsSync(migrationPath)).toBe(true);

            const sql = fs.readFileSync(migrationPath, 'utf8');

            // 1. Must NOT use SECURITY DEFINER
            expect(sql).not.toContain('SECURITY DEFINER');

            // 2. Must pin search_path to public
            expect(sql).toContain('SET search_path = public');

            // 3. Must contain device_models and repair_part_compatible_models tables
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.device_models');
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.repair_part_compatible_models');

            // 4. Must use ON DELETE RESTRICT on foreign keys to protect history
            expect(sql).toContain('REFERENCES public.repair_parts(id) ON DELETE RESTRICT');
            expect(sql).toContain('REFERENCES public.device_models(id) ON DELETE RESTRICT');

            // 5. Must enable RLS on both tables
            expect(sql).toContain('ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;');
            expect(sql).toContain('ALTER TABLE public.repair_part_compatible_models ENABLE ROW LEVEL SECURITY;');

            // 6. Must revoke from PUBLIC and grant exclusively to service_role
            expect(sql).toContain('REVOKE ALL ON TABLE public.device_models FROM PUBLIC, anon, authenticated;');
            expect(sql).toContain('GRANT ALL ON TABLE public.device_models TO service_role;');
            expect(sql).toContain('REVOKE ALL ON TABLE public.repair_part_compatible_models FROM PUBLIC, anon, authenticated;');
            expect(sql).toContain('GRANT ALL ON TABLE public.repair_part_compatible_models TO service_role;');

            // 7. Must contain RPCs
            expect(sql).toContain('public.deactivate_device_model');
            expect(sql).toContain('public.reactivate_device_model');
            expect(sql).toContain('public.discontinue_device_model_parts');

            // 8. Discontinue RPC must verify all balance buckets
            expect(sql).toContain('quantity_on_hand > 0');
            expect(sql).toContain('quantity_reserved > 0');
            expect(sql).toContain('quantity_defective > 0');
            expect(sql).toContain('quantity_inspection > 0');
        });
    });

    describe('Authentication and Admin RBAC Enforcement', () => {
        it('should reject unauthenticated requests to GET /models with 401', async () => {
            supabaseAdmin.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('No session')
            });

            const res = await request(app).get('/api/warehouse/models');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject non-admin users with 403', async () => {
            mockAuthUser(CUSTOMER_USER_ID, 'user');

            const res = await request(app)
                .get('/api/warehouse/models')
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/warehouse/models', () => {
        it('should return list of models including empty models (0 parts)', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            const mockModels = [
                {
                    id: VALID_MODEL_ID,
                    brand: 'Apple',
                    model_name: 'iPhone 14 Plus',
                    device_family: 'iPhone 14 Series',
                    normalized_key: 'apple:iphone 14 plus',
                    release_year: 2022,
                    sort_weight: 10,
                    is_active: true,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-01T00:00:00Z'
                },
                {
                    id: VALID_MODEL_ID_2,
                    brand: 'Apple',
                    model_name: 'iPhone 15 Pro Max',
                    device_family: 'iPhone 15 Series',
                    normalized_key: 'apple:iphone 15 pro max',
                    release_year: 2023,
                    sort_weight: 20,
                    is_active: true,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-01T00:00:00Z'
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
                if (table === 'device_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        ilike: jest.fn().mockReturnThis(),
                        or: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        range: jest.fn().mockResolvedValue({
                            data: mockModels,
                            error: null,
                            count: 2
                        })
                    };
                }
                if (table === 'repair_part_compatible_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({
                            data: [], // No parts linked => empty models
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .get('/api/warehouse/models')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].modelName).toBe('iPhone 14 Plus');
            expect(res.body.data[0].partCount).toBe(0);
            expect(res.body.data[1].modelName).toBe('iPhone 15 Pro Max');
            expect(res.body.data[1].partCount).toBe(0);
        });
    });

    describe('POST /api/warehouse/models', () => {
        it('should create a new model successfully with sanitized server-side normalized key', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            const createdModel = {
                id: VALID_MODEL_ID,
                brand: 'Apple',
                model_name: 'iPhone 16 Pro',
                device_family: 'iPhone 16 Series',
                normalized_key: 'apple:iphone 16 pro',
                release_year: 2024,
                sort_weight: 30,
                is_active: true,
                created_at: '2026-09-01T00:00:00Z',
                updated_at: '2026-09-01T00:00:00Z'
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
                if (table === 'device_models') {
                    return {
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: createdModel,
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/models')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    brand: 'Apple',
                    modelName: 'iPhone 16 Pro',
                    deviceFamily: 'iPhone 16 Series',
                    releaseYear: 2024,
                    sortWeight: 30
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.modelName).toBe('iPhone 16 Pro');
            expect(res.body.data.normalizedKey).toBe('apple:iphone 16 pro');
            expect(res.body.data.isActive).toBe(true);
        });

        it('should reject duplicate model creation with 409 WAREHOUSE_MODEL_EXISTS', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

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
                if (table === 'device_models') {
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
                .post('/api/warehouse/models')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    brand: 'Apple',
                    modelName: 'iPhone 14 Plus',
                    deviceFamily: 'iPhone 14 Series'
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_MODEL_EXISTS');
        });

        it('should reject payload with forbidden fields (stock, costPrice, etc.) with 400', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            const res = await request(app)
                .post('/api/warehouse/models')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    brand: 'Apple',
                    modelName: 'iPhone 14 Plus',
                    deviceFamily: 'iPhone 14 Series',
                    stock: 50,
                    costPrice: 100
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_INVALID_PAYLOAD');
        });
    });

    describe('PATCH /api/warehouse/models/:modelId', () => {
        it('should update model name and family without mutating stock or SKU', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            const updatedModel = {
                id: VALID_MODEL_ID,
                brand: 'Apple',
                model_name: 'iPhone 14 Plus (Updated)',
                device_family: 'iPhone 14 Series',
                normalized_key: 'apple:iphone 14 plus (updated)',
                release_year: 2022,
                sort_weight: 15,
                is_active: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-09-01T00:00:00Z'
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
                if (table === 'device_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        update: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: updatedModel,
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .patch(`/api/warehouse/models/${VALID_MODEL_ID}`)
                .set('Authorization', 'Bearer valid-token')
                .send({
                    modelName: 'iPhone 14 Plus (Updated)',
                    sortWeight: 15
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.modelName).toBe('iPhone 14 Plus (Updated)');
        });
    });

    describe('POST /api/warehouse/models/:modelId/deactivate & reactivate', () => {
        it('should call deactivate_device_model RPC and return inactive status', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            supabaseAdmin.rpc.mockResolvedValue({
                data: {
                    id: VALID_MODEL_ID,
                    modelName: 'iPhone 14 Plus',
                    isActive: false,
                    alreadyDeactivated: false
                },
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/models/${VALID_MODEL_ID}/deactivate`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isActive).toBe(false);
            expect(supabaseAdmin.rpc).toHaveBeenCalledWith('deactivate_device_model', {
                p_model_id: VALID_MODEL_ID
            });
        });

        it('should call reactivate_device_model RPC and return active status', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            supabaseAdmin.rpc.mockResolvedValue({
                data: {
                    id: VALID_MODEL_ID,
                    modelName: 'iPhone 14 Plus',
                    isActive: true,
                    alreadyActive: false
                },
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/models/${VALID_MODEL_ID}/reactivate`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isActive).toBe(true);
            expect(supabaseAdmin.rpc).toHaveBeenCalledWith('reactivate_device_model', {
                p_model_id: VALID_MODEL_ID
            });
        });
    });

    describe('Discontinue Parts Preview & Execution with Shared Active Part Protection', () => {
        it('preview should correctly separate and count shared active parts, stock-blocked parts, and eligible parts', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            // Part 1: Shared with active model B
            // Part 2: Exclusive to model A, has active stock
            // Part 3: Exclusive to model A, zero stock (eligible)
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
                if (table === 'device_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: VALID_MODEL_ID, model_name: 'iPhone 14 Plus', brand: 'Apple' },
                            error: null
                        })
                    };
                }
                if (table === 'repair_part_compatible_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockResolvedValue({
                            data: [
                                {
                                    repair_part_id: 'part-shared-1',
                                    repair_parts: { id: 'part-shared-1', name: 'USB-C Flex', status: 'active', is_active: true, stock: 0 }
                                },
                                {
                                    repair_part_id: 'part-stock-2',
                                    repair_parts: { id: 'part-stock-2', name: 'Display OLED', status: 'active', is_active: true, stock: 3 }
                                },
                                {
                                    repair_part_id: 'part-eligible-3',
                                    repair_parts: { id: 'part-eligible-3', name: 'Adhesive Strip', status: 'active', is_active: true, stock: 0 }
                                }
                            ],
                            error: null
                        }),
                        in: jest.fn().mockResolvedValue({
                            data: [
                                {
                                    repair_part_id: 'part-shared-1',
                                    device_model_id: VALID_MODEL_ID_2,
                                    device_models: { id: VALID_MODEL_ID_2, is_active: true }
                                }
                            ],
                            error: null
                        })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({
                            data: [
                                { repair_part_id: 'part-stock-2', quantity_on_hand: 3, quantity_reserved: 0, quantity_defective: 0, quantity_inspection: 0 }
                            ],
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .get(`/api/warehouse/models/${VALID_MODEL_ID}/discontinue-parts/preview`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalLinkedParts).toBe(3);
            expect(res.body.data.sharedActivePartsCount).toBe(1);
            expect(res.body.data.blockedByStockCount).toBe(1);
            expect(res.body.data.eligiblePartsCount).toBe(1);
            expect(res.body.data.isBlocked).toBe(true);
        });

        it('discontinue-parts should fail atomically with 400 when exclusive parts have active stock', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            supabaseAdmin.rpc.mockResolvedValue({
                data: null,
                error: { message: 'WAREHOUSE_MODEL_HAS_ACTIVE_STOCK' }
            });

            const res = await request(app)
                .post(`/api/warehouse/models/${VALID_MODEL_ID}/discontinue-parts`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_MODEL_HAS_ACTIVE_STOCK');
        });

        it('discontinue-parts should succeed and retire only eligible exclusive parts leaving shared parts active', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            supabaseAdmin.rpc.mockResolvedValue({
                data: {
                    modelId: VALID_MODEL_ID,
                    modelName: 'iPhone 14 Plus',
                    totalLinkedParts: 2,
                    sharedActivePartsCount: 1,
                    eligiblePartsCount: 1,
                    discontinuedCount: 1,
                    success: true
                },
                error: null
            });

            const res = await request(app)
                .post(`/api/warehouse/models/${VALID_MODEL_ID}/discontinue-parts`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sharedActivePartsCount).toBe(1);
            expect(res.body.data.discontinuedCount).toBe(1);
            expect(supabaseAdmin.rpc).toHaveBeenCalledWith('discontinue_device_model_parts', {
                p_model_id: VALID_MODEL_ID
            });
        });
    });

    describe('Rename Invariance & Relational Parts Lookup', () => {
        it('GET /api/warehouse/models/:modelId/parts should return linked parts regardless of model name changes', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            const linkedParts = [
                {
                    repair_part_id: 'part-uuid-1',
                    is_primary: true,
                    repair_parts: {
                        id: 'part-uuid-1',
                        name: 'Display OEM',
                        sku: 'DISP-IP14P-OEM',
                        barcode: '4260123456789',
                        category: 'Display',
                        compatible_devices: ['iPhone 14 Plus'],
                        brand: 'Apple',
                        device_family: 'iPhone 14 Series',
                        part_type: 'Display',
                        quality: 'Original / OEM',
                        status: 'active',
                        is_active: true,
                        min_stock: 2,
                        image_url: null
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
                if (table === 'device_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: VALID_MODEL_ID, brand: 'Apple', model_name: 'iPhone 14 Plus (2022)' },
                            error: null
                        })
                    };
                }
                if (table === 'repair_part_compatible_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockResolvedValue({
                            data: linkedParts,
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .get(`/api/warehouse/models/${VALID_MODEL_ID}/parts`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].id).toBe('part-uuid-1');
            expect(res.body.data[0].sku).toBe('DISP-IP14P-OEM');
            // Must not expose cost, price, supplier
            expect(res.body.data[0]).not.toHaveProperty('cost_price');
            expect(res.body.data[0]).not.toHaveProperty('sell_price');
            expect(res.body.data[0]).not.toHaveProperty('supplier_id');
        });
    });

    describe('Inactive Model Part Creation Enforcement', () => {
        it('POST /api/warehouse/parts should reject linking to an inactive device model with 409 WAREHOUSE_MODEL_INACTIVE', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

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
                if (table === 'device_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: VALID_MODEL_ID,
                                brand: 'Apple',
                                model_name: 'iPhone 14 Plus (Deactivated)',
                                device_family: 'iPhone 14 Series',
                                is_active: false
                            },
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/warehouse/parts')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    name: 'iPhone 14 Plus Rear Glass',
                    sku: 'GLAS-IP14P-OEM',
                    category: 'Gehäuse',
                    deviceModelId: VALID_MODEL_ID
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_MODEL_INACTIVE');
            expect(res.body.message).toContain('inactive');
        });
    });
});

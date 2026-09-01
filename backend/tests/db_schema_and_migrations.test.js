/**
 * backend/tests/db_schema_and_migrations.test.js
 * Comprehensive integration and contract tests for Phase 1 fixes:
 * 1. Migration 022 PostgreSQL Query & Concurrency Locking Fix
 * 2. Migration 011 / 014 user_role enum and clean install compatibility
 * 3. Schema Drift: repair_devices, repair_cases, messages, addresses, accessories, audit_logs
 * 4. Single Source of Truth for Repair Parts Inventory (part_stock_locations)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');
const warehouseModelService = require('../services/warehouseModelService');
const inventoryController = require('../controllers/inventoryController');
const repairController = require('../controllers/repairController');
const repairArchiveController = require('../controllers/repairArchiveController');
const auditLogger = require('../middleware/auditLogger');

describe('Phase 1 Database, Migrations & Schema Drift Verification', () => {

    describe('1. Migration Syntax & Static Integrity', () => {
        const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');

        test('Migration 022 discontinue_device_model_parts must not contain FOR UPDATE on aggregate SELECT', () => {
            const m022Path = path.join(migrationsDir, '022_device_models_management.sql');
            expect(fs.existsSync(m022Path)).toBe(true);
            const content = fs.readFileSync(m022Path, 'utf8');

            // Must NOT have direct FOR UPDATE on the aggregate query level without a subquery
            const hasDirectAggregateLock = /SELECT\s+COALESCE\s*\(\s*array_agg\([^)]+\)\s*,\s*'\{\}'\)\s+INTO\s+v_eligible_part_ids\s+FROM\s+public\.repair_parts\s+rp[\s\S]*?FOR\s+UPDATE\s+OF\s+rp\s*;/i.test(content);
            expect(hasDirectAggregateLock).toBe(false);

            // Must have subquery locking with deterministic ordering
            expect(content).toContain('ORDER BY rp.id');
            expect(content).toContain('FOR UPDATE OF rp');
            expect(content).toContain('array_agg(locked.id)');
        });

        test('Migration 011 must not reference unlisted "administrator" enum literal', () => {
            const m011Path = path.join(migrationsDir, '011_least_privilege_rls_policies.sql');
            expect(fs.existsSync(m011Path)).toBe(true);
            const content = fs.readFileSync(m011Path, 'utf8');

            expect(content).not.toContain("'administrator'");
            expect(content).toContain("role = 'admin'");
        });

        test('Migration 023 schema drift alignment file exists and defines all missing tables/columns/enums', () => {
            const m023Path = path.join(migrationsDir, '023_schema_drift_alignment.sql');
            expect(fs.existsSync(m023Path)).toBe(true);
            const content = fs.readFileSync(m023Path, 'utf8');

            expect(content).toContain("CREATE TABLE IF NOT EXISTS public.repair_devices");
            expect(content).toContain("CREATE TABLE IF NOT EXISTS public.repair_cases");
            expect(content).toContain("ALTER TABLE public.messages");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS assigned_to UUID");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS priority TEXT");
            expect(content).toContain("ALTER TABLE public.message_replies");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS is_internal_note BOOLEAN");
            expect(content).toContain("ALTER TABLE public.addresses");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS state TEXT");
            expect(content).toContain("ALTER TABLE public.accessories");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS rating NUMERIC");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS num_reviews INT");
            expect(content).toContain("ALTER TABLE public.audit_logs");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS admin_id UUID");
            expect(content).toContain("ADD COLUMN IF NOT EXISTS payload JSONB");
            expect(content).toContain("ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'staff'");
            expect(content).toContain("ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'withdrawal'");
        });

        test('All migration files are sequentially ordered with valid numeric prefixes', () => {
            const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
            expect(files.length).toBeGreaterThanOrEqual(20);

            const prefixes = files.map(f => parseInt(f.split('_')[0], 10)).filter(n => !isNaN(n));
            for (let i = 0; i < prefixes.length - 1; i++) {
                expect(prefixes[i]).toBeLessThanOrEqual(prefixes[i + 1]);
            }
        });
    });

    describe('2. Single Source of Truth for Repair Parts Inventory', () => {
        test('warehouseModelService.getDeviceModels calculates available quantity from part_stock_locations balances', async () => {
            const mockModelId = '00000000-0000-4000-8000-000000000001';
            const mockPartId = '00000000-0000-4000-8000-000000000002';

            const models = [
                {
                    id: mockModelId,
                    brand: 'Apple',
                    model_name: 'iPhone 15 Pro',
                    device_family: 'iPhone',
                    normalized_key: 'apple_iphone_15_pro',
                    is_active: true
                }
            ];

            const relations = [
                {
                    device_model_id: mockModelId,
                    repair_part_id: mockPartId,
                    repair_parts: {
                        id: mockPartId,
                        is_active: true,
                        status: 'active',
                        min_stock: 2,
                        stock: 999 // Stale legacy column should be overridden by location balances!
                    }
                }
            ];

            const locationStock = [
                {
                    repair_part_id: mockPartId,
                    quantity_on_hand: 50,
                    quantity_reserved: 10,
                    quantity_defective: 5,
                    quantity_inspection: 0,
                    warehouse_locations: { is_active: true }
                }
            ];

            // Mock Supabase calls
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'device_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        range: jest.fn().mockResolvedValue({ data: models, error: null, count: 1 })
                    };
                }
                if (table === 'repair_part_compatible_models') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: relations, error: null })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: locationStock, error: null })
                    };
                }
                return originalFrom(table);
            });

            try {
                const result = await warehouseModelService.getDeviceModels({ page: 1, limit: 10 });
                expect(result.data).toBeDefined();
                expect(result.data.length).toBe(1);

                const model = result.data[0];
                expect(model.partCount).toBe(1);
                // Total on hand should be 50 (from part_stock_locations), not 999 (from repair_parts.stock)
                expect(model.totalOnHand).toBe(50);
                // Available should be 50 - 10 - 5 = 35
                expect(model.totalAvailable).toBe(35);
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('inventoryController.getInventoryItems returns location-partitioned stock for RepairPart', async () => {
            const mockPartId = '00000000-0000-4000-8000-000000000003';
            const repairParts = [
                {
                    id: mockPartId,
                    name: 'iPhone 15 Display',
                    min_stock: 2,
                    sell_price: 150.0,
                    stock: 0 // Stale legacy column
                }
            ];

            const locationStock = [
                {
                    repair_part_id: mockPartId,
                    quantity_on_hand: 20,
                    quantity_reserved: 2,
                    quantity_defective: 0,
                    quantity_inspection: 0,
                    warehouse_locations: { is_active: true }
                }
            ];

            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_parts') {
                    return {
                        select: jest.fn().mockResolvedValue({ data: repairParts, error: null })
                    };
                }
                if (table === 'part_stock_locations') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: locationStock, error: null })
                    };
                }
                return originalFrom(table);
            });

            const req = { query: { type: 'RepairPart', page: 1, limit: 10 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await inventoryController.getInventoryItems(req, res, next);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalled();

                const responseData = res.json.mock.calls[0][0];
                expect(responseData.success).toBe(true);
                expect(responseData.data.length).toBe(1);
                // Stock should be 20 - 2 = 18 available, not 0 from legacy column
                expect(responseData.data[0].stock).toBe(18);
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });
    });

    describe('3. Schema Drift Controller Contracts', () => {
        test('repairController interacts with repair_devices table', async () => {
            const originalFrom = supabaseAdmin.from;
            let queriedTable = '';

            supabaseAdmin.from = jest.fn((table) => {
                queriedTable = table;
                return {
                    select: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    range: jest.fn().mockResolvedValue({ data: [{ id: '1', brand: 'Samsung', model: 'S24' }], error: null, count: 1 })
                };
            });

            const req = { query: { page: 1, limit: 10 } };
            const res = { json: jest.fn() };
            const next = jest.fn();

            try {
                await repairController.getRepairCatalog(req, res, next);
                expect(queriedTable).toBe('repair_devices');
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    devices: expect.any(Array),
                    totalDevices: 1
                }));
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('repairArchiveController interacts with repair_cases table', async () => {
            const originalFrom = supabaseAdmin.from;
            let queriedTable = '';

            supabaseAdmin.from = jest.fn((table) => {
                queriedTable = table;
                return {
                    select: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    range: jest.fn().mockResolvedValue({
                        data: [{ id: '1', title: 'OLED Repair', category: 'Screen', img_before: 'b.jpg', img_after: 'a.jpg' }],
                        error: null,
                        count: 1
                    })
                };
            });

            const req = { query: { page: 1, limit: 10 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await repairArchiveController.getAllCases(req, res, next);
                expect(queriedTable).toBe('repair_cases');
                expect(res.status).toHaveBeenCalledWith(200);
                const data = res.json.mock.calls[0][0];
                expect(data.cases[0].imgBefore).toBe('b.jpg');
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('auditLogger captures admin operations with dual user_id and admin_id schema alignment', async () => {
            const originalFrom = supabaseAdmin.from;
            let insertedRecord = null;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'audit_logs') {
                    return {
                        insert: jest.fn((rec) => {
                            insertedRecord = rec;
                            return Promise.resolve({ error: null });
                        })
                    };
                }
                return originalFrom(table);
            });

            const req = {
                user: { id: 'admin-123', email: 'admin@example.com', role: 'admin' },
                method: 'POST',
                originalUrl: '/api/settings',
                body: { siteName: 'HandyLand', password: 'sensitive_pass' },
                ip: '127.0.0.1'
            };
            const res = {};
            const next = jest.fn();

            try {
                await auditLogger(req, res, next);
                expect(next).toHaveBeenCalled();
                expect(insertedRecord).toBeDefined();
                expect(insertedRecord.user_id).toBe('admin-123');
                expect(insertedRecord.admin_id).toBe('admin-123');
                expect(insertedRecord.admin_email).toBe('admin@example.com');
                expect(insertedRecord.action).toBe('POST');
                // Sensitive password field was sanitized
                expect(insertedRecord.details.password).toBeUndefined();
                expect(insertedRecord.payload.password).toBeUndefined();
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });
    });

    describe('4. Script Security & Secret Sanitization', () => {
        test('scripts do not contain hardcoded production credentials', () => {
            const scriptsDir = path.join(__dirname, '..', 'scripts');
            const targetScripts = [
                'healthCheck.js',
                'repair_admin.js',
                'repair_admin_proper.js',
                'create-new-admin.js',
                'reset-admin-password.js',
                'fixCorruptedUsers.js'
            ];

            const forbiddenPatterns = [
                /Admin@HandyLand2024!/,
                /HandyLand2024!/,
                /password1234/,
                /admin123456/
            ];

            for (const scriptName of targetScripts) {
                const scriptPath = path.join(scriptsDir, scriptName);
                if (fs.existsSync(scriptPath)) {
                    const content = fs.readFileSync(scriptPath, 'utf8');
                    for (const pattern of forbiddenPatterns) {
                        expect(pattern.test(content)).toBe(false);
                    }
                }
            }
        });

        test('tickets-dump.json contains only synthetic sample data', () => {
            const dumpPath = path.join(__dirname, '..', 'scripts', 'tickets-dump.json');
            expect(fs.existsSync(dumpPath)).toBe(true);
            const content = fs.readFileSync(dumpPath, 'utf8');
            const data = JSON.parse(content);

            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(1);
            expect(data[0].ticketId).toBe('REP-DEMO-000001');
            expect(data[0].device).toBe('Generic Demo Smartphone');
        });
    });
});

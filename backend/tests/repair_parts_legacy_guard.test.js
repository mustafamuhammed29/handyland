/**
 * backend/tests/repair_parts_legacy_guard.test.js
 * Comprehensive tests for Phase 2D: Legacy repair parts write hardening.
 */
'use strict';

const request = require('supertest');
const express = require('express');

// Mock auth middleware to pass as admin
jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { id: 'mock-admin-user-id', role: 'admin', name: 'Admin User' };
        next();
    },
    authorize: (...roles) => (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        next();
    }
}));

// Mock Supabase
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('../config/supabase', () => ({
    supabase: { from: (...args) => mockFrom(...args), rpc: (...args) => mockRpc(...args) },
    supabaseAdmin: { from: (...args) => mockFrom(...args), rpc: (...args) => mockRpc(...args) }
}));

const repairPartRoutes = require('../routes/repairPartRoutes');
const inventoryRoutes = require('../routes/inventoryRoutes');

const app = express();
app.use(express.json());
app.use('/api/repair-parts', repairPartRoutes);
app.use('/api/inventory', inventoryRoutes);

describe('Phase 2D: Legacy Repair Parts Mutation Guards', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. Legacy repair-parts CRUD write blockades', () => {
        test('POST /api/repair-parts returns 409 and LEGACY_REPAIR_PARTS_MUTATION_DISABLED without calling DB', async () => {
            const res = await request(app)
                .post('/api/repair-parts')
                .send({
                    name: 'iPhone 13 Screen',
                    sku: 'SCR-IP13-001',
                    stock: 10,
                    costPrice: 45
                });

            expect(res.status).toBe(409);
            expect(res.body).toEqual({
                success: false,
                error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
                message: 'Repair parts must be managed through the warehouse module.'
            });

            // Zero DB calls
            expect(mockFrom).not.toHaveBeenCalled();
            expect(mockRpc).not.toHaveBeenCalled();
        });

        test('PUT /api/repair-parts/:id returns 409 and LEGACY_REPAIR_PARTS_MUTATION_DISABLED without calling DB', async () => {
            const res = await request(app)
                .put('/api/repair-parts/d3b07384-d113-40f2-b2d9-123456789abc')
                .send({
                    stock: 5,
                    price: 99.99
                });

            expect(res.status).toBe(409);
            expect(res.body).toEqual({
                success: false,
                error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
                message: 'Repair parts must be managed through the warehouse module.'
            });

            // Zero DB calls
            expect(mockFrom).not.toHaveBeenCalled();
            expect(mockRpc).not.toHaveBeenCalled();
        });

        test('DELETE /api/repair-parts/:id returns 409 and LEGACY_REPAIR_PARTS_MUTATION_DISABLED without calling DB', async () => {
            const res = await request(app)
                .delete('/api/repair-parts/d3b07384-d113-40f2-b2d9-123456789abc');

            expect(res.status).toBe(409);
            expect(res.body).toEqual({
                success: false,
                error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
                message: 'Repair parts must be managed through the warehouse module.'
            });

            // Zero DB calls
            expect(mockFrom).not.toHaveBeenCalled();
            expect(mockRpc).not.toHaveBeenCalled();
        });
    });

    describe('2. Legacy generic inventory stock update guard for RepairPart', () => {
        test('PUT /api/inventory/RepairPart/:id/stock returns 409 and LEGACY_REPAIR_PARTS_MUTATION_DISABLED without calling DB', async () => {
            const res = await request(app)
                .put('/api/inventory/RepairPart/d3b07384-d113-40f2-b2d9-123456789abc/stock')
                .send({
                    stock: 12,
                    price: 89.99,
                    reason: 'Manual Correction'
                });

            expect(res.status).toBe(409);
            expect(res.body).toEqual({
                success: false,
                error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
                message: 'Repair parts must be managed through the warehouse module.'
            });

            // Zero DB calls
            expect(mockFrom).not.toHaveBeenCalled();
            expect(mockRpc).not.toHaveBeenCalled();
        });
    });

    describe('3. Products and Accessories inventory operations remain unaffected', () => {
        test('PUT /api/inventory/Product/:id/stock continues existing flow', async () => {
            const mockSelect = jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                    data: { name: 'iPhone 14 Pro', stock: 5 },
                    error: null
                })
            });
            const mockUpdate = jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            });
            const mockInsert = jest.fn().mockResolvedValue({ error: null });

            mockFrom.mockImplementation((table) => {
                if (table === 'products') {
                    return {
                        select: () => ({ eq: () => mockSelect() }),
                        update: () => mockUpdate()
                    };
                }
                if (table === 'stock_history') {
                    return { insert: mockInsert };
                }
                return {};
            });

            const res = await request(app)
                .put('/api/inventory/Product/prod-123/stock')
                .send({
                    stock: 8,
                    price: 799,
                    reason: 'Restock'
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Item updated'
            });
            expect(mockFrom).toHaveBeenCalledWith('products');
            expect(mockFrom).toHaveBeenCalledWith('stock_history');
        });

        test('PUT /api/inventory/Accessory/:id/stock continues existing flow', async () => {
            const mockSelect = jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                    data: { name: 'USB-C Cable 2M', stock: 20 },
                    error: null
                })
            });
            const mockUpdate = jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            });
            const mockInsert = jest.fn().mockResolvedValue({ error: null });

            mockFrom.mockImplementation((table) => {
                if (table === 'accessories') {
                    return {
                        select: () => ({ eq: () => mockSelect() }),
                        update: () => mockUpdate()
                    };
                }
                if (table === 'stock_history') {
                    return { insert: mockInsert };
                }
                return {};
            });

            const res = await request(app)
                .put('/api/inventory/Accessory/acc-456/stock')
                .send({
                    stock: 25,
                    price: 19.99,
                    reason: 'Restock'
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Item updated'
            });
            expect(mockFrom).toHaveBeenCalledWith('accessories');
            expect(mockFrom).toHaveBeenCalledWith('stock_history');
        });
    });

    describe('4. Legacy GET /api/repair-parts read compatibility', () => {
        test('GET /api/repair-parts returns paginated list as before', async () => {
            const mockParts = [
                { id: 'part-1', name: 'Screen iPhone 12', sku: 'SCR-12', stock: 3, min_stock: 2 }
            ];

            const mockQuery = {
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({
                    data: mockParts,
                    error: null,
                    count: 1
                })
            };

            mockFrom.mockImplementation((table) => {
                if (table === 'repair_parts') {
                    return {
                        select: jest.fn().mockReturnValue(mockQuery)
                    };
                }
                return {};
            });

            const res = await request(app)
                .get('/api/repair-parts?page=1&limit=50');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockParts);
            expect(mockFrom).toHaveBeenCalledWith('repair_parts');
        });
    });

    describe('5. Error Response Sanitization', () => {
        test('Response contains no database names, sql fragments, or stack traces', async () => {
            const res = await request(app)
                .post('/api/repair-parts')
                .send({ name: 'Test' });

            const bodyStr = JSON.stringify(res.body);
            expect(bodyStr).not.toContain('supabase');
            expect(bodyStr).not.toContain('part_stock_locations');
            expect(bodyStr).not.toContain('part_stock_movements');
            expect(bodyStr).not.toContain('SELECT');
            expect(bodyStr).not.toContain('stack');
            expect(bodyStr).not.toContain('postgres');
        });
    });
});

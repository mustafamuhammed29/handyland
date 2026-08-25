/**
 * backend/tests/commerce_repair_flow.test.js
 * Comprehensive tests for Commerce, Cart Operations, Coupon Calculations, Inventory, and Repairs.
 */
'use strict';

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

describe('Commerce, Inventory & Repair Lifecycle Flows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const setupAuthUser = (userId = 'user-123', role = 'user') => {
        supabaseAdmin.auth.getUser.mockResolvedValue({
            data: { user: { id: userId, email: `${userId}@test.com` } },
            error: null
        });

        return {
            id: userId,
            name: `User ${userId}`,
            email: `${userId}@test.com`,
            role: role,
            is_active: true,
            is_verified: true
        };
    };

    describe('1. Coupon Validation Logic & Discount Calculations', () => {
        it('POST /api/coupons/validate should reject missing code with 400', async () => {
            const res = await request(app)
                .post('/api/coupons/validate')
                .set('x-app-type', 'frontend')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Coupon code required');
        });

        it('POST /api/coupons/validate should return 404 for nonexistent coupon code', async () => {
            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                })
            }));

            const res = await request(app)
                .post('/api/coupons/validate')
                .set('x-app-type', 'frontend')
                .send({ code: 'NONEXISTENT' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid coupon code');
        });

        it('POST /api/coupons/validate should return 400 for expired or inactive coupon', async () => {
            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: 'coupon-expired',
                            code: 'EXPIRED10',
                            is_active: false,
                            valid_until: '2020-01-01T00:00:00Z'
                        },
                        error: null
                    })
                })
            }));

            const res = await request(app)
                .post('/api/coupons/validate')
                .set('x-app-type', 'frontend')
                .send({ code: 'EXPIRED10' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Coupon has expired or is inactive');
        });

        it('POST /api/coupons/validate should calculate percentage discount with maximum cap', async () => {
            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: 'coupon-promo20',
                            code: 'PROMO20',
                            discount_type: 'percentage',
                            discount_value: 20, // 20%
                            min_order_value: 50,
                            max_discount: 30, // max €30
                            is_active: true,
                            valid_until: '2030-12-31T23:59:59Z',
                            usage_limit: 100,
                            used_count: 5
                        },
                        error: null
                    })
                })
            }));

            const res = await request(app)
                .post('/api/coupons/validate')
                .set('x-app-type', 'frontend')
                .send({ code: 'PROMO20', cartTotal: 200 }); // 20% of 200 = 40, capped at 30

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.calculatedDiscount).toBe(30);
        });
    });

    describe('2. Stock Availability & Inventory Checks', () => {
        it('POST /api/products/validate-stock should verify stock availability for line items', async () => {
            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'products') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockImplementation((col, val) => {
                            if (val === 'prod-in-stock') {
                                return { single: jest.fn().mockResolvedValue({ data: { id: 'prod-in-stock', name: 'iPhone Case', stock: 10 }, error: null }) };
                            }
                            if (val === 'prod-out-of-stock') {
                                return { single: jest.fn().mockResolvedValue({ data: { id: 'prod-out-of-stock', name: 'MacBook Pro', stock: 0 }, error: null }) };
                            }
                            return { single: jest.fn().mockResolvedValue({ data: null, error: null }) };
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/products/validate-stock')
                .set('x-app-type', 'frontend')
                .send({
                    items: [
                        { id: 'prod-in-stock', quantity: 2 },
                        { id: 'prod-out-of-stock', quantity: 1 }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false); // Because one item is out of stock
            expect(res.body.results).toHaveLength(2);
            expect(res.body.results[0].available).toBe(true);
            expect(res.body.results[1].available).toBe(false);
        });
    });

    describe('3. Repair Catalog & Preliminary Cost Estimation', () => {
        it('GET /api/repairs/catalog should return paginated catalog devices', async () => {
            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({
                    data: [
                        { id: 'device-1', brand: 'Apple', model: 'iPhone 15 Pro', services: [] }
                    ],
                    error: null,
                    count: 1
                })
            }));

            const res = await request(app).get('/api/repairs/catalog');

            expect(res.status).toBe(200);
            expect(res.body.devices).toHaveLength(1);
            expect(res.body.totalDevices).toBe(1);
        });

        it('POST /api/repairs/estimate should calculate preliminary cost correctly', async () => {
            const res = await request(app)
                .post('/api/repairs/estimate')
                .set('x-app-type', 'frontend')
                .send({
                    device: 'Apple iPhone 14 Pro',
                    issue: 'Broken screen and battery issue'
                });

            // Base 50 + iPhone 30 + Screen 80 + Battery 40 = 200
            expect(res.status).toBe(200);
            expect(res.body.estimatedCost).toBe(200);
            expect(res.body.currency).toBe('EUR');
        });

        it('POST /api/repairs/estimate should reject invalid/missing input with 400', async () => {
            const res = await request(app)
                .post('/api/repairs/estimate')
                .set('x-app-type', 'frontend')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});

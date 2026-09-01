/**
 * backend/tests/payment_security.test.js
 * Comprehensive tests for Stripe and PayPal payment security, webhooks, and authentication.
 */
'use strict';

const mockStripeInstance = {
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_test_12345',
            client_secret: 'pi_test_12345_secret_abc'
        })
    },
    webhooks: {
        constructEvent: jest.fn()
    },
    refunds: {
        create: jest.fn().mockResolvedValue({ id: 're_test_123' })
    }
};

jest.mock('stripe', () => {
    return jest.fn(() => mockStripeInstance);
});

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

describe('Payment Security & Webhook Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStripeInstance.paymentIntents.create.mockResolvedValue({
            id: 'pi_test_12345',
            client_secret: 'pi_test_12345_secret_abc'
        });
    });

    const setupAuthAndDb = (userId = 'user-123', role = 'user') => {
        supabaseAdmin.auth.getUser.mockResolvedValue({
            data: { user: { id: userId, email: 'payer@test.com' } },
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
                            name: 'Test Payer',
                            email: 'payer@test.com',
                            role: role,
                            is_active: true,
                            is_verified: true
                        },
                        error: null
                    }),
                    order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
                    then: function(resolve) { resolve({ data: [], error: null, count: 0 }); }
                };
            }
            if (table === 'orders') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'order-123', user_id: userId, total_amount: 49.99, status: 'pending' },
                        error: null
                    }),
                    update: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: { id: 'order-123' }, error: null })
                    }),
                    then: function(resolve) { resolve({ data: [], error: null }); }
                };
            }
            if (table === 'transactions') {
                return {
                    insert: jest.fn().mockReturnValue({
                        then: function(resolve) { resolve({ data: [], error: null }); }
                    }),
                    update: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: { id: 'tx-123' }, error: null })
                            })
                        })
                    }),
                    then: function(resolve) { resolve({ data: [], error: null }); }
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: {}, error: null }),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                then: function(resolve) { resolve({ data: [], error: null, count: 0 }); }
            };
        });
    };

    describe('1. Stripe Payment Intent Authentication & Authorization', () => {
        it('POST /api/payment/create-payment-intent should return 401 when unauthenticated', async () => {
            const res = await request(app)
                .post('/api/payment/create-payment-intent')
                .set('x-app-type', 'frontend')
                .send({ orderId: 'order-123' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('POST /api/payment/create-payment-intent should create payment intent when authenticated', async () => {
            setupAuthAndDb('user-123', 'user');

            const res = await request(app)
                .post('/api/payment/create-payment-intent')
                .set('Authorization', 'Bearer valid-token')
                .set('x-app-type', 'frontend')
                .send({ orderId: 'order-123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.clientSecret).toBe('pi_test_12345_secret_abc');
        });
    });

    describe('2. Stripe Webhook Cryptographic Signature Verification', () => {
        it('POST /api/payment/webhook should return 400 when stripe-signature header is missing', async () => {
            const res = await request(app)
                .post('/api/payment/webhook')
                .send({ type: 'payment_intent.succeeded' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Webhook signature or secret missing');
        });

        it('POST /api/payment/webhook should return 400 when signature verification fails', async () => {
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
            mockStripeInstance.webhooks.constructEvent.mockImplementationOnce(() => {
                throw new Error('Signature verification failed');
            });

            const res = await request(app)
                .post('/api/payment/webhook')
                .set('stripe-signature', 'invalid-signature-header')
                .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

            expect(res.status).toBe(400);
        });

        it('POST /api/payment/webhook should process payment_intent.succeeded and return received', async () => {
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
            mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_success_123',
                        metadata: { orderId: 'order-123' },
                        payment_method_types: ['card']
                    }
                }
            });

            setupAuthAndDb('user-123', 'user');

            const res = await request(app)
                .post('/api/payment/webhook')
                .set('stripe-signature', 'valid-mock-signature')
                .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

            expect(res.status).toBe(200);
            expect(res.body.received).toBe(true);
        });
    });

    describe('3. PayPal REST API Payment Flow (Mocked Network)', () => {
        const originalFetch = global.fetch;

        beforeEach(() => {
            process.env.PAYPAL_CLIENT_ID = 'test_client_id';
            process.env.PAYPAL_SECRET = 'test_secret';
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        it('POST /api/payment/paypal/create-order should return 401 when unauthenticated', async () => {
            const res = await request(app)
                .post('/api/payment/paypal/create-order')
                .set('x-app-type', 'frontend')
                .send({ items: [{ price: 25, quantity: 2 }] });

            expect(res.status).toBe(401);
        });

        it('POST /api/payment/paypal/create-order returns 503 under P0 security containment', async () => {
            setupAuthAndDb('user-123', 'user');

            const res = await request(app)
                .post('/api/payment/paypal/create-order')
                .set('Authorization', 'Bearer valid-token')
                .set('x-app-type', 'frontend')
                .send({ items: [{ price: 25, quantity: 2 }], shippingFee: 4.90 });

            expect(res.status).toBe(503);
            expect(res.body.success).toBe(false);
            expect(res.body.error?.code).toBe('SERVICE_UNAVAILABLE');
        });
    });
});

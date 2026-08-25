/**
 * backend/tests/security_middleware.test.js
 * Comprehensive tests for CSRF protection, CORS origin handling, and sensitive data leakage.
 */
'use strict';

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

describe('Security Middleware & Policy Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. CSRF Protection Middleware (Double-Submit & Custom Header Model)', () => {
        it('Safe read-only methods (GET) should succeed without CSRF headers and issue XSRF-TOKEN cookie', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            const cookies = res.headers['set-cookie'] || [];
            const xsrfCookie = cookies.find(c => c.startsWith('XSRF-TOKEN='));
            expect(xsrfCookie).toBeDefined();
        });

        it('State-changing POST should return 403 CSRF_VALIDATION_FAILED when missing trusted headers and tokens', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@user.com', password: 'password123' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        it('State-changing POST should succeed CSRF check with "x-app-type: frontend"', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('x-app-type', 'frontend')
                .send({ email: 'test@user.com', password: 'password123' });

            // Will pass CSRF, and hit auth controller (status 200 or 400 validation, but NOT 403 CSRF)
            expect(res.status).not.toBe(403);
        });

        it('State-changing POST should succeed CSRF check with "x-app-type: admin"', async () => {
            const res = await request(app)
                .post('/api/auth/admin/login')
                .set('x-app-type', 'admin')
                .send({ email: 'admin@test.com', password: 'password123' });

            expect(res.status).not.toBe(403);
        });

        it('State-changing POST should succeed CSRF check with "x-requested-with: XMLHttpRequest"', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('x-requested-with', 'XMLHttpRequest')
                .send({ email: 'test@user.com', password: 'password123' });

            expect(res.status).not.toBe(403);
        });

        it('State-changing POST should succeed CSRF check with "Authorization: Bearer <token>"', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer dummy-token');

            expect(res.status).not.toBe(403);
        });

        it('State-changing POST should succeed CSRF check with matching double-submit cookie and x-xsrf-token', async () => {
            const token = 'test-xsrf-token-double-submit-12345';
            const res = await request(app)
                .post('/api/auth/login')
                .set('Cookie', [`XSRF-TOKEN=${token}`])
                .set('x-xsrf-token', token)
                .send({ email: 'test@user.com', password: 'password123' });

            expect(res.status).not.toBe(403);
        });

        it('Bypassed webhook route /api/payment/webhook should skip CSRF check without headers', async () => {
            const res = await request(app)
                .post('/api/payment/webhook')
                .send({ type: 'payment_intent.succeeded' });

            // Returns 400 for missing signature, proving it bypassed 403 CSRF middleware
            expect(res.status).toBe(400);
            expect(res.body.code).not.toBe('CSRF_VALIDATION_FAILED');
        });

        it('Bypassed missing translations route /api/translations/missing should skip CSRF check', async () => {
            supabaseAdmin.from.mockReturnValueOnce({
                insert: jest.fn().mockResolvedValue({ data: [], error: null })
            });

            const res = await request(app)
                .post('/api/translations/missing')
                .send({ key: 'test.missing.key', lang: 'de' });

            expect(res.status).not.toBe(403);
        });
    });

    describe('2. CORS Origin Verification Policy', () => {
        it('Permitted frontend origin (e.g. http://localhost:3000) receives Access-Control-Allow-Origin', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3000');

            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
        });

        it('Vercel deployment pattern *.vercel.app is accepted under current documented CORS configuration', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://handyland-preview.vercel.app');

            expect(res.headers['access-control-allow-origin']).toBe('https://handyland-preview.vercel.app');
        });

        it('Untrusted external origin does NOT receive Access-Control-Allow-Origin', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://malicious-attacker-domain.com');

            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    describe('3. Sensitive Configuration Endpoints & Information Disclosure Prevention', () => {
        it('GET /api/settings/payment-config should only return public keys and omit secret keys', async () => {
            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: {
                        value: {
                            stripeEnabled: true,
                            stripePublishableKey: 'pk_test_public_123',
                            stripeSecretKey: 'sk_test_secret_MUST_NOT_LEAK',
                            stripeWebhookSecret: 'whsec_secret_MUST_NOT_LEAK',
                            paypalClientId: 'paypal_client_public_456',
                            paypalSecret: 'paypal_secret_MUST_NOT_LEAK'
                        }
                    },
                    error: null
                })
            }));

            const res = await request(app).get('/api/settings/payment-config');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const dataStr = JSON.stringify(res.body);
            expect(dataStr).not.toContain('sk_test_secret_MUST_NOT_LEAK');
            expect(dataStr).not.toContain('whsec_secret_MUST_NOT_LEAK');
            expect(dataStr).not.toContain('paypal_secret_MUST_NOT_LEAK');
        });

        it('GET /api/status requires admin authorization', async () => {
            const res = await request(app).get('/api/status');
            expect(res.status).toBe(401);
        });
    });
});

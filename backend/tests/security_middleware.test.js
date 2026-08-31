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
        process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://www.handyland.de,https://admin.handyland.de';
    });

    describe('1. CSRF Protection Middleware (Strict Origin Policy)', () => {
        it('Safe read-only methods (GET) should succeed without CSRF headers and issue XSRF-TOKEN cookie', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            const cookies = res.headers['set-cookie'] || [];
            const xsrfCookie = cookies.find(c => c.startsWith('XSRF-TOKEN='));
            expect(xsrfCookie).toBeDefined();
        });

        it('Cookie-authenticated state-changing POST should return 403 when missing Origin header', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['accessToken=some-cookie-session']);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        it('Cookie-authenticated state-changing POST should return 403 with disallowed Origin even if x-app-type is set', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['accessToken=some-cookie-session'])
                .set('Origin', 'https://attacker.vercel.app')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        it('Cookie-authenticated state-changing POST should succeed CSRF check with approved Origin', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['accessToken=some-cookie-session'])
                .set('Origin', 'https://handyland.de');

            // Passes CSRF middleware and hits controller (status 200)
            expect(res.status).toBe(200);
        });

        it('State-changing POST with non-browser Bearer token and no cookies succeeds without Origin', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer dummy-cli-token');

            expect(res.status).not.toBe(403);
        });

        it('Bypassed webhook route /api/payment/webhook should skip CSRF check without Origin', async () => {
            const res = await request(app)
                .post('/api/payment/webhook')
                .send({ type: 'payment_intent.succeeded' });

            // Returns 400 for missing signature, proving it bypassed 403 CSRF middleware
            expect(res.status).toBe(400);
            expect(res.body.code).not.toBe('CSRF_VALIDATION_FAILED');
        });
    });

    describe('2. CORS Origin Verification Policy (Exact Match Only)', () => {
        it('Permitted production origin https://handyland.de receives Access-Control-Allow-Origin', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://handyland.de');

            expect(res.headers['access-control-allow-origin']).toBe('https://handyland.de');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
        });

        it('Permitted production origin https://admin.handyland.de receives Access-Control-Allow-Origin', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://admin.handyland.de');

            expect(res.headers['access-control-allow-origin']).toBe('https://admin.handyland.de');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
        });

        it('Permitted dev origin http://localhost:3000 receives Access-Control-Allow-Origin in non-prod', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3000');

            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        });

        it('Wildcard Vercel subdomains (e.g. https://attacker.vercel.app) are REJECTED', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://attacker.vercel.app');

            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });

        it('Wildcard Render subdomains (e.g. https://attacker.onrender.com) are REJECTED', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://attacker.onrender.com');

            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });

        it('Wildcard Railway subdomains (e.g. https://attacker.up.railway.app) are REJECTED', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'https://attacker.up.railway.app');

            expect(res.headers['access-control-allow-origin']).toBeUndefined();
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

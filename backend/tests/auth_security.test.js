/**
 * backend/tests/auth_security.test.js
 * Comprehensive tests for authentication, authorization boundaries, 2FA, and roles.
 */
'use strict';

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin, createAuthClient } = require('../config/supabase');

describe('Auth & Authorization Security Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. Unauthenticated Route Protection (HTTP 401)', () => {
        it('GET /api/auth/me should return 401 when no token or session cookie is provided', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.requireAuth).toBe(true);
        });

        it('GET /api/orders/my should return 401 when unauthenticated', async () => {
            const res = await request(app).get('/api/orders/my');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/addresses should return 401 when unauthenticated', async () => {
            const res = await request(app).get('/api/addresses');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/cart should return 401 when unauthenticated', async () => {
            const res = await request(app).get('/api/cart');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/auth/me should return 401 when an invalid/expired token is provided', async () => {
            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'JWT expired' }
            });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-expired-token');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.tokenExpired).toBe(true);
        });
    });

    describe('2. Role-Based Authorization Boundaries (HTTP 403 vs 200)', () => {
        const setupMockUserWithRole = (role, userId = 'user-uuid-123') => {
            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: userId, email: `${role}@test.com` } },
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
                                name: `Test ${role}`,
                                email: `${role}@test.com`,
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
                const chainable = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    neq: jest.fn().mockReturnThis(),
                    gte: jest.fn().mockReturnThis(),
                    lte: jest.fn().mockReturnThis(),
                    gt: jest.fn().mockReturnThis(),
                    lt: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    ilike: jest.fn().mockReturnThis(),
                    or: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                    then: function(resolve) { resolve({ data: [], error: null, count: 0 }); }
                };
                return chainable;
            });
        };

        it('GET /api/auth/admin/users should return 403 when accessed by standard user (role: "user")', async () => {
            setupMockUserWithRole('user');

            const res = await request(app)
                .get('/api/auth/admin/users')
                .set('Authorization', 'Bearer valid-user-token');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Access denied');
        });

        it('GET /api/stats should return 403 when accessed by standard user (role: "user")', async () => {
            setupMockUserWithRole('user');

            const res = await request(app)
                .get('/api/stats')
                .set('Authorization', 'Bearer valid-user-token');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/settings/smtp should return 403 when accessed by staff user (role: "staff")', async () => {
            setupMockUserWithRole('staff');

            const res = await request(app)
                .get('/api/settings/smtp')
                .set('Authorization', 'Bearer valid-staff-token');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/refunds should return 200 when accessed by staff user (role: "staff")', async () => {
            setupMockUserWithRole('staff');

            const res = await request(app)
                .get('/api/refunds')
                .set('Authorization', 'Bearer valid-staff-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/stats should return 200 when accessed by admin user (role: "admin")', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .get('/api/stats')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('3. Two-Factor Authentication (2FA) Endpoints', () => {
        const setupMockAuthUser = (twoFactorEnabled = false) => {
            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'test-2fa-user', email: '2fa@test.com' } },
                error: null
            });
            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'test-2fa-user',
                                email: '2fa@test.com',
                                role: 'user',
                                is_active: true,
                                is_verified: true,
                                two_factor_enabled: twoFactorEnabled,
                                two_factor_secret: 'MOCKSECRET123456'
                            },
                            error: null
                        }),
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ data: { id: 'test-2fa-user' }, error: null })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });
        };

        it('POST /api/2fa/setup should generate a secret and QR code for authenticated user', async () => {
            setupMockAuthUser(false);

            const res = await request(app)
                .post('/api/2fa/setup')
                .set('Authorization', 'Bearer valid-user-token')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('secret');
            expect(res.body).toHaveProperty('qrCode');
        });

        it('POST /api/2fa/verify should return 400 when an invalid TOTP token is provided', async () => {
            setupMockAuthUser(false);

            const res = await request(app)
                .post('/api/2fa/verify')
                .set('Authorization', 'Bearer valid-user-token')
                .set('x-app-type', 'frontend')
                .send({ token: '000000' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid 2FA token');
        });

        it('POST /api/2fa/disable should disable 2FA for authenticated user', async () => {
            setupMockAuthUser(true);

            const res = await request(app)
                .post('/api/2fa/disable')
                .set('Authorization', 'Bearer valid-user-token')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('2FA disabled');
        });
    });
});

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
        process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://www.handyland.de,https://admin.handyland.de';
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

    describe('4. Dedicated Refresh Endpoints & Session Isolation', () => {
        beforeEach(() => {
            supabaseAdmin.auth.refreshSession.mockReset();
        });

        const setupMockAdminProfile = (role = 'admin', isActive = true) => {
            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'admin-user-id',
                                role: role,
                                is_active: isActive
                            },
                            error: null
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

        describe('A. Customer Refresh (POST /api/auth/refresh)', () => {
            it('1. Valid refreshToken refreshes customer session and sets accessToken & refreshToken cookies', async () => {
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'cust-user-123' },
                            access_token: 'new-cust-access-123',
                            refresh_token: 'new-cust-refresh-456'
                        }
                    },
                    error: null
                });

                const res = await request(app)
                    .post('/api/auth/refresh')
                    .set('Cookie', ['refreshToken=valid-cust-refresh'])
                    .set('Origin', 'https://handyland.de')
                    .set('x-app-type', 'frontend');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.accessToken).toBeUndefined();

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('adminToken='))).toBe(false);
                expect(cookies.some(c => c.startsWith('adminRefreshToken='))).toBe(false);
            });

            it('2. POST /api/auth/refresh ignores adminRefreshToken and returns 401 if refreshToken is missing', async () => {
                const res = await request(app)
                    .post('/api/auth/refresh')
                    .set('Cookie', ['adminRefreshToken=some-admin-refresh'])
                    .set('Origin', 'https://handyland.de')
                    .set('x-app-type', 'frontend');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('No customer refresh token');
                expect(supabaseAdmin.auth.refreshSession).not.toHaveBeenCalled();
            });

            it('3. Dual cookies present: POST /api/auth/refresh consumes only refreshToken and sets only customer cookies', async () => {
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'cust-user-123' },
                            access_token: 'new-cust-access-999',
                            refresh_token: 'new-cust-refresh-999'
                        }
                    },
                    error: null
                });

                const res = await request(app)
                    .post('/api/auth/refresh')
                    .set('Cookie', ['refreshToken=cust-tok', 'adminRefreshToken=admin-tok'])
                    .set('Origin', 'https://handyland.de')
                    .set('x-app-type', 'frontend');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('adminToken='))).toBe(false);
                expect(cookies.some(c => c.startsWith('adminRefreshToken='))).toBe(false);
            });

            it('4. Invalid/expired refreshToken returns 401 and clears customer cookies only', async () => {
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: { session: null },
                    error: { message: 'Invalid refresh token' }
                });

                const res = await request(app)
                    .post('/api/auth/refresh')
                    .set('Cookie', ['refreshToken=bad-refresh-tok'])
                    .set('Origin', 'https://handyland.de')
                    .set('x-app-type', 'frontend');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Refresh token expired');

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('accessToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(false);
            });
            it('5. POST /api/auth/refresh never queries public.users table during valid customer refresh', async () => {
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'cust-user-123' },
                            access_token: 'new-cust-access',
                            refresh_token: 'new-cust-refresh'
                        }
                    },
                    error: null
                });

                const res = await request(app)
                    .post('/api/auth/refresh')
                    .set('Cookie', ['refreshToken=valid-cust-refresh'])
                    .set('Origin', 'https://handyland.de')
                    .set('x-app-type', 'frontend');

                expect(res.status).toBe(200);
                // Users table must not be queried for standard customer refresh
                expect(supabaseAdmin.from).not.toHaveBeenCalledWith('users');
            });
        });

        describe('B. Admin Refresh (POST /api/auth/admin/refresh)', () => {
            it('1. Valid adminRefreshToken + admin role refreshes admin session and sets admin cookies', async () => {
                setupMockAdminProfile('admin', true);
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'admin-user-id' },
                            access_token: 'new-admin-access-111',
                            refresh_token: 'new-admin-refresh-222'
                        }
                    },
                    error: null
                });

                const res = await request(app)
                    .post('/api/auth/admin/refresh')
                    .set('Cookie', ['adminRefreshToken=valid-admin-refresh'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.accessToken).toBeUndefined();

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.startsWith('adminToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('adminRefreshToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('accessToken='))).toBe(false);
                expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(false);
            });

            it('2. POST /api/auth/admin/refresh ignores customer refreshToken and returns 401 if adminRefreshToken is missing', async () => {
                const res = await request(app)
                    .post('/api/auth/admin/refresh')
                    .set('Cookie', ['refreshToken=cust-refresh'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('No admin refresh token');
                expect(supabaseAdmin.auth.refreshSession).not.toHaveBeenCalled();
            });

            it('3. POST /api/auth/admin/refresh with non-admin role returns 403 and clears admin cookies', async () => {
                setupMockAdminProfile('user', true); // User role instead of admin
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'admin-user-id' },
                            access_token: 'token-xyz',
                            refresh_token: 'refresh-xyz'
                        }
                    },
                    error: null
                });

                const res = await request(app)
                    .post('/api/auth/admin/refresh')
                    .set('Cookie', ['adminRefreshToken=user-trying-admin-refresh'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(403);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Access denied: Admin role required');

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminRefreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.startsWith('accessToken='))).toBe(false);
            });

            it('4. Dual cookies present: POST /api/auth/admin/refresh consumes only adminRefreshToken and sets only admin cookies', async () => {
                setupMockAdminProfile('administrator', true);
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'admin-user-id' },
                            access_token: 'new-admin-acc-555',
                            refresh_token: 'new-admin-ref-555'
                        }
                    },
                    error: null
                });

                const res = await request(app)
                    .post('/api/auth/admin/refresh')
                    .set('Cookie', ['refreshToken=cust-tok', 'adminRefreshToken=admin-tok'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.startsWith('adminToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('adminRefreshToken='))).toBe(true);
                expect(cookies.some(c => c.startsWith('accessToken='))).toBe(false);
                expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(false);
            });

            it('5. Invalid/expired adminRefreshToken returns 401 and clears admin cookies only', async () => {
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: { session: null },
                    error: { message: 'Invalid refresh token' }
                });

                const res = await request(app)
                    .post('/api/auth/admin/refresh')
                    .set('Cookie', ['adminRefreshToken=expired-admin-tok'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Refresh token expired');

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminRefreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('accessToken=;'))).toBe(false);
            });

            it('6. Database profile lookup failure safely returns 403 and clears admin cookies', async () => {
                // Simulate DB error when querying public.users
                supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                    data: {
                        session: {
                            user: { id: 'admin-user-id' },
                            access_token: 'token-xyz',
                            refresh_token: 'refresh-xyz'
                        }
                    },
                    error: null
                });
                supabaseAdmin.from.mockImplementationOnce(() => ({
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } })
                }));

                const res = await request(app)
                    .post('/api/auth/admin/refresh')
                    .set('Cookie', ['adminRefreshToken=valid-tok'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(403);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Access denied: Admin role required');

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminRefreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.startsWith('accessToken='))).toBe(false);
            });
        });

        describe('C. Logout Namespace Isolation (POST /api/auth/logout)', () => {
            it('1. Customer logout with x-app-type: frontend clears only accessToken and refreshToken', async () => {
                const res = await request(app)
                    .post('/api/auth/logout')
                    .set('Cookie', ['accessToken=cust-tok', 'adminToken=admin-tok'])
                    .set('Origin', 'https://handyland.de')
                    .set('x-app-type', 'frontend');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('accessToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(false);
                expect(cookies.some(c => c.includes('adminRefreshToken=;'))).toBe(false);
            });

            it('2. Admin logout with x-app-type: admin clears only adminToken and adminRefreshToken', async () => {
                const res = await request(app)
                    .post('/api/auth/logout')
                    .set('Cookie', ['accessToken=cust-tok', 'adminToken=admin-tok'])
                    .set('Origin', 'https://admin.handyland.de')
                    .set('x-app-type', 'admin');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminRefreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('accessToken=;'))).toBe(false);
                expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(false);
            });

            it('3. Universal logout without x-app-type header clears both cookie namespaces', async () => {
                const res = await request(app)
                    .post('/api/auth/logout')
                    .set('Origin', 'https://handyland.de');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const cookies = res.headers['set-cookie'] || [];
                expect(cookies.some(c => c.includes('accessToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminToken=;'))).toBe(true);
                expect(cookies.some(c => c.includes('adminRefreshToken=;'))).toBe(true);
            });
        });
    });

    describe('5. Role Normalization & Case Insensitivity on Admin Routes', () => {
        const setupMockAdminUser = (roleValue) => {
            supabaseAdmin.auth.getUser.mockResolvedValue({
                data: { user: { id: 'admin-user-id', email: 'admin@handyland.com' } },
                error: null
            });
            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'admin-user-id',
                                name: 'Admin Person',
                                email: 'admin@handyland.com',
                                role: roleValue,
                                is_active: true,
                                is_verified: true
                            },
                            error: null
                        }),
                        order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
                        then: function(resolve) { resolve({ data: [], error: null, count: 0 }); }
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    gte: jest.fn().mockReturnThis(),
                    lte: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis(),
                    range: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                    then: function(resolve) { resolve({ data: [], error: null, count: 0 }); }
                };
            });
        };

        it('GET /api/auth/admin/users accepts uppercase "ADMIN"', async () => {
            setupMockAdminUser('ADMIN');
            const res = await request(app)
                .get('/api/auth/admin/users')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/auth/admin/users accepts "administrator"', async () => {
            setupMockAdminUser('administrator');
            const res = await request(app)
                .get('/api/auth/admin/users')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/auth/admin/users accepts uppercase "ADMINISTRATOR"', async () => {
            setupMockAdminUser('ADMINISTRATOR');
            const res = await request(app)
                .get('/api/auth/admin/users')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/auth/admin/users rejects non-admin roles like "staff" or "user"', async () => {
            setupMockAdminUser('staff');
            const res = await request(app)
                .get('/api/auth/admin/users')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/stats with authorize("admin") strictly requires exact "admin" role in current middleware', async () => {
            setupMockAdminUser('admin');
            const res = await request(app)
                .get('/api/stats')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('6. Phone Verification devCode Environment Gating', () => {
        const phoneVerificationService = require('../services/phoneVerificationService');

        beforeEach(() => {
            jest.spyOn(phoneVerificationService, 'sendWhatsAppOTP').mockResolvedValue(true);
            jest.spyOn(phoneVerificationService, 'sendTwilioSMS').mockResolvedValue(true);
            jest.spyOn(console, 'log').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('sendOTP should NEVER return devCode when NODE_ENV is production', async () => {
            const originalEnv = process.env.NODE_ENV;
            try {
                process.env.NODE_ENV = 'production';
                const result = await phoneVerificationService.sendOTP('+4915123456789');
                expect(result.success).toBe(true);
                expect(result.devCode).toBeUndefined();
            } finally {
                process.env.NODE_ENV = originalEnv;
            }
        });

        it('sendOTP may return devCode in development mode for unconfigured SMS gateway', async () => {
            const originalEnv = process.env.NODE_ENV;
            try {
                process.env.NODE_ENV = 'development';
                const result = await phoneVerificationService.sendOTP('+4915123456789');
                expect(result.success).toBe(true);
                expect(result.devCode).toBeDefined();
                expect(result.devCode).toMatch(/^\d{6}$/);
            } finally {
                process.env.NODE_ENV = originalEnv;
            }
        });
    });
});

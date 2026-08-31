/**
 * backend/tests/cookie_auth_hardening.test.js
 * Focused tests for cookie-only authentication, token exposure prevention,
 * strict CORS origin allowlist, and anti-CSRF protections.
 */
'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const { supabaseAdmin, createAuthClient } = require('../config/supabase');

describe('Cookie-Only Authentication & Security Hardening Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. Zero Reusable Credentials in JSON Responses', () => {
        it('Normal login JSON response does NOT expose token, access_token, refresh_token, or session', async () => {
            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: 'cust-uuid-1', email: 'user@handyland.de' },
                            session: {
                                access_token: 'secret-cust-access-jwt',
                                refresh_token: 'secret-cust-refresh-jwt'
                            }
                        },
                        error: null
                    })
                }
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'cust-uuid-1',
                                name: 'Customer Test',
                                email: 'user@handyland.de',
                                role: 'user',
                                is_active: true,
                                is_verified: true,
                                two_factor_enabled: false
                            },
                            error: null
                        }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                if (table === 'addresses') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockResolvedValue({ data: [], error: null })
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() };
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'user@handyland.de', password: 'ValidPassword123!' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify no token fields in JSON
            expect(res.body.token).toBeUndefined();
            expect(res.body.accessToken).toBeUndefined();
            expect(res.body.access_token).toBeUndefined();
            expect(res.body.refreshToken).toBeUndefined();
            expect(res.body.refresh_token).toBeUndefined();
            expect(res.body.tempToken).toBeUndefined();
            expect(res.body.session).toBeUndefined();
            expect(res.body.user.token).toBeUndefined();
            expect(res.body.data.token).toBeUndefined();

            // Verify cookies are set
            const cookies = res.headers['set-cookie'] || [];
            expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
            expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
        });

        it('Admin login JSON response does NOT expose token, access_token, or session', async () => {
            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: 'admin-uuid-1', email: 'admin@handyland.de' },
                            session: {
                                access_token: 'secret-admin-access-jwt',
                                refresh_token: 'secret-admin-refresh-jwt'
                            }
                        },
                        error: null
                    })
                }
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'admin-uuid-1',
                                name: 'Admin Test',
                                email: 'admin@handyland.de',
                                role: 'admin',
                                is_active: true,
                                is_verified: true,
                                two_factor_enabled: false
                            },
                            error: null
                        }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() };
            });

            const res = await request(app)
                .post('/api/auth/admin/login')
                .send({ email: 'admin@handyland.de', password: 'AdminPassword123!' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            expect(res.body.token).toBeUndefined();
            expect(res.body.accessToken).toBeUndefined();
            expect(res.body.access_token).toBeUndefined();
            expect(res.body.user.token).toBeUndefined();
            expect(res.body.data.token).toBeUndefined();

            const cookies = res.headers['set-cookie'] || [];
            expect(cookies.some(c => c.startsWith('adminToken='))).toBe(true);
            expect(cookies.some(c => c.startsWith('adminRefreshToken='))).toBe(true);
        });

        it('2FA Login requirement does NOT expose tempToken in JSON', async () => {
            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: '2fa-user-1', email: '2fa@handyland.de' },
                            session: {
                                access_token: 'should-not-leak-access-token',
                                refresh_token: 'should-not-leak-refresh-token'
                            }
                        },
                        error: null
                    })
                }
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: '2fa-user-1',
                                name: '2FA User',
                                email: '2fa@handyland.de',
                                role: 'user',
                                is_active: true,
                                is_verified: true,
                                two_factor_enabled: true
                            },
                            error: null
                        }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    is: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                    update: jest.fn().mockReturnThis()
                };
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: '2fa@handyland.de', password: 'Password123!' });

            expect(res.status).toBe(200);
            expect(res.body.twoFactorRequired).toBe(true);
            expect(res.body.tempToken).toBeUndefined();
            expect(res.body.token).toBeUndefined();
            expect(res.body.accessToken).toBeUndefined();
        });

        it('Customer and Admin refresh endpoints do NOT return accessToken in JSON', async () => {
            supabaseAdmin.auth.refreshSession.mockResolvedValueOnce({
                data: {
                    session: {
                        user: { id: 'cust-1' },
                        access_token: 'new-cust-access',
                        refresh_token: 'new-cust-refresh'
                    }
                },
                error: null
            });

            const custRes = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=valid-token'])
                .set('Origin', 'http://localhost:3000');

            expect(custRes.status).toBe(200);
            expect(custRes.body.success).toBe(true);
            expect(custRes.body.accessToken).toBeUndefined();
            expect(custRes.body.token).toBeUndefined();
        });
    });

    describe('2. Cookie Security Configuration Attributes & Environment Policies', () => {
        const originalEnv = process.env.NODE_ENV;
        const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;
        const originalSameSite = process.env.AUTH_COOKIE_SAMESITE;
        const { validateAndGetAllowedOrigins, getValidatedSameSitePolicy } = require('../config/security');

        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
            process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
            process.env.AUTH_COOKIE_SAMESITE = originalSameSite;
        });

        it('Production fails closed if ALLOWED_ORIGINS is missing or empty', () => {
            process.env.NODE_ENV = 'production';
            delete process.env.ALLOWED_ORIGINS;

            expect(() => validateAndGetAllowedOrigins()).toThrow(/ALLOWED_ORIGINS environment variable is required/);

            process.env.ALLOWED_ORIGINS = '   ';
            expect(() => validateAndGetAllowedOrigins()).toThrow(/ALLOWED_ORIGINS environment variable is required/);
        });

        it('Production fails closed if ALLOWED_ORIGINS contains wildcards', () => {
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://*.vercel.app';

            expect(() => validateAndGetAllowedOrigins()).toThrow(/cannot contain wildcards/);
        });

        it('Production fails closed if ALLOWED_ORIGINS contains non-HTTPS origins', () => {
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS = 'https://handyland.de,http://insecure-admin.handyland.de';

            expect(() => validateAndGetAllowedOrigins()).toThrow(/must only contain HTTPS origins/);
        });

        it('Production fails closed if ALLOWED_ORIGINS contains localhost', () => {
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://localhost:3000';

            expect(() => validateAndGetAllowedOrigins()).toThrow(/cannot contain localhost/);
        });

        it('Production fails closed if AUTH_COOKIE_SAMESITE is missing or blank', () => {
            process.env.NODE_ENV = 'production';

            delete process.env.AUTH_COOKIE_SAMESITE;
            expect(() => getValidatedSameSitePolicy()).toThrow(/AUTH_COOKIE_SAMESITE environment variable is required in production/);

            process.env.AUTH_COOKIE_SAMESITE = '   ';
            expect(() => getValidatedSameSitePolicy()).toThrow(/AUTH_COOKIE_SAMESITE environment variable is required in production/);
        });

        it('Production fails closed if AUTH_COOKIE_SAMESITE is invalid', () => {
            process.env.NODE_ENV = 'production';
            process.env.AUTH_COOKIE_SAMESITE = 'invalid_samesite_mode';

            expect(() => getValidatedSameSitePolicy()).toThrow(/AUTH_COOKIE_SAMESITE must be 'strict', 'lax', or 'none'/);
        });

        it('Production succeeds with strict, lax, or none for AUTH_COOKIE_SAMESITE', () => {
            process.env.NODE_ENV = 'production';

            process.env.AUTH_COOKIE_SAMESITE = 'strict';
            expect(getValidatedSameSitePolicy()).toBe('strict');

            process.env.AUTH_COOKIE_SAMESITE = 'lax';
            expect(getValidatedSameSitePolicy()).toBe('lax');

            process.env.AUTH_COOKIE_SAMESITE = 'none';
            expect(getValidatedSameSitePolicy()).toBe('none');
        });

        it('Development defaults to lax when AUTH_COOKIE_SAMESITE is missing', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.AUTH_COOKIE_SAMESITE;

            expect(getValidatedSameSitePolicy()).toBe('lax');
        });

        it('Temporary Test Deployment Topology: ALLOWED_ORIGINS with Vercel test URLs and AUTH_COOKIE_SAMESITE=none', async () => {
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS = 'https://front-end-rho-five-94.vercel.app,https://admin-preview.vercel.app';
            process.env.AUTH_COOKIE_SAMESITE = 'none';

            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: 'test-user-1', email: 'test@handyland.de' },
                            session: { access_token: 'test-tok-123', refresh_token: 'test-ref-123' }
                        },
                        error: null
                    })
                }
            });

            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: 'test-user-1',
                        name: 'Test User',
                        email: 'test@handyland.de',
                        role: 'admin',
                        is_active: true,
                        is_verified: true
                    },
                    error: null
                }),
                update: jest.fn().mockReturnThis()
            }));

            const res = await request(app)
                .post('/api/auth/admin/login')
                .send({ email: 'test@handyland.de', password: 'ValidPassword123!' });

            expect(res.status).toBe(200);
            const cookies = res.headers['set-cookie'] || [];
            const adminTokenCookie = cookies.find(c => c.startsWith('adminToken='));

            expect(adminTokenCookie).toBeDefined();
            expect(adminTokenCookie).toContain('HttpOnly');
            expect(adminTokenCookie).toContain('Secure');
            expect(adminTokenCookie).toContain('SameSite=None');
            expect(adminTokenCookie).toContain('Path=/');
            expect(adminTokenCookie).not.toContain('Domain=');
        });

        it('Final Custom Domain Topology: ALLOWED_ORIGINS with custom domains and AUTH_COOKIE_SAMESITE=strict', async () => {
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://www.handyland.de,https://admin.handyland.de';
            process.env.AUTH_COOKIE_SAMESITE = 'strict';

            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: 'admin-prod-1', email: 'admin@handyland.de' },
                            session: { access_token: 'prod-access-tok', refresh_token: 'prod-refresh-tok' }
                        },
                        error: null
                    })
                }
            });

            supabaseAdmin.from.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: 'admin-prod-1',
                        name: 'Admin Prod',
                        email: 'admin@handyland.de',
                        role: 'admin',
                        is_active: true,
                        is_verified: true
                    },
                    error: null
                }),
                update: jest.fn().mockReturnThis()
            }));

            const res = await request(app)
                .post('/api/auth/admin/login')
                .send({ email: 'admin@handyland.de', password: 'AdminPassword123!' });

            expect(res.status).toBe(200);
            const cookies = res.headers['set-cookie'] || [];
            const adminTokenCookie = cookies.find(c => c.startsWith('adminToken='));

            expect(adminTokenCookie).toBeDefined();
            expect(adminTokenCookie).toContain('HttpOnly');
            expect(adminTokenCookie).toContain('Secure');
            expect(adminTokenCookie).toContain('SameSite=Strict');
            expect(adminTokenCookie).toContain('Path=/');
            expect(adminTokenCookie).not.toContain('Domain=');
        });

        it('Logout clearCookie options match setCookie scope', async () => {
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://admin.handyland.de';
            process.env.AUTH_COOKIE_SAMESITE = 'strict';

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['accessToken=cust-tok', 'adminToken=admin-tok'])
                .set('Origin', 'https://handyland.de');

            expect(res.status).toBe(200);
            const cookies = res.headers['set-cookie'] || [];
            
            const clearedAccess = cookies.find(c => c.startsWith('accessToken=;'));
            const clearedAdmin = cookies.find(c => c.startsWith('adminToken=;'));

            expect(clearedAccess).toBeDefined();
            expect(clearedAccess).toContain('Path=/');
            expect(clearedAccess).toContain('SameSite=Strict');
            expect(clearedAccess).toContain('HttpOnly');
            expect(clearedAccess).toContain('Secure');

            expect(clearedAdmin).toBeDefined();
            expect(clearedAdmin).toContain('Path=/');
            expect(clearedAdmin).toContain('SameSite=Strict');
        });
    });

    describe('3. Browser Client Static Code Verification', () => {
        it('Frontend and Admin API wrappers do not inject localStorage Bearer token and retain withCredentials', () => {
            const frontEndApiCode = fs.readFileSync(path.join(__dirname, '../../front-end/src/utils/api.ts'), 'utf8');
            const adminApiCode = fs.readFileSync(path.join(__dirname, '../../backend/admin/src/utils/api.ts'), 'utf8');

            expect(frontEndApiCode).toContain('withCredentials: true');
            expect(frontEndApiCode).not.toContain("localStorage.getItem('token')");
            expect(frontEndApiCode).not.toContain("Authorization'] = `Bearer");

            expect(adminApiCode).toContain('withCredentials: true');
            expect(adminApiCode).not.toContain("localStorage.getItem('token')");
            expect(adminApiCode).not.toContain("Authorization'] = `Bearer");
        });

        it('Admin Socket.IO clients do not read localStorage auth token and do not emit join:admin', () => {
            const ordersCode = fs.readFileSync(path.join(__dirname, '../../backend/admin/src/pages/OrdersManager.tsx'), 'utf8');
            const messagesCode = fs.readFileSync(path.join(__dirname, '../../backend/admin/src/pages/MessagesManager.tsx'), 'utf8');
            const notifsCode = fs.readFileSync(path.join(__dirname, '../../backend/admin/src/hooks/useAdminNotifications.ts'), 'utf8');

            expect(ordersCode).not.toContain("auth: { token");
            expect(ordersCode).not.toContain("emit('join:admin')");

            expect(messagesCode).not.toContain("auth: { token");
            expect(messagesCode).not.toContain("emit('join:admin')");

            expect(notifsCode).not.toContain("auth: { token");
            expect(notifsCode).not.toContain("emit('join:admin')");
        });
    });

    describe('4. Strict Origin CORS & CSRF Enforcement', () => {
        it('Approved production origins succeed under credentialed CORS', async () => {
            const originalAllowed = process.env.ALLOWED_ORIGINS;
            process.env.ALLOWED_ORIGINS = 'https://handyland.de,https://www.handyland.de,https://admin.handyland.de';

            const origins = [
                'https://handyland.de',
                'https://www.handyland.de',
                'https://admin.handyland.de'
            ];

            for (const origin of origins) {
                const res = await request(app)
                    .get('/health')
                    .set('Origin', origin);

                expect(res.headers['access-control-allow-origin']).toBe(origin);
                expect(res.headers['access-control-allow-credentials']).toBe('true');
            }

            process.env.ALLOWED_ORIGINS = originalAllowed;
        });

        it('Attacker subdomains on Vercel, Render, Railway are strictly REJECTED', async () => {
            const attackerOrigins = [
                'https://attacker.vercel.app',
                'https://handyland-fake.vercel.app',
                'https://attacker.onrender.com',
                'https://attacker.up.railway.app'
            ];

            for (const origin of attackerOrigins) {
                const res = await request(app)
                    .get('/health')
                    .set('Origin', origin);

                expect(res.headers['access-control-allow-origin']).toBeUndefined();
            }
        });

        it('Cookie-authenticated mutation with missing/disallowed Origin is rejected even if Bearer token is attached', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['accessToken=some-cookie'])
                .set('Authorization', 'Bearer some-bearer-token');

            // Missing origin on cookie-present request must fail CSRF
            expect(res.status).toBe(403);
            expect(res.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        it('Non-browser request with Bearer token and NO cookies succeeds without Origin', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer cli-automated-token');

            // Passes CSRF check
            expect(res.status).toBe(200);
        });
    });
});

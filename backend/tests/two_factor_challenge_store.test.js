/**
 * backend/tests/two_factor_challenge_store.test.js
 * Focused tests for encrypted 2FA challenge store lifecycle:
 * - AES-256-GCM encryption with AAD binding
 * - Startup and configuration validation
 * - Login challenge issuance (Zero credentials / cookies before OTP)
 * - OTP verification, atomic locking, failure revocation, replay protection
 * - Idempotent challenge cancellation and cleanup worker
 * - Protect middleware isolation (challengeId rejection)
 */
'use strict';

const request = require('supertest');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const app = require('../server');
const { supabaseAdmin, createAuthClient } = require('../config/supabase');
const {
    getValidatedEncryptionKey,
    buildAAD,
    encryptSessionPayload,
    decryptSessionPayload,
    validate2FAEncryptionConfig
} = require('../utils/auth2faChallengeCrypto');
const {
    isChallengeStoreEnabled,
    classifyRevocationError,
    create2FAChallenge,
    verifyLoginOtp,
    cancelLoginChallenge,
    cleanupExpiredAndFailedChallenges
} = require('../services/twoFactorChallengeService');

const TEST_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('Encrypted 2FA Challenge Store Lifecycle Tests', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.AUTH_2FA_SESSION_ENCRYPTION_KEY = TEST_KEY_HEX;
        process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED = 'true';
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    // ─────────────────────────────────────────────────────────────
    // 1. AES-256-GCM Session Encryption & AAD Binding
    // ─────────────────────────────────────────────────────────────
    describe('1. Crypto Utility & AAD Binding', () => {
        it('Validates 32-byte key from 64-character hex string', () => {
            const keyBuf = getValidatedEncryptionKey(TEST_KEY_HEX);
            expect(Buffer.isBuffer(keyBuf)).toBe(true);
            expect(keyBuf.length).toBe(32);
        });

        it('Rejects missing, short, non-hex, or malformed encryption key', () => {
            expect(() => getValidatedEncryptionKey('')).toThrow(/required/);
            expect(() => getValidatedEncryptionKey('short-key')).toThrow(/64-character/);
            expect(() => getValidatedEncryptionKey('zzzz'.repeat(16))).toThrow(/64-character/);
        });

        it('Successfully encrypts and decrypts session payload', () => {
            const challengeId = crypto.randomUUID();
            const userId = crypto.randomUUID();
            const session = {
                access_token: 'mock-access-token-xyz',
                refresh_token: 'mock-refresh-token-xyz',
                user: { id: userId, email: 'test@handyland.de' }
            };

            const encrypted = encryptSessionPayload({
                session,
                challengeId,
                userId,
                keyHex: TEST_KEY_HEX
            });

            expect(encrypted.encrypted_session_payload).toBeDefined();
            expect(encrypted.encryption_iv).toHaveLength(24); // 12 bytes = 24 hex chars
            expect(encrypted.encryption_tag).toHaveLength(32); // 16 bytes = 32 hex chars
            expect(encrypted.encryption_key_version).toBe(1);

            const decrypted = decryptSessionPayload({
                encryptedPayload: encrypted.encrypted_session_payload,
                ivHex: encrypted.encryption_iv,
                tagHex: encrypted.encryption_tag,
                challengeId,
                userId,
                keyHex: TEST_KEY_HEX
            });

            expect(decrypted.access_token).toBe(session.access_token);
            expect(decrypted.refresh_token).toBe(session.refresh_token);
        });

        it('Fails decryption safely when AAD does not match (wrong challengeId or userId)', () => {
            const challengeId = crypto.randomUUID();
            const userId = crypto.randomUUID();
            const session = { access_token: 'token-abc' };

            const encrypted = encryptSessionPayload({
                session,
                challengeId,
                userId,
                keyHex: TEST_KEY_HEX
            });

            // Wrong challenge ID in AAD verification
            expect(() => {
                decryptSessionPayload({
                    encryptedPayload: encrypted.encrypted_session_payload,
                    ivHex: encrypted.encryption_iv,
                    tagHex: encrypted.encryption_tag,
                    challengeId: crypto.randomUUID(), // different ID
                    userId,
                    keyHex: TEST_KEY_HEX
                });
            }).toThrow(/failed/);

            // Wrong user ID in AAD verification
            expect(() => {
                decryptSessionPayload({
                    encryptedPayload: encrypted.encrypted_session_payload,
                    ivHex: encrypted.encryption_iv,
                    tagHex: encrypted.encryption_tag,
                    challengeId,
                    userId: crypto.randomUUID(), // different user
                    keyHex: TEST_KEY_HEX
                });
            }).toThrow(/failed/);
        });

        it('Generates distinct IVs for consecutive encryptions of the same payload', () => {
            const challengeId = crypto.randomUUID();
            const userId = crypto.randomUUID();
            const session = { access_token: 'token-1' };

            const enc1 = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });
            const enc2 = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });

            expect(enc1.encryption_iv).not.toEqual(enc2.encryption_iv);
            expect(enc1.encrypted_session_payload).not.toEqual(enc2.encrypted_session_payload);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Startup & Environment Fail-Closed Rules
    // ─────────────────────────────────────────────────────────────
    describe('2. Environment Validation & Rollout Switches', () => {
        it('Fails closed in production if feature is enabled but key is missing', () => {
            process.env.NODE_ENV = 'production';
            process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED = 'true';
            delete process.env.AUTH_2FA_SESSION_ENCRYPTION_KEY;

            expect(() => validate2FAEncryptionConfig(true)).toThrow(/AUTH_2FA_SESSION_ENCRYPTION_KEY/);
        });

        it('Passes validation when key is valid in production', () => {
            process.env.NODE_ENV = 'production';
            process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED = 'true';
            process.env.AUTH_2FA_SESSION_ENCRYPTION_KEY = TEST_KEY_HEX;

            expect(() => validate2FAEncryptionConfig(true)).not.toThrow();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Login 2FA Challenge Issuance (Zero Browser Credentials)
    // ─────────────────────────────────────────────────────────────
    describe('3. Login Challenge Issuance', () => {
        it('Customer login for 2FA user returns opaque challengeId and NO credentials or cookies', async () => {
            process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED = 'true';

            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: '2fa-cust-uuid', email: 'cust2fa@handyland.de' },
                            session: {
                                access_token: 'temporary-upstream-access-jwt',
                                refresh_token: 'temporary-upstream-refresh-jwt'
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
                                id: '2fa-cust-uuid',
                                name: '2FA Customer',
                                email: 'cust2fa@handyland.de',
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
                if (table === 'auth_2fa_challenges') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        is: jest.fn().mockReturnThis(),
                        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockResolvedValue({ data: [], error: null })
                };
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'cust2fa@handyland.de', password: 'ValidPassword123!' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.twoFactorRequired).toBe(true);
            expect(res.body.challengeId).toBeDefined();
            expect(typeof res.body.challengeId).toBe('string');

            // ZERO tokens or session in JSON
            expect(res.body.token).toBeUndefined();
            expect(res.body.accessToken).toBeUndefined();
            expect(res.body.access_token).toBeUndefined();
            expect(res.body.refreshToken).toBeUndefined();
            expect(res.body.session).toBeUndefined();
            expect(res.body.tempToken).toBeUndefined();

            // ZERO auth cookies issued before OTP
            const cookies = res.headers['set-cookie'] || [];
            expect(cookies.some(c => c.startsWith('accessToken='))).toBe(false);
            expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(false);
        });

        it('Admin login for 2FA admin returns opaque challengeId and NO credentials or cookies', async () => {
            process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED = 'true';

            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: '2fa-admin-uuid', email: 'admin2fa@handyland.de' },
                            session: {
                                access_token: 'temp-admin-access-jwt',
                                refresh_token: 'temp-admin-refresh-jwt'
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
                                id: '2fa-admin-uuid',
                                name: '2FA Admin',
                                email: 'admin2fa@handyland.de',
                                role: 'admin',
                                is_active: true,
                                is_verified: true,
                                two_factor_enabled: true
                            },
                            error: null
                        }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                if (table === 'auth_2fa_challenges') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        is: jest.fn().mockReturnThis(),
                        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis()
                };
            });

            const res = await request(app)
                .post('/api/auth/admin/login')
                .send({ email: 'admin2fa@handyland.de', password: 'AdminPassword123!' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.twoFactorRequired).toBe(true);
            expect(res.body.challengeId).toBeDefined();
            expect(res.body.appType).toBe('admin');

            const cookies = res.headers['set-cookie'] || [];
            expect(cookies.some(c => c.startsWith('adminToken='))).toBe(false);
            expect(cookies.some(c => c.startsWith('adminRefreshToken='))).toBe(false);
        });

        it('Fails closed with 503 if account has 2FA enabled but feature store is disabled', async () => {
            process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED = 'false';

            createAuthClient.mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({
                        data: {
                            user: { id: '2fa-user-off', email: 'off2fa@handyland.de' },
                            session: { access_token: 'secret-token' }
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
                                id: '2fa-user-off',
                                name: '2FA User Off',
                                email: 'off2fa@handyland.de',
                                role: 'user',
                                is_active: true,
                                is_verified: true,
                                two_factor_enabled: true
                            },
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'off2fa@handyland.de', password: 'ValidPassword123!' });

            expect(res.status).toBe(503);
            expect(res.body.success).toBe(false);
            expect(res.body.code).toBe('TWO_FACTOR_LOGIN_UNAVAILABLE');

            const cookies = res.headers['set-cookie'] || [];
            expect(cookies.length).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. OTP Verification Endpoint & Lifecycle
    // ─────────────────────────────────────────────────────────────
    describe('4. OTP Verification & Atomic State Transitions', () => {
        it('Rejects malformed challengeId or OTP format', async () => {
            const res1 = await request(app)
                .post('/api/auth/2fa/verify-login')
                .send({ challengeId: 'not-a-uuid', otp: '123456' });

            expect(res1.status).toBe(400);

            const res2 = await request(app)
                .post('/api/auth/2fa/verify-login')
                .send({ challengeId: crypto.randomUUID(), otp: 'abc' });

            expect(res2.status).toBe(400);
        });

        it('Wrong OTP increments failure counter without consumption', async () => {
            const challengeId = crypto.randomUUID();
            const userId = 'user-otp-test-1';
            const secret = speakeasy.generateSecret();

            const session = { access_token: 'held-access-jwt', refresh_token: 'held-refresh-jwt' };
            const encrypted = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });

            const mockChallenge = {
                id: challengeId,
                user_id: userId,
                encrypted_session_payload: encrypted.encrypted_session_payload,
                encryption_iv: encrypted.encryption_iv,
                encryption_tag: encrypted.encryption_tag,
                encryption_key_version: 1,
                failed_attempts: 0,
                expires_at: new Date(Date.now() + 300000).toISOString(),
                consumed_at: null,
                revoked_at: null,
                processing_until: null
            };

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'auth_2fa_challenges') {
                    return {
                        update: jest.fn().mockImplementation((payload) => ({
                            eq: jest.fn().mockReturnThis(),
                            is: jest.fn().mockReturnThis(),
                            gt: jest.fn().mockReturnThis(),
                            lt: jest.fn().mockReturnThis(),
                            or: jest.fn().mockReturnThis(),
                            select: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null })
                        }))
                    };
                }
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: userId,
                                email: 'user@test.de',
                                two_factor_secret: secret.base32,
                                two_factor_enabled: true
                            },
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
            });

            // Submit an incorrect OTP
            const res = await request(app)
                .post('/api/auth/2fa/verify-login')
                .send({ challengeId, otp: '000000' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.attemptsRemaining).toBe(2);
        });

        it('Correct OTP consumes challenge once, issues HttpOnly cookies, and returns sanitized user data', async () => {
            const challengeId = crypto.randomUUID();
            const userId = 'user-otp-test-2';
            const secret = speakeasy.generateSecret();
            const validOtp = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32'
            });

            const session = { access_token: 'valid-access-jwt', refresh_token: 'valid-refresh-jwt' };
            const encrypted = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });

            const mockChallenge = {
                id: challengeId,
                user_id: userId,
                encrypted_session_payload: encrypted.encrypted_session_payload,
                encryption_iv: encrypted.encryption_iv,
                encryption_tag: encrypted.encryption_tag,
                encryption_key_version: 1,
                failed_attempts: 0,
                expires_at: new Date(Date.now() + 300000).toISOString(),
                consumed_at: null,
                revoked_at: null,
                processing_until: null
            };

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'auth_2fa_challenges') {
                    return {
                        update: jest.fn().mockImplementation((payload) => ({
                            eq: jest.fn().mockReturnThis(),
                            is: jest.fn().mockReturnThis(),
                            gt: jest.fn().mockReturnThis(),
                            lt: jest.fn().mockReturnThis(),
                            or: jest.fn().mockReturnThis(),
                            select: jest.fn().mockResolvedValue({
                                data: [{ ...mockChallenge, consumed_at: new Date().toISOString() }],
                                error: null
                            })
                        }))
                    };
                }
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: userId,
                                name: 'OTP Verified User',
                                email: 'verified@handyland.de',
                                role: 'user',
                                is_active: true,
                                is_verified: true,
                                two_factor_secret: secret.base32,
                                two_factor_enabled: true
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
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/auth/2fa/verify-login')
                .send({ challengeId, otp: validOtp });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe('verified@handyland.de');

            // No tokens in JSON body
            expect(res.body.token).toBeUndefined();
            expect(res.body.accessToken).toBeUndefined();
            expect(res.body.session).toBeUndefined();

            // Cookies issued securely
            const cookies = res.headers['set-cookie'] || [];
            expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
            expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
        });

        it('Third wrong OTP revokes held Supabase session and marks challenge revoked', async () => {
            const challengeId = crypto.randomUUID();
            const userId = 'user-3rd-fail';
            const secret = speakeasy.generateSecret();

            const session = { access_token: 'revoke-held-jwt' };
            const encrypted = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });

            const mockChallenge = {
                id: challengeId,
                user_id: userId,
                encrypted_session_payload: encrypted.encrypted_session_payload,
                encryption_iv: encrypted.encryption_iv,
                encryption_tag: encrypted.encryption_tag,
                encryption_key_version: 1,
                failed_attempts: 2, // Already had 2 failures
                expires_at: new Date(Date.now() + 300000).toISOString(),
                consumed_at: null,
                revoked_at: null,
                processing_until: null
            };

            let updatedFields = null;

            supabaseAdmin.auth.admin.signOut = jest.fn().mockResolvedValue({});

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'auth_2fa_challenges') {
                    return {
                        update: jest.fn().mockImplementation((payload) => {
                            updatedFields = payload;
                            return {
                                eq: jest.fn().mockReturnThis(),
                                is: jest.fn().mockReturnThis(),
                                gt: jest.fn().mockReturnThis(),
                                lt: jest.fn().mockReturnThis(),
                                or: jest.fn().mockReturnThis(),
                                select: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null })
                            };
                        })
                    };
                }
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: userId,
                                email: 'maxfail@test.de',
                                two_factor_secret: secret.base32,
                                two_factor_enabled: true
                            },
                            error: null
                        })
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/auth/2fa/verify-login')
                .send({ challengeId, otp: '000000' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Maximum attempts exceeded/);
            expect(supabaseAdmin.auth.admin.signOut).toHaveBeenCalledWith('revoke-held-jwt');
            expect(updatedFields.failed_attempts).toBe(3);
            expect(updatedFields.revoked_at).toBeDefined();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Challenge Cancellation Endpoint
    // ─────────────────────────────────────────────────────────────
    describe('5. Challenge Cancellation', () => {
        it('Valid unresolved challenge revokes held session and returns generic success', async () => {
            const challengeId = crypto.randomUUID();
            const userId = 'cancel-user-1';
            const session = { access_token: 'cancel-jwt' };
            const encrypted = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });

            const mockChallenge = {
                id: challengeId,
                user_id: userId,
                encrypted_session_payload: encrypted.encrypted_session_payload,
                encryption_iv: encrypted.encryption_iv,
                encryption_tag: encrypted.encryption_tag,
                encryption_key_version: 1,
                consumed_at: null,
                revoked_at: null,
                processing_until: null
            };

            supabaseAdmin.auth.admin.signOut = jest.fn().mockResolvedValue({});

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'auth_2fa_challenges') {
                    return {
                        update: jest.fn().mockImplementation(() => ({
                            eq: jest.fn().mockReturnThis(),
                            is: jest.fn().mockReturnThis(),
                            or: jest.fn().mockReturnThis(),
                            select: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null })
                        }))
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/auth/2fa/cancel-login')
                .send({ challengeId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Challenge cancelled');
            expect(supabaseAdmin.auth.admin.signOut).toHaveBeenCalledWith('cancel-jwt');
        });

        it('Repeated cancellation is idempotent and does not leak challenge existence or state', async () => {
            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'auth_2fa_challenges') {
                    return {
                        update: jest.fn().mockImplementation(() => ({
                            eq: jest.fn().mockReturnThis(),
                            is: jest.fn().mockReturnThis(),
                            or: jest.fn().mockReturnThis(),
                            select: jest.fn().mockResolvedValue({ data: [], error: null }) // 0 rows claimed
                        }))
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const res = await request(app)
                .post('/api/auth/2fa/cancel-login')
                .send({ challengeId: crypto.randomUUID() });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Challenge cancelled');
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Cleanup Worker & Error Classification
    // ─────────────────────────────────────────────────────────────
    describe('6. Cleanup Worker & Error Classification', () => {
        it('Correctly classifies network timeout and 5xx errors into allowlisted codes', () => {
            expect(classifyRevocationError(new Error('ETIMEDOUT'))).toBe('REVOKE_NETWORK_TIMEOUT');
            expect(classifyRevocationError({ status: 503, message: 'Service Unavailable' })).toBe('REVOKE_UPSTREAM_5XX');
            expect(classifyRevocationError({ status: 401, message: 'Invalid JWT' })).toBe('REVOKE_AUTH_REJECTED');
            expect(classifyRevocationError(new Error('Unknown error'))).toBe('REVOKE_UNEXPECTED');
        });

        it('Cleanup worker processes expired and failed challenges idempotently', async () => {
            const challengeId = crypto.randomUUID();
            const userId = 'cleanup-user-1';
            const session = { access_token: 'cleanup-jwt' };
            const encrypted = encryptSessionPayload({ session, challengeId, userId, keyHex: TEST_KEY_HEX });

            const mockCandidate = {
                id: challengeId,
                user_id: userId,
                encrypted_session_payload: encrypted.encrypted_session_payload,
                encryption_iv: encrypted.encryption_iv,
                encryption_tag: encrypted.encryption_tag,
                encryption_key_version: 1,
                expires_at: new Date(Date.now() - 10000).toISOString(),
                consumed_at: null,
                revoked_at: null,
                processing_until: null
            };

            supabaseAdmin.auth.admin.signOut = jest.fn().mockResolvedValue({});

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'auth_2fa_challenges') {
                    return {
                        select: jest.fn().mockImplementation(() => ({
                            is: jest.fn().mockReturnThis(),
                            or: jest.fn().mockReturnThis(),
                            limit: jest.fn().mockResolvedValue({ data: [mockCandidate], error: null })
                        })),
                        update: jest.fn().mockImplementation(() => ({
                            eq: jest.fn().mockReturnThis(),
                            is: jest.fn().mockReturnThis(),
                            or: jest.fn().mockReturnThis(),
                            select: jest.fn().mockResolvedValue({ data: [mockCandidate], error: null })
                        }))
                    };
                }
                return { select: jest.fn().mockReturnThis() };
            });

            const stats = await cleanupExpiredAndFailedChallenges({ batchSize: 10 });
            expect(stats.processed).toBe(1);
            expect(stats.revoked).toBe(1);
            expect(supabaseAdmin.auth.admin.signOut).toHaveBeenCalledWith('cleanup-jwt');
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 7. Protect Middleware Isolation
    // ─────────────────────────────────────────────────────────────
    describe('7. Protect Middleware Isolation', () => {
        it('Passing challengeId as Bearer token cannot authenticate protected endpoints', async () => {
            const challengeId = crypto.randomUUID();

            supabaseAdmin.auth.getUser = jest.fn().mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid JWT' }
            });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${challengeId}`);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});

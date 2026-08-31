/**
 * backend/services/twoFactorChallengeService.js
 * Database-backed encrypted 2FA challenge store lifecycle service.
 * Handles atomic challenge creation, lock acquisition, TOTP verification,
 * session revocation, cancellation, and idempotent worker cleanup.
 */
'use strict';

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const { supabaseAdmin } = require('../config/supabase');
const {
    encryptSessionPayload,
    decryptSessionPayload
} = require('../utils/auth2faChallengeCrypto');
const logger = require('../utils/logger');

const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes
const PROCESSING_LOCK_MS = 10 * 1000; // 10 seconds
const MAX_FAILED_ATTEMPTS = 3;

/**
 * Checks if the 2FA challenge store feature is explicitly enabled.
 * @returns {boolean}
 */
const isChallengeStoreEnabled = () => {
    return process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED === 'true';
};

/**
 * Sanitizes and classifies upstream Supabase revocation errors into allowlisted codes.
 * @param {Error|Object} error - Caught error.
 * @returns {'REVOKE_NETWORK_TIMEOUT'|'REVOKE_UPSTREAM_5XX'|'REVOKE_AUTH_REJECTED'|'REVOKE_UNEXPECTED'}
 */
const classifyRevocationError = (error) => {
    if (!error) return 'REVOKE_UNEXPECTED';

    const msg = (error.message || '').toLowerCase();
    const code = (error.code || '').toLowerCase();
    const status = error.status || error.statusCode || 0;

    if (
        code === 'etimedout' ||
        code === 'econnreset' ||
        code === 'econnrefused' ||
        msg.includes('etimedout') ||
        msg.includes('timeout') ||
        msg.includes('network')
    ) {
        return 'REVOKE_NETWORK_TIMEOUT';
    }

    if (status >= 500 || msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
        return 'REVOKE_UPSTREAM_5XX';
    }

    if (
        status === 400 ||
        status === 401 ||
        status === 403 ||
        status === 404 ||
        msg.includes('invalid') ||
        msg.includes('expired') ||
        msg.includes('jwt') ||
        msg.includes('session not found') ||
        msg.includes('user not found')
    ) {
        return 'REVOKE_AUTH_REJECTED';
    }

    return 'REVOKE_UNEXPECTED';
};

/**
 * Revokes prior unresolved challenges for a user when initiating a new login.
 * @param {string} userId - User UUID.
 */
const revokePendingChallengesForUser = async (userId) => {
    try {
        const { data: pendingChallenges, error } = await supabaseAdmin
            .from('auth_2fa_challenges')
            .select('*')
            .eq('user_id', userId)
            .is('consumed_at', null)
            .is('revoked_at', null);

        if (error || !pendingChallenges || pendingChallenges.length === 0) {
            return;
        }

        for (const challenge of pendingChallenges) {
            try {
                const session = decryptSessionPayload({
                    encryptedPayload: challenge.encrypted_session_payload,
                    ivHex: challenge.encryption_iv,
                    tagHex: challenge.encryption_tag,
                    challengeId: challenge.id,
                    userId: challenge.user_id,
                    keyVersion: challenge.encryption_key_version
                });

                if (session?.access_token) {
                    await supabaseAdmin.auth.admin.signOut(session.access_token);
                }

                await supabaseAdmin
                    .from('auth_2fa_challenges')
                    .update({
                        revoked_at: new Date().toISOString(),
                        revocation_error_code: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', challenge.id)
                    .is('consumed_at', null)
                    .is('revoked_at', null);
            } catch (revokeErr) {
                const errorCode = classifyRevocationError(revokeErr);
                await supabaseAdmin
                    .from('auth_2fa_challenges')
                    .update({
                        revocation_error_code: errorCode,
                        revocation_retry_count: (challenge.revocation_retry_count || 0) + 1,
                        last_revocation_attempt_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', challenge.id)
                    .is('consumed_at', null)
                    .is('revoked_at', null);
            }
        }
    } catch (err) {
        logger.warn(`[Auth2FA] Opportunistic cleanup warning for user: ${err.message}`);
    }
};

/**
 * Creates an encrypted 2FA challenge for a verified password session.
 *
 * @param {Object} params
 * @param {string} params.userId - User UUID.
 * @param {Object} params.session - Supabase session object.
 * @param {string} [params.appType='frontend'] - Application caller type ('frontend' or 'admin').
 * @returns {Promise<{ challengeId: string, appType: string }>}
 */
const create2FAChallenge = async ({ userId, session, appType = 'frontend' }) => {
    // 1. Opportunistically revoke prior unresolved challenges for this user
    await revokePendingChallengesForUser(userId);

    // 2. Generate UUID challenge ID and encrypt session payload
    const challengeId = crypto.randomUUID();
    const encrypted = encryptSessionPayload({
        session,
        challengeId,
        userId,
        keyVersion: 1
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_LIFETIME_MS);

    // 3. Insert into public.auth_2fa_challenges
    const { error: insertError } = await supabaseAdmin
        .from('auth_2fa_challenges')
        .insert({
            id: challengeId,
            user_id: userId,
            encrypted_session_payload: encrypted.encrypted_session_payload,
            encryption_iv: encrypted.encryption_iv,
            encryption_tag: encrypted.encryption_tag,
            encryption_key_version: encrypted.encryption_key_version,
            expires_at: expiresAt.toISOString(),
            failed_attempts: 0,
            processing_until: null,
            processing_id: null,
            consumed_at: null,
            revoked_at: null,
            revocation_retry_count: 0,
            revocation_error_code: null,
            last_revocation_attempt_at: null,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        });

    if (insertError) {
        logger.error(`[Auth2FA] Failed to store 2FA challenge: ${insertError.message}`);
        throw new Error('[Auth2FA] Failed to initialize 2FA challenge.');
    }

    return {
        challengeId,
        appType
    };
};

/**
 * Verifies a TOTP code against an active challenge and consumes it atomically.
 *
 * @param {Object} params
 * @param {string} params.challengeId - Challenge UUID.
 * @param {string} params.otp - 6-digit OTP code.
 * @returns {Promise<{ success: boolean, status?: number, message?: string, session?: Object, user?: Object, attemptsRemaining?: number }>}
 */
const verifyLoginOtp = async ({ challengeId, otp }) => {
    // 1. Format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!challengeId || typeof challengeId !== 'string' || !uuidRegex.test(challengeId)) {
        return { success: false, status: 400, message: 'Invalid challenge ID format' };
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
        return { success: false, status: 400, message: 'OTP must be a 6-digit numeric code' };
    }

    const cleanOtp = otp.trim();
    const nowIso = new Date().toISOString();
    const processingId = crypto.randomUUID();
    const lockUntilIso = new Date(Date.now() + PROCESSING_LOCK_MS).toISOString();

    // 2. Atomic lock acquisition
    const { data: claimedRows, error: claimError } = await supabaseAdmin
        .from('auth_2fa_challenges')
        .update({
            processing_id: processingId,
            processing_until: lockUntilIso,
            updated_at: nowIso
        })
        .eq('id', challengeId)
        .is('consumed_at', null)
        .is('revoked_at', null)
        .gt('expires_at', nowIso)
        .lt('failed_attempts', MAX_FAILED_ATTEMPTS)
        .or(`processing_until.is.null,processing_until.lt.${nowIso}`)
        .select();

    if (claimError || !claimedRows || claimedRows.length === 0) {
        // Inspect current state to provide safe accurate status without leaking details
        const { data: existing } = await supabaseAdmin
            .from('auth_2fa_challenges')
            .select('expires_at, failed_attempts, consumed_at, revoked_at, processing_until')
            .eq('id', challengeId)
            .maybeSingle();

        if (existing) {
            if (existing.processing_until && new Date(existing.processing_until) > new Date()) {
                return { success: false, status: 409, message: 'Verification is currently in progress. Please try again shortly.' };
            }
            if (existing.consumed_at) {
                return { success: false, status: 400, message: 'Challenge has already been completed.' };
            }
            if (existing.revoked_at || existing.failed_attempts >= MAX_FAILED_ATTEMPTS) {
                return { success: false, status: 400, message: 'Challenge has been revoked due to too many failed attempts or cancellation.' };
            }
            if (new Date(existing.expires_at) <= new Date()) {
                return { success: false, status: 400, message: 'Challenge has expired. Please log in again.' };
            }
        }

        return { success: false, status: 400, message: 'Invalid or expired challenge.' };
    }

    const challenge = claimedRows[0];

    // 3. Decrypt session payload
    let session;
    try {
        session = decryptSessionPayload({
            encryptedPayload: challenge.encrypted_session_payload,
            ivHex: challenge.encryption_iv,
            tagHex: challenge.encryption_tag,
            challengeId: challenge.id,
            userId: challenge.user_id,
            keyVersion: challenge.encryption_key_version
        });
    } catch (decryptErr) {
        // Release processing lock on decryption failure
        await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({ processing_id: null, processing_until: null, updated_at: new Date().toISOString() })
            .eq('id', challengeId)
            .eq('processing_id', processingId);

        logger.error(`[Auth2FA] Decryption failure during OTP verify: ${decryptErr.message}`);
        return { success: false, status: 500, message: 'Internal authentication error.' };
    }

    // 4. Fetch user profile and secret from public.users
    const { data: userProfile, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', challenge.user_id)
        .single();

    if (userError || !userProfile || !userProfile.two_factor_secret || !userProfile.two_factor_enabled) {
        await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({ processing_id: null, processing_until: null, updated_at: new Date().toISOString() })
            .eq('id', challengeId)
            .eq('processing_id', processingId);

        return { success: false, status: 400, message: 'Two-factor authentication is not configured for this account.' };
    }

    // 5. Verify TOTP code with Speakeasy
    const verified = speakeasy.totp.verify({
        secret: userProfile.two_factor_secret,
        encoding: 'base32',
        token: cleanOtp,
        window: 2 // standard +/- 1 minute window
    });

    if (!verified) {
        const newFailedCount = (challenge.failed_attempts || 0) + 1;

        if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
            // Revoke Supabase session on 3rd failure
            let revokeSuccess = false;
            let revokeErrorCode = null;

            try {
                if (session?.access_token) {
                    await supabaseAdmin.auth.admin.signOut(session.access_token);
                    revokeSuccess = true;
                }
            } catch (err) {
                revokeErrorCode = classifyRevocationError(err);
            }

            await supabaseAdmin
                .from('auth_2fa_challenges')
                .update({
                    failed_attempts: newFailedCount,
                    processing_id: null,
                    processing_until: null,
                    revoked_at: revokeSuccess ? new Date().toISOString() : null,
                    revocation_error_code: revokeErrorCode,
                    revocation_retry_count: revokeSuccess ? 0 : 1,
                    last_revocation_attempt_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', challengeId)
                .eq('processing_id', processingId);

            return {
                success: false,
                status: 400,
                message: 'Invalid verification code. Maximum attempts exceeded, session revoked.'
            };
        }

        // Increment failure counter and release lock
        await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({
                failed_attempts: newFailedCount,
                processing_id: null,
                processing_until: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', challengeId)
            .eq('processing_id', processingId);

        return {
            success: false,
            status: 400,
            message: 'Invalid verification code.',
            attemptsRemaining: MAX_FAILED_ATTEMPTS - newFailedCount
        };
    }

    // 6. Valid OTP: Atomically mark consumed and clear lock
    const { data: consumedRows, error: consumeError } = await supabaseAdmin
        .from('auth_2fa_challenges')
        .update({
            consumed_at: new Date().toISOString(),
            processing_id: null,
            processing_until: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', challengeId)
        .eq('processing_id', processingId)
        .is('consumed_at', null)
        .is('revoked_at', null)
        .select();

    if (consumeError || !consumedRows || consumedRows.length === 0) {
        return { success: false, status: 400, message: 'Challenge could not be consumed.' };
    }

    return {
        success: true,
        session,
        user: userProfile
    };
};

/**
 * Cancels a pending challenge and revokes the associated Supabase session.
 *
 * @param {Object} params
 * @param {string} params.challengeId - Challenge UUID.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const cancelLoginChallenge = async ({ challengeId }) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!challengeId || typeof challengeId !== 'string' || !uuidRegex.test(challengeId)) {
        return { success: false, message: 'Invalid challenge ID format' };
    }

    const processingId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const lockUntilIso = new Date(Date.now() + PROCESSING_LOCK_MS).toISOString();

    const { data: claimedRows } = await supabaseAdmin
        .from('auth_2fa_challenges')
        .update({
            processing_id: processingId,
            processing_until: lockUntilIso,
            updated_at: nowIso
        })
        .eq('id', challengeId)
        .is('consumed_at', null)
        .is('revoked_at', null)
        .or(`processing_until.is.null,processing_until.lt.${nowIso}`)
        .select();

    if (!claimedRows || claimedRows.length === 0) {
        // Return idempotent success without revealing internal state
        return { success: true, message: 'Challenge cancelled' };
    }

    const challenge = claimedRows[0];
    let session;
    try {
        session = decryptSessionPayload({
            encryptedPayload: challenge.encrypted_session_payload,
            ivHex: challenge.encryption_iv,
            tagHex: challenge.encryption_tag,
            challengeId: challenge.id,
            userId: challenge.user_id,
            keyVersion: challenge.encryption_key_version
        });
    } catch (_) {
        await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({
                processing_id: null,
                processing_until: null,
                revoked_at: new Date().toISOString(),
                revocation_error_code: 'REVOKE_UNEXPECTED',
                updated_at: new Date().toISOString()
            })
            .eq('id', challengeId)
            .eq('processing_id', processingId);

        return { success: true, message: 'Challenge cancelled' };
    }

    let revokeSuccess = false;
    let revokeErrorCode = null;
    try {
        if (session?.access_token) {
            await supabaseAdmin.auth.admin.signOut(session.access_token);
            revokeSuccess = true;
        } else {
            revokeSuccess = true;
        }
    } catch (err) {
        revokeErrorCode = classifyRevocationError(err);
    }

    if (revokeSuccess) {
        await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({
                processing_id: null,
                processing_until: null,
                revoked_at: new Date().toISOString(),
                revocation_error_code: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', challengeId)
            .eq('processing_id', processingId);
    } else {
        await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({
                processing_id: null,
                processing_until: null,
                revoked_at: null,
                revocation_error_code: revokeErrorCode,
                revocation_retry_count: (challenge.revocation_retry_count || 0) + 1,
                last_revocation_attempt_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', challengeId)
            .eq('processing_id', processingId);
    }

    return { success: true, message: 'Challenge cancelled' };
};

/**
 * Idempotent batch cleanup worker for expired, max-failed, and retry-pending challenges.
 *
 * @param {Object} [options]
 * @param {number} [options.batchSize=25] - Batch size limit.
 * @returns {Promise<{ processed: number, revoked: number, failedRetries: number }>}
 */
const cleanupExpiredAndFailedChallenges = async ({ batchSize = 25 } = {}) => {
    const nowIso = new Date().toISOString();

    const { data: candidates, error } = await supabaseAdmin
        .from('auth_2fa_challenges')
        .select('*')
        .is('consumed_at', null)
        .is('revoked_at', null)
        .or(`expires_at.lte.${nowIso},failed_attempts.gte.${MAX_FAILED_ATTEMPTS},revocation_retry_count.gt.0`)
        .or(`processing_until.is.null,processing_until.lt.${nowIso}`)
        .limit(batchSize);

    if (error || !candidates || candidates.length === 0) {
        return { processed: 0, revoked: 0, failedRetries: 0 };
    }

    let revokedCount = 0;
    let failedRetryCount = 0;

    for (const challenge of candidates) {
        const processingId = crypto.randomUUID();
        const lockUntilIso = new Date(Date.now() + PROCESSING_LOCK_MS).toISOString();

        // Atomically claim candidate row
        const { data: claimed } = await supabaseAdmin
            .from('auth_2fa_challenges')
            .update({
                processing_id: processingId,
                processing_until: lockUntilIso,
                updated_at: new Date().toISOString()
            })
            .eq('id', challenge.id)
            .is('consumed_at', null)
            .is('revoked_at', null)
            .or(`processing_until.is.null,processing_until.lt.${nowIso}`)
            .select();

        if (!claimed || claimed.length === 0) {
            continue;
        }

        let session;
        try {
            session = decryptSessionPayload({
                encryptedPayload: challenge.encrypted_session_payload,
                ivHex: challenge.encryption_iv,
                tagHex: challenge.encryption_tag,
                challengeId: challenge.id,
                userId: challenge.user_id,
                keyVersion: challenge.encryption_key_version
            });
        } catch (_) {
            await supabaseAdmin
                .from('auth_2fa_challenges')
                .update({
                    processing_id: null,
                    processing_until: null,
                    revoked_at: new Date().toISOString(),
                    revocation_error_code: 'REVOKE_UNEXPECTED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', challenge.id)
                .eq('processing_id', processingId);

            revokedCount++;
            continue;
        }

        let revokeSuccess = false;
        let revokeErrorCode = null;
        try {
            if (session?.access_token) {
                await supabaseAdmin.auth.admin.signOut(session.access_token);
                revokeSuccess = true;
            } else {
                revokeSuccess = true;
            }
        } catch (err) {
            revokeErrorCode = classifyRevocationError(err);
        }

        if (revokeSuccess) {
            await supabaseAdmin
                .from('auth_2fa_challenges')
                .update({
                    processing_id: null,
                    processing_until: null,
                    revoked_at: new Date().toISOString(),
                    revocation_error_code: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', challenge.id)
                .eq('processing_id', processingId);

            revokedCount++;
        } else {
            await supabaseAdmin
                .from('auth_2fa_challenges')
                .update({
                    processing_id: null,
                    processing_until: null,
                    revoked_at: null,
                    revocation_error_code: revokeErrorCode,
                    revocation_retry_count: (challenge.revocation_retry_count || 0) + 1,
                    last_revocation_attempt_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', challenge.id)
                .eq('processing_id', processingId);

            failedRetryCount++;
        }
    }

    return { processed: candidates.length, revoked: revokedCount, failedRetries: failedRetryCount };
};

module.exports = {
    isChallengeStoreEnabled,
    classifyRevocationError,
    create2FAChallenge,
    verifyLoginOtp,
    cancelLoginChallenge,
    cleanupExpiredAndFailedChallenges,
    revokePendingChallengesForUser,
    MAX_FAILED_ATTEMPTS,
    CHALLENGE_LIFETIME_MS,
    PROCESSING_LOCK_MS
};

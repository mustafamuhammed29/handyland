/**
 * backend/utils/auth2faChallengeCrypto.js
 * AES-256-GCM authenticated session encryption for 2FA challenge store.
 * Strictly uses Node.js built-in crypto module.
 */
'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended for AES-GCM
const KEY_LENGTH_BYTES = 32; // 256-bit key
const KEY_HEX_LENGTH = 64;

/**
 * Validates and derives the 32-byte encryption key from environment or explicit parameter.
 * @param {string} [overrideKeyHex] - Optional key for testing.
 * @returns {Buffer} 32-byte encryption key buffer.
 */
const getValidatedEncryptionKey = (overrideKeyHex) => {
    const rawKey = overrideKeyHex !== undefined ? overrideKeyHex : process.env.AUTH_2FA_SESSION_ENCRYPTION_KEY;

    if (!rawKey || typeof rawKey !== 'string' || rawKey.trim() === '') {
        throw new Error('[Security] AUTH_2FA_SESSION_ENCRYPTION_KEY environment variable is required.');
    }

    const trimmed = rawKey.trim();

    if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        throw new Error('[Security] AUTH_2FA_SESSION_ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).');
    }

    const keyBuf = Buffer.from(trimmed, 'hex');
    if (keyBuf.length !== KEY_LENGTH_BYTES) {
        throw new Error(`[Security] Invalid key byte length: expected ${KEY_LENGTH_BYTES}, got ${keyBuf.length}.`);
    }

    return keyBuf;
};

/**
 * Deterministically constructs Authenticated Additional Data (AAD)
 * to cryptographically bind the ciphertext to the challenge ID, user ID, and key version.
 *
 * @param {string} challengeId - Challenge UUID.
 * @param {string} userId - User UUID.
 * @param {number} keyVersion - Integer key version.
 * @returns {Buffer} AAD buffer.
 */
const buildAAD = (challengeId, userId, keyVersion = 1) => {
    if (!challengeId || !userId) {
        throw new Error('[Security] Both challengeId and userId are required to construct AAD.');
    }
    const aadString = `challenge:${String(challengeId)}|user:${String(userId)}|v:${Number(keyVersion)}`;
    return Buffer.from(aadString, 'utf8');
};

/**
 * Encrypts a Supabase session object using AES-256-GCM with AAD.
 *
 * @param {Object} params
 * @param {Object} params.session - The session object to encrypt (e.g. { access_token, refresh_token }).
 * @param {string} params.challengeId - Challenge UUID.
 * @param {string} params.userId - User UUID.
 * @param {number} [params.keyVersion=1] - Encryption key version.
 * @param {string} [params.keyHex] - Optional key override for isolated unit tests.
 * @returns {{ encrypted_session_payload: string, encryption_iv: string, encryption_tag: string, encryption_key_version: number }}
 */
const encryptSessionPayload = ({ session, challengeId, userId, keyVersion = 1, keyHex }) => {
    if (!session || typeof session !== 'object') {
        throw new Error('[Security] Session object is required for encryption.');
    }

    const key = getValidatedEncryptionKey(keyHex);
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);
    const aad = buildAAD(challengeId, userId, keyVersion);

    const plaintext = JSON.stringify(session);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(aad);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        encrypted_session_payload: encrypted,
        encryption_iv: iv.toString('hex'),
        encryption_tag: authTag.toString('hex'),
        encryption_key_version: keyVersion
    };
};

/**
 * Decrypts and authenticates a stored session payload using AES-256-GCM with AAD.
 *
 * @param {Object} params
 * @param {string} params.encryptedPayload - Ciphertext in hex.
 * @param {string} params.ivHex - 12-byte IV in hex.
 * @param {string} params.tagHex - 16-byte Auth Tag in hex.
 * @param {string} params.challengeId - Challenge UUID.
 * @param {string} params.userId - User UUID.
 * @param {number} [params.keyVersion=1] - Encryption key version.
 * @param {string} [params.keyHex] - Optional key override for isolated unit tests.
 * @returns {Object} Parsed session object.
 */
const decryptSessionPayload = ({
    encryptedPayload,
    ivHex,
    tagHex,
    challengeId,
    userId,
    keyVersion = 1,
    keyHex
}) => {
    if (!encryptedPayload || !ivHex || !tagHex || !challengeId || !userId) {
        throw new Error('[Security] Missing parameters required for session decryption.');
    }

    const key = getValidatedEncryptionKey(keyHex);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const aad = buildAAD(challengeId, userId, keyVersion);

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAAD(aad);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (_) {
        // Fail closed with a safe generic error without leaking cryptographic internal details
        throw new Error('[Security] Session payload decryption/authentication failed.');
    }
};

/**
 * Validates encryption configuration at server startup.
 * @param {boolean} isFeatureEnabled - Whether the 2FA challenge store is enabled.
 */
const validate2FAEncryptionConfig = (isFeatureEnabled) => {
    const isProd = process.env.NODE_ENV === 'production';
    if (isFeatureEnabled || isProd) {
        if (isFeatureEnabled) {
            getValidatedEncryptionKey();
        }
    }
};

module.exports = {
    getValidatedEncryptionKey,
    buildAAD,
    encryptSessionPayload,
    decryptSessionPayload,
    validate2FAEncryptionConfig,
    KEY_LENGTH_BYTES,
    KEY_HEX_LENGTH
};

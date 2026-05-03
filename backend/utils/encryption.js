/**
 * utils/encryption.js
 * AES-256-CBC encryption for sensitive settings (e.g. SMTP passwords).
 * Uses JWT_SECRET as the encryption key source.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Derive a 32-byte key from JWT_SECRET
 */
const getKey = () => {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-dev-only';
    return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt a plaintext string
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted string (iv:encrypted in hex)
 */
const encrypt = (text) => {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted string (iv:encrypted in hex)
 * @returns {string} Decrypted plaintext
 */
const decrypt = (encryptedText) => {
    if (!encryptedText || !encryptedText.includes(':')) return '';
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = { encrypt, decrypt };

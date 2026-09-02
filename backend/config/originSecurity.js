/**
 * backend/config/originSecurity.js
 * Single source of truth for allowed origins and cookie security policies.
 * Eliminates circular dependencies between security middleware, controllers, and socket handlers.
 */
'use strict';

const defaultDevelopmentOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];

/**
 * Validates and retrieves the exact allowed origins list.
 * In production:
 *   - ALLOWED_ORIGINS environment variable is mandatory and non-empty.
 *   - Must be a comma-separated list of exact HTTPS origins (e.g. "https://example.com,https://admin.example.com").
 *   - Fails closed (throws Error) if missing, empty, contains wildcards ('*'), contains non-HTTPS schemes (e.g. 'http://'),
 *     contains localhost, or has invalid URL structures (e.g. paths or trailing slashes).
 * In development:
 *   - If ALLOWED_ORIGINS is provided, parses and merges with default development origins.
 *   - If omitted, defaults to default development origins.
 */
const validateAndGetAllowedOrigins = () => {
    const isProd = process.env.NODE_ENV === 'production';
    const envRaw = process.env.ALLOWED_ORIGINS;

    if (isProd) {
        if (!envRaw || typeof envRaw !== 'string' || envRaw.trim() === '') {
            // Fallback to environment-based detection
            const renderUrl = process.env.RENDER_EXTERNAL_URL;
            const vercelUrl = process.env.VERCEL_URL;
            const fallbacks = [];
            if (renderUrl) fallbacks.push(renderUrl);
            if (vercelUrl) fallbacks.push(`https://${vercelUrl}`);
            
            if (fallbacks.length === 0) {
                throw new Error('[Security] ALLOWED_ORIGINS environment variable is required and cannot be empty in production.');
            }
            return fallbacks;
        }

        const origins = envRaw.split(',').map(o => o.trim()).filter(Boolean);
        if (origins.length === 0) {
            throw new Error('[Security] ALLOWED_ORIGINS contains no valid origins in production.');
        }

        for (const origin of origins) {
            if (origin.includes('*')) {
                throw new Error(`[Security] ALLOWED_ORIGINS cannot contain wildcards in production: "${origin}"`);
            }
            if (!origin.startsWith('https://')) {
                throw new Error(`[Security] ALLOWED_ORIGINS must only contain HTTPS origins in production: "${origin}"`);
            }

            let parsed;
            try {
                parsed = new URL(origin);
            } catch (err) {
                throw new Error(`[Security] ALLOWED_ORIGINS contains invalid URL in production: "${origin}"`);
            }

            if (parsed.origin !== origin) {
                throw new Error(`[Security] ALLOWED_ORIGINS entries must be exact origins without paths or trailing slashes: "${origin}"`);
            }

            if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
                throw new Error(`[Security] ALLOWED_ORIGINS cannot contain localhost in production: "${origin}"`);
            }
        }

        return Array.from(new Set(origins));
    }

    // Outside production
    const envOrigins = envRaw
        ? envRaw.split(',').map(o => o.trim()).filter(Boolean)
        : [];

    return Array.from(new Set([...defaultDevelopmentOrigins, ...envOrigins]));
};

/**
 * Checks if a given request origin is permitted.
 */
const isOriginAllowed = (origin) => {
    if (!origin) {
        return false;
    }

    let allowed;
    try {
        allowed = validateAndGetAllowedOrigins();
    } catch (err) {
        console.error('[Security] Origin validation error:', err.message);
        return false;
    }

    if (allowed.includes(origin)) {
        return true;
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        return true;
    }
    // Allow .vercel.app and .onrender.com only in dev (not test)
    if (process.env.NODE_ENV === 'development' && (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com'))) {
        return true;
    }

    return false;
};

/**
 * Validates and retrieves the cookie SameSite policy from AUTH_COOKIE_SAMESITE.
 * Accepted values: 'strict', 'lax', 'none'.
 * In production:
 *   - AUTH_COOKIE_SAMESITE is mandatory and cannot be missing, empty, or whitespace-only.
 *   - MUST be exactly one of 'strict', 'lax', 'none' (throws Error if invalid or missing).
 *   - Does NOT silently default to any value.
 * In non-production:
 *   - If specified, MUST be one of 'strict', 'lax', 'none' (warns and falls back to 'lax' if invalid).
 *   - If omitted, defaults to 'lax'.
 */
const getValidatedSameSitePolicy = () => {
    const isProd = process.env.NODE_ENV === 'production';
    const rawVal = process.env.AUTH_COOKIE_SAMESITE;

    if (isProd) {
        if (!rawVal || typeof rawVal !== 'string' || rawVal.trim() === '' || rawVal === 'undefined') {
            throw new Error('[Security] AUTH_COOKIE_SAMESITE environment variable is required in production (accepted values: strict, lax, none).');
        }

        const normalized = rawVal.trim().toLowerCase();
        if (!['strict', 'lax', 'none'].includes(normalized)) {
            throw new Error(`[Security] AUTH_COOKIE_SAMESITE must be 'strict', 'lax', or 'none' in production. Received: "${rawVal}"`);
        }

        return normalized;
    }

    // Non-production environment
    if (rawVal !== undefined && rawVal !== null && rawVal !== '' && rawVal !== 'undefined') {
        const normalized = String(rawVal).trim().toLowerCase();
        if (!['strict', 'lax', 'none'].includes(normalized)) {
            console.warn(`[Security] Invalid AUTH_COOKIE_SAMESITE in non-production: "${rawVal}". Falling back to 'lax'.`);
            return 'lax';
        }
        return normalized;
    }

    return 'lax';
};

module.exports = {
    validateAndGetAllowedOrigins,
    isOriginAllowed,
    getValidatedSameSitePolicy,
    defaultDevelopmentOrigins,
};

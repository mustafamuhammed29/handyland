const crypto = require('crypto');
const { isOriginAllowed, getValidatedSameSitePolicy } = require('../config/originSecurity');

/**
 * Strict Origin-Based Anti-CSRF Protection Middleware
 *
 * Security Model:
 * 1. Safe Read-Only Methods (GET, HEAD, OPTIONS): Bypass mutation checks and issue companion XSRF-TOKEN cookie.
 * 2. Dedicated Webhooks (/api/payment/webhook): Bypassed (cryptographically verified by Stripe signature).
 * 3. State-Changing Methods (POST, PUT, DELETE, PATCH):
 *    a. If browser authentication cookies (accessToken, adminToken, refreshToken, adminRefreshToken) are present:
 *       - The Origin header MUST be present and MUST strictly match the exact allowed origins allowlist.
 *       - Client-selected headers (x-app-type, x-requested-with) CANNOT bypass this verification.
 *       - If both cookies and Authorization: Bearer are present, it is treated as cookie-authenticated and requires a valid Origin.
 *    b. If NO authentication cookies are present:
 *       - If an Origin header is provided, it MUST match the allowed origins allowlist.
 *       - If Origin is absent, requests are allowed ONLY for non-browser Bearer callers (CLI, scripts, test runners)
 *         or unauthenticated non-browser requests without cookies.
 */

const csrfProtection = (req, res, next) => {
    // 1. Dedicated webhooks bypass (e.g. Stripe webhook with signature verification)
    if (req.originalUrl && req.originalUrl.includes('/api/payment/webhook')) {
        return next();
    }

    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = getValidatedSameSitePolicy();

    // 2. Safe read-only methods: issue companion cookie
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
            const token = crypto.randomBytes(32).toString('hex');
            res.cookie('XSRF-TOKEN', token, {
                httpOnly: false,
                secure: isProd || sameSite === 'none',
                sameSite: sameSite,
                path: '/'
            });
        }
        return next();
    }

    // 3. State-changing requests: Evaluate Origin and Cookie presence
    const hasAuthCookies = !!(
        req.cookies?.accessToken ||
        req.cookies?.adminToken ||
        req.cookies?.refreshToken ||
        req.cookies?.adminRefreshToken
    );

    const origin = req.headers['origin'];
    const authHeader = req.headers['authorization'];
    const hasBearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');

    // Rule A: Cookie-authenticated requests MUST have a valid matching Origin
    if (hasAuthCookies) {
        if (!origin || !isOriginAllowed(origin)) {
            return res.status(403).json({
                success: false,
                code: 'CSRF_VALIDATION_FAILED',
                message: 'Cross-Site Request Forgery protection: Invalid or missing Origin header for cookie-authenticated request.'
            });
        }
        return next();
    }

    // Rule B: Requests without cookies
    if (origin) {
        if (!isOriginAllowed(origin)) {
            return res.status(403).json({
                success: false,
                code: 'CSRF_VALIDATION_FAILED',
                message: 'Cross-Site Request Forgery protection: Origin not allowed.'
            });
        }
        return next();
    }

    // Rule C: No cookies and no Origin — allow non-browser Bearer callers or unauthenticated CLI requests
    if (hasBearer || !hasAuthCookies) {
        return next();
    }

    return res.status(403).json({
        success: false,
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Cross-Site Request Forgery protection: Request rejected.'
    });
};

module.exports = csrfProtection;


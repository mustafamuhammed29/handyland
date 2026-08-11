const crypto = require('crypto');

/**
 * Multi-Layered CSRF Protection Middleware
 * Compatible with cross-origin deployments (Vercel Frontend <-> Render Backend).
 *
 * 1. Safe Methods (GET/HEAD/OPTIONS): Issues an XSRF-TOKEN companion cookie.
 * 2. State-Changing Methods (POST/PUT/DELETE/PATCH):
 *    - Bypasses public webhooks with dedicated crypto signatures (e.g. Stripe webhook).
 *    - Validates presence of trusted custom headers ('x-app-type', 'x-requested-with', 'x-xsrf-token')
 *      OR matching XSRF double-submit token OR Bearer Authorization header.
 *    - Blocks simple cross-site form submissions (traditional CSRF attack vector).
 */
const csrfProtection = (req, res, next) => {
    // 1. Always bypass webhooks & public translation missing endpoint
    if (req.originalUrl && (req.originalUrl.includes('/api/payment/webhook') || req.originalUrl.includes('/api/translations/missing'))) {
        return next();
    }

    // 2. Safe read-only methods: issue companion cookie
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
            const token = crypto.randomBytes(32).toString('hex');
            res.cookie('XSRF-TOKEN', token, {
                httpOnly: false, // Accessible by legitimate client JS
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            });
        }
        return next();
    }

    // 3. State-changing requests: Verify custom anti-CSRF headers
    const appTypeHeader = req.headers['x-app-type'];
    const requestedWith = req.headers['x-requested-with'];
    const authHeader = req.headers['authorization'];
    const headerToken = req.headers['x-xsrf-token'];
    const cookieToken = req.cookies ? req.cookies['XSRF-TOKEN'] : null;

    // A valid custom header or double submit token protects against cross-origin ambient credential abuse
    const hasTrustedCustomHeader = 
        (appTypeHeader && (appTypeHeader === 'frontend' || appTypeHeader === 'admin')) ||
        (requestedWith && requestedWith.toLowerCase() === 'xmlhttprequest') ||
        (authHeader && authHeader.startsWith('Bearer ')) ||
        (cookieToken && headerToken && cookieToken === headerToken);

    if (!hasTrustedCustomHeader) {
        return res.status(403).json({
            success: false,
            code: 'CSRF_VALIDATION_FAILED',
            message: 'Cross-Site Request Forgery protection: Missing trusted custom header or anti-CSRF token.'
        });
    }

    next();
};

module.exports = csrfProtection;


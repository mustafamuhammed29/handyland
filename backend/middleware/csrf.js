const crypto = require('crypto');

/**
 * CSRF Protection Middleware (Double Submit Cookie Pattern)
 * 1. Generates a CSRF token for each session.
 * 2. Sends it in a cookie (readable by JS).
 * 3. Client sends it back in a custom header.
 */
const csrfProtection = (req, res, next) => {
    // Exclude GET, HEAD, OPTIONS from CSRF check
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Generate token if not exists (simplified for this context)
        if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
            const token = crypto.randomBytes(32).toString('hex');
            res.cookie('XSRF-TOKEN', token, {
                httpOnly: false, // JS needs to read this
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/'
            });
        }
        return next();
    }

    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-xsrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or missing CSRF token'
        });
    }

    next();
};

module.exports = csrfProtection;

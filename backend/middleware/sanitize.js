/**
 * Input sanitization middleware
 * Protects against NoSQL injection and XSS attacks
 */

const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        // Remove MongoDB operators ($ prefix)
        value = value.replace(/\$/g, '');
        // Basic XSS prevention - strip script tags and event handlers
        value = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript\s*:/gi, '');
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        // Recursively sanitize objects
        for (const key in value) {
            // Block keys starting with $ (NoSQL injection)
            if (key.startsWith('$')) {
                delete value[key];
            } else {
                value[key] = sanitizeValue(value[key]);
            }
        }
    }
    return value;
};

const sanitize = (req, res, next) => {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.query) req.query = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
    next();
};

module.exports = sanitize;

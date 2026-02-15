/**
 * Custom MongoDB Sanitization Middleware
 * Recursively removes keys starting with '$' from req.body, req.query, and req.params
 * Modifies objects in-place to avoid "Cannot set property" errors in Express 5
 */
const sanitize = (obj) => {
    if (obj instanceof Object && !(obj instanceof Date)) {
        for (const key in obj) {
            if (key.startsWith('$')) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
};

module.exports = (req, res, next) => {
    try {
        if (req.body) sanitize(req.body);
        if (req.query) sanitize(req.query);
        if (req.params) sanitize(req.params);
    } catch (err) {
        console.error('Sanitization Error:', err);
    }
    next();
};

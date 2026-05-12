// Error handler middleware
const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Supabase / PostgreSQL unique violation
    if (err.code === '23505') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_KEY',
                message: 'A record with this value already exists',
                details: err.detail
            }
        });
    }

    // PostgreSQL invalid input
    if (err.code === '22P02') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_INPUT',
                message: 'Invalid input syntax'
            }
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid token'
            }
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Token expired'
            }
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Server Error';

    // Log to file
    const errLog = `[${new Date().toISOString()}] GLOBAL ERROR ${statusCode} on ${req.method} ${req.originalUrl}: ${err.stack || message}\n`;
    require('fs').appendFileSync('backend_errors.log', errLog);

    res.status(statusCode).json({
        success: false,
        error: {
            code: 'SERVER_ERROR',
            message: message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

// Not found handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: messages
            }
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_KEY',
                message: `${field} already exists`
            }
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            error: {
                code: 'RESOURCE_NOT_FOUND',
                message: 'Resource not found'
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
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            code: 'SERVER_ERROR',
            message: err.message || 'Server Error',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

// Not found handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };

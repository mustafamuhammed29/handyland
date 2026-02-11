const logger = require('../utils/logger');

const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL'
];

const validateEnv = () => {
    const missing = [];
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar] || process.env[envVar] === '...' || process.env[envVar].includes('your_')) {
            missing.push(envVar);
        }
    });

    if (missing.length > 0) {
        logger.error(`❌ Missing or placeholder environment variables: ${missing.join(', ')}`);

        if (process.env.NODE_ENV === 'production') {
            logger.error('FATAL: Missing environment variables in production. Exiting...');
            process.exit(1);
        } else {
            logger.warn('WARNING: Running with missing environment variables in development.');
        }
    } else {
        logger.info('✅ Environment variables validated successfully.');
    }
};

module.exports = validateEnv;

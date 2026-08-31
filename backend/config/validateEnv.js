const logger = require('../utils/logger');

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'SENDGRID_API_KEY'
];

const validateEnv = () => {
    const missing = [];
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar] || process.env[envVar] === '...' || process.env[envVar].includes('your_')) {
            missing.push(envVar);
        }
    });

    // Enforce 2FA Challenge Store Encryption Key when the feature is enabled
    if (process.env.AUTH_2FA_CHALLENGE_STORE_ENABLED === 'true') {
        const key = process.env.AUTH_2FA_SESSION_ENCRYPTION_KEY;
        if (!key || typeof key !== 'string' || !/^[0-9a-fA-F]{64}$/.test(key.trim())) {
            missing.push('AUTH_2FA_SESSION_ENCRYPTION_KEY (must be 64 hex characters)');
        }
    }

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

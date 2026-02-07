const validateEnv = () => {
    const requiredEnv = [
        'MONGO_URI',
        'JWT_SECRET',
        // 'STRIPE_SECRET_KEY', // Check later when we add Stripe
        // 'STRIPE_PUBLISHABLE_KEY'
    ];

    const missingEnv = requiredEnv.filter(env => !process.env[env]);

    if (missingEnv.length > 0) {
        console.error('❌ FATAL ERROR: Missing required environment variables:');
        missingEnv.forEach(env => console.error(`   - ${env}`));
        process.exit(1);
    }

    // specific checks
    if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
        console.error('❌ FATAL ERROR: MONGO_URI must start with "mongodb"');
        process.exit(1);
    }
};

module.exports = validateEnv;

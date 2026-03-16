/**
 * config/database.js
 * Handles MongoDB connection and initial seeding.
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland', {});
        logger.info('✅ MongoDB Connected');

        // Seed email templates on fresh connection
        try {
            const EmailTemplate = require('../models/EmailTemplate');
            await EmailTemplate.seedDefaults();
        } catch (seedErr) {
            logger.warn(`⚠️  Could not seed email templates: ${seedErr.message}`);
        }
    } catch (err) {
        logger.error(`❌ MongoDB Connection Error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };

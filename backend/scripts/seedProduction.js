const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Since this is a script, we load env vars directly if not provided via CLI
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.production' });

const User = require('../models/User');
const EmailTemplate = require('../models/EmailTemplate');
const Settings = require('../models/Settings');

async function seedProduction() {
    console.log('🌱 Starting Production Database Seeding...');

    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI is not defined. Please set it in your environment variables.');
        process.exit(1);
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // 1. Seed Initial Admin User
        console.log(`Checking for admin user: ${process.env.ADMIN_EMAIL}...`);
        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

        if (!existingAdmin) {
            const adminUser = new User({
                name: 'System Admin',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin',
                isVerified: true,
                isActive: true
            });
            await adminUser.save();
            console.log('✅ Initial Admin User created successfully.');
        } else {
            console.log('⏩ Admin User already exists. Skipping creation.');
        }

        // 2. Seed Default Email Templates
        console.log('Seeding Email Templates...');
        await EmailTemplate.seedDefaults();
        console.log('✅ Email Templates seeded / verified.');

        // 3. Seed Default Settings
        console.log('Checking global settings...');
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({
                siteName: 'HandyLand',
                contactEmail: 'support@handyland.com',
                currency: 'EUR',
                taxRate: 19,
                socialAuth: { google: false, facebook: false }
            });
            await settings.save();
            console.log('✅ Default settings created.');
        } else {
            console.log('⏩ Global settings already exist. Skipping.');
        }

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Database Error:', error);
        process.exit(1);
    }
}

seedProduction();

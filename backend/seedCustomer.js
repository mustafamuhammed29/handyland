const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
        console.log('✅ MongoDB Connected');

        const testEmail = 'customer@handyland.com';
        const testPass = 'customer123';

        // Check if test user already exists
        const existing = await User.findOne({ email: testEmail });

        if (existing) {
            console.log('ℹ️ Test customer already exists');
            console.log('Email: customer@handyland.com');
            console.log('Password: customer123');
            process.exit(0);
        }

        // Create test customer
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPass, salt);

        await User.create({
            name: 'Test Customer',
            email: testEmail,
            password: hashedPassword,
            phone: '+49123456789',
            address: 'Berlin, Germany',
            role: 'user',
            isVerified: true,
            balance: 500
        });

        console.log('✅ Test customer created!');
        console.log('==========================================');
        console.log('📧 Email: customer@handyland.com');
        console.log('🔑 Password: customer123');
        console.log('==========================================');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createTestUser();

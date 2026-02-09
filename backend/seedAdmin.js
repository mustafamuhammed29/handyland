const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminEmail = 'admin@handyland.com';
        const adminPass = 'admin123';

        // Manual hashing since hooks are disabled for debug
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);

        // Check if admin exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user exists. Deleting...');
            await User.deleteOne({ email: adminEmail });
        }

        console.log('Creating admin user...');
        admin = await User.create({
            name: 'System Admin',
            email: adminEmail,
            password: hashedPassword, // Use hashed password
            role: 'admin',
            isVerified: true,
            address: {
                street: 'HQ Street',
                city: 'Tech City',
                zipCode: '10000',
                country: 'Germany'
            },
            phone: '0000000000',
            refreshToken: '' // explicit empty
        });
        console.log('Admin user created successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();

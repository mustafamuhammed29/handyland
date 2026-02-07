const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const createAdminUser = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@handyland.com' });

        if (adminExists) {
            console.log('Admin user already exists!');
            console.log('Email:', adminExists.email);
            console.log('Role:', adminExists.role);
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@handyland.com',
            password: 'admin123',
            role: 'admin',
            isVerified: true,
            phone: '+49 123 456 7890',
            address: {
                street: 'Hauptstraße 1',
                city: 'Berlin',
                zipCode: '10115',
                country: 'Germany'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email:', admin.email);
        console.log('Password: admin123');
        console.log('Role:', admin.role);
        console.log('\nYou can now login with these credentials.');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();

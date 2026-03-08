const mongoose = require('mongoose');
const User = require('./models/User');

async function testUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/handyland', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const email = 'user123@example.com';
        const password = 'Password@123';

        // Delete if exists
        await User.deleteOne({ email });

        // Create new
        const user = await User.create({
            name: 'Test User',
            email,
            password,
            isVerified: true,
            role: 'user'
        });

        console.log('Created user:', user.email);

        // Find and test password Match
        const found = await User.findOne({ email }).select('+password');
        const isMatch = await found.matchPassword(password);
        console.log('Password match test:', isMatch);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testUser();

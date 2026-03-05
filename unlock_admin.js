const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function unlockAdmin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/handyland');
        const user = await User.findOne({ email: 'test_e2e@handyland.com' }).select('+loginAttempts +lockUntil');
        if (user) {
            user.role = 'admin';
            user.isActive = true;
            user.isVerified = true;
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            await user.save();
            console.log('Admin user unlocked and promoted!');
        } else {
            console.log('User not found!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

unlockAdmin();

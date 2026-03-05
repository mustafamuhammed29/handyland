const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function makeAdmin() {
    await mongoose.connect('mongodb://127.0.0.1:27017/handyland');
    const user = await User.findOne({ email: 'test_e2e@handyland.com' });
    if (user) {
        user.role = 'admin';
        user.isVerified = true;
        user.isActive = true;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
        console.log('User promoted to admin!');
    } else {
        console.log('User not found!');
    }
    mongoose.disconnect();
}
makeAdmin().catch(console.error);

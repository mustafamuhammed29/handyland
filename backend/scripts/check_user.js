require('dotenv').config();
const mongoose = require('mongoose');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./models/User');
        const user = await User.findOne({ email: { $regex: 'mustafa', $options: 'i' } });
        console.log('Found user:', user ? user.email : 'None');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkUser();

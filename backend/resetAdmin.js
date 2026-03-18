const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
    try {
        let user = await User.findOne({ email: 'admin@handyland.com' });
        if (!user) {
            console.log("Admin not found, creating new admin account...");
            user = new User({
                name: 'System Admin',
                email: 'admin@handyland.com',
                password: 'Admin123!',
                role: 'admin',
                isVerified: true,
                isActive: true
            });
            await user.save();
            console.log("Admin created successfully with password 'Admin123!'");
        } else {
            console.log("Admin found. Role is:", user.role);
            user.role = 'admin'; // ensure it's admin
            user.isActive = true;
            user.password = 'Admin123!';
            await user.save();
            console.log("Admin password updated successfully to 'Admin123!'");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});

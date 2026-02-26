const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const RepairTicket = require('./models/RepairTicket');
const Review = require('./models/Review');
const Order = require('./models/Order');

const checkCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.countDocuments({ role: 'user' });
        const repairs = await RepairTicket.countDocuments();
        const reviews = await Review.countDocuments();
        const orders = await Order.countDocuments();

        console.log('--- DB COUNTS ---');
        console.log(`Users (Happy Customers): ${users}`);
        console.log(`Repair Tickets: ${repairs}`);
        console.log(`Reviews: ${reviews}`);
        console.log(`Orders: ${orders}`);

        const avgRating = await Review.aggregate([
            { $group: { _id: null, avg: { $avg: "$rating" } } }
        ]);
        console.log(`Avg Rating: ${avgRating.length > 0 ? avgRating[0].avg : 'N/A'}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkCounts();

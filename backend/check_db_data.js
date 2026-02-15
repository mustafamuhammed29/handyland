const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const RepairDevice = require('./models/RepairDevice');
const RepairTicket = require('./models/RepairTicket');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';

mongoose.connect(uri)
    .then(async () => {
        console.log('✅ Connected to MongoDB. Checking data counts...');

        try {
            const userCount = await User.countDocuments();
            const productCount = await Product.countDocuments();
            const orderCount = await Order.countDocuments();
            const repairDeviceCount = await RepairDevice.countDocuments();
            const repairTicketCount = await RepairTicket.countDocuments();

            console.log('--- Database Stats ---');
            console.log(`Users: ${userCount}`);
            console.log(`Products: ${productCount}`);
            console.log(`Orders: ${orderCount}`);
            console.log(`Repair Devices (Catalog): ${repairDeviceCount}`);
            console.log(`Repair Tickets (Requests): ${repairTicketCount}`);
            console.log('----------------------');

            if (userCount === 0 && productCount === 0) {
                console.log('⚠️  DATABASE APPEARS EMPTY. You may need to run seed scripts.');
            } else {
                console.log('✅ Database has data.');
            }

        } catch (err) {
            console.error('❌ Error counting documents:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('❌ Connection Error:', err);
        process.exit(1);
    });

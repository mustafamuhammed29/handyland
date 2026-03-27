const mongoose = require('mongoose');
const Cart = require('./models/Cart');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const admin = await User.findOne({ role: 'admin' });
    const cart = await Cart.findOne({ user: admin._id });
    console.log("Admin Cart:", JSON.stringify(cart, null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});

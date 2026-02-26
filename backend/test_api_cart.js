const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function testApi() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
    const User = require('./models/User');
    const Product = require('./models/Product');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return console.log("No admin found");

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'fallback', { expiresIn: '1d' });
    console.log("Generated Token:", token.substring(0, 15));

    const p = await Product.findOne();
    if (!p) return console.log("No product found");

    console.log("Testing POST /api/cart/sync...");
    try {
        const resSync = await axios.post('http://localhost:5000/api/cart/sync', {
            localItems: [{ id: p._id.toString(), quantity: 1, category: 'device' }]
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("sync response length:", resSync.data.length);
    } catch (err) {
        console.error("Sync Error:", err.response ? err.response.data : err.message);
    }

    console.log("Testing PUT /api/cart...");
    try {
        const resPut = await axios.put('http://localhost:5000/api/cart', {
            id: p._id.toString(), productType: 'device', quantity: 2
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("put response:", JSON.stringify(resPut.data));
    } catch (err) {
        console.error("Put Error:", err.response ? err.response.data : err.message);
    }

    process.exit();
}

testApi().catch(console.error);

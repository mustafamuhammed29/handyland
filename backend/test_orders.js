const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
// Use a fixed email to avoid creating too many users, or unique.
// Let's use unique.
const EMAIL = `order_test_${Date.now()}@example.com`;
const PASSWORD = 'Password123!@#';

const runOrderTests = async () => {
    console.log('--- STARTING ORDER TESTS ---');

    // Connect to DB to manually verify user
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
        console.log('✅ DB Connected for Test Setup');
    } catch (e) {
        console.error('❌ DB Connection Failed:', e.message);
        return;
    }

    let productId = '';

    // 0. Setup: Register & Verify & Login, Get a Product
    try {
        // Register
        console.log(`[TEST] Registering ${EMAIL}`);
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                name: 'Order Tester',
                email: EMAIL,
                password: PASSWORD,
                phone: '+14155552671'
            });
        } catch (e) {
            // Check if user already exists (if we used fixed email)
            if (e.response && e.response.status === 400 && e.response.data.message.includes('exists')) {
                console.log('User already exists, proceeding to login.');
            } else {
                throw e;
            }
        }

        // Manual Verification in DB
        const user = await User.findOne({ email: EMAIL });
        if (user) {
            user.isVerified = true;
            await user.save();
            console.log('✅ User Manually Verified in DB');
        } else {
            throw new Error('User not found in DB after registration');
        }

        // Login
        console.log(`[TEST] Logging in`);
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const cookies = loginRes.headers['set-cookie'];
        // Extract accessToken and refreshToken cookies
        // They look like: "accessToken=...; Path=/; HttpOnly", "refreshToken=..."
        // We need to join them for the Cookie header.
        const cookieHeader = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';

        if (!cookieHeader) console.warn('⚠️ No cookies received from login!');
        else console.log('✅ Login Successful (Cookies received)');

        // Also get a product ID
        const prodRes = await axios.get(`${BASE_URL}/products`);
        if (prodRes.data.products && prodRes.data.products.length > 0) {
            productId = prodRes.data.products[0]._id;
            console.log(`✅ Setup Complete. User Logged In. Product ID: ${productId}`);
            console.log(`   Product Details: Name=${prodRes.data.products[0].name}, Category=${prodRes.data.products[0].category}`);
        } else {
            console.error('❌ No products found to test with.');
            return;
        }

        const axiosConfig = {
            headers: {
                Cookie: cookieHeader,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        };

        // 1. Create Valid Order
        try {
            console.log(`\n[TEST] Create Valid Order`);
            const dbProduct = await Product.findById(productId);
            // Ensure stock exists
            dbProduct.stock = 100;
            await dbProduct.save();
            const realPrice = dbProduct.price;
            console.log(`   Fetched Price from DB: ${realPrice}`);

            const orderData = {
                items: [
                    {
                        product: productId,
                        productType: 'Product', // Required by schema often? Check controller.
                        quantity: 1,
                        price: realPrice
                    }
                ],
                shippingAddress: {
                    fullName: 'Test User',
                    email: EMAIL, // Required by schema
                    street: '123 Test St',
                    city: 'Test City',
                    zipCode: '12345',
                    country: 'Testland',
                    phone: '+14155552671'
                },
                paymentMethod: 'card',
                itemsPrice: realPrice,
                taxPrice: 0,
                shippingPrice: 0,
                totalPrice: realPrice // Exact match needed? Backend calculates it.
            };

            const res = await axios.post(`${BASE_URL}/orders`, orderData, axiosConfig);
            if (res.status === 201) {
                console.log(`✅ Create Order Successful (201) - ID: ${res.data.order ? res.data.order._id : res.data._id}`);
            }
        } catch (e) {
            console.error('❌ Create Order Failed:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        }

        // 2. Manipulated Total (Integrity Check)
        try {
            console.log(`\n[TEST] Create Order with Manipulated Total`);
            const dbProduct = await Product.findById(productId);
            const realPrice = dbProduct.price;

            const badOrderData = {
                items: [
                    { product: productId, productType: 'Product', quantity: 1, price: realPrice }
                ],
                shippingAddress: {
                    fullName: 'Test User',
                    email: EMAIL, // Required by schema
                    street: '123 Test St',
                    city: 'Test City',
                    zipCode: '12345',
                    country: 'Testland',
                    phone: '+14155552671'
                },
                paymentMethod: 'card',
                // Manipulate prices (though backend should ignore them and recalculate, or reject if mismatch)
                // If backend recalculates, it shouldn't fail, just correct it?
                // Or if we send "totalAmount", it checks it?
                // Order.js model pre-validate hook I added CHECKS it.
                totalPrice: realPrice - 10
            };

            const res = await axios.post(`${BASE_URL}/orders`, badOrderData, axiosConfig);
            if (res.status === 201) {
                console.log(`✅ Manipulated Order Accepted (Backend likely recalculated total)`);
                // Check if totalAmount is correct
                const savedOrder = res.data.order || res.data;
                // Backend adds shipping if < 100. dbProduct.price is 590 (>100).
                // So total should be 590.
                console.log(`   Saved Total: ${savedOrder.totalAmount}`);
            }
        } catch (e) {
            console.error('❌ Manipulated Order Error:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        }

        // 3. Get My Orders
        try {
            console.log(`\n[TEST] Get My Orders`);
            // Use correct endpoint: /orders/my or /orders
            const res = await axios.get(`${BASE_URL}/orders/my`, axiosConfig);
            if (res.status === 200) {
                console.log(`✅ Get My Orders Successful (200) - Count: ${res.data.length || res.data.orders?.length || res.data.count}`);
            }
        } catch (e) {
            console.error('❌ Get My Orders Failed:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        }

    } catch (e) {
        console.error('❌ Setup Failed:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    } finally {
        await mongoose.disconnect();
    }

    console.log('\n--- ORDER TESTS COMPLETE ---');
};

runOrderTests();

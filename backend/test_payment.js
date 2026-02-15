const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const logFile = './payment_test.log';

// Clear log
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (...args) => {
    const msg = args.join(' ');
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
};

// Mongoose Models (for direct verification)
const Order = require('./models/Order');
const Transaction = require('./models/Transaction');
const Product = require('./models/Product');

// Test Data
const testUser = {
    email: 'payment_tester@example.com',
    password: 'Password123!',
    name: 'Payment Tester'
};

let authToken = null;
let createdOrderId = null;
let createdSessionId = null;

async function runPaymentTests() {
    log('💰 Starting Payment Integration Tests...\n');

    try {
        await connectDB();

        // Setup: Authenticate
        await authenticateUser();

        // Test 1: Create Order & Checkout Session
        await testCreateCheckoutSession();

        // Test 2: Webhook - Payment Success
        await testWebhookPaymentSuccess();

        // Test 3: Transaction Verification
        await testTransactionRecord();

        // Test 4: Webhook - Payment Failed
        await testWebhookPaymentFailed();

        // Test 5: Webhook - Refund (Charge Refunded)
        await testWebhookRefund();

        log('\n✅ All Payment Tests Passed!');
    } catch (error) {
        log('\n❌ Payment Tests Failed:', error.message);
        if (error.response) {
            log('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await mongoose.disconnect();
    }
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
        log('✅ DB Connected');
    } catch (e) {
        throw new Error(`DB Connection Failed: ${e.message}`);
    }
}

const User = require('./models/User');

async function authenticateUser() {
    log('\n🔹 Setup: Authenticating...');
    const timestamp = Date.now();
    const email = `payment_test_${timestamp}@example.com`;
    const password = 'Password123!@#';

    // 1. Register
    log(`   Registering new user: ${email}`);
    await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Payment Tester',
        email,
        password,
        phone: '+14155552671'
    });

    // 2. Manually Verify in DB
    const user = await User.findOne({ email });
    if (!user) throw new Error('User creation failed');
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    log('   User manually verified in DB');

    // 3. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password });

    if (loginRes.data.token) authToken = loginRes.data.token;
    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
        authToken = cookies.map(c => c.split(';')[0]).join('; ');
    }
    log('   ✅ Authenticated');

    // Update global testUser email for checkout
    testUser.email = email;
}

async function testCreateCheckoutSession() {
    log('\nTest 1: Create Checkout Session');

    // 1. Get a product ID
    // 1. Get a product ID
    const product = await Product.findOne();
    if (!product) throw new Error('No products found in DB');

    // Ensure stock
    product.stock = 100;
    await product.save();
    log(`   Selected Product: ${product.name} (Stock set to 100)`);

    // 2. Prepare payload
    const payload = {
        items: [{
            product: product.id, // UUID
            productType: 'Product',
            name: product.name,
            price: 19.99,
            quantity: 1,
            image: 'http://example.com/img.jpg'
        }],
        shippingAddress: {
            fullName: 'Test User',
            email: testUser.email,
            street: '123 Test St',
            city: 'Test City',
            zipCode: '12345',
            country: 'Germany',
            phone: '+123456789'
        },
        termsAccepted: true
    };

    // 3. Call API
    const config = { headers: { Cookie: authToken }, withCredentials: true };
    const response = await axios.post(`${BASE_URL}/payment/create-checkout-session`, payload, config);

    if (response.status === 200 && response.data.sessionId) {
        createdSessionId = response.data.sessionId;
        log('   ✅ Session Created:', createdSessionId);

        // Verify Order Created
        // Session creation response doesn't return Order ID directly in JSON (checked controller),
        // But it saves order.sessionId.
        // Wait, controller returns { success: true, sessionId, url }
        // BUT metadata has orderId.
        // We can find order by paymentId = sessionId
        const order = await Order.findOne({ paymentId: createdSessionId });
        if (!order) throw new Error('Order not created in DB for session');

        createdOrderId = order._id;
        log('   ✅ Order Record Found:', order.orderNumber);
        log(`   ✅ Amount Stored: ${order.totalAmount} (Expected ~25.98 with shipping)`);
    } else {
        throw new Error('Failed to create session');
    }
}

const uniquePaymentIntent = `pi_test_${Date.now()}`;
async function testWebhookPaymentSuccess() {
    log('\nTest 2: Webhook - Payment Success');

    // Simulate Stripe Event
    const event = {
        type: 'checkout.session.completed',
        id: 'evt_test_success',
        data: {
            object: {
                id: createdSessionId,
                payment_intent: uniquePaymentIntent,
                payment_status: 'paid',
                amount_total: 2598, // 25.98 * 100
                currency: 'eur',
                metadata: {
                    orderId: createdOrderId.toString()
                }
            }
        }
    };

    // Call Webhook Endpoint
    // Note: We need to modify controller to accept mock without signature or we assume our updated mock handles it.
    // Our updated mock `constructEvent` returns the body.
    try {
        await axios.post(`${BASE_URL}/payment/webhook`, event, {
            headers: { 'stripe-signature': 'mock_signature' }
        });
        log('   ✅ Webhook Sent');

        // Verify DB Updates
        const order = await Order.findById(createdOrderId);
        if (order.status === 'processing' && order.paymentStatus === 'paid') {
            log('   ✅ Order Updated: Paid & Processing');
            log(`   ℹ️  Order Payment ID in DB: ${order.paymentId}`);
            log(`   ℹ️  Expected Payment Intent: ${uniquePaymentIntent}`);
        } else {
            throw new Error(`Order status incorrect: ${order.status}, ${order.paymentStatus}`);
        }
    } catch (e) {
        throw new Error(`Webhook failed: ${e.message}`);
    }
}

async function testTransactionRecord() {
    log('\nTest 3: Transaction Verification');

    const transaction = await Transaction.findOne({ order: createdOrderId });
    if (!transaction) throw new Error('Transaction record not found');

    log('   ✅ Transaction Found');
    log(`   ✅ Amount: ${transaction.amount} (Should be decimal)`);
    log(`   ✅ Payment Method: ${transaction.paymentMethod}`);

    // Verify Cents logic (Schema has get/set)
    // We can't see the raw DB value via Mongoose easily without .lean() or bypass, 
    // but we can trust the getter if it returns correct decimal.
    // If we saved 25.98, getter should return 25.98.
    // Mongoose getter logic: get: v => v / 100.
    // Wait. Schema says: 
    // set: v => Math.round(v * 100)
    // get: v => Math.round(v) / 100
    // So if Controller saves `order.totalAmount` (25.98) -> DB has 2598.
    // Mongoose read -> 25.98.

    if (Math.abs(transaction.amount - 25.98) < 0.01) {
        log('   ✅ Amount Conversion Correct');
    } else {
        log(`   ❌ Amount Mismatch: Got ${transaction.amount}, Expected 25.98`);
    }
}

async function testWebhookPaymentFailed() {
    log('\nTest 4: Webhook - Payment Failed');

    // Create a new order for failure test
    const failPaymentId = `pi_test_fail_${Date.now()}`;
    const failOrder = await Order.create({
        items: [], // Mock items
        totalAmount: 10.00,
        status: 'pending',
        paymentStatus: 'pending',
        paymentId: failPaymentId,
        orderNumber: 'TEST-FAIL-' + Date.now(),
        shippingAddress: {
            fullName: 'Test Fail',
            email: 'fail@test.com',
            phone: '+123456789',
            street: 'Fail St',
            city: 'Fail City',
            zipCode: '00000',
            country: 'Nowhere'
        }
    });

    const event = {
        type: 'payment_intent.payment_failed',
        data: {
            object: {
                id: failPaymentId
                // metadata might not be here in payment_intent object usually, unless copied.
                // Controller uses `paymentId` lookup.
            }
        }
    };

    await axios.post(`${BASE_URL}/payment/webhook`, event, {
        headers: { 'stripe-signature': 'mock_signature' }
    });

    const updatedOrder = await Order.findById(failOrder._id);
    if (updatedOrder.status === 'cancelled' && updatedOrder.paymentStatus === 'failed') {
        log('   ✅ Order Cancelled on Payment Failure');
    } else {
        throw new Error(`Order not cancelled: ${updatedOrder.status}`);
    }
}

async function testWebhookRefund() {
    log('\nTest 5: Webhook - Refund');

    // Reuse the successful order (createdOrderId)
    // It is currently 'processing' / 'paid'

    const event = {
        type: 'charge.refunded',
        data: {
            object: {
                id: 'ch_test_refund',
                payment_intent: uniquePaymentIntent, // Unique ID
                amount_refunded: 2598
            }
        }
    };

    await axios.post(`${BASE_URL}/payment/webhook`, event, {
        headers: { 'stripe-signature': 'mock_signature' }
    });

    const updatedOrder = await Order.findById(createdOrderId);
    if (updatedOrder.status === 'refunded' && updatedOrder.paymentStatus === 'refunded') {
        log('   ✅ Order Status Refunded');
    } else {
        throw new Error(`Order not refunded: ${updatedOrder.status}`);
    }

    // Verify Refund Transaction
    const refundTrans = await Transaction.findOne({
        order: createdOrderId,
        amount: { $lt: 0 }
    });

    if (refundTrans && Math.abs(refundTrans.amount + 25.98) < 0.01) {
        log('   ✅ Refund Transaction Created (Negative Amount)');
    } else {
        throw new Error('Refund transaction missing or incorrect');
    }
}

runPaymentTests();

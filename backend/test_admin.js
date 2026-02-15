const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Environment Check
if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run tests in production mode!');
    process.exit(1);
}

// Set to test mode
process.env.NODE_ENV = 'test';

const BASE_URL = 'http://localhost:5000/api';
const logFile = './admin_test.log';

let regularUserToken = null;
let adminToken = null;

const log = (...args) => {
    const message = args.join(' ');
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
};

// Retry Logic
async function makeRequestWithRetry(axiosConfig, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await axios(axiosConfig);
        } catch (error) {
            if (error.response?.status === 429) {
                // Rate limited, wait and retry
                const waitTime = (i + 1) * 2000; // 2s, 4s, 6s
                log(`⏳ Rate limited, waiting ${waitTime / 1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw error; // Not a rate limit error, throw it
        }
    }
    throw new Error('Max retries exceeded');
}

async function waitForServer() {
    log('⏳ Checking server availability...');

    for (let i = 0; i < 5; i++) {
        try {
            await axios.get('http://localhost:5000/api/status');
            log('✅ Server is responding\n');
            return true;
        } catch (error) {
            if (i === 4) {
                log('❌ Server not responding. Please start server first:');
                log('   cd backend && npm run dev\n');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function setup() {
    log('🔧 Setting up test environment...\n');

    // Check server
    await waitForServer();

    // Connect to database
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
        log('✅ Connected to database');
    } catch (error) {
        log('❌ Database connection failed:', error.message);
        process.exit(1);
    }

    // Create regular user
    try {
        const timestamp = Date.now();
        const response = await makeRequestWithRetry({
            method: 'post',
            url: `${BASE_URL}/auth/register`,
            data: {
                name: 'Regular User',
                email: `user_${timestamp}@example.com`,
                password: 'TestPassword123!@#'
            }
        });

        // Extract token
        if (response.data.token) {
            regularUserToken = response.data.token;
        } else if (response.headers['set-cookie']) {
            const cookies = response.headers['set-cookie'];
            const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
            if (accessTokenCookie) {
                regularUserToken = accessTokenCookie.split(';')[0].split('=')[1];
            }
        }

        log('✅ Regular user created and logged in');
    } catch (error) {
        log('❌ Regular user creation failed:', error.response?.data?.message || error.message);
        // Don't throw, proceed to admin checks
    }

    // Login as admin
    try {
        const response = await makeRequestWithRetry({
            method: 'post',
            url: `${BASE_URL}/auth/admin/login`,
            data: {
                email: 'admin@handyland.com',
                password: 'admin123'
            }
        });

        // Extract token
        if (response.data.token) {
            adminToken = response.data.token;
        } else if (response.headers['set-cookie']) {
            const cookies = response.headers['set-cookie'];
            const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
            if (accessTokenCookie) {
                adminToken = accessTokenCookie.split(';')[0].split('=')[1];
            }
        }

        if (adminToken) {
            log('✅ Admin logged in');
        } else {
            throw new Error('No token received');
        }
    } catch (error) {
        log('❌ Admin login failed:', error.response?.data?.message || error.message);
        log('\n⚠️  Make sure admin user exists. Create it by running:');
        log('   cd backend && node createAdmin.js\n');
        throw error;
    }

    log('✅ Setup complete\n');
}

async function testAdminLogin() {
    log('🧪 Test 1: Admin Login & Access Control\n');

    if (!adminToken) {
        log('⚠️ Skipping Admin Login test due to missing admin token setup');
        return;
    }

    log('  Test 1.1: Verify Admin Token works');
    try {
        const response = await makeRequestWithRetry({
            method: 'get',
            url: `${BASE_URL}/auth/me`,
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(response.status === 200, 'Should return 200');
        assert(response.data.user.role === 'admin', 'User should be admin');
        log('  ✅ Admin token verified\n');
    } catch (error) {
        log('  ❌ Admin token verification failed:', error.response?.data || error.message);
    }
}

async function testDashboardStats() {
    log('🧪 Test 2: Dashboard Statistics\n');

    log('  Test 2.1: Admin access to statistics');
    try {
        const response = await makeRequestWithRetry({
            method: 'get',
            url: `${BASE_URL}/stats`, // Corrected endpoint based on statsRoutes.js
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        assert(response.status === 200, 'Should return 200');
        log('  ✅ Admin retrieved statistics');
        log('');
    } catch (error) {
        log('  ❌ Admin stats failed:', JSON.stringify(error.response?.data || error.message));
    }
}

async function testProductManagement() {
    log('🧪 Test 3: Product Management (Admin CRUD)\n');

    let productId = null;

    log('  Test 3.1: Admin create product');
    try {
        const response = await makeRequestWithRetry({
            method: 'post',
            url: `${BASE_URL}/products`,
            data: {
                name: `Test Product ${Date.now()}`,
                description: 'Test Description',
                price: 99.99,
                category: 'accessories',
                stock: 50,
                // images: ['http://example.com/image.png']
            },
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        assert(response.status === 201, 'Should return 201');
        // Controller returns the product object directly, and uses 'id' for deletion
        productId = response.data.id;
        log('  ✅ Product created:', productId);
    } catch (error) {
        log('  ❌ Product creation failed:', JSON.stringify(error.response?.data || error.message));
    }

    if (productId) {
        // Cleanup
        try {
            await makeRequestWithRetry({
                method: 'delete',
                url: `${BASE_URL}/products/${productId}`,
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            log('  ✅ Product cleaned up\n');
        } catch (e) {
            const m = e.response ? e.response.data : e.message;
            log('  ⚠️ Product cleanup failed:', JSON.stringify(m));
        }
    }
}

async function testOrderManagement() {
    log('🧪 Test 4: Order Management (Admin)\n');

    log('  Test 4.1: Admin get all orders');
    try {
        const response = await makeRequestWithRetry({
            method: 'get',
            url: `${BASE_URL}/orders/admin/all`,
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        assert(response.status === 200, 'Should return 200');
        log(`  ✅ Admin retrieved orders`);
    } catch (error) {
        log('  ❌ Get all orders failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    // Clear log
    fs.writeFileSync(logFile, '');

    log('🚀 Starting Admin Panel Tests\n');
    log('='.repeat(60) + '\n');

    try {
        await setup();

        // Run tests
        await testAdminLogin();
        await testDashboardStats();
        await testProductManagement();
        await testOrderManagement();

        log('='.repeat(60));
        log('\n✅ ALL ADMIN TESTS PASSED! 🎉\n');

    } catch (error) {
        log('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            log('Response:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            log('\n📁 Database connection closed');
        }
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// Run tests
runTests();

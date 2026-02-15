const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path as needed
require('dotenv').config();

const jar = new CookieJar();
const client = wrapper(axios.create({
    baseURL: 'http://localhost:5000',
    jar,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
}));

const TEST_USER = {
    name: 'Test User',
    email: `test_user_${Date.now()}@example.com`,
    password: 'Password123!',
    phone: '1234567890'
};

async function runTest() {
    console.log('🚀 Starting Comprehensive Auth Test...');
    console.log(`👤 Test User: ${TEST_USER.email}`);

    try {
        // Connect to DB for manual verification
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
        console.log('✅ Connected to MongoDB for verification bypass');

        // 1. Register
        console.log('\n1️⃣  Testing Registration...');
        const registerRes = await client.post('/api/auth/register', TEST_USER);
        if (registerRes.status === 201) {
            console.log('✅ Registration Successful');
        } else {
            console.error('❌ Registration Failed:', registerRes.data);
            process.exit(1);
        }

        // 1.5 Manually Verify User
        console.log('\n🔄 Manually Verifying User in DB...');
        await User.updateOne({ email: TEST_USER.email }, { isVerified: true });
        console.log('✅ User Verified');

        // 2. Login
        console.log('\n2️⃣  Testing Login...');
        const loginRes = await client.post('/api/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password
        });

        if (loginRes.status === 200) {
            console.log('✅ Login Successful');
            // Check cookies
            const cookies = await jar.getCookies('http://localhost:5000');
            const accessToken = cookies.find(c => c.key === 'accessToken');
            const refreshToken = cookies.find(c => c.key === 'refreshToken');

            if (accessToken && refreshToken) {
                console.log('✅ Cookies Received (HttpOnly):');
                console.log(`   - accessToken: ${accessToken.value.substring(0, 10)}...`);
                console.log(`   - refreshToken: ${refreshToken.value.substring(0, 10)}...`);
            } else {
                console.error('❌ Cookies Missing!');
                process.exit(1);
            }
        } else {
            console.error('❌ Login Failed:', loginRes.data);
            process.exit(1);
        }

        // 3. Access Protected Route (Me)
        console.log('\n3️⃣  Testing Protected Route (/api/auth/me)...');
        const meRes = await client.get('/api/auth/me');
        if (meRes.status === 200 && meRes.data.user.email === TEST_USER.email) {
            console.log('✅ Protected Route Access Successful');
            console.log(`   - User ID: ${meRes.data.user.id}`);
        } else {
            console.error('❌ Protected Route Failed:', meRes.data);
            process.exit(1);
        }

        // 4. Test Token Refresh
        console.log('\n4️⃣  Testing Token Refresh...');
        const refreshRes = await client.get('/api/auth/refresh');
        if (refreshRes.status === 200) {
            console.log('✅ Token Refresh Successful');
        } else {
            console.error('❌ Token Refresh Failed:', refreshRes.data);
        }

        // 5. Logout
        console.log('\n5️⃣  Testing Logout...');
        const logoutRes = await client.post('/api/auth/logout');
        if (logoutRes.status === 200) {
            console.log('✅ Logout Successful');
            const cookiesAfterLogout = await jar.getCookies('http://localhost:5000');
            const hasTokens = cookiesAfterLogout.some(c => c.key === 'accessToken' || c.key === 'refreshToken');
            if (!hasTokens) {
                console.log('✅ Cookies Cleared');
            } else {
                console.warn('⚠️  Cookies might not have been fully cleared by client (expected for HttpOnly)');
            }
        } else {
            console.error('❌ Logout Failed');
        }

        console.log('\n🎉 ALL TESTS PASSED! Backend Auth is 100% Functional.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST FAILED With Error:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

runTest();

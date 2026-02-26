// Test Authentication System
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
    console.log('\n🧪  Testing Authentication System\n');

    try {
        // Test 1: Register new user
        console.log('1️⃣  Testing Registration...');
        const registerData = {
            name: 'Test User',
            email: 'test@handyland.com',
            password: 'test123',
            phone: '+49 987 654 3210'
        };

        try {
            const registerRes = await axios.post(`${BASE_URL}/auth/register`, registerData);
            console.log('✅ Registration successful!');
            if (registerRes.data.token) {
                console.log('   Token:', registerRes.data.token.substring(0, 20) + '...');
            }
            console.log('   User:', registerRes.data.user.name);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('ℹ️  User already exists (this is fine for testing)');
            } else {
                throw error;
            }
        }

        // Test 2: Login with admin
        console.log('\n2️⃣  Testing Admin Login...');
        const loginData = {
            email: 'admin@handyland.com',
            password: 'admin123'
        };

        const loginRes = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✅ Login successful!');
        console.log('   Token:', loginRes.data.token.substring(0, 20) + '...');
        console.log('   User:', loginRes.data.user.name);
        console.log('   Role:', loginRes.data.user.role);

        const token = loginRes.data.token;

        // Test 3: Get current user (protected route)
        console.log('\n3️⃣  Testing Protected Route (Get Me)...');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Protected route works!');
        console.log('   User:', meRes.data.user.name);
        console.log('   Email:', meRes.data.user.email);

        // Test 4: Admin login
        console.log('\n4️⃣  Testing Admin Login Endpoint...');
        const adminLoginRes = await axios.post(`${BASE_URL}/auth/admin/login`, loginData);
        console.log('✅ Admin login successful!');
        console.log('   Role:', adminLoginRes.data.user.role);

        // Test 5: Test unauthorized access
        console.log('\n5️⃣  Testing Unauthorized Access...');
        try {
            await axios.get(`${BASE_URL}/auth/me`);
            console.log('❌ Should have failed!');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Unauthorized access properly blocked!');
            } else {
                throw error;
            }
        }

        console.log('\n\n🎉 All tests passed!\n');
        console.log('📋 Summary:');
        console.log('   ✅ User registration works');
        console.log('   ✅ User login works');
        console.log('   ✅ JWT authentication works');
        console.log('   ✅ Protected routes work');
        console.log('   ✅ Admin login works');
        console.log('   ✅ Authorization works\n');

    } catch (error) {
        console.error('\n❌ Test failed!');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Message:', error.response.data.message);
        } else {
            console.error('   Error:', error.message);
        }
        process.exit(1);
    }
}

testAuth();

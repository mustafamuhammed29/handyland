const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testBackend() {
    console.log('🧪 Testing Backend...');

    try {
        // 1. Status
        console.log('\n1️⃣  Checking Status...');
        const status = await axios.get(`${API_URL}/../api/status`); // The original script had this weird path
        // Wait, the original script had /../api/status which resolves to /api/status anyway if base is /api
        // Actually base is /api, so /api/../api/status is /api/status.
        // Let's just use the full URL.
        const statusRes = await axios.get('http://localhost:5000/api/status');
        console.log('   ✅ Status:', statusRes.data.status);
        console.log('   📊 Database:', statusRes.data.database);

        // 2. Admin Login
        console.log('\n2️⃣  Testing Admin Login...');
        const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
            email: 'admin@handyland.com',
            password: 'admin123'
        });
        console.log('   ✅ Login Successful');
        const token = loginRes.data.token;
        console.log('   🔑 Token obtained');

        // 3. Get Profile
        console.log('\n3️⃣  Getting Admin Profile...');
        const profileRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Profile:', profileRes.data.user.email);

        // 4. Get Orders
        console.log('\n4️⃣  Getting Orders...');
        const ordersRes = await axios.get(`${API_URL}/orders/admin/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Orders Count:', ordersRes.data.count);

    } catch (error) {
        console.error('   ❌ Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testBackend();

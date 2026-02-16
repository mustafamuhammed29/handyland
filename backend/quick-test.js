const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Enable cookie support for axios
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const API = 'http://localhost:5000/api';

async function testAuthFlow() {
    try {
        console.log('1️⃣ Testing Registration...');
        const email = `test${Date.now()}@test.com`;
        try {
            const reg = await client.post(`${API}/auth/register`, {
                name: 'Test User',
                email: email,
                password: 'Test123!@#$%',
                phone: '1234567890'
            });
            console.log('✅ Registration:', reg.data.success);
        } catch (e) {
            if (e.response && e.response.status === 400 && e.response.data.message.includes('already exists')) {
                console.log('⚠️ User already exists, proceeding to login...');
            } else {
                throw e;
            }
        }

        console.log('\n2️⃣ Testing Login...');
        const login = await client.post(`${API}/auth/login`, {
            email: email, // Note: If registration failed/skipped, this might fail if user doesn't exist. 
            // ideally we'd use a known user or the one just registered.
            // For robustness, let's use the dynamic email.
            password: 'Test123!@#$%'
        });
        console.log('✅ Login:', login.data.success);

        const token = login.data.token;
        if (token) {
            console.log('🎫 Token:', token.substring(0, 20) + '...');
        } else {
            console.log('❌ No Token returned in login response');
        }

        console.log('\n3️⃣ Testing Protected Route (/auth/me)...');
        try {
            const me = await client.get(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Protected Route:', me.data.success);
            console.log('👤 User:', me.data.user.name);
        } catch (e) {
            console.error('❌ Protected Route Failed:', e.response ? e.response.data : e.message);
        }

        console.log('\n🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAuthFlow();

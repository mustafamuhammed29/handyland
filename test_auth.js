const http = require('http');

const request = (method, path, body = null) => {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', e => reject(e));
        if (body) req.write(payload);
        req.end();
    });
};

async function runTests() {
    console.log('--- TEST 2A: Register ---');
    let res = await request('POST', '/api/auth/register', {
        name: 'Test User', email: 'test_e2e@handyland.com', password: 'Test@1234567', phone: '+491234567890'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    // If 400 user exists, let's ignore it or we can delete it first, but we'll see.
    console.log('\n--- TEST 2B: Register duplicate ---');
    res = await request('POST', '/api/auth/register', {
        name: 'Test User', email: 'test_e2e@handyland.com', password: 'Test@1234567', phone: '+491234567890'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n--- TEST 2C: Weak password ---');
    res = await request('POST', '/api/auth/register', {
        name: 'Test User', email: 'test_weak_e2e@handyland.com', password: '123'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n--- TEST 2D: Login unverified ---');
    res = await request('POST', '/api/auth/login', {
        email: 'test_e2e@handyland.com', password: 'Test@1234567'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n--- TEST 2E: Forgot password (exists) ---');
    res = await request('POST', '/api/auth/forgot-password', {
        email: 'test_e2e@handyland.com'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n--- TEST 2F: Forgot password (does not exist) ---');
    res = await request('POST', '/api/auth/forgot-password', {
        email: 'doesnotexist123xyz@fake.com'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n--- TEST 2G: Account Lockout ---');
    for (let i = 1; i <= 6; i++) {
        res = await request('POST', '/api/auth/login', {
            email: 'test_e2e@handyland.com', password: 'WrongPassword123!'
        });
        console.log(`Attempt ${i} Status: ${res.status}, Message:`, res.data.message || res.data);
    }

    console.log('\n--- TEST 2H: Admin login with non-admin ---');
    res = await request('POST', '/api/auth/admin/login', {
        email: 'test_e2e@handyland.com', password: 'Test@1234567'
    });
    console.log(`Status: ${res.status}, Data:`, res.data);
}

runTests().catch(console.error);

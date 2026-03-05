const http = require('http');

const request = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data || '{}') });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data });
                }
            });
        });

        req.on('error', e => reject(e));
        if (body) req.write(payload);
        req.end();
    });
};

async function runTests() {
    console.log('--- TEST 3A: XSS Sanitization ---');
    let res = await request('POST', '/api/auth/register', {
        name: '<script>alert(1)</script>', email: 'xss2@test.com', password: 'Test@1234567'
    });
    console.log(`Status: ${res.status}, Data Name field:`, res.data?.user?.name || res.data);

    console.log('\n--- TEST 3B: NoSQL Injection ---');
    // Using a raw HTTP request because Node's http handles object bodies as invalid if not stringified.
    // Let's stringify the object payload.
    res = await request('POST', '/api/auth/login', {
        email: { "$gt": "" }, password: { "$gt": "" }
    });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n--- TEST 3C: Rate Limiting on Auth ---');
    // Rapid requests
    for (let i = 1; i <= 10; i++) {
        res = await request('POST', '/api/auth/login', {
            email: 'rate_' + i + '@test.com', password: '123'
        });
        console.log(`Attempt ${i} Status: ${res.status}, Message:`, res.data?.message || res.data);
    }

    console.log('\n--- TEST 3D: Security Headers ---');
    res = await request('GET', '/health');
    console.log(`Status: ${res.status}`);
    console.log(`X-Content-Type-Options:`, res.headers['x-content-type-options']);
    console.log(`X-Frame-Options:`, res.headers['x-frame-options']);
    console.log(`Referrer-Policy:`, res.headers['referrer-policy']);
}

runTests().catch(console.error);

const http = require('http');

let currentCookies = [];

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
                ...headers
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        if (currentCookies.length > 0) {
            options.headers['Cookie'] = currentCookies.join('; ');
        }

        const req = http.request(options, (res) => {
            let data = '';

            // Capture cookies
            const setCookie = res.headers['set-cookie'];
            if (setCookie) {
                currentCookies = setCookie.map(cookie => cookie.split(';')[0]); // Very basic cookie jar
            }

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data: data });
            });
        });

        req.on('error', e => reject(e));
        if (body) req.write(payload);
        req.end();
    });
};

async function runSmokeTests() {
    console.log('--- SMOKE TESTS ---');

    console.log('\nLogging in as Admin...');
    let res = await request('POST', '/api/auth/login', {
        email: 'test_e2e@handyland.com',
        password: 'Test@1234567'
    });
    console.log('Login Status:', res.status);

    const endpoints = [
        { method: 'GET', path: '/api/products' },
        { method: 'POST', path: '/api/products', body: { name: 'Test Product', price: 99, category: 'Test' } },
        { method: 'GET', path: '/api/orders' },
        { method: 'GET', path: '/api/stats' },
        { method: 'GET', path: '/api/notifications' },
        { method: 'GET', path: '/api/cart' },
        { method: 'POST', path: '/api/cart', body: { productId: 'fakeid' } },
        { method: 'GET', path: '/api/coupons' },
        { method: 'GET', path: '/health' }
    ];

    for (let ep of endpoints) {
        let r = await request(ep.method, ep.path, ep.body);
        let icon = (r.status >= 200 && r.status < 300) || r.status === 400 || r.status === 404 ? '✅' : '❌'; // Accept 400/404 for missing IDs since auth worked
        if (ep.path === '/api/stats' && r.status !== 200) icon = '❌';
        if (ep.path === '/api/cart' && r.status === 401) icon = '❌';
        console.log(`${icon} [${ep.method}] ${ep.path} -> ${r.status}`);
    }
}

runSmokeTests().catch(console.error);

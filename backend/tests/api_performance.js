const axios = require('axios');

async function testPerformance() {
    const baseURL = 'http://localhost:5000';
    console.log("🚀 Starting REST API Performance & Response Audit...");

    const testCases = [
        { name: 'GET /api/products', url: `${baseURL}/api/products`, method: 'get' },
        { name: 'GET /api/repairs', url: `${baseURL}/api/repairs`, method: 'get' },
        { name: 'GET /api/accessories', url: `${baseURL}/api/accessories`, method: 'get' },
        // Invalid Auth -> 401
        { name: 'GET /api/auth/me (No token -> 401)', url: `${baseURL}/api/auth/me`, method: 'get', expectStatus: 401 },
        // Invalid Endpoint -> 404
        { name: 'GET /api/non-existent-route -> 404', url: `${baseURL}/api/non-existent-route`, method: 'get', expectStatus: 404 },
        // Bad Register Request -> 400
        { name: 'POST /api/auth/register (Missing fields -> 400)', url: `${baseURL}/api/auth/register`, method: 'post', data: {}, expectStatus: 400 }
    ];

    let total = 0;
    let failed = 0;

    for (const tc of testCases) {
        const start = Date.now();
        let status = 0;
        let responseTime = 0;
        let passed = false;

        try {
            const res = await axios({
                method: tc.method,
                url: tc.url,
                data: tc.data || null,
                validateStatus: () => true
            });
            status = res.status;
            responseTime = Date.now() - start;
            
            const expected = tc.expectStatus || 200;
            passed = (status === expected);
        } catch (e) {
            responseTime = Date.now() - start;
            console.error(`  Error on ${tc.name}: ${e.message}`);
        }

        const isSlow = responseTime > 500;
        const speedTag = isSlow ? `\x1b[31m${responseTime}ms (SLOW)\x1b[0m` : `\x1b[32m${responseTime}ms\x1b[0m`;
        const statusTag = passed ? `\x1b[32m${status}\x1b[0m` : `\x1b[31m${status} (Expected: ${tc.expectStatus || 200})\x1b[0m`;

        console.log(`- ${tc.name.padEnd(50)} | Status: ${statusTag} | Response Time: ${speedTag}`);
        
        total++;
        if (!passed || isSlow) failed++;
    }

    console.log(`\n📊 API Performance Audit Finished. Passed/Speed-Compliant: ${total - failed}/${total}`);
}

testPerformance();

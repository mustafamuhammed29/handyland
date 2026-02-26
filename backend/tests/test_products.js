const axios = require('axios');

const API_URL = 'http://localhost:5000/api/products';

const runProductTests = async () => {
    console.log('--- STARTING PRODUCT TESTS ---');

    // 1. Get All Products
    try {
        console.log(`\n[TEST] Get All Products`);
        const res = await axios.get(API_URL);
        if (res.status === 200) {
            console.log(`✅ Get All Products Successful (200) - Count: ${res.data.count || res.data.length || res.data.products?.length}`);
        }
    } catch (e) {
        console.error('❌ Get All Products Failed:', e.message);
    }

    // 2. Filter by Category (assuming 'smartphone' category exists or empty)
    try {
        console.log(`\n[TEST] Filter by Category (smartphone)`);
        const res = await axios.get(`${API_URL}?category=smartphone`);
        if (res.status === 200) {
            console.log('✅ Filter by Category Successful (200)');
        }
    } catch (e) {
        console.error('❌ Filter Failed:', e.message);
    }

    // 3. Search (assuming 'iPhone' might exist)
    try {
        console.log(`\n[TEST] Search Products (iPhone)`);
        const res = await axios.get(`${API_URL}?search=iPhone`);
        if (res.status === 200) {
            console.log('✅ Search Successful (200)');
        }
    } catch (e) {
        console.error('❌ Search Failed:', e.message);
    }

    // 4. Create Product (Should fail without auth/admin)
    try {
        console.log(`\n[TEST] Create Product (Unauthorized)`);
        await axios.post(API_URL, { name: 'Test Product' });
        console.error('❌ Create Product SHOULD have failed');
    } catch (e) {
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
            console.log('✅ Create Product Unauthorized Blocked (401/403)');
        } else {
            console.error('❌ Create Product Unexpected Error:', e.message);
        }
    }

    console.log('\n--- PRODUCT TESTS COMPLETE ---');
};

runProductTests();

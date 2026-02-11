// Quick test script to verify settings API
const testSettings = async () => {
    try {
        // Test GET
        console.log('Testing GET /api/settings...');
        const getResponse = await fetch('http://localhost:5000/api/settings');
        const data = await getResponse.json();
        console.log('✅ GET Success:', JSON.stringify(data, null, 2));

        // Test PUT (requires admin token)
        console.log('\n⚠️  PUT requires authentication - test from frontend');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testSettings();

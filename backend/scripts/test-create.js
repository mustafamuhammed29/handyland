require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function testCreate() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    console.log('Testing user creation...');
    const testPassword = process.env.TEST_USER_PASSWORD || require('crypto').randomBytes(16).toString('hex');
    const { data, error } = await supabase.auth.admin.createUser({
        email: 'temp-' + Date.now() + '@example.com',
        password: testPassword,
        email_confirm: true
    });
    if (error) console.error('Create Error:', error);
    else console.log('Create Success:', data.user.id);
}

testCreate();

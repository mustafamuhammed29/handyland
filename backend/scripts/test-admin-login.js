require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testAdminLogin() {
    try {
        const email = 'admin2@handyland.com';
        const password = 'password1234';
        
        console.log(`Testing login for ${email}...`);
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('Login FAILED:', error.message);
        } else {
            console.log('Login SUCCESSFUL!');
            console.log('User ID:', data.user.id);
            console.log('Role:', data.user.app_metadata.role);
            
            // Check public profile
            const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
            console.log('Public Profile:', profile ? `Found (Role: ${profile.role})` : 'NOT FOUND');
        }

    } catch (error) {
        console.error('Unexpected Error:', error.message);
    }
}

testAdminLogin();

require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createNewAdmin() {
    try {
        const newEmail = process.env.NEW_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        const password = process.env.NEW_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

        if (!newEmail || !password) {
            console.error('❌ Missing credentials. Please provide NEW_ADMIN_EMAIL and NEW_ADMIN_PASSWORD.');
            process.exit(1);
        }

        console.log(`Attempting to create a NEW admin: ${newEmail}`);
        
        const { data, error } = await supabase.auth.admin.createUser({
            email: newEmail,
            password,
            email_confirm: true,
            user_metadata: { name: 'Admin User' }
        });

        if (error) {
            console.error('Creation FAILED:', error.message);
        } else {
            console.log('Admin account CREATED! ID:', data.user.id);
            
            // Manually ensure role is admin
            await supabase.from('users').update({ role: 'admin' }).eq('id', data.user.id);
            console.log('Role updated to admin.');
            console.log(`Email: ${newEmail}`);
        }

    } catch (error) {
        console.error('Unexpected Error:', error.message);
    }
}

createNewAdmin();

require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createNewAdmin() {
    try {
        const newEmail = 'admin2@handyland.com';
        console.log(`Attempting to create a NEW admin: ${newEmail}`);
        
        const { data, error } = await supabase.auth.admin.createUser({
            email: newEmail,
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: 'Admin Two' }
        });

        if (error) {
            console.error('Creation FAILED:', error.message);
        } else {
            console.log('Admin account CREATED! ID:', data.user.id);
            
            // Manually ensure role is admin
            await supabase.from('users').update({ role: 'admin' }).eq('id', data.user.id);
            console.log('Role updated to admin.');
            
            console.log('Login credentials:');
            console.log(`Email: ${newEmail}`);
            console.log('Pass:  password123');
        }

    } catch (error) {
        console.error('Unexpected Error:', error.message);
    }
}

createNewAdmin();

require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function createAdmin() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    console.log('Creating fresh admin...');
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin_new@handyland.com',
        password: 'password1234',
        email_confirm: true,
        user_metadata: { name: 'Admin Fresh' }
    });

    if (createError) {
        console.error('Create Error:', createError.message);
        return;
    }

    console.log('New User ID:', user.id);

    // 3. Upsert Profile in public.users
    console.log('Updating public profile...');
    const { error: profError } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            email: 'admin_new@handyland.com',
            name: 'Admin Fresh',
            role: 'admin',
            is_active: true
        });

    if (profError) {
        console.error('Profile Error:', profError.message);
    } else {
        console.log('✅ Admin user created successfully!');
    }
}

createAdmin();

require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function createAdmin() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const email = process.env.NEW_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const password = process.env.NEW_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const name = process.env.NEW_ADMIN_NAME || 'HandyLand Admin';

    if (!email || !password) {
        console.error('❌ Missing admin creation credentials.');
        console.error('   Please provide NEW_ADMIN_EMAIL and NEW_ADMIN_PASSWORD via environment variables.');
        process.exit(1);
    }
    
    console.log(`Creating fresh admin: ${email}...`);
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
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

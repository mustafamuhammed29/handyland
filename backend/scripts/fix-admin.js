require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function fixAdmin() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    const email = process.env.ADMIN_REPAIR_EMAIL || process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_REPAIR_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ Missing credentials. Please provide ADMIN_REPAIR_EMAIL and ADMIN_REPAIR_PASSWORD.');
        process.exit(1);
    }

    console.log(`Cleaning up ${email}...`);

    // 1. List users to find the ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Cannot list users:', listError.message);
    } else {
        const existing = users.find(u => u.email === email);
        if (existing) {
            console.log('Deleting existing Auth user:', existing.id);
            await supabase.auth.admin.deleteUser(existing.id);
        }
    }

    // 2. Create fresh user
    console.log('Creating fresh Auth user...');
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
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
            email: 'admin2@handyland.com',
            name: 'Admin Fresh',
            role: 'admin',
            is_active: true
        });

    if (profError) {
        console.error('Profile Error:', profError.message);
    } else {
        console.log('✅ Admin user restored successfully!');
    }
}

fixAdmin();

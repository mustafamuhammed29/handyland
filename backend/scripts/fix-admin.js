require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function fixAdmin() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    console.log('Cleaning up admin2@handyland.com...');
    
    // 1. List users to find the ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Cannot list users:', listError.message);
        // If we can't list, we might have a serious problem.
        // Try to create anyway.
    } else {
        const existing = users.find(u => u.email === 'admin2@handyland.com');
        if (existing) {
            console.log('Deleting existing Auth user:', existing.id);
            await supabase.auth.admin.deleteUser(existing.id);
        }
    }

    // 2. Create fresh user
    console.log('Creating fresh Auth user...');
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin2@handyland.com',
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

require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function repairAdminProper() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const email = 'admin@handyland.com';
    const password = 'admin123';

    console.log(`Repairing admin: ${email}...`);

    // 1. Delete old profile if exists to avoid conflicts
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (!listError) {
        const existing = users.find(u => u.email === email);
        if (existing) {
            console.log('Deleting existing Auth user:', existing.id);
            await supabase.auth.admin.deleteUser(existing.id);
        }
    }

    const { error: delError } = await supabase
        .from('users')
        .delete()
        .eq('email', email);
    
    // 2. Create in Auth
    console.log('Creating fresh Auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Admin HandyLand' }
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
        return;
    }

    console.log('Auth user created successfully with ID:', authData.user.id);

    // 3. Update profile role to admin
    console.log('Updating public profile...');
    const { error: updateError } = await supabase
        .from('users')
        .upsert({
            id: authData.user.id,
            email: email,
            name: 'Admin HandyLand',
            role: 'admin',
            is_active: true
        });

    if (updateError) {
        console.error('Update Error:', updateError.message);
    } else {
        console.log('✅ Admin user restored successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

repairAdminProper();

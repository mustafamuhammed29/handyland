require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function repairAdmin() {
    const email = process.env.ADMIN_REPAIR_EMAIL || process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_REPAIR_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ Missing repair credentials.');
        console.error('   Please provide ADMIN_REPAIR_EMAIL and ADMIN_REPAIR_PASSWORD via environment variables.');
        process.exit(1);
    }

    console.log(`Repairing admin: ${email}...`);

    // 1. Delete old profile if exists to avoid conflicts
    const { error: delError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('email', email);
    
    if (delError) console.log('Note: No old profile found to delete or delete failed.');

    // 1.5. Find and delete auth user
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList.users.find(u => u.email === email);
    if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        console.log('Deleted existing auth user.');
    }

    // 2. Create in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'admin', name: 'Admin HandyLand' })
        .eq('id', authData.user.id);

    if (updateError) {
        console.error('Update Error:', updateError.message);
    } else {
        console.log('Admin profile updated successfully!');
    }
}

repairAdmin();

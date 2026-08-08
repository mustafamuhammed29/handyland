require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function repairAdmin() {
    const email = 'admin@handyland.de';
    const password = 'admin123456'; // المؤقت

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

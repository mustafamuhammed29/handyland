require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkUser() {
    console.log('--- Checking User ---');
    const email = 'mustafamohammad0545@gmail.com';
    
    // We can use the admin API to update the user's password directly
    // This bypassed the standard login rate limits if we just reset it for them.
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }
    
    const user = data.users.find(u => u.email === email);
    if (user) {
        console.log(`User found: ${user.id}`);
        // Let's reset the password to something temporary
        const newPassword = 'HandyLand2024!';
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword, email_confirm: true }
        );
        
        if (updateError) {
            console.error('Error updating user password:', updateError.message);
        } else {
            console.log(`Successfully updated password for ${email}.`);
            console.log(`New temporary password: ${newPassword}`);
        }
    } else {
        console.log(`User with email ${email} not found.`);
        // Create the user if it doesn't exist
        const newPassword = 'HandyLand2024!';
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: newPassword,
            email_confirm: true
        });
        
        if (createError) {
             console.error('Error creating user:', createError.message);
        } else {
             console.log(`Successfully created user ${email}.`);
             console.log(`Temporary password: ${newPassword}`);
        }
    }
}

checkUser().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

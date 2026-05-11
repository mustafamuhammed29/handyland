require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function forceResetPassword() {
    try {
        const userId = 'becc4862-61ef-41f5-bc77-c3a159ded0c9';
        const newPassword = 'password1234';
        
        console.log(`Force resetting password for ID ${userId} to ${newPassword}...`);
        
        const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) throw error;
        
        console.log('Password updated successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

forceResetPassword();

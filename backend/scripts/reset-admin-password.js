require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function forceResetPassword() {
    try {
        const userId = process.env.TARGET_USER_ID || process.argv[2];
        const newPassword = process.env.NEW_PASSWORD || process.argv[3];

        if (!userId || !newPassword) {
            console.error('❌ Missing reset parameters.');
            console.error('   Usage: TARGET_USER_ID=<uuid> NEW_PASSWORD=<pass> node reset-admin-password.js');
            console.error('   Or: node reset-admin-password.js <uuid> <password>');
            process.exit(1);
        }
        
        console.log(`Force resetting password for user ID ${userId}...`);
        
        const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) throw error;
        
        console.log('Password updated successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

forceResetPassword();

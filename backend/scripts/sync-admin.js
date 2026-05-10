require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function forceSyncAdmin() {
    try {
        const userId = 'becc4862-61ef-41f5-bc77-c3a159ded0c9';
        const email = 'admin2@handyland.com';
        
        console.log(`Force syncing profile for ${email} (${userId})...`);
        
        const { error } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: email,
                name: 'Admin Two',
                role: 'admin',
                is_active: true,
                is_verified: true,
                provider: 'local'
            }, { onConflict: 'id' });

        if (error) {
            console.error('Sync FAILED:', error.message);
        } else {
            console.log('Sync SUCCESSFUL! The link between Auth and Profile is now established.');
            console.log('You can now log in at http://localhost:3001');
        }

    } catch (error) {
        console.error('Unexpected Error:', error.message);
    }
}

forceSyncAdmin();

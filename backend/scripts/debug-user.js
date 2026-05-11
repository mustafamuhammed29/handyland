require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function debugUser() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    console.log('--- DEBUG USER: admin2@handyland.com ---');
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('List error:', listError);
        return;
    }
    
    const authUser = users.find(u => u.email === 'admin2@handyland.com');
    console.log('Auth Table User:', JSON.stringify(authUser, null, 2));
    
    if (authUser) {
        const { data: profile, error: profError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
            
        console.log('\nPublic Profile:', JSON.stringify(profile, null, 2));
        if (profError) console.error('Profile Error:', profError);
    }
}

debugUser();

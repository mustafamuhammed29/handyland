require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function checkHealth() {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_KEY;

    console.log('--- SUPABASE HEALTH CHECK ---');
    console.log('URL:', url);

    const sbAnon = createClient(url, anon);
    const sbAdmin = createClient(url, service);

    console.log('\n[1] Testing ANON key (public.users)...');
    try {
        const { data, error } = await sbAnon.from('users').select('count', { count: 'exact', head: true });
        if (error) console.error('❌ ANON Error:', error.message);
        else console.log('✅ ANON Success! Count:', data);
    } catch (e) { console.error('❌ ANON Exception:', e.message); }

    console.log('\n[2] Testing SERVICE_ROLE key (public.users)...');
    try {
        const { data, error } = await sbAdmin.from('users').select('count', { count: 'exact', head: true });
        if (error) console.error('❌ SERVICE_ROLE Error:', error.message);
        else console.log('✅ SERVICE_ROLE Success! Count:', data);
    } catch (e) { console.error('❌ SERVICE_ROLE Exception:', e.message); }

    console.log('\n[3] Testing AUTH sign-in (admin2@handyland.com)...');
    try {
        const { data, error } = await sbAdmin.auth.signInWithPassword({
            email: 'admin2@handyland.com',
            password: 'password1234'
        });
        if (error) console.error('❌ AUTH Error:', error.message, error);
        else console.log('✅ AUTH Success! User ID:', data.user.id);
    } catch (e) { console.error('❌ AUTH Exception:', e.message); }

    console.log('\n--- CHECK COMPLETE ---');
}

checkHealth();

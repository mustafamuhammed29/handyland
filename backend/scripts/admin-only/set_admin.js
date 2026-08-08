require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function setAdmin() {
    const { data: users, error } = await supabaseAdmin.from('users').select('id, email, role');
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    
    console.log('Current Users:');
    console.table(users);

    // Set all users to admin for now, or just print them if we want to be safe
    for (const u of users) {
        if (u.role !== 'admin') {
            await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', u.id);
            console.log(`Updated ${u.email} to admin`);
        }
    }
    console.log('Done');
}

setAdmin();

require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function forceDelete() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const id = 'becc4862-61ef-41f5-bc77-c3a159ded0c9';
    console.log('Force deleting user:', id);
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) console.error('Delete Error:', error.message);
    else console.log('Delete Success!');
}

forceDelete();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixViaSQL() {
  const corruptedEmails = [
    'mustafamohammad0545@gmail.com',
    'admin@handyland.de', 
    'jifesa7479@availors.com'
  ];

  for (const email of corruptedEmails) {
    console.log(`\nCleaning: ${email}`);

    // Try deleting via rpc
    const r1 = await supabase.rpc('exec_sql', {
      sql: `DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = '${email}')`
    });
    console.log('  identities:', r1.error ? r1.error.message : 'OK');

    const r2 = await supabase.rpc('exec_sql', {
      sql: `DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = '${email}')`
    });
    console.log('  sessions:', r2.error ? r2.error.message : 'OK');

    const r3 = await supabase.rpc('exec_sql', {
      sql: `DELETE FROM auth.users WHERE email = '${email}'`
    });
    console.log('  auth.users:', r3.error ? r3.error.message : 'OK');
  }

  // After cleanup, try to recreate
  console.log('\n=== Recreating users ===');
  const { data: dbUsers } = await supabase.from('users').select('id, email, name, role');
  
  for (const u of dbUsers) {
    const { error } = await supabase.auth.admin.getUserById(u.id);
    if (!error) {
      console.log(`${u.email}: Already OK ✅`);
      continue;
    }

    console.log(`Recreating: ${u.email}`);
    const defaultPass = u.role === 'admin' ? 'Admin@HandyLand2024!' : 'HandyLand2024!';
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: defaultPass,
      email_confirm: true,
      user_metadata: { name: u.name }
    });

    if (createErr) {
      console.log(`  FAIL: ${createErr.message}`);
    } else {
      console.log(`  Created with new ID: ${newUser.user.id}`);
      if (newUser.user.id !== u.id) {
        // Update DB
        await supabase.from('users').delete().eq('id', u.id);
        await supabase.from('users').insert({ ...u, id: newUser.user.id });
        console.log('  DB ID updated ✅');
      }
      console.log(`  Temp password: ${defaultPass}`);
    }
  }
}

fixViaSQL().catch(e => console.error('FATAL:', e));

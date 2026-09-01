const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixViaSQL() {
  const corruptedEmails = process.env.CORRUPTED_EMAILS ? process.env.CORRUPTED_EMAILS.split(',') : (process.argv[2] ? [process.argv[2]] : []);

  if (corruptedEmails.length === 0) {
    console.log('ℹ️ No corrupted emails specified. Pass via CORRUPTED_EMAILS=email1,email2 or as CLI argument.');
    return;
  }

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
  
  const defaultAdminPass = process.env.DEFAULT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const defaultUserPass = process.env.DEFAULT_USER_PASSWORD;

  if (!defaultAdminPass || !defaultUserPass) {
    console.error('❌ Missing recreation passwords.');
    console.error('   Please provide DEFAULT_ADMIN_PASSWORD and DEFAULT_USER_PASSWORD via environment variables.');
    process.exit(1);
  }

  for (const u of dbUsers) {
    const { error } = await supabase.auth.admin.getUserById(u.id);
    if (!error) {
      console.log(`${u.email}: Already OK ✅`);
      continue;
    }

    console.log(`Recreating: ${u.email}`);
    const defaultPass = u.role === 'admin' ? defaultAdminPass : defaultUserPass;
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

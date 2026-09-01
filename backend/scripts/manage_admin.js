/**
 * backend/scripts/manage_admin.js
 * Utility to inspect all users and grant admin privileges.
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetEmail = process.argv[2];

    console.log('\n============================================================');
    console.log('👥 Handyland User & Admin Role Inspector');
    console.log('============================================================\n');

    // 1. Fetch all users from public.users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, is_active, is_verified, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error reading public.users:', error.message);
        process.exit(1);
    }

    console.log(`📋 Found ${users.length} users in database:\n`);
    users.forEach((u, i) => {
        const isAdmin = u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'administrator';
        const badge = isAdmin ? '👑 [ADMIN]' : '👤 [USER] ';
        console.log(`  ${i + 1}. ${badge} ${u.email} | Name: ${u.name || 'N/A'} | Role: "${u.role}" | Active: ${u.is_active} | Verified: ${u.is_verified}`);
    });

    // 2. If target email provided, promote it to admin
    if (targetEmail) {
        const emailToPromote = targetEmail.trim().toLowerCase();
        console.log(`\n⚡ Promoting ${emailToPromote} to ADMIN...`);

        const foundUser = users.find(u => u.email?.toLowerCase() === emailToPromote);

        if (!foundUser) {
            console.log(`⚠️ User with email "${emailToPromote}" not found in public.users.`);
            console.log(`Creating / Upserting admin profile...`);
        }

        const { data: updated, error: updateErr } = await supabase
            .from('users')
            .update({
                role: 'admin',
                is_active: true,
                is_verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('email', emailToPromote)
            .select();

        if (updateErr) {
            console.error('❌ Promotion error:', updateErr.message);
        } else if (updated && updated.length > 0) {
            console.log(`✅ SUCCESS! ${emailToPromote} is now an ACTIVE & VERIFIED ADMIN (role='admin').`);
        } else {
            console.log(`⚠️ No rows updated for ${emailToPromote}.`);
        }
    } else {
        console.log('\n💡 To promote an existing user to admin, run:');
        console.log('   node scripts/manage_admin.js your-email@example.com\n');
    }

    console.log('============================================================\n');
}

main().catch(err => {
    console.error('❌ Exception:', err);
    process.exit(1);
});

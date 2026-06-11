require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    console.log('--- Cleaning E2E Products ---');
    const { data: e2eProducts } = await sb.from('products').select('*').like('name', '%(E2E)%');
    if (e2eProducts && e2eProducts.length > 0) {
        console.log(`Found ${e2eProducts.length} E2E products to delete...`);
        for (let p of e2eProducts) {
            await sb.from('products').delete().eq('id', p.id);
            console.log(`Deleted: ${p.name}`);
        }
    } else {
        console.log('No E2E products found.');
    }

    console.log('\n--- Cleaning Duplicate Services ---');
    const { data: services } = await sb.from('services').select('*');
    if (services) {
        // Group by name
        const byName = {};
        for (let s of services) {
            if (!byName[s.name]) byName[s.name] = [];
            byName[s.name].push(s);
        }
        
        for (let name in byName) {
            if (byName[name].length > 1) {
                console.log(`Found ${byName[name].length} duplicates for "${name}". Deleting all but one...`);
                // Keep the first one, delete the rest
                for (let i = 1; i < byName[name].length; i++) {
                    await sb.from('services').delete().eq('id', byName[name][i].id);
                    console.log(`Deleted duplicate ID: ${byName[name][i].id}`);
                }
            }
        }
    }

    console.log('\n--- Checking Settings ---');
    const { data: settings } = await sb.from('settings').select('*').in('key', ['announcementBanner', 'settings', 'data']);
    console.log(settings);

    console.log('Done.');
}

run().catch(console.error);

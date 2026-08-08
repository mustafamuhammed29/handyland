require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    console.log('--- Updating Contact and Banner in Settings ---');
    
    // First fetch the current settings
    const { data: settingsList } = await sb.from('settings').select('*');
    if (!settingsList || settingsList.length === 0) {
        console.error('No settings found!');
        return;
    }
    
    const settings = settingsList[0];
    
    const newContactSection = {
        ...settings.contact_section,
        phone: '+49 151 12345678',
        email: 'info@handy-land-hd.de'
    };
    
    // Also fix the announcement banner (Bug 2) which currently shows ID "514532"
    let newBanner = settings.announcement_banner;
    if (newBanner && newBanner.text && newBanner.text.includes('514532')) {
        newBanner.text = 'Willkommen bei HANDYLAND - Premium Gerätehandel & Reparatur';
    }
    
    const { error } = await sb.from('settings').update({
        contact_section: newContactSection,
        announcement_banner: newBanner
    }).eq('id', settings.id);
    
    if (error) {
        console.error('Failed to update settings', error);
    } else {
        console.log('Settings updated successfully!');
    }
}

run().catch(console.error);

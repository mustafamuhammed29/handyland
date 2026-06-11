require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function updateSetting(key, updater) {
    const { data } = await sb.from('settings').select('*').eq('key', key).single();
    if (!data) {
        console.error(`Key ${key} not found.`);
        return;
    }
    const val = JSON.parse(data.value);
    const newVal = updater(val);
    const { error } = await sb.from('settings').update({ value: JSON.stringify(newVal) }).eq('key', key);
    if (error) {
        console.error(`Failed to update ${key}:`, error);
    } else {
        console.log(`Updated ${key} successfully.`);
    }
}

async function run() {
    // 1. Update contactSection
    await updateSetting('contactSection', (val) => {
        val.email = 'info@handy-land-hd.de';
        val.phone = '+49 151 12345678';
        val.whatsappPhone = '+49 151 12345678';
        return val;
    });

    // 2. Update features (whatsappOrders phoneNumber)
    await updateSetting('features', (val) => {
        if (val.whatsappOrders) {
            val.whatsappOrders.phoneNumber = '+49 151 12345678';
        }
        return val;
    });

    // 3. Update announcementBanner (Bug 2)
    await updateSetting('announcementBanner', (val) => {
        if (val.text && val.text.includes('514532')) {
            val.text = 'Willkommen bei HANDYLAND - Premium Gerätehandel & Reparatur';
        }
        return val;
    });
}

run().catch(console.error);

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    console.log('--- Cleaning Duplicate Services in JSON Arrays ---');
    const { data: devices } = await sb.from('repair_devices').select('id, model, services');
    if (devices) {
        for (let device of devices) {
            if (device.services && Array.isArray(device.services)) {
                // Deduplicate by service.type or service.label
                const uniqueServices = [];
                const seenTypes = new Set();
                const seenLabels = new Set();
                
                for (let s of device.services) {
                    const typeKey = s.type ? String(s.type).toLowerCase() : null;
                    const labelKey = s.label ? String(s.label).toLowerCase() : null;
                    
                    if (typeKey && seenTypes.has(typeKey)) continue;
                    if (labelKey && seenLabels.has(labelKey)) continue;
                    
                    if (typeKey) seenTypes.add(typeKey);
                    if (labelKey) seenLabels.add(labelKey);
                    
                    uniqueServices.push(s);
                }
                
                if (uniqueServices.length < device.services.length) {
                    console.log(`Found duplicates in ${device.model}. Reducing from ${device.services.length} to ${uniqueServices.length}.`);
                    await sb.from('repair_devices').update({ services: uniqueServices }).eq('id', device.id);
                }
            }
        }
    }
    console.log('Done.');
}

run().catch(console.error);

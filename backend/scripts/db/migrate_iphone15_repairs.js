/**
 * backend/scripts/db/migrate_iphone15_repairs.js
 * Migration script: Updates the iPhone 15 repair services in Supabase to distinct, properly labeled services.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabaseAdmin } = require('../../config/supabase');

const IPHONE_15_SERVICES = [
    {
        type: 'screen',
        label: 'Display-Reparatur (OLED / Glas)',
        price: 189,
        duration: '1-2 Std.',
        warranty: '12 Monate'
    },
    {
        type: 'battery',
        label: 'Akkutausch (Originalqualität)',
        price: 89,
        duration: '45 Min.',
        warranty: '12 Monate'
    },
    {
        type: 'backglass',
        label: 'Rückglas / Backcover-Reparatur',
        price: 119,
        duration: '1-2 Std.',
        warranty: '12 Monate'
    },
    {
        type: 'camera',
        label: 'Hauptkamera / Linsen-Reparatur',
        price: 129,
        duration: '1 Std.',
        warranty: '12 Monate'
    },
    {
        type: 'charging',
        label: 'USB-C Ladebuchse / Mikrofon',
        price: 79,
        duration: '45 Min.',
        warranty: '12 Monate'
    },
    {
        type: 'other',
        label: 'Fehlerdiagnose & Kostenvoranschlag',
        price: 29,
        duration: '30 Min.',
        warranty: 'Kostenlos bei Reparatur'
    }
];

async function updateIPhone15Repairs() {
    console.log('--- Updating iPhone 15 repair services in Supabase ---');

    const { data: devices, error: findError } = await supabaseAdmin
        .from('repair_devices')
        .select('id, model, brand')
        .ilike('model', '%iPhone 15%');

    if (findError) {
        console.error('❌ Error finding iPhone 15 devices:', findError);
        process.exit(1);
    }

    if (!devices || devices.length === 0) {
        console.log('⚠️ No iPhone 15 device found in repair_devices.');
        return;
    }

    for (const device of devices) {
        console.log(`Updating device: ${device.model} (${device.id})`);
        const { error: updateError } = await supabaseAdmin
            .from('repair_devices')
            .update({
                services: IPHONE_15_SERVICES,
                updated_at: new Date().toISOString()
            })
            .eq('id', device.id);

        if (updateError) {
            console.error(`❌ Failed to update ${device.model}:`, updateError);
        } else {
            console.log(`✅ Successfully updated ${device.model} with ${IPHONE_15_SERVICES.length} distinct services.`);
        }
    }

    console.log('--- Done ---');
}

if (require.main === module) {
    updateIPhone15Repairs()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { updateIPhone15Repairs, IPHONE_15_SERVICES };

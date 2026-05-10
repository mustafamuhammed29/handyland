require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkAndSeedContact() {
    try {
        console.log('Checking contact settings...');
        const { data: existing } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'contactSection')
            .single();

        if (existing) {
            console.log('Current Contact Settings:', JSON.stringify(existing.value, null, 2));
        } else {
            console.log('Contact settings missing. Seeding now...');
            const contactData = {
                address: 'Berlin, HQ',
                phone: '+49 30 1234 5678',
                email: 'support@handyland.de',
                formTitle: 'Sicherer Nachrichtenkanal',
                formButton: 'Protokoll senden',
                mapUrl: '',
                socialLinks: [
                    { platform: 'Facebook', iconName: 'Facebook', url: '#' },
                    { platform: 'Instagram', iconName: 'Instagram', url: '#' }
                ]
            };

            const { error } = await supabase
                .from('settings')
                .upsert({ 
                    key: 'contactSection', 
                    value: contactData,
                    group: 'general'
                });

            if (error) throw error;
            console.log('Contact settings seeded successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAndSeedContact();

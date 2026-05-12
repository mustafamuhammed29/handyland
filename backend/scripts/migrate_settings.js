require('dotenv').config();
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'handyland';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrateSettings() {
    console.log('Starting settings migration from MongoDB to Supabase...');
    const mongoClient = new MongoClient(MONGO_URI);

    try {
        await mongoClient.connect();
        const db = mongoClient.db(DB_NAME);
        
        // Fetch the single settings document
        const settingsDoc = await db.collection('settings').findOne({});
        if (!settingsDoc) {
            console.log('No settings document found in MongoDB. Exiting.');
            return;
        }

        console.log(`Found settings document in MongoDB with ${Object.keys(settingsDoc).length} keys.`);

        // The old settings structure maps keys to groups, usually 'general' or 'email'.
        const determineGroup = (key) => {
            if (key === 'smtp' || key.startsWith('smtp_')) return 'email';
            return 'general';
        };

        for (const [key, value] of Object.entries(settingsDoc)) {
            // Skip MongoDB identifier and empty values that might corrupt parsing
            if (key === '_id' || key === '__v') continue;

            const group = determineGroup(key);
            let stringifiedValue = typeof value === 'object' && value !== null 
                ? JSON.stringify(value) 
                : String(value);

            // Special handling for legacy top-level contact mapping if needed, 
            // but we'll just upsert exactly what was in MongoDB to match the new structure.
            // Supabase uses 'contactSection' for the contact form block, and 'contact_email', 'contact_phone' for primitives.
            // If the old MongoDB used 'contact' object, we'll upsert it as 'contact'.
            
            const { error } = await supabase
                .from('settings')
                .upsert(
                    {
                        key,
                        value: stringifiedValue,
                        group,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'key' }
                );

            if (error) {
                console.error(`Failed to upsert key '${key}':`, error.message);
            } else {
                console.log(`Successfully migrated setting: ${key}`);
            }
        }

        console.log('Settings migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoClient.close();
    }
}

migrateSettings();

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'handyland';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrateTranslations() {
    console.log('Starting translations migration from MongoDB to Supabase...');
    const mongoClient = new MongoClient(MONGO_URI);

    try {
        await mongoClient.connect();
        const db = mongoClient.db(DB_NAME);
        
        const translations = await db.collection('translations').find({}).toArray();
        console.log(`Found ${translations.length} translation keys in MongoDB.`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        const batchSize = 100;
        let currentBatch = [];

        for (const doc of translations) {
            const { key, namespace = 'translation', values } = doc;
            
            if (!key || !values) {
                skipCount++;
                continue;
            }

            for (const [language, value] of Object.entries(values)) {
                if (!value) continue;
                
                currentBatch.push({
                    key,
                    language,
                    namespace,
                    value
                });

                if (currentBatch.length >= batchSize) {
                    const { error } = await supabase
                        .from('translations')
                        .upsert(currentBatch, { onConflict: 'key,language,namespace' });
                        
                    if (error) {
                        console.error('Error upserting batch:', error.message);
                        errorCount += currentBatch.length;
                    } else {
                        successCount += currentBatch.length;
                    }
                    currentBatch = [];
                }
            }
        }

        // Final batch
        if (currentBatch.length > 0) {
            const { error } = await supabase
                .from('translations')
                .upsert(currentBatch, { onConflict: 'key,language,namespace' });
                
            if (error) {
                console.error('Error upserting final batch:', error.message);
                errorCount += currentBatch.length;
            } else {
                successCount += currentBatch.length;
            }
        }

        console.log(`Translation migration completed!`);
        console.log(`Success: ${successCount}`);
        console.log(`Skipped: ${skipCount}`);
        console.log(`Errors: ${errorCount}`);
        
        // Let's also trigger the front-end locales update since the DB has the correct ones now.
        console.log('You might want to run the pull-translations script if you want to sync JSON files.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoClient.close();
    }
}

migrateTranslations();

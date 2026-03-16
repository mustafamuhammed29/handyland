const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const Translation = require('./models/Translation');

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland', {});

// Helper to flatten nested JSON object to { "key.nested": "value" }
const flattenObject = (obj, prefix = '') =>
    Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});


const seedTranslations = async () => {
    try {
        console.log('Clearing existing translations...');
        // Uncomment next line if you want the script to purge first
        // await Translation.deleteMany();

        const dataDir = path.join(__dirname, '..', 'front-end', 'public', 'locales');
        
        // Define fallback source of truth. We will load 'en' and 'de' from the frontend legacy files
        const langs = ['en', 'de', 'ar', 'ru', 'tr', 'fa'];
        
        const finalMap = {};

        for (const lang of langs) {
            const filePath = path.join(dataDir, lang, 'translation.json');
            if (fs.existsSync(filePath)) {
                console.log(`Loading ${lang}...`);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const flat = flattenObject(content);
                
                // Merge into finalMap
                for (const [key, val] of Object.entries(flat)) {
                    if (!finalMap[key]) finalMap[key] = { namespace: 'translation', values: {} };
                    finalMap[key].values[lang] = val;
                }
            }
        }

        console.log(`Prepared ${Object.keys(finalMap).length} translation keys.`);

        let inserted = 0;
        let skipped = 0;

        for (const [key, data] of Object.entries(finalMap)) {
            try {
                // Upsert to ensure we don't crash on duplicates
                await Translation.findOneAndUpdate(
                    { key },
                    { 
                        $set: { namespace: data.namespace },
                        // In case it exists, we merge whatever we parsed into its values map
                        $set: { 'values.en': data.values.en, 'values.de': data.values.de, 'values.tr': data.values.tr, 'values.ru': data.values.ru, 'values.ar': data.values.ar, 'values.fa': data.values.fa }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                inserted++;
            } catch (err) {
                console.error(`Error inserting ${key}:`, err.message);
                skipped++;
            }
        }

        console.log(`✅ Seed Completed. Inserted/Updated: ${inserted}, Errors: ${skipped}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedTranslations();

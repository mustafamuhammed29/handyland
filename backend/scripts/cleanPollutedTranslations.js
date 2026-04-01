/**
 * cleanPollutedTranslations.js
 * ----------------------------
 * Cleans translation entries where the stored value equals the key name.
 * This happens when i18next saveMissing sends { "key": "key" } to the backend.
 * 
 * Usage:
 *   node backend/scripts/cleanPollutedTranslations.js
 * 
 * Safe to run multiple times — only clears values that equal their key.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Translation = require('../models/Translation');

const SUPPORTED_LANGS = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];

const cleanPolluted = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const all = await Translation.find();
        let totalCleaned = 0;
        let docsUpdated = 0;

        for (const doc of all) {
            let dirty = false;

            for (const lang of SUPPORTED_LANGS) {
                const val = doc.values?.[lang];
                if (val && val === doc.key) {
                    // This value is the key name — it's polluted
                    console.log(`  🧹 Clearing ${lang} value for: ${doc.key}  (was: "${val}")`);
                    doc.values[lang] = '';
                    dirty = true;
                    totalCleaned++;
                }
            }

            if (dirty) {
                doc.markModified('values');
                await doc.save();
                docsUpdated++;
            }
        }

        console.log('\n─────────────────────────────────');
        console.log(`✅ Done!`);
        console.log(`   Documents updated : ${docsUpdated}`);
        console.log(`   Values cleared    : ${totalCleaned}`);
        if (totalCleaned === 0) {
            console.log('   (No polluted data found — DB is already clean)');
        }
        console.log('─────────────────────────────────\n');

    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

cleanPolluted();

/**
 * seedTranslations.js
 * -------------------
 * FIX 2: Seeds all translation keys from the local JSON files into MongoDB.
 * 
 * The i18n system loads translations from the Backend API (not local files),
 * so new keys added to translation.json must be pushed to the DB first.
 * 
 * Usage:
 *   node backend/scripts/seedTranslations.js
 * 
 * Supports: upsert (safe to run multiple times — won't overwrite existing values)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Translation = require('../models/Translation');

// ─── Config ──────────────────────────────────────────────────────────────────

const LOCALES_DIR = path.join(__dirname, '../../front-end/public/locales');
const SUPPORTED_LANGS = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively flatten { nav: { home: "Startseite" } }
 * into { "nav.home": "Startseite" }
 */
const flattenObject = (obj, prefix = '') => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(acc, flattenObject(value, fullKey));
        } else {
            acc[fullKey] = String(value);
        }
        return acc;
    }, {});
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const seedTranslations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected\n');

        // Step 1: build a master map of { key → { en: '...', de: '...', ar: '...' } }
        const masterMap = {};

        for (const lang of SUPPORTED_LANGS) {
            const filePath = path.join(LOCALES_DIR, lang, 'translation.json');

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Skipping ${lang} — file not found: ${filePath}`);
                continue;
            }

            const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const flat = flattenObject(raw);

            console.log(`📄 ${lang}: ${Object.keys(flat).length} keys`);

            for (const [key, value] of Object.entries(flat)) {
                if (!masterMap[key]) {
                    // Derive namespace from key prefix (e.g. "orders.cancel" → "orders")
                    const namespace = key.includes('.') ? key.split('.')[0] : 'translation';
                    masterMap[key] = { namespace, values: {} };
                }
                masterMap[key].values[lang] = value;
            }
        }

        // Step 2: upsert each key into MongoDB
        const keys = Object.keys(masterMap);
        console.log(`\n🔄 Upserting ${keys.length} keys into MongoDB...\n`);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const key of keys) {
            const { namespace, values } = masterMap[key];
            const existing = await Translation.findOne({ key });

            if (!existing) {
                // New key — create it
                await Translation.create({ key, namespace, values });
                created++;
                console.log(`  ➕ CREATE  ${key}`);
            } else {
                // Key exists — only fill in missing language slots, never overwrite
                let needsSave = false;
                for (const [lang, value] of Object.entries(values)) {
                    if (!existing.values[lang] && value) {
                        existing.values[lang] = value;
                        needsSave = true;
                    }
                }
                if (needsSave) {
                    existing.markModified('values');
                    await existing.save();
                    updated++;
                    console.log(`  ✏️  UPDATE  ${key}`);
                } else {
                    skipped++;
                }
            }
        }

        console.log('\n─────────────────────────────────');
        console.log(`✅ Done!`);
        console.log(`   Created : ${created}`);
        console.log(`   Updated : ${updated}`);
        console.log(`   Skipped : ${skipped} (already complete)`);
        console.log('─────────────────────────────────\n');

    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

seedTranslations();

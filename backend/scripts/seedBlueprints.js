/**
 * Seed Script: Device Blueprints (BackMarket Style)
 * Run with: node backend/scripts/seedBlueprints.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/handyland';

const deviceBlueprintSchema = new mongoose.Schema({
    model: String, brand: String, basePrice: Number, image: String,
    validStorages: [String],
    storagePrices: { type: Map, of: Number, default: {} },
    screenModifiers: {
        hervorragend: { type: Number, default: 1.0 },
        sehr_gut: { type: Number, default: 0.9 },
        gut: { type: Number, default: 0.75 },
        beschadigt: { type: Number, default: 0.5 }
    },
    bodyModifiers: {
        hervorragend: { type: Number, default: 1.0 },
        sehr_gut: { type: Number, default: 0.95 },
        gut: { type: Number, default: 0.85 },
        beschadigt: { type: Number, default: 0.6 }
    },
    functionalMultiplier: { type: Number, default: 1.0 },
    nonFunctionalMultiplier: { type: Number, default: 0.4 },
    category: { type: String, default: 'Smartphone' },
    active: { type: Boolean, default: true }
}, { timestamps: true });

const DeviceBlueprint = mongoose.model('DeviceBlueprint', deviceBlueprintSchema);

const SEED_DATA = [
    // ── APPLE ──────────────────────────────────────────────
    {
        brand: 'Apple', model: 'iPhone 15 Pro',
        basePrice: 350,
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch_GEO_EMEA?wid=5120&hei=2880&fmt=p-jpg',
        validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 40, '512GB': 90, '1TB': 160 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.92, gut: 0.78, beschadigt: 0.50 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.96, gut: 0.86, beschadigt: 0.62 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.35
    },
    {
        brand: 'Apple', model: 'iPhone 15',
        basePrice: 270,
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch?wid=5120&hei=2880&fmt=p-jpg',
        validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 35, '512GB': 80 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.90, gut: 0.75, beschadigt: 0.50 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.95, gut: 0.85, beschadigt: 0.60 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.40
    },
    {
        brand: 'Apple', model: 'iPhone 14',
        basePrice: 200,
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg',
        validStorashes: ['128GB', '256GB', '512GB'],
        validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 30, '512GB': 70 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.90, gut: 0.75, beschadigt: 0.48 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.95, gut: 0.84, beschadigt: 0.58 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.40
    },
    {
        brand: 'Apple', model: 'iPhone 13',
        basePrice: 160,
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-6-1inch-midnight?wid=5120&hei=2880&fmt=p-jpg',
        validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 25, '512GB': 60 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.90, gut: 0.74, beschadigt: 0.48 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.94, gut: 0.83, beschadigt: 0.57 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.40
    },
    {
        brand: 'Apple', model: 'iPhone 12',
        basePrice: 100,
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-black-select-2020?wid=940&hei=1112&fmt=png-alpha',
        validStorages: ['64GB', '128GB', '256GB'],
        storagePrices: { '64GB': 0, '128GB': 15, '256GB': 40 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.88, gut: 0.72, beschadigt: 0.45 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.92, gut: 0.80, beschadigt: 0.55 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.38
    },

    // ── SAMSUNG ────────────────────────────────────────────
    {
        brand: 'Samsung', model: 'Galaxy S24 Ultra',
        basePrice: 380,
        image: 'https://images.samsung.com/is/image/samsung/p6pim/de/2401/gallery/de-galaxy-s24-ultra-s928-sm-s928bzaheub-thumb-539573286',
        validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 60, '1TB': 120 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.92, gut: 0.78, beschadigt: 0.50 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.96, gut: 0.86, beschadigt: 0.62 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.35
    },
    {
        brand: 'Samsung', model: 'Galaxy S24',
        basePrice: 250,
        image: 'https://images.samsung.com/is/image/samsung/p6pim/de/2401/gallery/de-galaxy-s24-s921-sm-s921bzadeub-thumb-539573291',
        validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 35 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.90, gut: 0.75, beschadigt: 0.50 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.95, gut: 0.85, beschadigt: 0.60 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.40
    },
    {
        brand: 'Samsung', model: 'Galaxy A55',
        basePrice: 130,
        image: 'https://images.samsung.com/is/image/samsung/p6pim/de/sm-a556blbaeub/gallery/de-galaxy-a55-5g-sm-a556-501099-sm-a556blbaeub-thumb-540164647',
        validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 25 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.88, gut: 0.72, beschadigt: 0.45 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.93, gut: 0.82, beschadigt: 0.58 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.40
    },

    // ── GOOGLE ─────────────────────────────────────────────
    {
        brand: 'Google', model: 'Pixel 8 Pro',
        basePrice: 280,
        image: 'https://store.google.com/de/product/pixel_8_pro_specs_images/pixel8pro_gray.png',
        validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 35, '512GB': 80, '1TB': 150 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.91, gut: 0.76, beschadigt: 0.50 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.95, gut: 0.85, beschadigt: 0.60 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.38
    },
    {
        brand: 'Google', model: 'Pixel 7a',
        basePrice: 160,
        image: 'https://store.google.com/de/product/pixel_7a_specs_images/pixel_7a_black.png',
        validStorages: ['128GB'],
        storagePrices: { '128GB': 0 },
        screenModifiers: { hervorragend: 1.0, sehr_gut: 0.90, gut: 0.74, beschadigt: 0.48 },
        bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.94, gut: 0.83, beschadigt: 0.57 },
        functionalMultiplier: 1.0, nonFunctionalMultiplier: 0.40
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB:', MONGO_URI);

        // Drop the old stale index (modelName_1) if it exists
        try {
            await mongoose.connection.collection('deviceblueprints').dropIndex('modelName_1');
            console.log('🗑️  Dropped stale index: modelName_1');
        } catch (e) {
            console.log('ℹ️  No old modelName_1 index found (safe to ignore)');
        }

        // Wipe existing blueprints
        const deleted = await DeviceBlueprint.deleteMany({});
        console.log(`🗑️  Deleted ${deleted.deletedCount} existing blueprints`);

        // Insert seed data
        const result = await DeviceBlueprint.insertMany(SEED_DATA);
        console.log(`✅ Inserted ${result.length} device blueprints:`);
        result.forEach(d => console.log(`   → ${d.brand} ${d.model} (Base: €${d.basePrice})`));

        await mongoose.disconnect();
        console.log('\n🎉 Done! Open the Admin Panel → Valuation to see the new devices.');
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
}

seed();

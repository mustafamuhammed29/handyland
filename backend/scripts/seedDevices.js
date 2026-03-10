/**
 * seedDevices.js — HandyLand Device Blueprint Seeder
 * 
 * Prices based on European market buyback rates (Rebuy.de + BackMarket.de averages)
 * as of Q1 2025. basePrice = "Excellent / Hervorragend" condition, 128GB tier.
 * 
 * Run: node scripts/seedDevices.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DeviceBlueprint = require('../models/DeviceBlueprint');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/handyland';

// ─── Price Methodology ──────────────────────────────────────────────────────
// basePrice = avg(Rebuy ankaufspreis, BackMarket buyback) for 128GB Hervorragend
// storagePrices = addons on top of base (128GB = 0, 256GB = +30~60, 512GB = +80~120)
// screenModifiers: hervorragend=1.0, sehr_gut=0.88, gut=0.72, beschadigt=0.45
// bodyModifiers:   hervorragend=1.0, sehr_gut=0.93, gut=0.82, beschadigt=0.55
// functionalMultiplier: 1.0 (works) | nonFunctionalMultiplier: 0.35 (defect)
// ──────────────────────────────────────────────────────────────────────────────

const SCREEN_MODS = { hervorragend: 1.0, sehr_gut: 0.88, gut: 0.72, beschadigt: 0.45 };
const BODY_MODS = { hervorragend: 1.0, sehr_gut: 0.93, gut: 0.82, beschadigt: 0.55 };

const devices = [
    // ═══════════════════════ APPLE iPHONE ═══════════════════════

    // iPhone 16 Series (2024)
    {
        brand: 'Apple', model: 'iPhone 16 Pro Max', basePrice: 820, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 70, '1TB': 150 },
        image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-max-black-titanium-select?wid=600&hei=600&fmt=jpeg'
    },
    {
        brand: 'Apple', model: 'iPhone 16 Pro', basePrice: 720, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 60, '512GB': 120, '1TB': 200 }
    },
    {
        brand: 'Apple', model: 'iPhone 16 Plus', basePrice: 580, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 50, '512GB': 100 }
    },
    {
        brand: 'Apple', model: 'iPhone 16', basePrice: 500, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 45, '512GB': 90 }
    },

    // iPhone 15 Series (2023)
    {
        brand: 'Apple', model: 'iPhone 15 Pro Max', basePrice: 680, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 65, '1TB': 140 }
    },
    {
        brand: 'Apple', model: 'iPhone 15 Pro', basePrice: 580, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 55, '512GB': 110, '1TB': 185 }
    },
    {
        brand: 'Apple', model: 'iPhone 15 Plus', basePrice: 440, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 45, '512GB': 85 }
    },
    {
        brand: 'Apple', model: 'iPhone 15', basePrice: 390, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 40, '512GB': 80 }
    },

    // iPhone 14 Series (2022)
    {
        brand: 'Apple', model: 'iPhone 14 Pro Max', basePrice: 510, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 50, '512GB': 100, '1TB': 170 }
    },
    {
        brand: 'Apple', model: 'iPhone 14 Pro', basePrice: 430, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 45, '512GB': 90, '1TB': 155 }
    },
    {
        brand: 'Apple', model: 'iPhone 14 Plus', basePrice: 320, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 35, '512GB': 70 }
    },
    {
        brand: 'Apple', model: 'iPhone 14', basePrice: 280, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 30, '512GB': 65 }
    },

    // iPhone 13 Series (2021)
    {
        brand: 'Apple', model: 'iPhone 13 Pro Max', basePrice: 380, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 40, '512GB': 80, '1TB': 130 }
    },
    {
        brand: 'Apple', model: 'iPhone 13 Pro', basePrice: 320, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 35, '512GB': 70, '1TB': 120 }
    },
    {
        brand: 'Apple', model: 'iPhone 13', basePrice: 235, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 30, '512GB': 60 }
    },
    {
        brand: 'Apple', model: 'iPhone 13 mini', basePrice: 190, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 25, '512GB': 50 }
    },

    // iPhone 12 Series (2020)
    {
        brand: 'Apple', model: 'iPhone 12 Pro Max', basePrice: 270, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 30, '512GB': 60 }
    },
    {
        brand: 'Apple', model: 'iPhone 12 Pro', basePrice: 230, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 25, '512GB': 55 }
    },
    {
        brand: 'Apple', model: 'iPhone 12', basePrice: 175, validStorages: ['64GB', '128GB', '256GB'],
        storagePrices: { '64GB': -15, '128GB': 0, '256GB': 25 }
    },
    {
        brand: 'Apple', model: 'iPhone 12 mini', basePrice: 145, validStorages: ['64GB', '128GB', '256GB'],
        storagePrices: { '64GB': -10, '128GB': 0, '256GB': 20 }
    },

    // iPhone 11 Series
    {
        brand: 'Apple', model: 'iPhone 11 Pro Max', basePrice: 185, validStorages: ['64GB', '256GB', '512GB'],
        storagePrices: { '64GB': -10, '256GB': 20, '512GB': 45 }
    },
    {
        brand: 'Apple', model: 'iPhone 11 Pro', basePrice: 160, validStorages: ['64GB', '256GB', '512GB'],
        storagePrices: { '64GB': -10, '256GB': 18, '512GB': 40 }
    },
    {
        brand: 'Apple', model: 'iPhone 11', basePrice: 120, validStorages: ['64GB', '128GB', '256GB'],
        storagePrices: { '64GB': -8, '128GB': 0, '256GB': 15 }
    },

    // ═══════════════════════ SAMSUNG GALAXY ═══════════════════════

    // S25 Series (2025)
    {
        brand: 'Samsung', model: 'Samsung Galaxy S25 Ultra', basePrice: 850, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 75, '1TB': 160 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S25+', basePrice: 650, validStorages: ['256GB', '512GB'],
        storagePrices: { '256GB': 0, '512GB': 65 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S25', basePrice: 520, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 50 }
    },

    // S24 Series (2024)
    {
        brand: 'Samsung', model: 'Samsung Galaxy S24 Ultra', basePrice: 700, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 70, '1TB': 150 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S24+', basePrice: 510, validStorages: ['256GB', '512GB'],
        storagePrices: { '256GB': 0, '512GB': 60 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S24', basePrice: 400, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 45 }
    },

    // S23 Series (2023)
    {
        brand: 'Samsung', model: 'Samsung Galaxy S23 Ultra', basePrice: 530, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 65, '1TB': 135 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S23+', basePrice: 360, validStorages: ['256GB', '512GB'],
        storagePrices: { '256GB': 0, '512GB': 55 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S23', basePrice: 285, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 40 }
    },

    // S22 Series (2022)
    {
        brand: 'Samsung', model: 'Samsung Galaxy S22 Ultra', basePrice: 380, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 40, '512GB': 80, '1TB': 130 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S22+', basePrice: 250, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 35 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy S22', basePrice: 200, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 30 }
    },

    // Z Fold / Flip Series
    {
        brand: 'Samsung', model: 'Samsung Galaxy Z Fold 6', basePrice: 850, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 80, '1TB': 160 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy Z Flip 6', basePrice: 500, validStorages: ['256GB', '512GB'],
        storagePrices: { '256GB': 0, '512GB': 60 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy Z Fold 5', basePrice: 680, validStorages: ['256GB', '512GB', '1TB'],
        storagePrices: { '256GB': 0, '512GB': 70, '1TB': 140 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy Z Flip 5', basePrice: 380, validStorages: ['256GB', '512GB'],
        storagePrices: { '256GB': 0, '512GB': 55 }
    },

    // A Series
    {
        brand: 'Samsung', model: 'Samsung Galaxy A55', basePrice: 180, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 30 }
    },
    {
        brand: 'Samsung', model: 'Samsung Galaxy A35', basePrice: 130, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 25 }
    },

    // ═══════════════════════ GOOGLE PIXEL ═══════════════════════

    {
        brand: 'Google', model: 'Google Pixel 9 Pro XL', basePrice: 680, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 55, '512GB': 110, '1TB': 180 }
    },
    {
        brand: 'Google', model: 'Google Pixel 9 Pro', basePrice: 570, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 50, '512GB': 100 }
    },
    {
        brand: 'Google', model: 'Google Pixel 9', basePrice: 430, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 45 }
    },
    {
        brand: 'Google', model: 'Google Pixel 8 Pro', basePrice: 420, validStorages: ['128GB', '256GB', '512GB', '1TB'],
        storagePrices: { '128GB': 0, '256GB': 45, '512GB': 90, '1TB': 150 }
    },
    {
        brand: 'Google', model: 'Google Pixel 8', basePrice: 310, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 40 }
    },
    {
        brand: 'Google', model: 'Google Pixel 7 Pro', basePrice: 270, validStorages: ['128GB', '256GB', '512GB'],
        storagePrices: { '128GB': 0, '256GB': 35, '512GB': 70 }
    },
    {
        brand: 'Google', model: 'Google Pixel 7', basePrice: 200, validStorages: ['128GB', '256GB'],
        storagePrices: { '128GB': 0, '256GB': 30 }
    },
    {
        brand: 'Google', model: 'Google Pixel 7a', basePrice: 175, validStorages: ['128GB'],
        storagePrices: { '128GB': 0 }
    },
];

// Inject shared modifiers into every device
const seedData = devices.map(d => ({
    ...d,
    imageUrl: d.image || undefined,
    screenModifiers: SCREEN_MODS,
    bodyModifiers: BODY_MODS,
    functionalMultiplier: 1.0,
    nonFunctionalMultiplier: 0.35,
    category: 'Smartphone',
    active: true,
}));

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    let inserted = 0, updated = 0;

    for (const device of seedData) {
        const existing = await DeviceBlueprint.findOne({ model: device.model });
        if (existing) {
            await DeviceBlueprint.updateOne({ _id: existing._id }, { $set: device });
            console.log(`  🔄 Updated: ${device.brand} ${device.model} → ${device.basePrice}€`);
            updated++;
        } else {
            await DeviceBlueprint.create(device);
            console.log(`  ✅ Inserted: ${device.brand} ${device.model} → ${device.basePrice}€`);
            inserted++;
        }
    }

    console.log(`\n🎉 Done! Inserted: ${inserted}, Updated: ${updated}, Total: ${seedData.length}`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});

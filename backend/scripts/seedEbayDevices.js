require('dotenv').config();
const mongoose = require('mongoose');
const DeviceBlueprint = require('../models/DeviceBlueprint');

const DUMMY_PRICE = 500; // Will be overwritten by eBay API

const devices = [
    // Apple
    { brand: 'Apple', model: 'iPhone 13', storages: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro', storages: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro Max', storages: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14', storages: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro', storages: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro Max', storages: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15', storages: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro', storages: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro Max', storages: ['256GB', '512GB', '1TB'] },

    // Samsung
    { brand: 'Samsung', model: 'Galaxy S22', storages: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra 5G', storages: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23', storages: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', storages: ['256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S24', storages: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', storages: ['256GB', '512GB', '1TB'] },

    // Xiaomi
    { brand: 'Xiaomi', model: 'Xiaomi 12', storages: ['128GB', '256GB'] },
    { brand: 'Xiaomi', model: 'Xiaomi 13', storages: ['256GB'] },
    { brand: 'Xiaomi', model: 'Xiaomi 13 Pro', storages: ['256GB', '512GB'] },
    { brand: 'Xiaomi', model: 'Xiaomi 14', storages: ['256GB', '512GB'] },
];

async function seed() {
    try {
        console.log('🔌 Connecting to database...');
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected.');

        console.log('🗑️  Deleting existing dummy devices...');
        await DeviceBlueprint.deleteMany({});
        console.log('✅ Collection cleared.');

        console.log('🌱 Seeding specific eBay-friendly models...');
        
        const blueprintsToInsert = devices.map(d => ({
            model: d.model,
            brand: d.brand,
            basePrice: DUMMY_PRICE,
            validStorages: d.storages,
            category: 'Smartphone',
            active: true
        }));

        await DeviceBlueprint.insertMany(blueprintsToInsert);
        console.log(`✅ Successfully inserted ${blueprintsToInsert.length} modern devices!`);

        console.log('🎉 Done! You can now use the eBay Price Research tool on these models.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    }
}

seed();

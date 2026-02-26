const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RepairCase = require('./models/RepairCase');
const Product = require('./models/Product');
const Accessory = require('./models/Accessory');
const RepairDevice = require('./models/RepairDevice');
const DeviceBlueprint = require('./models/DeviceBlueprint');

dotenv.config();

// Helper to pick random item from array
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Sample Data Pools
const brands = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Sony'];
const models = {
    'Apple': ['iPhone 11', 'iPhone 12', 'iPhone 13 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'MacBook Air M1', 'MacBook Pro 14"', 'iPad Pro 11"'],
    'Samsung': ['Galaxy S21', 'Galaxy S22 Ultra', 'Galaxy S23', 'Galaxy S24 Ultra', 'Galaxy Z Fold 5', 'Galaxy A54'],
    'Google': ['Pixel 6', 'Pixel 7 Pro', 'Pixel 8', 'Pixel 8 Pro'],
    'Xiaomi': ['Redmi Note 12', '13 Pro', '13 Ultra'],
    'Sony': ['Xperia 1 V', 'Xperia 5 IV']
};
const conditions = ['New', 'Used - Like New', 'Used - Good', 'Refurbished - Grade A', 'Refurbished - Grade B'];
const categories = ['Smartphone', 'Tablet', 'Laptop', 'Watch'];
const repairTypes = ['screen', 'glass', 'battery', 'camera', 'water', 'other'];
const accessoryTypes = ['protection', 'power', 'audio', 'wearables'];

// Images (Generic Placeholders)
const techImages = [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    'https://images.unsplash.com/photo-1610945431131-c6463eb4f227?w=800&q=80',
    'https://images.unsplash.com/photo-1592833159057-65a2845730ca?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1598327770170-13f572a1cdad?w=800&q=80',
    'https://images.unsplash.com/photo-1627993070444-24e5d6d87e07?w=800&q=80'
];

const names = ['TechnoFix', 'MobileMaster', 'ScreenSaver', 'RepairGuru', 'GadgetDoctor'];

const generateDeviceBlueprints = (count) => {
    const blueprints = [];
    // Ensure uniqueness for blueprints as modelName must be unique
    const usedModels = new Set();

    let attempts = 0;
    while (blueprints.length < count && attempts < 100) {
        attempts++;
        const brand = sample(brands);
        const modelBase = sample(models[brand] || models['Apple']);
        const variant = randomInt(1, 100);
        // Create pseudo-unique model names if needed, or rely on base models being distinct enough for demo
        // For better realism, we'll append a variant if it exists
        const modelName = `${modelBase} ${variant > 50 ? 'Plus' : ''} ${variant % 3 === 0 ? '5G' : ''}`.trim();

        if (usedModels.has(modelName)) continue;
        usedModels.add(modelName);

        blueprints.push({
            brand: brand,
            modelName: modelName,
            basePrice: randomInt(300, 1200),
            releaseYear: randomInt(2020, 2024),
            imageUrl: sample(techImages),
            validStorages: ['128GB', '256GB', '512GB', '1TB'].slice(0, randomInt(2, 4)),
            marketingName: `${brand} ${modelName} Ultimate`,
            description: `Flagship device from ${brand} featuring latest tech.`
        });
    }
    return blueprints;
};

const generateRepairCases = (count) => {
    const cases = [];
    for (let i = 0; i < count; i++) {
        const brand = sample(brands);
        const model = sample(models[brand] || models['Apple']);
        const type = sample(repairTypes);

        cases.push({
            title: `${model} - ${type.charAt(0).toUpperCase() + type.slice(1)} Repair`,
            category: type,
            difficulty: sample(['Low', 'Med', 'High', 'Expert']),
            time: `${randomInt(20, 120)} min`,
            labelBefore: 'Damaged',
            labelAfter: 'Fixed',
            imgBefore: sample(techImages),
            imgAfter: sample(techImages),
            description: `Professional repair for ${model} with ${type} issues. Restored to full functionality using OEM parts.`
        });
    }
    return cases;
};

const generateProducts = (count) => {
    const prods = [];
    for (let i = 0; i < count; i++) {
        const brand = sample(brands);
        const model = sample(models[brand] || models['Apple']);

        prods.push({
            id: `prod_${Date.now()}_${i}`,
            name: `${model} ${randomInt(1, 9) === 1 ? 'Pro' : ''}`,
            price: randomInt(200, 1500),
            description: `Excellent condition ${model}. Fully tested and verified.`,
            image: sample(techImages),
            category: sample(categories),
            condition: sample(conditions),
            seller: sample(names),
            color: sample(['Black', 'White', 'Silver', 'Gold', 'Blue', 'Green']),
            storage: sample(['64GB', '128GB', '256GB', '512GB', '1TB']),
            display: 'Original OLED',
            battery: `${randomInt(85, 100)}%`,
            specs: { warranty: '12 Months' }
        });
    }
    return prods;
};

const generateAccessories = (count) => {
    const accs = [];
    for (let i = 0; i < count; i++) {
        const type = sample(accessoryTypes);
        const items = {
            'protection': ['Case', 'Screen Protector', 'Bumper'],
            'power': ['Charger', 'Cable', 'Power Bank'],
            'audio': ['Headphones', 'Earbuds', 'Speaker'],
            'wearables': ['Watch Strap', 'Cover']
        };
        const item = sample(items[type]);

        accs.push({
            id: `acc_${Date.now()}_${i}`,
            name: `Premium ${item} for ${sample(models['Apple'])}`,
            category: type,
            price: randomInt(15, 150),
            image: sample(techImages),
            description: `High quality ${item} with premium materials.`,
            tag: randomInt(0, 1) ? 'Bestseller' : 'New',
            specs: { brand: sample(names) }
        });
    }
    return accs;
};

const generateRepairDevices = (count) => {
    const devs = [];
    for (let i = 0; i < count; i++) {
        const brand = sample(brands);
        const model = sample(models[brand] || models['Apple']);

        devs.push({
            id: `dev_${Date.now()}_${i}`,
            model: model,
            brand: brand,
            image: sample(techImages),
            isVisible: true,
            services: [
                { type: 'screen', label: 'Screen Replacement', price: randomInt(80, 400), duration: '60 min', warranty: '1 Year' },
                { type: 'battery', label: 'Battery Replacement', price: randomInt(50, 150), duration: '30 min', warranty: '6 Months' },
                { type: 'glass', label: 'Back Glass', price: randomInt(100, 250), duration: '2 Hours', warranty: 'Lifetime' }
            ]
        });
    }
    return devs;
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data (Optional: Remove if you want to append)
        await RepairCase.deleteMany({});
        await Product.deleteMany({});
        await Accessory.deleteMany({});
        await RepairDevice.deleteMany({});
        await DeviceBlueprint.deleteMany({}); // ADDED
        console.log('🗑️  Cleared existing data (Matches & Blueprints)');

        // Generate 20 items for each
        const repairCases = generateRepairCases(20);
        await RepairCase.insertMany(repairCases);
        console.log(`✅ Seeded ${repairCases.length} Repair Cases`);

        const products = generateProducts(20);
        await Product.insertMany(products);
        console.log(`✅ Seeded ${products.length} Products`);

        const accessories = generateAccessories(20);
        await Accessory.insertMany(accessories);
        console.log(`✅ Seeded ${accessories.length} Accessories`);

        const repairDevices = generateRepairDevices(20);
        await RepairDevice.insertMany(repairDevices);
        console.log(`✅ Seeded ${repairDevices.length} Repair Devices`);

        const blueprints = generateDeviceBlueprints(20); // ADDED
        await DeviceBlueprint.insertMany(blueprints); // ADDED
        console.log(`✅ Seeded ${blueprints.length} Device Blueprints (Valuation)`);

        console.log('🎉 All items seeded successfully!');
        process.exit();

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();

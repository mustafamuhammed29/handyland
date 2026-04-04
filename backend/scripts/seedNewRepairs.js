require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const RepairDevice = require('../models/RepairDevice');

const devicesToSeed = [
    {
        id: 'iphone-15-pro-max',
        model: 'iPhone 15 Pro Max',
        brand: 'Apple',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 429, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 119, duration: '1h', warranty: '6 Months' },
            { type: 'backglass', label: 'Back Glass Repair', price: 229, duration: '3h', warranty: '12 Months' },
            { type: 'camera', label: 'Rear Camera Repair', price: 249, duration: '1.5h', warranty: '12 Months' }
        ]
    },
    {
        id: 'iphone-15-pro',
        model: 'iPhone 15 Pro',
        brand: 'Apple',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 379, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 119, duration: '1h', warranty: '6 Months' },
            { type: 'backglass', label: 'Back Glass Repair', price: 199, duration: '3h', warranty: '12 Months' }
        ]
    },
    {
        id: 'iphone-14-pro',
        model: 'iPhone 14 Pro',
        brand: 'Apple',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 349, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 109, duration: '1h', warranty: '6 Months' },
            { type: 'backglass', label: 'Back Glass Repair', price: 169, duration: '3h', warranty: '12 Months' }
        ]
    },
    {
        id: 'iphone-13',
        model: 'iPhone 13',
        brand: 'Apple',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 229, duration: '1.5h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 99, duration: '1h', warranty: '6 Months' }
        ]
    },
    {
        id: 'iphone-12',
        model: 'iPhone 12',
        brand: 'Apple',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 199, duration: '1.5h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 89, duration: '1h', warranty: '6 Months' }
        ]
    },
    {
        id: 'galaxy-s24-ultra',
        model: 'Galaxy S24 Ultra',
        brand: 'Samsung',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-1.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 399, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 109, duration: '1h', warranty: '6 Months' },
            { type: 'backglass', label: 'Back Glass Repair', price: 129, duration: '2h', warranty: '12 Months' }
        ]
    },
    {
        id: 'galaxy-s23-ultra',
        model: 'Galaxy S23 Ultra',
        brand: 'Samsung',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 359, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 99, duration: '1h', warranty: '6 Months' }
        ]
    },
    {
        id: 'galaxy-a54',
        model: 'Galaxy A54',
        brand: 'Samsung',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a54.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 129, duration: '1h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 79, duration: '1h', warranty: '6 Months' }
        ]
    },
    {
        id: 'pixel-8-pro',
        model: 'Pixel 8 Pro',
        brand: 'Google',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 279, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 99, duration: '1h', warranty: '6 Months' }
        ]
    },
    {
        id: 'pixel-7',
        model: 'Pixel 7',
        brand: 'Google',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-7.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 219, duration: '2h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 89, duration: '1h', warranty: '6 Months' }
        ]
    },
    {
        id: 'xiaomi-13-pro',
        model: 'Xiaomi 13 Pro',
        brand: 'Xiaomi',
        image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13-pro.jpg',
        isVisible: true,
        services: [
            { type: 'screen', label: 'Screen Replacement', price: 299, duration: '2.5h', warranty: '12 Months' },
            { type: 'battery', label: 'Battery Replacement', price: 89, duration: '1h', warranty: '6 Months' }
        ]
    }
];

async function seedRepairs() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/handyland');
        console.log('Connected to MongoDB.');

        console.log('Wiping old repair devices with missing/corrupted names...');
        await RepairDevice.deleteMany({});
        console.log('Old records wiped.');

        console.log('Inserting new valid repair devices...');
        await RepairDevice.insertMany(devicesToSeed);
        console.log(`Successfully seeded ${devicesToSeed.length} devices.`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding repairs:', error);
        process.exit(1);
    }
}

seedRepairs();

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const RepairDevice = require('../models/RepairDevice');

const seedDataPath = path.join(__dirname, '../seed-data/scraped-prices.json');

function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function seedLegacyRepairs() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/handyland');
        console.log('Connected to MongoDB.');

        const rawData = fs.readFileSync(seedDataPath, 'utf8');
        const scrapedPrices = JSON.parse(rawData);

        for (const item of scrapedPrices) {
            const deviceId = generateSlug(`${item.brand} ${item.model}`);
            
            const services = item.repairs.map(repair => {
                let typeKey = generateSlug(repair.type);
                if (typeKey.includes('display')) typeKey = 'screen';
                if (typeKey.includes('akku')) typeKey = 'battery';
                if (typeKey.includes('backcover')) typeKey = 'backglass';

                return {
                    type: typeKey,
                    label: repair.type,
                    price: repair.price,
                    duration: '60 Min',
                    warranty: '12 Monate'
                };
            });

            const updateDoc = {
                id: deviceId,
                brand: item.brand,
                model: item.model,
                isVisible: true,
                services: services
            };

            await RepairDevice.findOneAndUpdate(
                { id: deviceId },
                { $set: updateDoc },
                { upsert: true, new: true }
            );

            console.log(`Upserted RepairDevice: ${item.brand} ${item.model}`);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        require('fs').writeFileSync('err.txt', error.stack || String(error));
        console.error('Error seeding legacy repairs:', error);
        process.exit(1);
    }
}

seedLegacyRepairs();

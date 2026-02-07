const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Load Models
const Product = require('./models/Product');
const Accessory = require('./models/Accessory');
const RepairDevice = require('./models/RepairDevice');
const Settings = require('./models/Settings');

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/handyland', {})
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // 1. Seed Products
        if (await Product.countDocuments() === 0) {
            const productData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf-8'));
            await Product.insertMany(productData);
            console.log('Products Seeded');
        }

        // 2. Seed Accessories
        if (await Accessory.countDocuments() === 0) {
            const accData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/accessories.json'), 'utf-8'));
            await Accessory.insertMany(accData);
            console.log('Accessories Seeded');
        }

        // 3. Seed Repair Devices
        if (await RepairDevice.countDocuments() === 0) {
            const repairData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/repairDevices.json'), 'utf-8'));
            await RepairDevice.insertMany(repairData);
            console.log('Repair Devices Seeded');
        }

        // 4. Seed Settings
        if (await Settings.countDocuments() === 0) {
            const settingsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/settings.json'), 'utf-8'));
            await Settings.create(settingsData);
            console.log('Settings Seeded');
        }

        console.log('Seeding Complete');
        process.exit();
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();

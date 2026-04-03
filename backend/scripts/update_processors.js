const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const updateProcessors = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI or MONGO_URI not found in environment');
        }
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const updates = [
            { name: 'Xiaomi 14 Ultra', processor: 'Snapdragon 8 Gen 3' },
            { name: 'Xiaomi 14 Pro', processor: 'Snapdragon 8 Gen 3' },
            { name: 'Xiaomi 13 Ultra', processor: 'Snapdragon 8 Gen 2' },
            { name: 'Xiaomi 13 Pro', processor: 'Snapdragon 8 Gen 2' },
            { name: 'Xiaomi 14', processor: 'Snapdragon 8 Gen 3' },
            { name: 'Xiaomi 13', processor: 'Snapdragon 8 Gen 2' }
        ];

        for (const update of updates) {
            // Update by name starting with the base name
            const result = await Product.updateMany(
                { name: new RegExp(`^${update.name}`, 'i') },
                { $set: { processor: update.processor } }
            );
            console.log(`Updated products for ${update.name}: ${result.modifiedCount} modified`);
        }

        console.log('Update complete');
        process.exit(0);
    } catch (err) {
        console.error('Error updating processors:', err);
        process.exit(1);
    }
};

updateProcessors();

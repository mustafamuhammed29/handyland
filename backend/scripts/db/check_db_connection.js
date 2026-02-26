const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';
console.log(`Attempting to connect to: ${uri}`);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ FAILURE: Could not connect to MongoDB');
        console.error(`Error Name: ${err.name}`);
        console.error(`Error Message: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.error('👉 CAUSE: MongoDB is likely NOT RUNNING on this machine.');
        }
        process.exit(1);
    });

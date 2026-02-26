const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const RepairDevice = require('./models/RepairDevice');

mongoose.connect('mongodb://127.0.0.1:27017/handyland').then(async () => {
    await RepairDevice.deleteMany({});
    const repairData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/repairDevices.json'), 'utf-8'));
    await RepairDevice.insertMany(repairData);
    console.log('Restored repair devices!');
    process.exit();
}).catch(console.error);

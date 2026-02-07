const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    type: String, // screen, battery, etc.
    label: String,
    price: Number,
    duration: String,
    warranty: String
}, { _id: false });

const repairDeviceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    brand: { type: String, required: true },
    image: String,
    isVisible: { type: Boolean, default: true },
    services: [serviceSchema]
}, { timestamps: true });

module.exports = mongoose.model('RepairDevice', repairDeviceSchema);

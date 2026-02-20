const mongoose = require('mongoose');

const ValuationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceName: { type: String, required: true },
    brand: { type: String },
    storage: { type: String },
    batteryHealth: { type: String },
    condition: { type: String, required: true },
    estimatedValue: { type: Number, required: true },
    includeAccessories: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Valuation', ValuationSchema);

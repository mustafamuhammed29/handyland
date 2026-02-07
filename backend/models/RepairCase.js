const mongoose = require('mongoose');

const repairCaseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, enum: ['screen', 'glass', 'water', 'camera', 'battery', 'other'], default: 'other' },
    difficulty: { type: String, enum: ['Low', 'Med', 'High', 'Expert'], default: 'Med' },
    time: String,
    labelBefore: String,
    labelAfter: String,
    imgBefore: String,
    imgAfter: String,
    description: String
}, { timestamps: true });

module.exports = mongoose.model('RepairCase', repairCaseSchema);

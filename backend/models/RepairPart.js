const mongoose = require('mongoose');

const repairPartSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true }, // screens, batteries, charging_ports, logic_boards, other
    subCategory: String, // e.g. iPhone 15 Pro Max
    brand: String, // Original OEM, Copy, High Quality, etc.
    price: { type: Number, required: true }, // Selling/Repair Price
    cost: { type: Number, default: 0 }, // Cost from supplier
    stock: { type: Number, required: true, default: 0, min: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    sold: { type: Number, default: 0 }, // Used in repairs
    isActive: { type: Boolean, default: true },
    barcode: { type: String, unique: true, sparse: true },
    supplier: String, // Supplier info for re-ordering
    image: String,
    description: String,
    specs: { type: Map, of: String }
}, { timestamps: true });

// Performance indexes for faster POS barcode scanning and categorization
repairPartSchema.index({ category: 1, subCategory: 1 });
repairPartSchema.index({ name: 'text', brand: 'text', subCategory: 'text' });
repairPartSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RepairPart', repairPartSchema);

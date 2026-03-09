const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true }, // audio, power, protection, wearables
    subCategory: String,
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    sold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    barcode: { type: String, unique: true, sparse: true },
    brand: String,
    model: String,
    supplierName: String,
    supplierContact: String,
    costPrice: { type: Number, default: 0 },
    image: String,
    description: String,
    tag: String,
    battery: String,
    processor: String,
    color: String,
    display: String,
    storage: String,
}, { timestamps: true });

module.exports = mongoose.model('Accessory', accessorySchema);

const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true }, // audio, power, protection, wearables
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    image: String,
    description: String,
    tag: String,
    battery: String,
    processor: String,
    color: String,
    display: String,
    storage: String,
    specs: { type: Map, of: String } // Flexible key-value pairs
}, { timestamps: true });

module.exports = mongoose.model('Accessory', accessorySchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID for compatibility
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    image: String,
    category: String,
    condition: String,
    seller: String,
    battery: String,
    processor: String,
    color: String,
    display: String,
    storage: String,
    specs: Object // Flexible specs object
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

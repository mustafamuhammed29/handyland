const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID for compatibility
    name: { type: String, required: true },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function (value) {
                return value > 0;
            },
            message: 'Price must be greater than 0'
        }
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    description: String,
    image: String,
    images: [String],
    category: String,
    condition: String,
    seller: String,
    battery: String,
    processor: String,
    color: String,
    display: String,
    storage: String,
    specs: Object, // Flexible specs object
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

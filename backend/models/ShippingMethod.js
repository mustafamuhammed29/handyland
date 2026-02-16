const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    duration: {
        type: String,
        required: true // e.g., "3-5 Business Days"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isExpress: { // Flag for frontend logic if needed
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);

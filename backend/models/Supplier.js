const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a supplier name'],
        trim: true
    },
    contactPerson: String,
    email: {
        type: String,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: String,
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    reliabilityScore: {
        type: Number, // Percentage of on-time deliveries
        default: 100
    },
    notes: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', SupplierSchema);

const mongoose = require('mongoose');

const SavedValuationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Changed to false to support guest valuations
    },
    contact: {
        name: String,
        email: String,
        phone: String
    },
    device: {
        type: String, // e.g., "Samsung Galaxy S23"
        required: true
    },
    specs: {
        type: String, // e.g., "256GB - Unlocked"
        required: true
    },
    condition: {
        type: String, // e.g., "Excellent"
        required: true
    },
    quoteReference: {
        type: String,
        unique: true,
        sparse: true
    },
    estimatedValue: {
        type: Number,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 48 * 60 * 60 * 1000, // 48 hours for quotes
        index: { expireAfterSeconds: 0 } // Auto-delete after expiry
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'sold', 'pending_shipment'],
        default: 'active'
    },
    isQuote: {
        type: Boolean,
        default: false
    },
    paymentDetails: {
        iban: String,
        bankName: String
    },
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SavedValuation', SavedValuationSchema);

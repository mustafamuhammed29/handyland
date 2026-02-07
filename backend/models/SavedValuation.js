const mongoose = require('mongoose');

const SavedValuationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    estimatedValue: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // Valid for 7 days
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'sold'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SavedValuation', SavedValuationSchema);

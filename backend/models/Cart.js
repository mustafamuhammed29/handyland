const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'items.productType' // Dynamic ref based on productType
        },
        productType: {
            type: String,
            required: true,
            enum: ['Product', 'Accessory']
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        // Store snapshot of critical data to avoid constant population if price changes drastically?
        // For now, relies on population for latest price/image, but keep it simple.
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Middleware to update updatedAt
cartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Cart', cartSchema);

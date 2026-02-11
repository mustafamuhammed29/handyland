const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'products.productType'
        },
        productType: {
            type: String,
            enum: ['Product', 'Accessory'],
            default: 'Product'
        },
        // Store snapshot for quick rendering without populate
        name: String,
        price: Number,
        image: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// One wishlist per user
WishlistSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);

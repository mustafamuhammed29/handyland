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
    minStock: { type: Number, default: 2, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    barcode: { type: String, unique: true, sparse: true },
    description: String,
    features: {
        type: [String],
        default: []
    },
    image: String,
    images: [String],
    category: String,
    subCategory: String,
    brand: String,
    model: String,
    supplierName: String,
    supplierContact: String,
    costPrice: { type: Number, default: 0 },
    condition: String,
    seller: String,
    battery: String,
    processor: String,
    color: String,
    display: String,
    storage: String,
    specs: Object, // Flexible specs object
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isMarginScheme: { type: Boolean, default: false },
    imeis: [{
        code: { type: String, required: true },
        status: { type: String, enum: ['available', 'sold', 'reserved', 'returned'], default: 'available' },
        costPrice: { type: Number }, // To track specific cost if bought via trade-in
        dateAdded: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' } // To track which order this was sold in
    }],
    seo: {
        metaTitle: String,
        metaDescription: String,
        keywords: String,
        canonicalUrl: String
    }
}, { timestamps: true });

// Performance indexes (FIX 9)
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ brand: 1, condition: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', model: 'text', brand: 'text' });

const transformSold = {
    transform: (doc, ret) => {
        ret.sold = Math.max(0, ret.sold || 0);
        return ret;
    }
};
productSchema.set('toJSON', transformSold);
productSchema.set('toObject', transformSold);

module.exports = mongoose.model('Product', productSchema);

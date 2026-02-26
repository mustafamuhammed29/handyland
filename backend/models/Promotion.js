const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: String,
    description: String,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: Number,
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    minOrderAmount: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', promotionSchema);

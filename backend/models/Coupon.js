const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Per-user tracking: each account can only use the coupon once
    usedBy: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            usedAt: { type: Date, default: Date.now },
            email: { type: String } // Store email for guest/display purposes
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);

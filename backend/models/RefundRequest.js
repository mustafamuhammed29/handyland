const mongoose = require('mongoose');

const RefundRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    // Items the customer wants to return
    items: [{
        product:  { type: mongoose.Schema.Types.ObjectId, refPath: 'items.productType' },
        productType: { type: String, enum: ['Product', 'Accessory'], default: 'Product' },
        name:     String,
        quantity: Number,
        price:    Number
    }],
    reason: {
        type: String,
        required: true,
        enum: [
            'widerrufsrecht',   // EU 14-day right of withdrawal (§ 312g BGB)
            'defective',        // Defective / damaged product
            'wrong_item',       // Wrong item received
            'not_as_described', // Not as described
            'other'
        ]
    },
    description: { type: String, maxlength: 1000 }, // customer's detailed explanation

    // EU / German law flags
    withinWithdrawalPeriod: { type: Boolean, default: false }, // true if within 14 days
    customerConfirmedReturn: { type: Boolean, default: false }, // customer acknowledges returning item

    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'rejected', 'processed'],
        default: 'pending',
        index: true
    },
    refundAmount: { type: Number, default: 0 }, // set by admin upon approval
    adminNotes:   { type: String },

    // Stripe refund tracking
    stripeRefundId: { type: String },

    // Resolution timestamps
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

module.exports = mongoose.model('RefundRequest', RefundRequestSchema);

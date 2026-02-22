const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    amount: {
        type: Number,
        required: true,
        get: v => Math.round(v) / 100, // Return dollars/euros (e.g., 1999 -> 19.99)
        set: v => Math.round(v * 100)  // Store cents (e.g., 19.99 -> 1999)
    },
    currency: {
        type: String,
        default: 'eur',
        enum: ['eur', 'usd', 'gbp'],
        lowercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['deposit', 'purchase', 'refund', 'credit', 'debit'],
        required: true,
        default: 'purchase'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'card_present'],
        required: true
    },
    stripePaymentId: {
        type: String
    },
    stripeCustomerId: {
        type: String,
        index: true
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { getters: true }, // Ensure getters are applied when converting to JSON
    toObject: { getters: true }
});

module.exports = mongoose.model('Transaction', TransactionSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const warrantySchema = new mongoose.Schema({
    warrantyCode: {
        type: String,
        required: true,
        unique: true,
        default: () => `WAR-${uuidv4().substring(0, 8).toUpperCase()}`
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        default: ''
    },
    itemType: {
        type: String,
        enum: ['Repair', 'Product', 'Accessory'],
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    imeiOrSerial: {
        type: String,
        default: ''
    },
    supplierName: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    durationDays: {
        type: Number,
        required: true,
        default: 90
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Claimed', 'Voided'],
        default: 'Active'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Pre-save middleware to automatically calculate end date and status
warrantySchema.pre('save', function (next) {
    if (this.isModified('startDate') || this.isModified('durationDays')) {
        const start = new Date(this.startDate);
        this.endDate = new Date(start.getTime() + this.durationDays * 24 * 60 * 60 * 1000);
    }

    // Auto update status if expired
    if (this.status === 'Active' && this.endDate < new Date()) {
        this.status = 'Expired';
    }

    next();
});

module.exports = mongoose.model('Warranty', warrantySchema);

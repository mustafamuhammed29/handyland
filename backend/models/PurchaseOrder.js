const mongoose = require('mongoose');
const crypto = require('crypto');

const PurchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        unique: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    items: [{
        productName: String,
        sku: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number
        }
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Partial', 'Received', 'Cancelled'],
        default: 'Draft'
    },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate PO Number and calc totals
PurchaseOrderSchema.pre('save', async function () {
    if (this.isNew && !this.poNumber) {
        const year = new Date().getFullYear().toString().slice(-2);
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.poNumber = `PO-${year}-${randomSuffix}`;
    }

    let total = 0;
    if (this.items && this.items.length > 0) {
        this.items.forEach(item => {
            item.totalPrice = item.quantity * item.unitPrice;
            total += item.totalPrice;
        });
    }
    this.totalAmount = total;
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

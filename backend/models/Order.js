const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'items.productType',
            required: true
        },
        productType: {
            type: String,
            required: true,
            enum: ['Product', 'Accessory']
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        image: String
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'paypal', 'stripe'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: String,
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'Germany'
        }
    },
    notes: String,
    trackingNumber: String,
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }]
}, {
    timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', async function () {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Find last order of the day
        const lastOrder = await this.constructor.findOne({
            orderNumber: new RegExp(`^HL-${year}${month}${day}`)
        }).sort({ orderNumber: -1 });

        let sequence = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop());
            sequence = lastSequence + 1;
        }

        this.orderNumber = `HL-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;

        // Add initial status to history
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: 'Order created'
        });
    }
});

// Update status history on status change
OrderSchema.pre('save', function () {
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }
});

// Add Indexes
OrderSchema.index({ user: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);

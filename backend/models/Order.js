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
        email: {
            type: String, // Critical for guest checkout
            required: true
        },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^\+?[1-9]\d{1,14}$/.test(v);
                },
                message: props => `${props.value} is not a valid phone number!`
            }
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

// Generate order number and validate total amount
OrderSchema.pre('validate', async function (next) {
    // 1. Generate Order Number
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const lastOrder = await this.constructor.findOne({
            orderNumber: new RegExp(`^HL-${year}${month}${day}`)
        }).sort({ orderNumber: -1 });

        let sequence = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop());
            sequence = lastSequence + 1;
        }

        this.orderNumber = `HL-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
    }

    // 2. Integrity Check: Verify Total Amount
    if (this.items && this.items.length > 0) {
        const itemsTotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Assumes tax is included in price (Gross pricing)
        // So Total = Items + Shipping - Discount
        const calculatedTotal = itemsTotal + (this.shippingFee || 0) - (this.discountAmount || 0);

        // Allow for small floating point differences (e.g. 0.01)
        if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
            // Invalidate the document
            this.invalidate('totalAmount', `Total amount mismatch. Expected: ${calculatedTotal.toFixed(2)}, Received: ${this.totalAmount}`);
        }
    }

    // Continue
    // next(); // Mongoose 5.x+ with async/await doesn't strictly need next() if promises are returned, but safe to just let function end or return
});

// Add initial status to history on save
OrderSchema.pre('save', function () {
    if (this.isNew && this.statusHistory.length === 0) {
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
// OrderSchema.index({ user: 1 }); // Already defined in schema
// OrderSchema.index({ orderNumber: 1 }); // Already defined in schema
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);

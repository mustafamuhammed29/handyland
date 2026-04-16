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
    shippingMethod: {
        type: String,
        default: 'Standard'
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String
    },
    appliedPoints: {
        type: Number,
        default: 0
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'paypal', 'stripe', 'klarna', 'giropay', 'sepa_debit', 'sofort', 'bank_transfer', 'wallet'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: String,
    paymentReceipt: String,
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
                    // Accept international (+49...), local (0170...), and formatted numbers
                    return /^(\+|00)?[\d\s\-().]{6,25}$/.test(v);
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
    invoiceGenerated: {
        type: Boolean,
        default: false
    },
    invoiceGeneratedAt: {
        type: Date
    },
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

// BUG-NEW-05 fix: replaced sequential query-based generation with crypto random suffix.
        // Old approach had two problems:
        //   1. Race condition: two concurrent orders could query same "last" and get same sequence
        //   2. Predictable: HL-YYYYMMDD-0001 reveals daily order volume
        // crypto.randomBytes(3).toString('hex') gives 6 hex chars = 16^6 = 16M combinations per day
        const crypto = require('crypto');
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.orderNumber = `HL-${year}${month}${day}-${randomSuffix}`;
    }

    // 2. Integrity Check: Verify Total Amount
    if (this.items && this.items.length > 0) {
        const itemsTotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // FIXED: Include tax in validation to match controller calculation
        // Total = Items + Shipping + Tax - Discount
        const calculatedTotal = itemsTotal + (this.shippingFee || 0) + (this.tax || 0) - (this.discountAmount || 0);

        // Allow for floating point and rounding differences between frontend/backend
        if (Math.abs(this.totalAmount - calculatedTotal) > 1.00) {
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

// Add Indexes (FIX 10)
OrderSchema.index({ user: 1, createdAt: -1 }); // Fast user order listings
OrderSchema.index({ status: 1 }); // Status-based queries and stats
OrderSchema.index({ createdAt: -1 }); // Timeline/sorting queries

module.exports = mongoose.model('Order', OrderSchema);

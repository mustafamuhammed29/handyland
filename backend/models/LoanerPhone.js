const mongoose = require('mongoose');

const loanerPhoneSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    imei: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['Available', 'Lent', 'Maintenance'],
        default: 'Available'
    },
    currentCustomer: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
    },
    lentDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LoanerPhone', loanerPhoneSchema);

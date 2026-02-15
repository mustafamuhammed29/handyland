const mongoose = require('mongoose');

const RepairTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // required: true // Removed to allow guest tickets
    },
    ticketId: {
        type: String,
        unique: true
    },
    device: {
        type: String, // e.g., "iPhone 13 Pro"
        required: true
    },
    issue: {
        type: String, // e.g., "Screen Replacement"
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'received', 'diagnosing', 'repairing', 'testing', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    estimatedCost: {
        type: Number
    },
    appointmentDate: {
        type: Date
    },
    serviceType: {
        type: String,
        enum: ['Mail-in', 'In-Store', 'On-Site'],
        default: 'In-Store'
    },
    notes: String,
    timeline: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    guestContact: {
        name: String,
        email: String,
        phone: String
    }
}, {
    timestamps: true
});

// Import customAlphabet dynamically or require it if using CommonJS
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

// Generate Ticket ID - FIX
RepairTicketSchema.pre('validate', async function (next) {
    // Ensure either user or guestContact is present
    if (!this.user && (!this.guestContact || !this.guestContact.email)) {
        this.invalidate('user', 'Either a registered user or guest contact details (email) are required.');
    }

    if (this.isNew && !this.ticketId) {
        const year = new Date().getFullYear().toString().slice(-2);
        // Random unique ID: REP-26-A7B3C9
        this.ticketId = `REP-${year}-${nanoid()}`;

        // Add initial timeline entry
        if (this.timeline.length === 0) {
            this.timeline.push({
                status: this.status,
                note: 'Repair ticket created'
            });
        }
    }
    // next();
});

module.exports = mongoose.model('RepairTicket', RepairTicketSchema);

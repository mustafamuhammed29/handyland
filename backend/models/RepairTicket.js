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
    technicianNotes: String,
    messages: [{
        role: {
            type: String,
            enum: ['customer', 'admin']
        },
        text: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
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

const crypto = require('crypto');

// Generate Ticket ID
RepairTicketSchema.pre('save', function () {
    if (this.isNew && !this.ticketId) {
        const year = new Date().getFullYear().toString().slice(-2);
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.ticketId = `REP-${year}-${randomSuffix}`;

        if (this.timeline.length === 0) {
            this.timeline.push({
                status: this.status,
                note: 'Repair ticket created'
            });
        }
    }
});

module.exports = mongoose.model('RepairTicket', RepairTicketSchema);

const mongoose = require('mongoose');

const RepairTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    }]
}, {
    timestamps: true
});

// Generate Ticket ID - FIX
RepairTicketSchema.pre('validate', async function () {
    if (this.isNew && !this.ticketId) {
        const year = new Date().getFullYear().toString().slice(-2);

        // Find last ticket with same year prefix
        const lastTicket = await this.constructor.findOne({
            ticketId: new RegExp(`^REP-${year}-`)
        }).sort({ ticketId: -1 });

        let sequence = 1;
        if (lastTicket && lastTicket.ticketId) {
            const lastSeq = parseInt(lastTicket.ticketId.split('-').pop());
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        this.ticketId = `REP-${year}-${String(sequence).padStart(4, '0')}`;

        // Add initial timeline entry
        if (this.timeline.length === 0) {
            this.timeline.push({
                status: this.status,
                note: 'Repair ticket created'
            });
        }
    }
});

module.exports = mongoose.model('RepairTicket', RepairTicketSchema);

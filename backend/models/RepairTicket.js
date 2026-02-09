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
    cost: {
        type: Number,
        default: 0
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

// Generate Ticket ID
RepairTicketSchema.pre('save', async function () {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const count = await this.constructor.countDocuments();
        this.ticketId = `REP-${year}-${(count + 1).toString().padStart(4, '0')}`;

        // Add initial history
        if (this.timeline.length === 0) {
            this.timeline.push({
                status: this.status,
                note: 'Repair ticket created'
            });
        }
    }
});

module.exports = mongoose.model('RepairTicket', RepairTicketSchema);

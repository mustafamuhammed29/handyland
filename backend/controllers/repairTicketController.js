const RepairTicket = require('../models/RepairTicket');

// @desc    Create new repair ticket
// @route   POST /api/repairs/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { device, issue, notes, appointmentDate, serviceType, guestContact } = req.body;

        const ticketData = {
            device,
            issue,
            notes,
            appointmentDate,
            serviceType
        };

        if (req.user) {
            ticketData.user = req.user.id;
        } else if (guestContact) {
            ticketData.guestContact = guestContact;
        } else {
            return res.status(400).json({
                success: false,
                message: 'User authentication or guest contact details are required'
            });
        }

        const ticket = await RepairTicket.create(ticketData);

        res.status(201).json({
            success: true,
            ticket
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating repair ticket',
            error: error.message
        });
    }
};

const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Update repair ticket status (Admin)
// @route   PUT /api/repairs/tickets/:id/status
// @access  Private/Admin
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status, estimatedCost, notes } = req.body;
        const ticket = await RepairTicket.findById(req.params.id).populate('user', 'name email');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (status) ticket.status = status;
        if (estimatedCost) ticket.estimatedCost = estimatedCost;
        if (notes) ticket.notes = notes; // Or add to a history array if modeled

        await ticket.save();

        // Send Email Notification
        if (status) {
            try {
                await sendEmail({
                    email: ticket.user.email,
                    subject: `Repair Update: ${ticket.device}`,
                    html: emailTemplates.repairStatusUpdate(ticket.user.name, ticket, status)
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating ticket',
            error: error.message
        });
    }
};

// @desc    Get my repair tickets
// @route   GET /api/repairs/tickets/my-tickets
// @access  Private
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await RepairTicket.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            repairs: tickets  // Changed from 'tickets' to 'repairs' for frontend compatibility
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching repair tickets',
            error: error.message
        });
    }
};

// @desc    Get ticket by ID
// @route   GET /api/repairs/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
    try {
        const ticket = await RepairTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Ensure user owns ticket
        if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching ticket',
            error: error.message
        });
    }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/repairs/admin/all
// @access  Private/Admin
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await RepairTicket.find().populate('user', 'name email');
        res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving tickets',
            error: error.message
        });
    }
};

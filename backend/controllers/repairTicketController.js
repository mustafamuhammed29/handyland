const RepairTicket = require('../models/RepairTicket');

// @desc    Create new repair ticket
// @route   POST /api/repairs/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { device, issue, notes } = req.body;

        const ticket = await RepairTicket.create({
            user: req.user.id,
            device,
            issue,
            notes
        });

        res.status(201).json({
            success: true,
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating repair ticket',
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
            tickets
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

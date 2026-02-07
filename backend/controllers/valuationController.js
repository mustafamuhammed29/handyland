const SavedValuation = require('../models/SavedValuation');

// @desc    Save a valuation
// @route   POST /api/valuations/saved
// @access  Private
exports.saveValuation = async (req, res) => {
    try {
        const { device, specs, condition, estimatedValue } = req.body;

        const valuation = await SavedValuation.create({
            user: req.user.id,
            device,
            specs,
            condition,
            estimatedValue
        });

        res.status(201).json({
            success: true,
            valuation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving valuation',
            error: error.message
        });
    }
};

// @desc    Get my saved valuations
// @route   GET /api/valuations/saved
// @access  Private
exports.getMyValuations = async (req, res) => {
    try {
        const valuations = await SavedValuation.find({
            user: req.user.id,
            status: 'active',
            expiryDate: { $gt: Date.now() }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: valuations.length,
            valuations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching valuations',
            error: error.message
        });
    }
};

// @desc    Delete saved valuation
// @route   DELETE /api/valuations/saved/:id
// @access  Private
exports.deleteValuation = async (req, res) => {
    try {
        const valuation = await SavedValuation.findById(req.params.id);

        if (!valuation) {
            return res.status(404).json({
                success: false,
                message: 'Valuation not found'
            });
        }

        if (valuation.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await valuation.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Valuation removed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting valuation',
            error: error.message
        });
    }
};

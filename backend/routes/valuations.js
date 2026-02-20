const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// GET all valuations for logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const Valuation = require('../models/Valuation');
        const valuations = await Valuation.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: valuations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create new valuation
router.post('/', protect, async (req, res) => {
    try {
        const Valuation = require('../models/Valuation');
        const { model, condition, storage, batteryHealth, accessories } = req.body;

        // Simple mock calculation if previewPrice wasn't passed, or fetch it.
        // For testing, just give it a dummy value if missing.
        const estimatedValue = req.body.estimatedValue || 250;

        const valuation = await Valuation.create({
            user: req.user._id,
            deviceName: model || 'Unknown Device',
            condition,
            storage,
            batteryHealth: batteryHealth ? batteryHealth.toString() : 'Unknown',
            includeAccessories: accessories || false,
            estimatedValue
        });
        res.status(201).json({ success: true, data: valuation });
    } catch (err) {
        console.error('Valuation Create Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE valuation by ID
router.delete('/:id', protect, async (req, res) => {
    try {
        const Valuation = require('../models/Valuation');
        await Valuation.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

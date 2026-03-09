const Warranty = require('../models/Warranty');

// @desc    Get all warranties
// @route   GET /api/warranties
// @access  Private/Admin
exports.getWarranties = async (req, res) => {
    try {
        const query = {};

        if (req.query.status) query.status = req.query.status;
        if (req.query.itemType) query.itemType = req.query.itemType;

        const warranties = await Warranty.find(query).sort({ createdAt: -1 });
        res.json(warranties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search warranty by code, phone, or IMEI
// @route   GET /api/warranties/search
// @access  Private/Admin
exports.searchWarranty = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Search query is required' });

        // exact match on warrantyCode or partial match on phone/imei
        const warranties = await Warranty.find({
            $or: [
                { warrantyCode: { $regex: query, $options: 'i' } },
                { customerPhone: { $regex: query, $options: 'i' } },
                { imeiOrSerial: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json(warranties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new warranty
// @route   POST /api/warranties
// @access  Private/Admin
exports.addWarranty = async (req, res) => {
    try {
        // Compute endDate based on durationDays and startDate
        const { durationDays, startDate } = req.body;

        let start = startDate ? new Date(startDate) : new Date();
        let end = new Date(start.getTime() + (durationDays || 90) * 24 * 60 * 60 * 1000);

        const warranty = await Warranty.create({
            ...req.body,
            startDate: start,
            endDate: end
        });

        res.status(201).json(warranty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a warranty
// @route   PUT /api/warranties/:id
// @access  Private/Admin
exports.updateWarranty = async (req, res) => {
    try {
        const warranty = await Warranty.findById(req.params.id);
        if (!warranty) return res.status(404).json({ message: 'Warranty not found' });

        // Recalculate end date if startDate or durationDays changes
        let newStartDate = req.body.startDate ? new Date(req.body.startDate) : warranty.startDate;
        let newDuration = req.body.durationDays !== undefined ? req.body.durationDays : warranty.durationDays;

        const newEndDate = new Date(newStartDate.getTime() + newDuration * 24 * 60 * 60 * 1000);

        const updatedBody = {
            ...req.body,
            startDate: newStartDate,
            durationDays: newDuration,
            endDate: newEndDate
        };

        const updated = await Warranty.findByIdAndUpdate(
            req.params.id,
            updatedBody,
            { new: true, runValidators: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a warranty
// @route   DELETE /api/warranties/:id
// @access  Private/Admin
exports.deleteWarranty = async (req, res) => {
    try {
        const result = await Warranty.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Warranty not found' });
        res.json({ message: 'Warranty deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

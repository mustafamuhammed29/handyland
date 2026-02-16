const ShippingMethod = require('../models/ShippingMethod');

// @desc    Get all shipping methods
// @route   GET /api/shipping-methods
// @access  Public
exports.getShippingMethods = async (req, res) => {
    try {
        const methods = await ShippingMethod.find({ isActive: true });
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all shipping methods (Admin)
// @route   GET /api/shipping-methods/admin/all
// @access  Private/Admin
exports.getAllShippingMethodsAdmin = async (req, res) => {
    try {
        const methods = await ShippingMethod.find({});
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create shipping method
// @route   POST /api/shipping-methods
// @access  Private/Admin
exports.createShippingMethod = async (req, res) => {
    try {
        const method = await ShippingMethod.create(req.body);
        res.status(201).json(method);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update shipping method
// @route   PUT /api/shipping-methods/:id
// @access  Private/Admin
exports.updateShippingMethod = async (req, res) => {
    try {
        const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(method);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete shipping method
// @route   DELETE /api/shipping-methods/:id
// @access  Private/Admin
exports.deleteShippingMethod = async (req, res) => {
    try {
        await ShippingMethod.findByIdAndDelete(req.params.id);
        res.json({ message: 'Shipping method deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteShippingMethod = async (req, res) => {
    try {
        await ShippingMethod.findByIdAndDelete(req.params.id);
        res.json({ message: 'Shipping method deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

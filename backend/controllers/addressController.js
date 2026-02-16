const Address = require('../models/Address');
const User = require('../models/User');

// @desc    Get all addresses for a user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user.id });
        res.status(200).json({ success: true, count: addresses.length, addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { name, street, city, state, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            await Address.updateMany({ user: req.user.id }, { isDefault: false });
        }

        const address = await Address.create({
            user: req.user.id,
            name,
            street,
            city,
            state,
            zipCode,
            country,
            isDefault
        });

        res.status(201).json({ success: true, address });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
    try {
        let address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        if (address.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (req.body.isDefault) {
            await Address.updateMany({ user: req.user.id }, { isDefault: false });
        }

        address = await Address.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, address });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        if (address.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await address.deleteOne();

        res.status(200).json({ success: true, message: 'Address removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

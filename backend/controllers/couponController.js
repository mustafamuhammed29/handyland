const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, amount, minOrderAmount, expiryDate, usageLimit } = req.body;

        const couponExists = await Coupon.findOne({ code });
        if (couponExists) {
            return res.status(400).json({ message: 'Coupon already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            amount,
            minOrderAmount, // Ensure model has this field or map appropriately
            validUntil: expiryDate,
            usageLimit
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        await coupon.deleteOne();
        res.json({ message: 'Coupon removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

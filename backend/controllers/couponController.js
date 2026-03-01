const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, amount, discountValue, minOrderAmount, minOrderValue, expiryDate, validUntil, usageLimit } = req.body;

        const couponExists = await Coupon.findOne({ code: code?.toUpperCase() });
        if (couponExists) {
            return res.status(400).json({ message: 'Coupon already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType: discountType || 'percentage',
            discountValue: discountValue || amount,
            minOrderValue: minOrderValue || minOrderAmount || 0,
            validUntil: validUntil || expiryDate,
            usageLimit: usageLimit || null
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

// @desc    Validate a coupon code and calculate discount
// @route   POST /api/coupons/validate  (also used via /api/orders/apply-coupon)
// @access  Private
exports.validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
        }

        if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
        }

        if (cartTotal && coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount is \u20AC${coupon.minOrderValue}`
            });
        }

        // Calculate discount amount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = ((cartTotal || 0) * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
            discount = coupon.discountValue;
        }

        discount = Math.min(discount, cartTotal || discount); // can't discount more than total

        res.json({
            success: true,
            couponCode: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discount: parseFloat(discount.toFixed(2)),
            validUntil: coupon.validUntil,
            message: `Coupon applied! You saved \u20AC${discount.toFixed(2)}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

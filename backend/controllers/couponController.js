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

// @desc    Get all coupons (with usedBy populated)
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        
        let query = {};
        if (search) {
            query.code = { $regex: search, $options: 'i' };
        }

        const count = await Coupon.countDocuments(query);
        const coupons = await Coupon.find(query)
            .populate('usedBy.user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            coupons,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle coupon active status (enable/disable)
// @route   PATCH /api/coupons/:id/toggle
// @access  Private/Admin
exports.toggleCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({
            message: `Coupon ${coupon.isActive ? 'enabled' : 'disabled'} successfully`,
            isActive: coupon.isActive
        });
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

// @desc    Validate a coupon code and calculate discount (enforces one-per-account)
// @route   POST /api/coupons/validate
// @access  Public (guests + logged-in users)
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

        // One-per-account enforcement: check if logged-in user already used it
        if (req.user) {
            const alreadyUsed = coupon.usedBy.some(
                entry => entry.user && entry.user.toString() === req.user._id.toString()
            );
            if (alreadyUsed) {
                return res.status(400).json({ success: false, message: 'You have already used this coupon' });
            }
        }

        // Calculate discount amount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = ((cartTotal || 0) * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {discount = Math.min(discount, coupon.maxDiscount);}
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

// @desc    Record coupon usage after order is placed (called internally)
// @param   couponCode, userId, userEmail
exports.recordCouponUsage = async (couponCode, userId, userEmail) => {
    try {
        if (!couponCode) {return;}
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (!coupon) {return;}

        // Increment usedCount
        coupon.usedCount = (coupon.usedCount || 0) + 1;

        // Record the user if provided
        if (userId) {
            // Avoid duplicate recording
            const alreadyRecorded = coupon.usedBy.some(
                entry => entry.user && entry.user.toString() === userId.toString()
            );
            if (!alreadyRecorded) {
                coupon.usedBy.push({ user: userId, email: userEmail, usedAt: new Date() });
            }
        } else if (userEmail) {
            // Guest - record by email
            coupon.usedBy.push({ email: userEmail, usedAt: new Date() });
        }

        await coupon.save();
    } catch (err) {
        console.error('Failed to record coupon usage:', err);
    }
};

// @desc    Get the latest active promo coupon for frontend popup
// @route   GET /api/coupons/latest-promo
// @access  Public
exports.getLatestPromo = async (req, res) => {
    try {
        const now = new Date();
        const coupon = await Coupon.findOne({
            isActive: true,
            validUntil: { $gt: now },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
            ]
        }).sort({ createdAt: -1 }); // newest first

        if (!coupon) {
            return res.json({ found: false });
        }

        res.json({
            found: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            validUntil: coupon.validUntil,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount
        });
    } catch (error) {
        res.status(500).json({ found: false, message: error.message });
    }
};

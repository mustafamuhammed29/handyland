const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createCoupon, getCoupons, deleteCoupon, validateCoupon, toggleCoupon, getLatestPromo } = require('../controllers/couponController');
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

const validateCouponLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    message: { success: false, message: 'Too many validation attempts, please try again later.' },
});

const createCouponRules = [
    body('code').notEmpty().withMessage('Code is required'),
    body('discountValue').isNumeric().withMessage('Discount value must be a number').custom(value => value >= 0).withMessage('Discount cannot be negative'),
    body('usageLimit').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Usage limit must be a positive integer'),
    body('minOrderValue').optional({ nullable: true }).isNumeric({ min: 0 }).withMessage('Min order value must be non-negative')
];

router.route('/')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), validate(createCouponRules), createCoupon);

// Public: Get the latest active promo coupon for the frontend popup
router.get('/latest-promo', getLatestPromo);

// Validate coupon (public - guests can also validate coupons)
router.post('/validate', validateCouponLimiter, validateCoupon);

// Toggle coupon active/inactive (admin only)
router.patch('/:id/toggle', protect, authorize('admin'), toggleCoupon);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;

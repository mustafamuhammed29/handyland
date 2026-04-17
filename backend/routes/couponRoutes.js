const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createCoupon, getCoupons, deleteCoupon, validateCoupon, toggleCoupon, getLatestPromo } = require('../controllers/couponController');

router.route('/')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);

// Public: Get the latest active promo coupon for the frontend popup
router.get('/latest-promo', getLatestPromo);

// Validate coupon (public - guests can also validate coupons)
router.post('/validate', validateCoupon);

// Toggle coupon active/inactive (admin only)
router.patch('/:id/toggle', protect, authorize('admin'), toggleCoupon);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;

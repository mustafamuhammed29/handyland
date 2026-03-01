const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createCoupon, getCoupons, deleteCoupon, validateCoupon } = require('../controllers/couponController');

router.route('/')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);

// Validate coupon (accessible to logged-in users)
router.post('/validate', protect, validateCoupon);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;


const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createCoupon, getCoupons, deleteCoupon } = require('../controllers/couponController');

router.route('/')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;

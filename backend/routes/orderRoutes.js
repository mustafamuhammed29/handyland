const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOrderStats,
    updateOrderStatus,
    applyCoupon,
    createOrder,
    getMyOrders,
    getOrder,
    requestRefund,
    processRefund,
    generateInvoice,
    cancelOrder,
    updateOrderToPaid,
    updateOrderToDelivered
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Admin routes (protected + admin only)
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.get('/admin/stats', protect, authorize('admin'), getOrderStats);
router.put('/admin/:id/status', protect, authorize('admin'), updateOrderStatus);

// User routes (protected)
router.post('/apply-coupon', protect, applyCoupon);
router.post('/', protect, createOrder);
// router.post('/request-refund', protect, requestRefund); // REMOVED - using controller direct export now
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, authorize('admin', 'staff'), updateOrderToDelivered);
router.route('/:id/refund').post(protect, requestRefund); // User requests refund
router.route('/refund/:id').put(protect, authorize('admin'), processRefund); // Admin processes request

module.exports = router;

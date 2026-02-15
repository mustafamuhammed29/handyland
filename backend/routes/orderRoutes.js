const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
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

// Validation rules
const createOrderRules = [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.product').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress.street').notEmpty().withMessage('Shipping address is required'),
];

// Admin routes (protected + admin only)
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.get('/admin/stats', protect, authorize('admin'), getOrderStats);
router.put('/admin/:id/status', protect, authorize('admin'), updateOrderStatus);

// User routes (protected)
router.get('/', protect, getMyOrders); // Convenience route for GET /api/orders
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.post('/apply-coupon', protect, applyCoupon);
router.post('/', protect, validate(createOrderRules), createOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, authorize('admin', 'staff'), updateOrderToDelivered);
router.route('/:id/refund').post(protect, requestRefund);
router.route('/refund/:id').put(protect, authorize('admin'), processRefund);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const {
    getAllOrders,
    getOrderStats,
    getOrderTimeline,
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
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const upload = require('../utils/imageUpload');

// Validation rules
const createOrderRules = [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.product').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
];

// Admin routes (protected + admin only)
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.get('/admin/stats', protect, authorize('admin'), getOrderStats);
router.get('/admin/timeline', protect, authorize('admin'), getOrderTimeline);
router.put('/admin/:id/status', protect, authorize('admin'), updateOrderStatus);
router.put('/admin/:id/approve-bank-transfer', protect, authorize('admin'), require('../controllers/orderController').approveBankTransfer);

// User routes (protected or optionally protected for guests)
router.get('/', protect, getMyOrders); // Convenience route for GET /api/orders
router.get('/my', protect, getMyOrders);
router.get('/:id', optionalProtect, getOrder);
router.get('/:id/invoice', optionalProtect, generateInvoice);
router.post('/apply-coupon', protect, applyCoupon);
router.post('/', protect, validate(createOrderRules), createOrder);
router.post('/:id/receipt', protect, upload.single('receipt'), require('../controllers/orderController').uploadPaymentReceipt); // BUG-NEW-09 fix: require auth
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, authorize('admin', 'staff'), updateOrderToDelivered);
router.route('/:id/request-refund').post(protect, requestRefund);
router.route('/:id/process-refund').put(protect, authorize('admin'), processRefund);
router.route('/:id/cancel').put(protect, cancelOrder);

module.exports = router;

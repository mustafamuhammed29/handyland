const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Admin routes (protected + admin only)
router.get('/admin/all', protect, authorize('admin'), orderController.getAllOrders);
router.get('/admin/stats', protect, authorize('admin'), orderController.getOrderStats);
router.put('/admin/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);

// User routes (protected)
router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrder);
router.put('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;

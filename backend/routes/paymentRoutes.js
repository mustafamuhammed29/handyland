const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// User routes
router.post('/create-checkout-session', protect, paymentController.createCheckoutSession);
router.post('/success', protect, paymentController.handlePaymentSuccess);
router.get('/:sessionId', protect, paymentController.getPaymentDetails);

// Admin routes
router.post('/refund', protect, authorize('admin'), paymentController.createRefund);

// Webhook (public - verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;

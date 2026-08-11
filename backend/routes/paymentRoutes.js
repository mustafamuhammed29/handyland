const express = require('express');
const router = express.Router();
const {
    createPaymentIntent,
    stripeWebhook,
    createPayPalOrder,
    capturePayPalOrder
} = require('../controllers/paymentController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Stripe Routes
router.post('/create-payment-intent', paymentLimiter, protect, createPaymentIntent); // Stripe Elements (embedded)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// PayPal Routes
router.post('/paypal/create-order', paymentLimiter, protect, createPayPalOrder);
router.post('/paypal/capture-order', paymentLimiter, protect, capturePayPalOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    handleWebhook,
    handlePaymentSuccess,
    getPaymentDetails,
    createRefund,
    createPayPalOrder,
    capturePayPalOrder
} = require('../controllers/paymentController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// Stripe Routes
router.post('/create-checkout-session', optionalProtect, createCheckoutSession);
router.post('/success', handlePaymentSuccess);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/:sessionId', protect, getPaymentDetails);
router.post('/refund', protect, authorize('admin', 'staff'), createRefund);

// PayPal Routes
router.post('/paypal/create-order', optionalProtect, createPayPalOrder);
router.post('/paypal/capture-order', optionalProtect, capturePayPalOrder);

module.exports = router;

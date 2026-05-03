const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware(86400), settingsController.getSettings);
router.get('/payment-config', cacheMiddleware(300), settingsController.getPaymentConfig);
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

// SMTP Email Server Management (Admin only)
router.get('/smtp', protect, authorize('admin'), settingsController.getSmtpSettings);
router.put('/smtp', protect, authorize('admin'), settingsController.updateSmtpSettings);
router.post('/smtp/test', protect, authorize('admin'), settingsController.testSmtpConnection);
// Social Auth Management (Admin only)
router.get('/social-auth', protect, authorize('admin'), settingsController.getSocialAuthSettings);
router.put('/social-auth', protect, authorize('admin'), settingsController.updateSocialAuthSettings);

module.exports = router;

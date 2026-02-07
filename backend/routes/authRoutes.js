const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const rateLimit = require('express-rate-limit');

const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', emailLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', emailLimiter, authController.verifyEmail);
router.post('/resend-verification', emailLimiter, authController.resendVerification);

// Admin login (separate endpoint)
router.post('/admin/login', authController.adminLogin);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/updateprofile', protect, authController.updateProfile);
router.put('/changepassword', protect, authController.changePassword);
router.get('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);

module.exports = router;

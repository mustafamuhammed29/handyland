const express = require('express');
const router = express.Router();
const { authLimiter, passwordResetLimiter, otpLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const phoneVerificationService = require('../services/phoneVerificationService');

const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV === 'development';

// FIXED: Rate limiting active in all environments (FIX 6)
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDevelopment ? 10 : 3, // Relaxed in dev, strict in production
    message: {
        success: false,
        message: 'Too many requests. Please try again in 15 minutes.'
    }
});


const loginLimiter = isDevelopment
    ? (req, res, next) => {
        console.log('⚠️  Rate limiting disabled in development mode');
        next();
    }
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        skipSuccessfulRequests: true,
        message: {
            success: false,
            message: 'Too many login attempts from this IP, please try again after 15 minutes'
        }
    });

const registerLimiter = isDevelopment
    ? (req, res, next) => {
        console.log('⚠️  Register rate limiting disabled in development mode');
        next();
    }
    : rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour window
        max: 5, // limit each IP to 5 registrations per hour
        message: {
            success: false,
            message: 'Too many accounts created from this IP, please try again after an hour'
        }
    });

// Validation rules
const registerRules = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
        .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[@$!%*#?&]/).withMessage('Password must contain at least one special character'),
    body('phone').optional({ checkFalsy: true }).matches(/^\+?[0-9\s\-()]{7,20}$/).withMessage('Invalid phone number'),
];

const loginRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.get('/csrf', (req, res) => {
    const token = req.cookies && req.cookies['XSRF-TOKEN'];
    res.status(200).json({ success: true, token });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or validation error
 */
router.post('/register', registerLimiter, validate(registerRules), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: User not verified
 */
router.post('/login', loginLimiter, validate(loginRules), authController.login);
router.post('/forgot-password', emailLimiter, validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
]), authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.put('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', emailLimiter, authController.verifyEmail);
router.post('/resend-verification', emailLimiter, authController.resendVerification);

// Admin login (separate endpoint)
const authLimiterWrapper = isDevelopment
    ? (req, res, next) => {
        // console.log('⚠️  Auth rate limiting disabled in development mode');
        next();
    }
    : authLimiter;
router.post('/admin/login', authLimiterWrapper, authController.adminLogin);
router.get('/admin/users', protect, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
}, authController.getAllUsers);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/updateprofile', protect, authController.updateProfile);
router.put('/changepassword', protect, authController.updatePassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Phone Verification Routes
router.post('/phone/send-otp', otpLimiter, protect, validate([
    body('phone').trim().notEmpty().withMessage('Phone number is required').matches(/^\+?[0-9\s\-()]{7,20}$/).withMessage('Invalid phone number format')
]), async (req, res) => {
    const { phone } = req.body;
    try {
        const result = await phoneVerificationService.sendOTP(phone);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({ success: false, message: 'Failed to send verification code.' });
    }
});

router.post('/phone/verify-otp', protect, validate([
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
]), async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const result = await phoneVerificationService.verifyOTP(req.user.id, phone, otp);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ success: false, message: 'Verification process failed.' });
    }
});

// Email availability check (used for live validation in Register form)
const checkEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDevelopment ? 100 : 20,
    message: { success: false, message: 'Too many requests' }
});
router.post('/check-email', checkEmailLimiter, authController.checkEmailAvailability);

module.exports = router;

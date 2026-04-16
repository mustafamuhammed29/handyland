/**
 * routes/index.js
 * Central router — imports all feature routes and mounts them.
 * Keep server.js clean: one line per domain.
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');

// ── Auth rate limiter ──────────────────────────────────────────────────────────
const rawAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

const authLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    return rawAuthLimiter(req, res, next);
};

// ── Upload (rate limited + auth) ───────────────────────────────────────────────
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many uploads, please try again later.' },
});

const upload = process.env.CLOUDINARY_URL
    ? require('../utils/cloudinaryUpload')
    : require('../utils/imageUpload');

router.post('/upload', uploadLimiter, protect, upload.single('image'), (req, res) => {
    if (!req.file) {return res.status(400).json({ success: false, message: 'No file uploaded' });}
    const imageUrl = (req.file.path && req.file.path.startsWith('http'))
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

// ── Feature routes ─────────────────────────────────────────────────────────────
router.use('/auth', authLimiter, require('./authRoutes'));
router.use('/auth', require('./socialAuthRoutes'));
router.use('/auth/2fa', require('./twoFactorRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/accessories', require('./accessoriesRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/inventory', require('./inventoryRoutes'));
router.use('/payment', require('./paymentRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/repair-parts', require('./repairPartRoutes'));
router.use('/repairs', require('./repairRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/emails', require('./emailRoutes'));
router.use('/email-templates', require('./emailTemplateRoutes'));
router.use('/stats', require('./statsRoutes'));
router.use('/repair-archive', require('./repairArchiveRoutes'));
router.use('/valuation', require('./valuationRoutes'));
router.use('/audit-logs', require('./auditRoutes'));
router.use('/promotions', require('./promotionsRoutes'));
router.use('/addresses', require('./addressRoutes'));
router.use('/transactions', require('./transactionRoutes'));
router.use('/translations', require('./translationRoutes'));
router.use('/wishlist', require('./wishlistRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/shipping-methods', require('./shippingRoutes'));
router.use('/pages', require('./pageRoutes'));
router.use('/coupons', require('./couponRoutes'));
router.use('/loaners', require('./loanerRoutes'));
router.use('/warranties', require('./warrantyRoutes'));
router.use('/price-research', require('./priceResearchRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/purchase-orders', require('./purchaseOrderRoutes'));

module.exports = router;

const express = require('express');
const router = express.Router();

// Mock Data for Promotions
const promotions = [
    {
        id: 'promo_001',
        title: 'Screen Replacement Special',
        description: 'Get 20% off your next repair screen replacement.',
        discount: '20%',
        code: 'SCREEN20',
        imageUrl: '/uploads/promotions/screen-repair.jpg', // Placeholder
        active: true,
        expiresAt: '2026-12-31'
    },
    {
        id: 'promo_002',
        title: 'Battery Boost',
        description: 'Free battery checkup with any repair.',
        discount: 'FREE',
        code: 'BATTERYFREE',
        imageUrl: '/uploads/promotions/battery.jpg',
        active: false,
        expiresAt: '2025-12-31'
    }
];

// @route   GET /api/promotions/active
// @desc    Get all active promotions
// @access  Public
router.get('/active', (req, res) => {
    const activePromos = promotions.filter(p => p.active);
    res.json({ success: true, promotions: activePromos });
});

// @route   GET /api/promotions
// @desc    Get all promotions (Admin)
// @access  Private (TODO: Add auth middleware)
router.get('/', (req, res) => {
    res.json({ success: true, promotions });
});

module.exports = router;

/**
 * backend/routes/twoFactorRoutes.js
 * Two-Factor Authentication routes
 */
'use strict';

const express = require('express');
const router = express.Router();
const { setup2FA, verify2FA, disable2FA } = require('../controllers/twoFactorController');
const { protect } = require('../middleware/auth');

router.post('/setup', protect, setup2FA);
router.post('/verify', protect, verify2FA);
router.post('/disable', protect, disable2FA);

module.exports = router;

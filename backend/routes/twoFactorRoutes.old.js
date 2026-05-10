'use strict';
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { setup2FA, verify2FA, disable2FA } = require('../controllers/twoFactorController');

router.post('/setup', protect, authorize('admin'), setup2FA);
router.post('/verify', protect, authorize('admin'), verify2FA);
router.post('/disable', protect, authorize('admin'), disable2FA);

module.exports = router;

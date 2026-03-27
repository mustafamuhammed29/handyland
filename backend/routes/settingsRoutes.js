const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware(86400), settingsController.getSettings);
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;

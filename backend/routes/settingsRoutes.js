const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const { protect, authorize } = require('../middleware/auth');

router.get('/', settingsController.getSettings);
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;

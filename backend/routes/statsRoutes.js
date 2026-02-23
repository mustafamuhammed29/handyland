const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), statsController.getDashboardStats);
router.get('/user', protect, statsController.getUserStats);

module.exports = router;

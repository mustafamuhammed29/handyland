const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

router.get('/', protect, cartController.getCart);
router.post('/sync', protect, cartController.syncCart);
router.put('/', protect, cartController.updateCart);
router.delete('/', protect, cartController.clearCart);

// Admin Routes
router.get('/all', protect, authorize('admin'), cartController.getAllCarts);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

router.get('/', protect, cartController.getCart);
router.post('/', protect, cartController.addToCart);
router.post('/sync', protect, cartController.syncCart);
router.put('/', protect, cartController.updateCartItem);
router.delete('/:itemId', protect, cartController.removeFromCart);
router.delete('/', protect, cartController.clearCart);
router.get('/all', protect, authorize('admin'), cartController.getAllCarts);
router.post('/admin/:cartId/remind', protect, authorize('admin'), cartController.sendCartReminder);

module.exports = router;

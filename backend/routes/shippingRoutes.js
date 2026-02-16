const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', shippingController.getShippingMethods); // Public
router.get('/admin/all', protect, authorize('admin'), shippingController.getAllShippingMethodsAdmin);
router.post('/', protect, authorize('admin'), shippingController.createShippingMethod);
router.put('/:id', protect, authorize('admin'), shippingController.updateShippingMethod);
router.delete('/:id', protect, authorize('admin'), shippingController.deleteShippingMethod);

module.exports = router;

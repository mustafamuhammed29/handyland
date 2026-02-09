const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

// Reviews
router.post('/:id/reviews', protect, productController.createProductReview);
router.get('/:id/reviews', productController.getProductReviews);

module.exports = router;

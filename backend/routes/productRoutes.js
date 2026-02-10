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

// Related Products
router.get('/:id/related', productController.getRelatedProducts);

// Q&A
router.get('/:id/questions', productController.getProductQuestions);
router.post('/:id/questions', protect, productController.askQuestion);
router.put('/questions/:id/answer', protect, authorize('admin'), productController.answerQuestion);

module.exports = router;

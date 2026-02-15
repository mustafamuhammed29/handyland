const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of products with pagination info
 */
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', protect, authorize('admin'), productController.createProduct);
router.put('/:id', protect, authorize('admin'), productController.updateProduct);
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

// Stock Validation
router.post('/validate-stock', productController.validateStock);

module.exports = router;

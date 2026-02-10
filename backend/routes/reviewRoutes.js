const express = require('express');
const { addReview, getProductReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, addReview);
router.route('/product/:productId').get(getProductReviews);

router.get('/admin', protect, authorize('admin'), require('../controllers/reviewController').getAllReviews);
router.delete('/:id', protect, authorize('admin'), require('../controllers/reviewController').deleteReview);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
} = require('../controllers/promotionsController');

router.get('/active', getPromotions);
router.get('/', getPromotions);
router.post('/', protect, authorize('admin'), createPromotion);
router.put('/:id', protect, authorize('admin'), updatePromotion);
router.delete('/:id', protect, authorize('admin'), deletePromotion);

module.exports = router;

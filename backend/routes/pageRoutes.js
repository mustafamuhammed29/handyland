const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:slug', pageController.getPageBySlug); // Public
router.get('/', protect, authorize('admin'), pageController.getAllPages); // Admin list all
router.post('/', protect, authorize('admin'), pageController.createOrUpdatePage); // Upsert
router.delete('/:id', protect, authorize('admin'), pageController.deletePage);

module.exports = router;

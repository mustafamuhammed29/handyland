const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:slug', pageController.getPage); // Public
router.get('/', protect, authorize('admin'), pageController.getPages); // Admin list all
router.post('/', protect, authorize('admin'), pageController.createPage); // Upsert
router.put('/:id', protect, authorize('admin'), pageController.updatePage);
router.delete('/:id', protect, authorize('admin'), pageController.deletePage);

module.exports = router;

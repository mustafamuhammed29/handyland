const express = require('express');
const router = express.Router();
const ebayCatalogController = require('../controllers/ebayCatalogController');
const { protect, authorize } = require('../middleware/auth');

// Search eBay Catalog by query to extract models (Admin only)
router.get('/search', protect, authorize('admin'), ebayCatalogController.searchEbayCatalog);

// Import selected devices to the local database (Admin only)
router.post('/import', protect, authorize('admin'), ebayCatalogController.importFromEbay);

module.exports = router;

const express = require('express');
const router = express.Router();
const ebayCatalogController = require('../controllers/ebayCatalogController');
const { protect } = require('../middleware/auth');

// Search eBay Catalog by query to extract models
router.get('/search', protect, ebayCatalogController.searchEbayCatalog);

// Import selected devices to the local database
router.post('/import', protect, ebayCatalogController.importFromEbay);

module.exports = router;

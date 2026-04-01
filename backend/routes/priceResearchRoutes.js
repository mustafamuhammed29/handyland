const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    researchSingle,
    researchDevice,
    applyPrice,
    getResearchStatus,
} = require('../controllers/priceResearchController');

// All routes require admin authentication
router.use(protect, authorize('admin'));

// GET  /api/price-research/ebay?model=iPhone+15+Pro&storage=128GB
router.get('/ebay', researchSingle);

// POST /api/price-research/ebay/device/:blueprintId  (research all storages)
router.post('/ebay/device/:blueprintId', researchDevice);

// POST /api/price-research/apply/:blueprintId  (apply suggested price)
router.post('/apply/:blueprintId', applyPrice);

// GET  /api/price-research/status  (all blueprints with research metadata)
router.get('/status', getResearchStatus);

module.exports = router;

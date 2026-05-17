const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');
const { protect, authorize } = require('../middleware/auth');

// ==========================================
// BLUEPRINT MANAGEMENT (ADMIN)
// ==========================================
router.get('/', (req, res) => res.status(200).json({ success: true, message: 'Valuation API is healthy' }));

router.get('/devices', valuationController.getBlueprints);
// Reseed must come BEFORE /:id
router.post('/devices/reseed', protect, authorize('admin'), valuationController.reseedBlueprints);
router.post('/devices', protect, authorize('admin'), valuationController.createBlueprint);
router.put('/devices/:id', protect, authorize('admin'), valuationController.updateBlueprint);
router.delete('/devices/:id', protect, authorize('admin'), valuationController.deleteBlueprint);
// Bulk delete (uses request body, not params)
router.delete('/devices', protect, authorize('admin'), valuationController.bulkDeleteBlueprints);

// ==========================================
// VALUATION & QUOTES (PUBLIC/USER)
// ==========================================

// Authorized Quote Management
router.post('/calculate', valuationController.calculatePrice);
router.post('/saved', valuationController.saveValuationQuote);
router.get('/quote/:reference', valuationController.getQuoteByReference);
router.get('/my-valuations', protect, valuationController.getSavedValuations); // Alias for frontend
router.get('/saved', protect, valuationController.getSavedValuations);

// ==========================================
// ADMIN QUOTES MANAGEMENT
// ==========================================
router.get('/admin/quotes', protect, authorize('admin'), valuationController.getValuations);
router.put('/admin/quotes/:id/status', protect, authorize('admin'), valuationController.updateValuationStatus);
router.post('/admin/quotes/:id/complete-purchase', protect, authorize('admin'), valuationController.completePurchase);

// ==========================================
// CATEGORY & BRAND MANAGEMENT
// ==========================================
router.get('/categories', valuationController.getCategories);
router.post('/categories', protect, authorize('admin'), valuationController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), valuationController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), valuationController.deleteCategory);

router.get('/brands', valuationController.getBrands);
router.post('/brands', protect, authorize('admin'), valuationController.createBrand);
router.put('/brands/:id', protect, authorize('admin'), valuationController.updateBrand);
router.delete('/brands/:id', protect, authorize('admin'), valuationController.deleteBrand);

module.exports = router;

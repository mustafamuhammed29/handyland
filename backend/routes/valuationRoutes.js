const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');
const { protect, authorize } = require('../middleware/auth');

// ==========================================
// BLUEPRINT MANAGEMENT (ADMIN)
// ==========================================
// Changed to /devices to match Admin Panel frontend
router.get('/devices', valuationController.getBlueprints);
router.post('/devices', protect, valuationController.createBlueprint);
router.put('/devices/:id', protect, valuationController.updateBlueprint);
router.delete('/devices/:id', protect, valuationController.deleteBlueprint);

// ==========================================
// VALUATION & QUOTES (PUBLIC/USER)
// ==========================================

// Public Calculation Endpoint
router.post('/calculate', valuationController.calculateValuation);

// Authorized Quote Management
router.post('/quote', protect, valuationController.createQuote);
router.post('/saved', protect, valuationController.saveValuation);
router.get('/my-valuations', protect, valuationController.getMyValuations); // Alias for frontend
router.get('/saved', protect, valuationController.getMyValuations);
router.delete('/saved/:id', protect, valuationController.deleteValuation);

// Public Quote Retrieval & Confirmation
router.get('/quote/:reference', valuationController.getQuoteByReference);
router.put('/quote/:reference/confirm', valuationController.confirmQuote);

// ==========================================
// ADMIN QUOTES MANAGEMENT
// ==========================================
router.get('/admin/quotes', protect, authorize('admin'), valuationController.getAdminQuotes);
router.put('/admin/quotes/:id/status', protect, authorize('admin'), valuationController.updateQuoteStatus);

module.exports = router;

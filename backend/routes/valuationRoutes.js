const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');
const { protect, admin } = require('../middleware/auth'); // Assuming admin middleware exists or just use protect for now

// ==========================================
// BLUEPRINT MANAGEMENT (ADMIN)
// ==========================================
// Changed to /devices to match Admin Panel frontend
router.get('/devices', protect, valuationController.getBlueprints);
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
router.get('/saved', protect, valuationController.getMyValuations);
router.delete('/saved/:id', protect, valuationController.deleteValuation);

module.exports = router;

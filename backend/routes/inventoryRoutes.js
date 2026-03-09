const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

router.use(protect);
router.use(authorize('admin')); // Only admins can access inventory data

router.get('/stats', inventoryController.getInventoryStats);
router.get('/items', inventoryController.getInventoryItems);
router.get('/sales', inventoryController.getRecentSales);
router.get('/history', inventoryController.getStockHistory);
router.put('/:type/:id/stock', inventoryController.updateStock);

module.exports = router;

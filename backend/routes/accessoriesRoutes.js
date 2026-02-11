const express = require('express');
const router = express.Router();
const accessoriesController = require('../controllers/accessoriesController');
const { protect, authorize } = require('../middleware/auth');

// Public - Get all accessories
router.get('/', accessoriesController.getAccessories);

// Admin only - Create, Update, Delete
router.post('/', protect, authorize('admin'), accessoriesController.createAccessory);
router.put('/:id', protect, authorize('admin'), accessoriesController.updateAccessory);
router.delete('/:id', protect, authorize('admin'), accessoriesController.deleteAccessory);

module.exports = router;

const express = require('express');
const router = express.Router();
const repairPartController = require('../controllers/repairPartController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all repair parts routes
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.route('/')
    .get(repairPartController.getRepairParts)
    .post(repairPartController.createRepairPart);

router.route('/:id')
    .get(repairPartController.getRepairPartById)
    .put(repairPartController.updateRepairPart)
    .delete(repairPartController.deleteRepairPart);

module.exports = router;

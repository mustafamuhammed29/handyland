const express = require('express');
const router = express.Router();
const repairPartController = require('../controllers/repairPartController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all repair parts routes
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.route('/')
    .get(repairPartController.getParts)
    .post(repairPartController.createPart);

router.route('/:id')
    // .get(repairPartController.getRepairPartById)
    .put(repairPartController.updatePart)
    .delete(repairPartController.deletePart);

module.exports = router;

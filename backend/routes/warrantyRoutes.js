const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warrantyController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/search', warrantyController.searchWarranty);

router.route('/')
    .get(warrantyController.getWarranties)
    .post(warrantyController.addWarranty);

router.route('/:id')
    .put(warrantyController.updateWarranty)
    .delete(warrantyController.deleteWarranty);

module.exports = router;

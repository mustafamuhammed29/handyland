const express = require('express');
const router = express.Router();
const controller = require('../controllers/repairArchiveController');
const { uploadFields } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// Public read: Archive cases are public to browse
router.get('/', controller.getAllCases);

// Admin-only mutation routes
router.post('/', 
    protect, 
    authorize('admin'),
    uploadFields('repairs', ['imgBefore', 'imgAfter']), 
    controller.createCase
);

router.put('/:id', 
    protect, 
    authorize('admin'),
    uploadFields('repairs', ['imgBefore', 'imgAfter']), 
    controller.updateCase
);

router.delete('/:id', protect, authorize('admin'), controller.deleteCase);

module.exports = router;

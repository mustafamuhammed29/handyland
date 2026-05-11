const express = require('express');
const router = express.Router();
const controller = require('../controllers/repairArchiveController');
const { uploadFields } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// Public or Protected routes? Archive is usually public to view, protected to create
router.get('/', controller.getAllCases);

// Protected routes (Admin only logic usually handled in controller or via another middleware)
router.post('/', 
    protect, 
    uploadFields('repairs', ['imgBefore', 'imgAfter']), 
    controller.createCase
);

router.put('/:id', 
    protect, 
    uploadFields('repairs', ['imgBefore', 'imgAfter']), 
    controller.updateCase
);

router.delete('/:id', protect, controller.deleteCase);

module.exports = router;

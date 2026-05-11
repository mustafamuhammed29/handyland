const express = require('express');
const router = express.Router();
const loanerController = require('../controllers/loanerController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin privileges
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(loanerController.getLoaners)
    .post(loanerController.createLoaner);

// Stats must come BEFORE /:id to avoid 'stats' being treated as an ID
router.get('/stats', loanerController.getLoanerStats);

router.route('/:id')
    .put(loanerController.updateLoaner)
    .delete(loanerController.deleteLoaner);

router.post('/:id/lend', loanerController.assignLoaner);
router.post('/:id/return', loanerController.returnLoaner);

module.exports = router;

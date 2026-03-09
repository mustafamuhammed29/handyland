const express = require('express');
const router = express.Router();
const loanerController = require('../controllers/loanerController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin privileges
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(loanerController.getLoaners)
    .post(loanerController.addLoaner);

router.route('/:id')
    .put(loanerController.updateLoaner)
    .delete(loanerController.deleteLoaner);

router.post('/:id/lend', loanerController.lendPhone);
router.post('/:id/return', loanerController.returnPhone);

module.exports = router;

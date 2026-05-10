const express = require('express');
const router = express.Router();
const {
    createRefund,
    getRefunds,
    getRefund,
    updateRefundStatus
} = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', protect, createRefund);
router.get('/my', protect, getRefunds);
// router.delete('/:id', protect, deleteRefundRequest);

// Admin routes
router.get('/', protect, authorize('admin', 'staff'), getRefunds);
router.get('/:id', protect, authorize('admin', 'staff'), getRefund);
// router.put('/:id/approve', protect, authorize('admin'), approveRefund);
// router.put('/:id/reject', protect, authorize('admin'), rejectRefund);
router.put('/:id/status', protect, authorize('admin', 'staff'), updateRefundStatus);

module.exports = router;


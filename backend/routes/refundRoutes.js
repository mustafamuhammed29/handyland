const express = require('express');
const router = express.Router();
const {
    submitRefundRequest,
    getMyRefunds,
    getAllRefunds,
    approveRefund,
    rejectRefund,
    getRefundById,
    updateRefundStatus,
    deleteRefundRequest
} = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', protect, submitRefundRequest);
router.get('/my', protect, getMyRefunds);
router.delete('/:id', protect, deleteRefundRequest);

// Admin routes
router.get('/', protect, authorize('admin', 'staff'), getAllRefunds);
router.get('/:id', protect, authorize('admin', 'staff'), getRefundById);
router.put('/:id/approve', protect, authorize('admin'), approveRefund);
router.put('/:id/reject', protect, authorize('admin'), rejectRefund);
router.put('/:id/status', protect, authorize('admin', 'staff'), updateRefundStatus);

module.exports = router;


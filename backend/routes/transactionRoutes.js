const express = require('express');
const {
    getTransactions,
    createTopUpSession,
    confirmTopUp,
    createPayPalTopUp,
    capturePayPalTopUp,
    createBankTransferTopUp,
    getAllTransactions,
    updateTransactionStatus
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// User Routes
router.get('/', getTransactions);
router.post('/create-topup-session', createTopUpSession);
router.post('/confirm-topup', confirmTopUp);

router.post('/paypal/create-topup', createPayPalTopUp);
router.post('/paypal/capture-topup', capturePayPalTopUp);
router.post('/bank-transfer', createBankTransferTopUp);

// Admin Routes
router.get('/admin', authorize('admin'), getAllTransactions);
router.put('/admin/:id/status', authorize('admin'), updateTransactionStatus);

module.exports = router;

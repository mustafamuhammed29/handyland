const express = require('express');
const {
    getTransactions,
    getTransaction,
    adminUpdateTransactionStatus,
    createTopUpSession,
    confirmTopUp,
    createPayPalTopUp,
    capturePayPalTopUp,
    createBankTransferTopUp,
    uploadTransactionReceipt
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const { receiptUpload } = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Customer Top-up & Transactions
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/create-topup-session', createTopUpSession);
router.post('/confirm-topup', confirmTopUp);
router.post('/paypal/create-topup', createPayPalTopUp);
router.post('/paypal/capture-topup', capturePayPalTopUp);
router.post('/bank-transfer', createBankTransferTopUp);
router.post('/:id/upload-receipt', receiptUpload.single('receipt'), uploadTransactionReceipt);

// Admin Routes
router.get('/admin', authorize('admin', 'staff'), getTransactions);
router.put('/admin/:id/status', authorize('admin', 'staff'), adminUpdateTransactionStatus);

module.exports = router;

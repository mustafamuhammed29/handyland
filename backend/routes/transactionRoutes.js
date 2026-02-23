const express = require('express');
const { getTransactions, createTopUpSession, confirmTopUp } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTransactions);
router.post('/create-topup-session', createTopUpSession);
router.post('/confirm-topup', confirmTopUp);

module.exports = router;

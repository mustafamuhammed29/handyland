const express = require('express');
const { getTransactions, addFunds } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTransactions);
router.post('/add-funds', addFunds);

module.exports = router;

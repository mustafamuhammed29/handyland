const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add funds (Mock)
// @route   POST /api/transactions/add-funds
// @access  Private
exports.addFunds = async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create transaction recorc
        const transaction = await Transaction.create({
            user: user._id,
            amount,
            type: 'deposit', // explicitly set type to deposit
            paymentMethod,
            status: 'completed',
            description: 'Funds added to wallet'
        });

        // Update user balance
        user.balance += parseFloat(amount);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Funds added successfully',
            balance: user.balance,
            transaction
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

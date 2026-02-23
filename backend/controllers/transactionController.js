const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Settings = require('../models/Settings');

// Helper: get Stripe instance (same pattern as paymentController)
const getStripe = async () => {
    const settings = await Settings.findOne();
    const secretKey = settings?.payment?.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;
    if (secretKey && !secretKey.includes('your_stripe_secret_key')) {
        return require('stripe')(secretKey);
    }
    throw new Error('Stripe ist nicht konfiguriert. Bitte Stripe-Schlüssel im Admin-Panel hinterlegen.');
};

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

// @desc    Create Stripe Checkout session for wallet top-up
// @route   POST /api/transactions/create-topup-session
// @access  Private
exports.createTopUpSession = async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount < 5) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag ist 5 €' });
        }
        if (parsedAmount > 5000) {
            return res.status(400).json({ success: false, message: 'Maximalbetrag ist 5.000 €' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });

        const stripe = await getStripe();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.email,
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Handyland Wallet Aufladung',
                        description: `Guthaben auf Ihr Wallet aufladen: €${parsedAmount.toFixed(2)}`,
                    },
                    unit_amount: Math.round(parsedAmount * 100), // Stripe uses cents
                },
                quantity: 1,
            }],
            success_url: `${process.env.FRONTEND_URL}/dashboard?wallet=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard?wallet=cancelled`,
            metadata: {
                userId: req.user.id,
                type: 'wallet_topup',
                amount: parsedAmount.toFixed(2),
            },
        });

        res.status(200).json({ success: true, url: session.url, sessionId: session.id });

    } catch (error) {
        console.error('Wallet top-up session error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Fehler beim Erstellen der Zahlungssitzung'
        });
    }
};

// @desc    Verify Stripe session and credit wallet (called after redirect)
// @route   POST /api/transactions/confirm-topup
// @access  Private
exports.confirmTopUp = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, message: 'Session-ID fehlt' });

        const stripe = await getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify session belongs to this user and is for wallet top-up
        if (session.metadata?.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Nicht autorisiert' });
        }
        if (session.metadata?.type !== 'wallet_topup') {
            return res.status(400).json({ success: false, message: 'Ungültige Sitzung' });
        }
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Zahlung noch nicht abgeschlossen' });
        }

        // Check if already processed (idempotency)
        const existing = await Transaction.findOne({ stripePaymentId: session.payment_intent });
        if (existing) {
            return res.status(200).json({ success: true, message: 'Bereits verarbeitet', alreadyProcessed: true });
        }

        const amount = parseFloat(session.metadata.amount);

        // Create transaction record
        await Transaction.create({
            user: req.user.id,
            amount,
            type: 'deposit',
            paymentMethod: 'card',
            status: 'completed',
            stripePaymentId: session.payment_intent,
            description: `Wallet-Aufladung via Stripe (€${amount.toFixed(2)})`,
        });

        // Credit user balance
        const user = await User.findById(req.user.id);
        user.balance = (user.balance || 0) + amount;
        await user.save();

        res.status(200).json({
            success: true,
            message: `€${amount.toFixed(2)} erfolgreich gutgeschrieben`,
            newBalance: user.balance,
        });

    } catch (error) {
        console.error('Confirm top-up error:', error);
        res.status(500).json({ success: false, message: error.message || 'Fehler beim Bestätigen der Zahlung' });
    }
};

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Settings = require('../models/Settings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for receipt uploads
const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/receipts');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${req.user.id}-${Date.now()}${ext}`);
    }
});

exports.receiptUpload = multer({
    storage: receiptStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Nur Bilder (JPG, PNG, WebP) oder PDF erlaubt'), false);
    }
});

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
        if (!user) {return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });}

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
        if (!sessionId) {return res.status(400).json({ success: false, message: 'Session-ID fehlt' });}

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

// ==========================================
// PayPal Wallet Top-Up
// ==========================================
const paypal = require('@paypal/checkout-server-sdk');

const getPayPalClient = async () => {
    const settings = await Settings.findOne();
    const clientId = settings?.payment?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = settings?.payment?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET;
    const environment = settings?.payment?.paypal?.mode === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    return new paypal.core.PayPalHttpClient(environment);
};

// @desc    Create PayPal Top-up Order
// @route   POST /api/transactions/paypal/create-topup
// @access  Private
exports.createPayPalTopUp = async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount < 5) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag ist 5 €' });
        }
        if (parsedAmount > 5000) {
            return res.status(400).json({ success: false, message: 'Maximalbetrag ist 5.000 €' });
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: "EUR",
                    value: parsedAmount.toFixed(2)
                },
                description: `Handyland Wallet Aufladung: €${parsedAmount.toFixed(2)}`
            }]
        });

        const client = await getPayPalClient();
        const order = await client.execute(request);

        res.status(200).json({
            success: true,
            id: order.result.id
        });
    } catch (error) {
        console.error('PayPal create top-up order error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Erstellen der PayPal-Bestellung',
            error: error.message
        });
    }
};

// @desc    Capture PayPal Top-up Order
// @route   POST /api/transactions/paypal/capture-topup
// @access  Private
exports.capturePayPalTopUp = async (req, res) => {
    try {
        const { orderID } = req.body;

        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const client = await getPayPalClient();
        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            const amount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value);
            const captureId = capture.result.purchase_units[0].payments.captures[0].id;

            // Check if already processed
            const existing = await Transaction.findOne({ stripePaymentId: captureId });
            if (existing) {
                return res.status(200).json({ success: true, message: 'Bereits verarbeitet', alreadyProcessed: true });
            }

            // Create transaction record
            await Transaction.create({
                user: req.user.id,
                amount,
                type: 'deposit',
                paymentMethod: 'paypal',
                status: 'completed',
                stripePaymentId: captureId, // Using this field for PayPal Capture ID as well
                description: `Wallet-Aufladung via PayPal (€${amount.toFixed(2)})`,
            });

            // Credit user balance
            const user = await User.findById(req.user.id);
            user.balance = (user.balance || 0) + amount;
            await user.save();

            res.status(200).json({
                success: true,
                message: `€${amount.toFixed(2)} erfolgreich per PayPal gutgeschrieben`,
                newBalance: user.balance,
            });
        } else {
            res.status(400).json({ success: false, message: 'PayPal-Zahlung nicht abgeschlossen' });
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Erfassen der PayPal-Zahlung',
            error: error.message
        });
    }
};

// ==========================================
// Bank Transfer Wallet Top-Up
// ==========================================

// @desc    Create pending Bank Transfer Top-up (NO immediate balance credit)
// @route   POST /api/transactions/bank-transfer
// @access  Private
exports.createBankTransferTopUp = async (req, res) => {
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

        // Create a *pending* transaction — NO balance credited yet
        const transaction = await Transaction.create({
            user: req.user.id,
            amount: parsedAmount,
            type: 'deposit',
            paymentMethod: 'bank_transfer',
            status: 'pending',
            description: `Ausstehende Wallet-Aufladung via Banküberweisung (€${parsedAmount.toFixed(2)})`,
        });

        res.status(200).json({
            success: true,
            message: 'Antrag auf Banküberweisung erstellt. Bitte laden Sie Ihren Zahlungsbeleg hoch.',
            transactionId: transaction._id,
            transaction
        });

    } catch (error) {
        console.error('Bank Transfer top-up error:', error);
        res.status(500).json({ success: false, message: 'Fehler beim Erstellen des Antrags', error: error.message });
    }
};

// @desc    Upload receipt for a pending bank transfer transaction
// @route   POST /api/transactions/:id/upload-receipt
// @access  Private
exports.uploadTransactionReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user.id,
            paymentMethod: 'bank_transfer',
            status: 'pending'
        });

        if (!transaction) {
            // Clean up uploaded file if transaction not found
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden oder bereits abgeschlossen' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Kein Beleg-Datei hochgeladen' });
        }

        // Delete old receipt if exists
        if (transaction.receiptUrl) {
            const oldPath = path.join(__dirname, '..', transaction.receiptUrl);
            if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
        }

        const receiptUrl = `/uploads/receipts/${req.file.filename}`;
        transaction.receiptUrl = receiptUrl;
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Zahlungsbeleg erfolgreich hochgeladen. Der Admin wird Ihre Zahlung prüfen.',
            receiptUrl
        });

    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {});
        console.error('Upload receipt error:', error);
        res.status(500).json({ success: false, message: 'Fehler beim Hochladen des Belegs', error: error.message });
    }
};

// ==========================================
// Admin Transaction Management
// ==========================================

// @desc    Get all transactions (Admin)
// @route   GET /api/transactions/admin
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
    try {
        const { status, type } = req.query;
        const query = {};
        if (status) {query.status = status;}
        if (type) {query.type = type;}

        const transactions = await Transaction.find(query)
            .populate('user', 'name email balance')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        console.error('Admin Fetch Transactions Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update transaction status (e.g. approve bank transfer)
// @route   PUT /api/transactions/admin/:id/status
// @access  Private/Admin
exports.updateTransactionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden' });
        }

        // Optional logic: if approving a pending deposit, credit the user's wallet
        if (transaction.status === 'pending' && status === 'completed' && transaction.type === 'deposit') {
            const user = await User.findById(transaction.user);
            if (user) {
                user.balance = (user.balance || 0) + transaction.amount;
                await user.save();
                transaction.description = transaction.description.replace('Ausstehende ', '');
            }
        }

        // Optional logic: if declining a completed deposit, deduct from the user's wallet
        // This is complex because they might have spent the money. We will just allow status update.
        if (transaction.status === 'completed' && status === 'failed' && transaction.type === 'deposit') {
            const user = await User.findById(transaction.user);
            if (user) {
                user.balance = Math.max(0, (user.balance || 0) - transaction.amount);
                await user.save();
            }
        }

        transaction.status = status;
        await transaction.save();

        res.status(200).json({
            success: true,
            message: `Transaktionsstatus aktualisiert auf ${status}`,
            transaction
        });

    } catch (error) {
        console.error('Admin Update Transaction Status Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

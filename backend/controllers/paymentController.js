const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// @desc    Create Stripe checkout session
// @route   POST /api/payment/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided'
            });
        }

        // Create line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user.id,
                items: JSON.stringify(items),
                shippingAddress: JSON.stringify(shippingAddress),
            },
        });

        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating checkout session',
            error: error.message
        });
    }
};

// @desc    Handle successful payment
// @route   POST /api/payment/success
// @access  Private
exports.handlePaymentSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // Create order in database
            const { userId, items, shippingAddress } = session.metadata;

            const parsedItems = JSON.parse(items);
            const parsedAddress = JSON.parse(shippingAddress);

            // Calculate total
            const totalAmount = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const order = await Order.create({
                user: userId,
                items: parsedItems.map(item => ({
                    product: item.product,
                    productType: item.productType,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })),
                totalAmount,
                shippingAddress: parsedAddress,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                paymentId: session.payment_intent,
                status: 'processing'
            });

            res.status(200).json({
                success: true,
                message: 'Payment successful',
                order
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }
    } catch (error) {
        console.error('Payment success handler error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payment/webhook
// @access  Public (Stripe only)
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment successful:', session.id);

            // Update order status
            const { userId, items, shippingAddress } = session.metadata;
            const parsedItems = JSON.parse(items);
            const parsedAddress = JSON.parse(shippingAddress);
            const totalAmount = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            await Order.create({
                user: userId,
                items: parsedItems.map(item => ({
                    product: item.product,
                    productType: item.productType,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })),
                totalAmount,
                shippingAddress: parsedAddress,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                paymentId: session.payment_intent,
                status: 'processing'
            });
            break;

        case 'payment_intent.payment_failed':
            const paymentIntent = event.data.object;
            console.log('Payment failed:', paymentIntent.id);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

// @desc    Get payment details
// @route   GET /api/payment/:sessionId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

        res.status(200).json({
            success: true,
            payment: {
                id: session.id,
                status: session.payment_status,
                amount: session.amount_total / 100,
                currency: session.currency
            }
        });
    } catch (error) {
        console.error('Get payment details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment details',
            error: error.message
        });
    }
};

// @desc    Create refund
// @route   POST /api/payment/refund
// @access  Private/Admin
exports.createRefund = async (req, res) => {
    try {
        const { paymentIntentId, amount } = req.body;

        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
        });

        res.status(200).json({
            success: true,
            message: 'Refund created successfully',
            refund
        });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating refund',
            error: error.message
        });
    }
};

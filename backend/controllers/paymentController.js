let stripe;
try {
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_stripe_secret_key')) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } else {
        throw new Error('Missing or placeholder Stripe key');
    }
} catch (error) {
    console.warn('Stripe initialization failed:', error.message);
    stripe = {
        checkout: { sessions: { create: async () => ({ id: 'mock_session_id', url: 'http://localhost:3000/mock-payment' }), retrieve: async () => ({ payment_status: 'paid', amount_total: 1000, metadata: {} }) } },
        webhooks: { constructEvent: () => ({ type: 'checkout.session.completed', data: { object: {} } }) },
        refunds: { create: async () => ({ id: 'mock_refund_id' }) }
    };
}
const Order = require('../models/Order');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const Transaction = require('../models/Transaction');

const Coupon = require('../models/Coupon');

// @desc    Create Stripe checkout session
// @route   POST /api/payment/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    try {
        const { items, shippingAddress, couponCode } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided or invalid format'
            });
        }

        // Validate Coupon if provided
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Invalid coupon code' });
            }
            if (!coupon.isActive) {
                return res.status(400).json({ success: false, message: 'Coupon is inactive' });
            }
            if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }
            if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
            }
        }

        // Validate Stock
        for (const item of items) {
            let product;
            if (item.productType === 'Product') {
                product = await Product.findById(item.product);
            } else {
                product = await Accessory.findById(item.product);
            }

            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}. Available: ${product.stock}` });
            }
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

        // Calculate Subtotal FIRST
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Determine Shipping Fee
        let shippingFee = 0;
        if (req.body.shippingFee) {
            shippingFee = parseFloat(req.body.shippingFee);
        } else {
            shippingFee = subtotal > 100 ? 0 : 5.99;
        }

        // Add Shipping to Line Items
        if (shippingFee > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Shipping Fee',
                    },
                    unit_amount: Math.round(shippingFee * 100),
                },
                quantity: 1,
            });
        }

        // Calculate Totals for Metadata

        const tax = subtotal * 0.19;

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
            customer_email: req.user ? req.user.email : req.body.email, // Use guest email if not logged in
            metadata: {
                userId: req.user ? req.user.id : 'guest',
                customerEmail: req.user ? req.user.email : req.body.email,
                items: JSON.stringify(items.map(i => ({ id: i.product, name: i.name, q: i.quantity, type: i.productType }))).substring(0, 500), // Truncate to avoid limit
                fullItems: JSON.stringify(items).substring(0, 500), // Keeping for compatibility but truncated
                shippingAddress: JSON.stringify(shippingAddress).substring(0, 500),
                subtotal: subtotal.toString(),
                shippingFee: shippingFee.toString(),
                tax: tax.toString(),
                couponCode: req.body.couponCode || '',
                discountAmount: req.body.discountAmount ? req.body.discountAmount.toString() : '0'
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
            // Check if order already exists to prevent duplicates
            const existingOrder = await Order.findOne({ paymentId: session.payment_intent });

            if (existingOrder) {
                return res.status(200).json({
                    success: true,
                    message: 'Payment successful (Order already processed)',
                    order: existingOrder
                });
            }

            // Create order in database
            const { userId, items, shippingAddress, couponCode, discountAmount, shippingFee, tax } = session.metadata;

            const parsedItems = JSON.parse(items);
            const parsedAddress = JSON.parse(shippingAddress);

            // Calculate total
            const totalAmount = session.amount_total / 100; // Stripe amount is in cents

            // Create order object
            const orderData = {
                items: parsedItems.map(item => ({
                    product: item.product,
                    productType: item.productType,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })),
                totalAmount,
                tax: tax ? parseFloat(tax) : 0,
                shippingFee: shippingFee ? parseFloat(shippingFee) : 0,
                shippingAddress: parsedAddress,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                paymentId: session.payment_intent,
                status: 'processing',
                couponCode: couponCode || null,
                discountAmount: discountAmount ? parseFloat(discountAmount) : 0
            };

            // Only add user if not guest
            if (userId && userId !== 'guest') {
                orderData.user = userId;
            }

            const order = await Order.create(orderData);

            // Create Transaction Record (only for registered users)
            if (userId && userId !== 'guest') {
                await Transaction.create({
                    user: userId,
                    order: order._id,
                    amount: totalAmount,
                    status: 'completed',
                    paymentMethod: 'card',
                    stripePaymentId: session.payment_intent,
                    description: `Payment for Order #${order.orderNumber}`
                });
            }

            // Deduct Stock (Ideally this should be in webhook, but valid here too as fallback)
            for (const item of parsedItems) {
                if (item.productType === 'Product') {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
                } else {
                    await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
                }
            }

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
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Payment successful (Webhook):', session.id);

        try {
            // Check if order already exists
            const existingOrder = await Order.findOne({ paymentId: session.payment_intent });
            if (existingOrder) {
                console.log('Order already processed, skipping.');
                return res.json({ received: true });
            }

            // Create order
            const { userId, items, shippingAddress, couponCode, discountAmount, shippingFee, tax, customerEmail } = session.metadata;

            // Safe Parsing
            let parsedItems = [];
            let parsedAddress = {};
            try {
                // If items was truncated or is just a summary, we might need to rely on the 'fullItems' or fallbacks if implemented.
                // For now, let's assume 'fullItems' is the one to use if 'items' is the summary version.
                // Based on previous step, 'items' is the summary (mapped) and 'fullItems' is the raw array.
                // Let's check which one we have.
                if (session.metadata.fullItems) {
                    parsedItems = JSON.parse(session.metadata.fullItems);
                } else {
                    parsedItems = JSON.parse(items);
                }
                parsedAddress = JSON.parse(shippingAddress);
            } catch (e) {
                console.error("Failed to parse metadata JSON", e);
                // Fallback or critical error? verify later.
            }

            const totalAmount = session.amount_total / 100;

            const orderData = {
                items: parsedItems.map(item => ({
                    product: item.product,
                    productType: item.productType,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })),
                totalAmount,
                tax: tax ? parseFloat(tax) : 0,
                shippingFee: shippingFee ? parseFloat(shippingFee) : 0,
                shippingAddress: parsedAddress,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                paymentId: session.payment_intent,
                status: 'processing',
                couponCode: couponCode || null,
                discountAmount: discountAmount ? parseFloat(discountAmount) : 0
            };

            if (userId && userId !== 'guest') {
                orderData.user = userId;
            }

            // Ensure email is saved in shipping address if not present
            if (!orderData.shippingAddress.email && customerEmail) {
                orderData.shippingAddress.email = customerEmail;
            }

            const order = await Order.create(orderData);

            // Create Transaction Record (only for registered users)
            if (userId && userId !== 'guest') {
                await Transaction.create({
                    user: userId,
                    order: order._id,
                    amount: totalAmount,
                    status: 'completed',
                    paymentMethod: 'card',
                    stripePaymentId: session.payment_intent,
                    description: `Payment for Order #${order.orderNumber || order._id}`
                });
            }

            // Deduct Stock
            for (const item of parsedItems) {
                if (item.productType === 'Product') {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
                } else {
                    await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
                }
            }

            // Update Coupon Usage
            if (couponCode) {
                await Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });
            }

            // Send Confirmation Email
            const emailService = require('../utils/emailService');
            // We pass the order object which now has ID and everything
            await emailService.sendOrderConfirmation(order);

        } catch (err) {
            console.error('Error processing webhook order creation:', err);
            // Don't return 500 to Stripe unless we want it to retry. 
            // Often better to log and alert admin, but here we might want retry for transient DB errors.
            return res.status(500).send('Internal Server Error');
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
    } else {
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

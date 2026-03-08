const Order = require('../models/Order');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

// FIXED: Cache Stripe instance to avoid DB query on every payment request (FIX 5)
let _stripeInstance = null;
let _stripeCacheTime = 0;
const STRIPE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get Stripe instance (with cache)
const getStripe = async () => {
    try {
        // FIXED: Return cached instance if still fresh (FIX 5)
        const now = Date.now();
        if (_stripeInstance && (now - _stripeCacheTime) < STRIPE_CACHE_TTL) {
            return _stripeInstance;
        }

        const settings = await Settings.findOne();
        const secretKey = settings?.payment?.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;

        let stripeResult;
        if (secretKey && !secretKey.includes('your_stripe_secret_key')) {
            stripeResult = require('stripe')(secretKey);
        } else {
            // Fallback Mock
            if (process.env.NODE_ENV !== 'production') console.warn('Stripe key missing or invalid. Using Mock.');
            stripeResult = {
                checkout: {
                    sessions: {
                        create: async (params) => ({
                            id: 'mock_session_' + Date.now(),
                            url: 'http://localhost:3000/payment-success?session_id=mock_session_' + Date.now(),
                            metadata: params.metadata,
                            amount_total: params.line_items.reduce((acc, item) => acc + item.price_data.unit_amount * item.quantity, 0),
                            currency: 'eur',
                            payment_status: 'unpaid'
                        }),
                        retrieve: async (id) => ({
                            id,
                            payment_status: 'paid',
                            amount_total: 1999,
                            currency: 'eur',
                            metadata: { orderId: 'mock_order_id' }
                        })
                    }
                },
                webhooks: {
                    constructEvent: (body, sig, secret) => {
                        if (Buffer.isBuffer(body)) return JSON.parse(body.toString());
                        if (typeof body === 'string') return JSON.parse(body);
                        return body;
                    }
                },
                refunds: { create: async () => ({ id: 'mock_refund_id_' + Date.now(), amount: 0, status: 'succeeded' }) }
            };
        }

        _stripeInstance = stripeResult;
        _stripeCacheTime = now;
        return _stripeInstance;
    } catch (err) {
        console.error("Error getting Stripe instance:", err);
        throw err;
    }
};


// @desc    Create Stripe checkout session
// @route   POST /api/payment/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    try {
        const { items, shippingAddress, couponCode, discountAmount, paymentProvider, termsAccepted } = req.body;

        if (!termsAccepted) {
            return res.status(400).json({
                success: false,
                message: 'You must accept the terms and conditions to proceed'
            });
        }

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

        // Validate Stock & Build Order Items
        const orderItems = [];

        for (const item of items) {
            let productDoc;

            if (item.productType === 'Product') {
                productDoc = await Product.findOne({ id: item.product });
                if (!productDoc && mongoose.Types.ObjectId.isValid(item.product)) {
                    productDoc = await Product.findById(item.product);
                }
            } else {
                productDoc = await Accessory.findOne({ id: item.product });
                if (!productDoc && mongoose.Types.ObjectId.isValid(item.product)) {
                    productDoc = await Accessory.findById(item.product);
                }
            }

            if (!productDoc) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
            }
            if (productDoc.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}. Available: ${productDoc.stock}` });
            }

            orderItems.push({
                product: productDoc._id,
                productType: item.productType || 'Product',
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image
            });
        }

        // Calculate Totals
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        let shippingFee = 0;
        if (req.body.shippingFee) {
            shippingFee = parseFloat(req.body.shippingFee);
        } else {
            shippingFee = subtotal >= 100 ? 0 : 5.99;
        }

        const finalDiscount = discountAmount ? parseFloat(discountAmount) : 0;
        const tax = subtotal * 0.19;

        // Prepare order data (but don't create yet)
        const orderData = {
            user: req.user ? req.user.id : undefined,
            items: orderItems,
            totalAmount: (subtotal + shippingFee + tax - finalDiscount),
            tax,
            shippingFee,
            discountAmount: finalDiscount,
            couponCode,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: paymentProvider || 'card',
            shippingAddress: {
                fullName: shippingAddress.fullName,
                email: shippingAddress.email,
                phone: shippingAddress.phone,
                street: shippingAddress.street,
                city: shippingAddress.city,
                zipCode: shippingAddress.zipCode,
                country: shippingAddress.country
            }
        };

        // Create line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

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

        // FIXED: Create Stripe session FIRST, then order (FIX 2)
        const stripe = await getStripe();
        const methodType = paymentProvider === 'stripe' ? 'card' : (paymentProvider || 'card');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: [methodType],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
            customer_email: req.user ? req.user.email : shippingAddress.email,
            metadata: {
                userId: req.user ? req.user.id : 'guest'
            },
        });

        // Only create order AFTER Stripe session succeeds (prevents ghost orders)
        const order = await Order.create({ ...orderData, paymentId: session.id });

        // Update session metadata with orderId (for webhook)
        // Note: Stripe metadata is immutable after creation, so we store orderId in the order's paymentId field instead

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
        const stripe = await getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // Find the order created in createCheckoutSession
            // We search by paymentId matching session.id (initial) or session.payment_intent (updated by webhook)
            const order = await Order.findOne({
                $or: [
                    { paymentId: session.id },
                    { paymentId: session.payment_intent }
                ]
            });

            if (order) {
                // If order exists, return it.
                // Status might be pending if webhook hasn't fired yet.
                // That's acceptable. Frontend can show "Processing".
                return res.status(200).json({
                    success: true,
                    message: 'Payment successful',
                    order
                });
            } else {
                // Should not happen with new logic, but handled if order creation failed?
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
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

    // Get Webhook Secret from Settings
    const settings = await Settings.findOne();
    const webhookSecret = settings?.payment?.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not configured');
        return res.status(500).send('Webhook secret not configured');
    }

    if (!sig) {
        console.error('[Webhook] Missing stripe-signature header');
        return res.status(400).send('Missing signature');
    }

    let event;

    try {
        const stripe = await getStripe();
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );
    } catch (err) {
        console.error('[Webhook] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (process.env.NODE_ENV !== 'production') console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        if (process.env.NODE_ENV !== 'production') console.log('Payment successful (Webhook):', session.id);

        try {
            // FIXED: Since order is now created after Stripe session, find by paymentId
            const order = await Order.findOne({ paymentId: session.id });
            if (!order) {
                // Try metadata orderId for backward compatibility
                const orderId = session.metadata?.orderId;
                if (orderId) {
                    const orderById = await Order.findById(orderId);
                    if (!orderById) {
                        console.error("Order not found for session:", session.id);
                        return res.status(404).send("Order not found");
                    }
                } else {
                    console.error("Order not found for session:", session.id);
                    return res.status(404).send("Order not found");
                }
            }

            const foundOrder = order || await Order.findById(session.metadata?.orderId);

            if (foundOrder.status !== 'pending' && foundOrder.status !== 'pending_payment') {
                if (process.env.NODE_ENV !== 'production') console.log('Order already processed:', foundOrder._id);
                return res.json({ received: true });
            }

            // Update Order
            foundOrder.status = 'processing';
            foundOrder.paymentStatus = 'paid';
            foundOrder.paymentId = session.payment_intent;
            await foundOrder.save();

            // Create Transaction Record (only for registered users)
            if (foundOrder.user) {
                await Transaction.create({
                    user: foundOrder.user,
                    order: foundOrder._id,
                    amount: foundOrder.totalAmount,
                    status: 'completed',
                    paymentMethod: 'card',
                    stripePaymentId: session.payment_intent,
                    description: `Payment for Order #${foundOrder.orderNumber}`
                });
            }

            // Deduct Stock
            for (const item of foundOrder.items) {
                if (item.productType === 'Product') {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
                } else if (item.productType === 'Accessory') {
                    await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
                }
            }

            // Update Coupon Usage
            if (foundOrder.couponCode) {
                await Coupon.updateOne({ code: foundOrder.couponCode }, { $inc: { usedCount: 1 } });
            }

            // Send Confirmation Email
            const emailService = require('../utils/emailService');
            await emailService.sendOrderConfirmation(foundOrder);

        } catch (err) {
            console.error('Error processing webhook order update:', err);
            return res.status(500).send('Internal Server Error');
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        if (process.env.NODE_ENV !== 'production') console.log('[Webhook] Payment failed:', paymentIntent.id);

        try {
            const order = await Order.findOne({ paymentId: paymentIntent.id });
            if (order && (order.status === 'pending' || order.status === 'pending_payment')) {
                order.status = 'cancelled';
                order.paymentStatus = 'failed';
                await order.save();
                if (process.env.NODE_ENV !== 'production') console.log(`[Webhook] Order ${order.orderNumber} marked as failed`);
            }
        } catch (err) {
            console.error('[Webhook] Error handling payment failure:', err);
        }
    } else if (event.type === 'charge.refunded') {
        const charge = event.data.object;
        if (process.env.NODE_ENV !== 'production') console.log('[Webhook] Charge refunded:', charge.id);

        try {
            const order = await Order.findOne({ paymentId: charge.payment_intent });
            if (order) {
                order.paymentStatus = 'refunded';
                order.status = 'refunded';
                await order.save();

                if (order.user) {
                    await Transaction.create({
                        user: order.user,
                        order: order._id,
                        amount: -charge.amount_refunded / 100,
                        status: 'completed',
                        paymentMethod: 'card',
                        stripePaymentId: charge.id,
                        description: `Refund for Order #${order.orderNumber}`
                    });
                }
                if (process.env.NODE_ENV !== 'production') console.log(`[Webhook] Order ${order.orderNumber} marked as refunded`);
            }
        } catch (err) {
            console.error('[Webhook] Error handling refund:', err);
        }
    } else {
        if (process.env.NODE_ENV !== 'production') console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
};

// @desc    Get payment details
// @route   GET /api/payment/:sessionId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
    try {
        const stripe = await getStripe();
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

        const stripe = await getStripe();
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
        });

        // FIXED: Added missing response (FIX 1)
        res.status(200).json({
            success: true,
            message: 'Refund created successfully',
            refund: { id: refund.id, amount: refund.amount / 100, status: refund.status }
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

// ==========================================
// PayPal Integration
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

// @desc    Create PayPal Order
// @route   POST /api/payment/paypal/create-order
// @access  Private
exports.createPayPalOrder = async (req, res) => {
    try {
        const { items, shippingAddress, couponCode, discountAmount } = req.body;
        // Simplified totals calculation for PayPal creation
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        let shippingFee = subtotal >= 100 ? 0 : 5.99;
        if (req.body.shippingFee) shippingFee = parseFloat(req.body.shippingFee);
        const finalDiscount = discountAmount ? parseFloat(discountAmount) : 0;

        const total = (subtotal + shippingFee - finalDiscount).toFixed(2);

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: "EUR",
                    value: total
                }
            }]
        });

        const client = await getPayPalClient();
        const order = await client.execute(request);

        res.status(200).json({
            success: true,
            id: order.result.id
        });
    } catch (error) {
        console.error('PayPal create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating PayPal order',
            error: error.message
        });
    }
};

// @desc    Capture PayPal Order
// @route   POST /api/payment/paypal/capture-order
// @access  Private
exports.capturePayPalOrder = async (req, res) => {
    try {
        const { orderID, orderData } = req.body;

        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const client = await getPayPalClient();
        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {

            // FIXED: Wrap DB operations in MongoDB transaction (FIX 3)
            const dbSession = await mongoose.startSession();
            dbSession.startTransaction();

            try {
                const orderItems = orderData.items.map(item => ({
                    product: item.product || item.id,
                    productType: item.category === 'device' ? 'Product' : (item.productType || 'Accessory'),
                    name: item.title || item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                }));

                const [finalOrder] = await Order.create([{
                    user: req.user ? req.user.id : undefined,
                    items: orderItems,
                    totalAmount: parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value),
                    tax: 0,
                    shippingFee: orderData.shippingFee || 0,
                    discountAmount: orderData.discountAmount || 0,
                    couponCode: orderData.couponCode,
                    status: 'processing',
                    paymentStatus: 'paid',
                    paymentMethod: 'paypal',
                    paymentId: capture.result.id,
                    shippingAddress: orderData.shippingAddress
                }], { session: dbSession });

                // Update Stock and Sold within session
                for (const item of orderItems) {
                    if (item.productType === 'Product') {
                        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } }, { session: dbSession });
                    } else if (item.productType === 'Accessory') {
                        await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } }, { session: dbSession });
                    }
                }

                // Record coupon usage
                if (orderData.couponCode && req.user) {
                    const { recordCouponUsage } = require('./couponController');
                    await recordCouponUsage(orderData.couponCode, req.user.id, req.user.email);
                }

                await dbSession.commitTransaction();
                dbSession.endSession();

                // Send Email (outside transaction)
                try {
                    const emailService = require('../utils/emailService');
                    await emailService.sendOrderConfirmation(finalOrder);
                } catch (e) { console.error('Email sending failed', e); }

                res.status(200).json({
                    success: true,
                    message: 'Payment successful',
                    order: finalOrder
                });

            } catch (err) {
                await dbSession.abortTransaction();
                dbSession.endSession();
                throw err;
            }
        } else {
            res.status(400).json({ success: false, message: 'Payment capture not completed' });
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({
            success: false,
            message: 'Error capturing PayPal order',
            error: error.message
        });
    }
};

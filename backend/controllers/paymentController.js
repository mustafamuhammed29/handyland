const Order = require('../models/Order');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

// Helper to get Stripe instance
const getStripe = async () => {
    try {
        const settings = await Settings.findOne();
        const secretKey = settings?.payment?.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;

        if (secretKey && !secretKey.includes('your_stripe_secret_key')) {
            return require('stripe')(secretKey);
        } else {
            // Fallback Mock
            console.warn('Stripe key missing or invalid. Using Mock.');
            return {
                checkout: {
                    sessions: {
                        create: async (params) => ({
                            id: 'mock_session_' + Date.now(),
                            url: 'http://localhost:3000/payment-success?session_id=mock_session_' + Date.now(), // Direct to success for mock
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
                refunds: { create: async () => ({ id: 'mock_refund_id_' + Date.now() }) }
            };
        }
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
        const { items, shippingAddress, couponCode, discountAmount, termsAccepted } = req.body;

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
            shippingFee = subtotal >= 100 ? 0 : 5.99; // Using >= to match frontend logic
        }

        const finalDiscount = discountAmount ? parseFloat(discountAmount) : 0;
        const tax = subtotal * 0.19; // Approximation

        // Create Pending Order
        const orderData = {
            user: req.user ? req.user.id : undefined,
            items: orderItems,
            totalAmount: (subtotal + shippingFee - finalDiscount),
            tax,
            shippingFee,
            discountAmount: finalDiscount,
            couponCode,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'card',
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

        const order = await Order.create(orderData);

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

        // Create checkout session
        const stripe = await getStripe();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
            customer_email: req.user ? req.user.email : shippingAddress.email,
            metadata: {
                orderId: order._id.toString(),
                userId: req.user ? req.user.id : 'guest'
            },
        });

        // Update Order with Session ID
        order.paymentId = session.id;
        await order.save();

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

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Payment successful (Webhook):', session.id);

        try {
            const orderId = session.metadata.orderId;
            if (!orderId) {
                console.error("No orderId in metadata");
                return res.status(400).send("No orderId in metadata");
            }

            const order = await Order.findById(orderId);
            if (!order) {
                console.error("Order not found:", orderId);
                return res.status(404).send("Order not found");
            }

            if (order.status !== 'pending' && order.status !== 'pending_payment') {
                console.log('Order already processed or not pending:', orderId);
                return res.json({ received: true });
            }

            // Update Order
            order.status = 'processing';
            order.paymentStatus = 'paid';
            order.paymentId = session.payment_intent; // Update with actual payment intent
            await order.save();

            // Create Transaction Record (only for registered users)
            if (order.user) {
                await Transaction.create({
                    user: order.user,
                    order: order._id,
                    amount: order.totalAmount,
                    status: 'completed',
                    paymentMethod: 'card',
                    stripePaymentId: session.payment_intent,
                    description: `Payment for Order #${order.orderNumber}`
                });
            }

            // Deduct Stock
            for (const item of order.items) {
                // Note: item.product IS the ObjectId ref if saved correctly. 
                // But schema says type: ObjectId.
                // wait, in createCheckoutSession we mapped item.product (which is ID string?)
                // Schema: product: { type: ObjectId, refPath: ... }
                // IF we saved STRING ID into ObjectId field, Mongoose casts it IF valid ObjectId.
                // But Accessory/Product IDs are UUID strings (from Product.js model: id: { type: String }).
                // Oh no.
                // Product.js has `id: String` (UUID) AND `_id: ObjectId` (Mongo).
                // Order.js has `product: ObjectId`.
                // If I passed UUID string to `product` field in Order creation... Mongoose might fail casting to ObjectId!
                // I need to check if `createCheckoutSession` saves `_id` or `id`.

                // createCheckoutSession: item.product matches what frontend sent.
                // Frontend (CartContext) usually uses `id` (UUID).
                // So Order creation might have failed or saved null if casting failed?
                // I MUST FIX THIS.
                // I need to look up the ObjectID from the UUID `id` before creating Order?
                // Yes.

                // Assuming I fix that in `createCheckoutSession`...
                // Here in webhook: item.product should be ObjectId.
                // So I can use findByIdAndUpdate (which uses _id).
                // But Product.js model says `id: String`. `_id` is implicit.
                // If item.product is ObjectId, I should use `findByIdAndUpdate`.
                // If it is UUID, I should use `findOneAndUpdate({ id: ... })`.

                // I will assume I fix `createCheckoutSession` to store ObjectIds.
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
                // Wait, if it's Accessory? Check type.
                if (item.productType === 'Accessory') {
                    await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
                }
            }

            // Update Coupon Usage
            if (order.couponCode) {
                await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
            }

            // Send Confirmation Email
            const emailService = require('../utils/emailService');
            await emailService.sendOrderConfirmation(order);

        } catch (err) {
            console.error('Error processing webhook order update:', err);
            return res.status(500).send('Internal Server Error');
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        console.log('[Webhook] Payment failed:', paymentIntent.id);

        try {
            // Find order by payment intent or session metadata
            const order = await Order.findOne({ paymentId: paymentIntent.id });
            if (order && (order.status === 'pending' || order.status === 'pending_payment')) {
                order.status = 'cancelled';
                order.paymentStatus = 'failed';
                await order.save();
                console.log(`[Webhook] Order ${order.orderNumber} marked as failed`);
            }
        } catch (err) {
            console.error('[Webhook] Error handling payment failure:', err);
        }
    } else if (event.type === 'charge.refunded') {
        const charge = event.data.object;
        console.log('[Webhook] Charge refunded:', charge.id);

        try {
            const order = await Order.findOne({ paymentId: charge.payment_intent });
            if (order) {
                order.paymentStatus = 'refunded';
                order.status = 'refunded';
                await order.save();

                // Record refund transaction
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
                console.log(`[Webhook] Order ${order.orderNumber} marked as refunded`);
            }
        } catch (err) {
            console.error('[Webhook] Error handling refund:', err);
        }
    } else {
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
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

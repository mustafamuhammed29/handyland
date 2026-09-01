/**
 * backend/controllers/paymentController.js
 * Stripe & PayPal payment management (Supabase version)
 */
'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabaseAdmin } = require('../config/supabase');
const { updateTransactionStatus } = require('./transactionController');

// @route POST /api/payments/create-intent
exports.createPaymentIntent = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, total_amount, shipping_email')
            .eq('id', orderId)
            .single();
        if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });
        
        if (order.user_id && (!req.user || (order.user_id !== req.user.id && req.user.role !== 'admin'))) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const totalAmount = Number(order.total_amount) || 0;
        if (totalAmount < 0) {
            return res.status(400).json({ success: false, message: 'Invalid order amount' });
        }

        const amountInCents = Math.round(totalAmount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            metadata: { orderId: order.id, userId: order.user_id || 'guest' }
        }, { idempotencyKey: `pi-${order.id}` });

        // Store transaction with integer cents amount and optional guest email
        await supabaseAdmin.from('transactions').insert({
            user_id: req.user ? req.user.id : (order.user_id || null),
            guest_email: !req.user && !order.user_id ? order.shipping_email : null,
            order_id: order.id,
            amount: amountInCents,
            currency: 'eur',
            status: 'pending',
            type: 'purchase',
            payment_method: 'stripe',
            stripe_payment_id: paymentIntent.id
        });

        return res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret });
    } catch (error) { next(error); }
};

// @route POST /api/payments/webhook
exports.stripeWebhook = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        console.warn('⚠️ Webhook rejected: Missing stripe-signature header or STRIPE_WEBHOOK_SECRET configuration');
        return res.status(400).json({ success: false, message: 'Webhook signature or secret missing' });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('❌ Stripe Webhook Signature Verification Failed:', err.message);
        return res.status(400).send(`Webhook Signature Verification Error: ${err.message}`);
    }

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            if (orderId) {
                // Idempotency check: see if order is already paid/processed
                const { data: existingOrder } = await supabaseAdmin
                    .from('orders')
                    .select('payment_status')
                    .eq('id', orderId)
                    .single();

                if (existingOrder && existingOrder.payment_status === 'paid') {
                    return res.status(200).json({ received: true, message: 'Already processed' });
                }

                await supabaseAdmin.from('orders').update({ payment_status: 'paid', status: 'processing' }).eq('id', orderId);
                await updateTransactionStatus(paymentIntent.id, 'completed', paymentIntent.charges?.data?.[0]?.receipt_url);
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            // Idempotency check: see if transaction is already updated/failed
            const { data: existingTx } = await supabaseAdmin
                .from('transactions')
                .select('status')
                .eq('stripe_payment_id', paymentIntent.id)
                .maybeSingle();

            if (existingTx && (existingTx.status === 'failed' || existingTx.status === 'completed')) {
                return res.json({ received: true });
            }
            await updateTransactionStatus(paymentIntent.id, 'failed');
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).end();
    }
};

// --- PayPal Integration ---

const generatePayPalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    if (!clientId || !secret) throw new Error("PayPal API keys are missing in environment variables.");
    const auth = Buffer.from(clientId + ':' + secret).toString('base64');
    
    // dynamically import node-fetch if using older node, but node 18+ has global fetch. 
    // We assume global fetch is available.
    const response = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    
    if (!response.ok) throw new Error('Failed to generate PayPal access token');
    const data = await response.json();
    return data.access_token;
};

// @route POST /api/payment/paypal/create-order
exports.createPayPalOrder = async (req, res, next) => {
    try {
        const orderData = req.body;
        const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (orderData.shippingFee || 0) - (orderData.discountAmount || 0);

        const accessToken = await generatePayPalAccessToken();
        const url = `${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'EUR',
                        value: Math.max(0, total).toFixed(2),
                    },
                }],
            }),
        });

        const data = await response.json();
        if (data.id) {
            return res.status(200).json({ success: true, id: data.id });
        } else {
            return res.status(400).json({ success: false, message: data.message || 'Failed to create PayPal order' });
        }
    } catch (error) {
        next(error);
    }
};

// @route POST /api/payment/paypal/capture-order
exports.capturePayPalOrder = async (req, res, next) => {
    try {
        const { orderID, orderData } = req.body;
        const accessToken = await generatePayPalAccessToken();
        const url = `${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderID}/capture`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            }
        });

        const data = await response.json();
        
        if (data.status === 'COMPLETED') {
            const capturedValue = data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
            const capturedCents = capturedValue ? Math.round(parseFloat(capturedValue) * 100) : null;

            const fakeReq = {
                user: req.user,
                body: {
                    items: orderData.items,
                    shippingAddress: orderData.shippingAddress,
                    shippingMethod: orderData.shippingMethod,
                    paymentMethod: 'paypal',
                    couponCode: orderData.couponCode,
                    appliedPoints: orderData.appliedPoints
                }
            };
            
            const fakeRes = {
                status: function(code) { this.statusCode = code; return this; },
                json: function(payload) { this.data = payload; return this; }
            };
            
            const { createOrder } = require('./orderController');
            await createOrder(fakeReq, fakeRes, next);
            
            if (fakeRes.data && fakeRes.data.success) {
                const order = fakeRes.data.order;
                const orderAmountCents = Math.round((Number(order.totalAmount) || 0) * 100);

                // Verify captured amount matches server-calculated order total (if capturedValue was returned)
                if (capturedCents !== null && Math.abs(capturedCents - orderAmountCents) > 1) {
                    return res.status(400).json({
                        success: false,
                        message: `Payment amount mismatch: captured €${(capturedCents/100).toFixed(2)} vs order total €${(orderAmountCents/100).toFixed(2)}`
                    });
                }

                // Update order to paid immediately since PayPal captured
                await supabaseAdmin.from('orders').update({ payment_status: 'paid', status: 'processing' }).eq('id', order._id);
                
                await supabaseAdmin.from('transactions').insert({
                    user_id: req.user ? req.user.id : null,
                    guest_email: !req.user ? (order.shippingAddress?.email || orderData.shippingAddress?.email) : null,
                    order_id: order._id,
                    amount: orderAmountCents,
                    currency: 'eur',
                    status: 'completed',
                    type: 'purchase',
                    payment_method: 'paypal',
                    stripe_payment_id: orderID
                });
                
                // Fetch the updated order
                const { data: finalOrder } = await supabaseAdmin.from('orders').select('*').eq('id', order._id).single();
                return res.status(200).json({ success: true, order: { ...finalOrder, _id: finalOrder.id } });
            } else {
                return res.status(500).json({ success: false, message: 'PayPal Captured but order creation failed' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'PayPal Capture Failed' });
        }
    } catch (error) {
        next(error);
    }
};

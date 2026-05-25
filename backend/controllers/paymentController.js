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
        
        const { data: order, error } = await supabaseAdmin.from('orders').select('id, user_id, total_amount').eq('id', orderId).single();
        if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });
        
        if (order.user_id && (!req.user || (order.user_id !== req.user.id && req.user.role !== 'admin'))) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const amountInCents = Math.round(order.total_amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            metadata: { orderId: order.id, userId: order.user_id || 'guest' }
        }, { idempotencyKey: `pi-${order.id}` });

        // Store transaction
        await supabaseAdmin.from('transactions').insert({
            user_id: req.user ? req.user.id : null,
            order_id: order.id,
            amount: order.total_amount,
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
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
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

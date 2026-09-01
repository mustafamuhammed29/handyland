/**
 * backend/controllers/paymentController.js
 * Stripe & PayPal payment management (Supabase version)
 * Milestone 5B: Full Store Checkout & Refunds Enablement
 */
'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabaseAdmin } = require('../config/supabase');
const { updateTransactionStatus } = require('./transactionController');

// @route POST /api/payment/create-payment-intent
// Store purchase checkout with support for 100% wallet, partial wallet, or card
exports.createPaymentIntent = async (req, res, next) => {
    let walletDeducted = false;
    let walletDeductedCents = 0;
    let orderIdRef = null;
    let userIdRef = null;

    try {
        const { orderId, walletAmountCents = 0 } = req.body;
        orderIdRef = orderId;
        
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, user_id, total_amount, shipping_email, payment_status, status')
            .eq('id', orderId)
            .single();

        if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });
        
        if (order.user_id && (!req.user || (order.user_id !== req.user.id && req.user.role !== 'admin'))) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (order.payment_status === 'paid') {
            return res.status(400).json({ success: false, message: 'Order has already been paid' });
        }

        userIdRef = req.user ? req.user.id : (order.user_id || null);
        const totalAmount = Number(order.total_amount) || 0;
        if (totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid order amount' });
        }

        const totalAmountInCents = Math.round(totalAmount * 100);
        const requestedWalletCents = Math.min(Math.max(0, Number(walletAmountCents) || 0), totalAmountInCents);

        // 1. Process Wallet Deduction (if applied) via process_wallet_ledger_entry
        if (requestedWalletCents > 0 && userIdRef) {
            const { data: ledgerData, error: ledgerError } = await supabaseAdmin.rpc('process_wallet_ledger_entry', {
                p_user_id: userIdRef,
                p_direction: 'debit',
                p_amount_cents: requestedWalletCents,
                p_reason: 'purchase',
                p_reference_type: 'order',
                p_reference_id: String(order.id),
                p_provider_name: 'system',
                p_provider_payment_id: null,
                p_idempotency_key: `order_wallet_${order.id}`,
                p_description: `Zahlung für Bestellung #${order.order_number || order.id}`
            });

            if (ledgerError) {
                console.error('Wallet deduction failed:', ledgerError.message);
                return res.status(409).json({ 
                    success: false, 
                    message: ledgerError.code === 'P0001' ? 'Unzureichendes Wallet-Guthaben' : ledgerError.message 
                });
            }

            walletDeducted = true;
            walletDeductedCents = requestedWalletCents;
        }

        const cardAmountInCents = totalAmountInCents - walletDeductedCents;

        // 2. Scenario A: 100% Wallet Paid
        if (cardAmountInCents === 0) {
            await supabaseAdmin
                .from('orders')
                .update({ payment_status: 'paid', status: 'processing' })
                .eq('id', order.id);

            await supabaseAdmin.from('transactions').insert({
                user_id: userIdRef,
                order_id: order.id,
                amount: totalAmountInCents,
                currency: 'eur',
                status: 'completed',
                type: 'purchase',
                payment_method: 'wallet',
                provider_name: 'system',
                description: `Bestellung #${order.order_number} vollständig mit Guthaben bezahlt`
            });

            return res.status(200).json({
                success: true,
                paidWithWallet: true,
                message: 'Bestellung erfolgreich mit Wallet bezahlt'
            });
        }

        // 3. Scenario B: Remaining Balance via Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: cardAmountInCents,
            currency: 'eur',
            metadata: {
                orderId: order.id,
                userId: userIdRef || 'guest',
                walletDeductedCents: String(walletDeductedCents)
            }
        }, { idempotencyKey: `pi-store-${order.id}` });

        // Record pending transaction
        await supabaseAdmin.from('transactions').insert({
            user_id: userIdRef,
            guest_email: !req.user && !order.user_id ? order.shipping_email : null,
            order_id: order.id,
            amount: cardAmountInCents,
            currency: 'eur',
            status: 'pending',
            type: 'purchase',
            payment_method: 'stripe',
            provider_name: 'stripe',
            provider_payment_id: paymentIntent.id,
            stripe_payment_id: paymentIntent.id,
            idempotency_key: `pi_${paymentIntent.id}`
        });

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            cardAmountInCents,
            walletDeductedCents
        });
    } catch (error) {
        // Compensatory Rollback: If Stripe creation fails, restore deducted wallet balance
        if (walletDeducted && walletDeductedCents > 0 && userIdRef && orderIdRef) {
            console.warn(`[Compensatory Rollback] Refunding ${walletDeductedCents} cents to user ${userIdRef} due to checkout failure`);
            await supabaseAdmin.rpc('process_wallet_ledger_entry', {
                p_user_id: userIdRef,
                p_direction: 'credit',
                p_amount_cents: walletDeductedCents,
                p_reason: 'adjustment',
                p_reference_type: 'order',
                p_reference_id: String(orderIdRef),
                p_provider_name: 'system',
                p_provider_payment_id: null,
                p_idempotency_key: `rollback_wallet_${orderIdRef}`,
                p_description: `Erstattung nach fehlgeschlagenem Checkout für Bestellung ${orderIdRef}`
            }).catch(rbErr => console.error('Failed compensatory wallet rollback:', rbErr));
        }

        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @route POST /api/payment/webhook
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

    // 1. Event Age Validation (Prevent stale replay attacks)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const eventAge = nowSeconds - Number(event.created);
    if (eventAge > 300) {
        console.warn(`⚠️ Warning: Webhook event ${event.id} is ${eventAge}s old. Checking existing transaction trace.`);
    }

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata || {};

            // Handle wallet top-up reconciliation
            if (metadata.type === 'topup' && metadata.userId) {
                const amountInCents = Number(paymentIntent.amount) || Number(metadata.amountCents);
                const providerPaymentId = paymentIntent.id;

                // Pre-RPC idempotency check
                const { data: existingTx } = await supabaseAdmin
                    .from('transactions')
                    .select('status')
                    .eq('provider_name', 'stripe')
                    .eq('provider_payment_id', providerPaymentId)
                    .maybeSingle();

                if (existingTx && existingTx.status === 'completed') {
                    return res.status(200).json({ received: true, idempotent: true });
                }

                // Execute atomic top-up RPC
                const { error: rpcError } = await supabaseAdmin.rpc('top_up_wallet_atomic', {
                    p_user_id: metadata.userId,
                    p_amount_cents: amountInCents,
                    p_provider_name: 'stripe',
                    p_provider_payment_id: providerPaymentId,
                    p_idempotency_key: `evt_${event.id}`,
                    p_metadata: { description: `Stripe Webhook Wallet Top-up: €${(amountInCents / 100).toFixed(2)}` }
                });

                if (rpcError) {
                    console.error('RPC Error in Stripe Webhook top-up:', rpcError.message);
                    return res.status(500).json({ error: 'Failed to process top-up via RPC' });
                }
            } else if (metadata.orderId) {
                // Store order purchase flow
                const orderId = metadata.orderId;
                const { data: existingOrder } = await supabaseAdmin
                    .from('orders')
                    .select('payment_status')
                    .eq('id', orderId)
                    .maybeSingle();

                if (existingOrder && existingOrder.payment_status === 'paid') {
                    return res.status(200).json({ received: true, message: 'Already processed' });
                }

                await supabaseAdmin.from('orders').update({ payment_status: 'paid', status: 'processing' }).eq('id', orderId);
                await updateTransactionStatus(paymentIntent.id, 'completed', paymentIntent.charges?.data?.[0]?.receipt_url);
            }
        } else if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const metadata = session.metadata || {};

            if (metadata.type === 'topup' && metadata.userId) {
                const amountInCents = Number(session.amount_total) || Number(metadata.amountCents);
                const providerPaymentId = session.payment_intent || session.id;

                // Pre-RPC idempotency check
                const { data: existingTx } = await supabaseAdmin
                    .from('transactions')
                    .select('status')
                    .eq('provider_name', 'stripe')
                    .eq('provider_payment_id', providerPaymentId)
                    .maybeSingle();

                if (existingTx && existingTx.status === 'completed') {
                    return res.status(200).json({ received: true, idempotent: true });
                }

                // Execute atomic top-up RPC
                const { error: rpcError } = await supabaseAdmin.rpc('top_up_wallet_atomic', {
                    p_user_id: metadata.userId,
                    p_amount_cents: amountInCents,
                    p_provider_name: 'stripe',
                    p_provider_payment_id: providerPaymentId,
                    p_idempotency_key: `evt_${event.id}`,
                    p_metadata: { description: `Stripe Checkout Webhook Top-up: €${(amountInCents / 100).toFixed(2)}` }
                });

                if (rpcError) {
                    console.error('RPC Error in Checkout Webhook top-up:', rpcError.message);
                    return res.status(500).json({ error: 'Failed to process checkout top-up via RPC' });
                }
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            // Mark transaction as failed without touching wallet balance
            await supabaseAdmin
                .from('transactions')
                .update({ status: 'failed' })
                .eq('stripe_payment_id', paymentIntent.id);
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).end();
    }
};

// --- PayPal Integration ---

const generatePayPalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    if (!clientId || !secret) throw new Error("PayPal API keys are missing in environment variables.");
    const auth = Buffer.from(clientId + ':' + secret).toString('base64');
    
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
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.payment_status === 'paid') {
            return res.status(400).json({ success: false, message: 'Order is already paid' });
        }

        const accessToken = await generatePayPalAccessToken();
        const totalNum = Number(order.total_amount) || 0;
        const amountCents = Math.round(totalNum * 100);

        const response = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: String(order.id),
                    amount: {
                        currency_code: 'EUR',
                        value: totalNum.toFixed(2)
                    },
                    description: `HandyLand Bestellung #${order.order_number}`
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error('PayPal Order Creation Failed: ' + JSON.stringify(errData));
        }

        const paypalOrder = await response.json();

        // Record pending transaction
        await supabaseAdmin.from('transactions').insert({
            user_id: req.user ? req.user.id : (order.user_id || null),
            order_id: order.id,
            amount: amountCents,
            currency: 'eur',
            status: 'pending',
            type: 'purchase',
            payment_method: 'paypal',
            provider_name: 'paypal',
            provider_payment_id: paypalOrder.id,
            idempotency_key: `paypal_order_${paypalOrder.id}`
        });

        return res.status(200).json({
            success: true,
            orderId: paypalOrder.id
        });
    } catch (error) {
        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @route POST /api/payment/paypal/capture-order
exports.capturePayPalOrder = async (req, res, next) => {
    try {
        const { orderId, paypalOrderId } = req.body;
        const refOrderId = paypalOrderId || orderId;

        if (!refOrderId) {
            return res.status(400).json({ success: false, message: 'PayPal Order ID is required' });
        }

        // Idempotency check: see if already captured
        const { data: existingTx } = await supabaseAdmin
            .from('transactions')
            .select('status, order_id')
            .eq('provider_payment_id', refOrderId)
            .maybeSingle();

        if (existingTx && existingTx.status === 'completed') {
            return res.status(200).json({ success: true, message: 'Payment already processed' });
        }

        const accessToken = await generatePayPalAccessToken();
        const response = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${refOrderId}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return res.status(400).json({ success: false, message: 'PayPal capture failed', details: errData });
        }

        const captureData = await response.json();
        if (captureData.status !== 'COMPLETED') {
            // Mark transaction as failed
            await supabaseAdmin.from('transactions').update({ status: 'failed' }).eq('provider_payment_id', refOrderId);
            return res.status(400).json({ success: false, message: `PayPal payment not completed (status: ${captureData.status})` });
        }

        // Complete order & transaction
        const targetOrderId = existingTx?.order_id || captureData.purchase_units?.[0]?.reference_id;
        if (targetOrderId) {
            await supabaseAdmin.from('orders').update({ payment_status: 'paid', status: 'processing' }).eq('id', targetOrderId);
        }
        await supabaseAdmin.from('transactions').update({ status: 'completed' }).eq('provider_payment_id', refOrderId);

        return res.status(200).json({
            success: true,
            message: 'Zahlung erfolgreich abgeschlossen',
            data: captureData
        });
    } catch (error) {
        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

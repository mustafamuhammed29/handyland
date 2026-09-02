/**
 * backend/controllers/transactionController.js
 * Transactions & Wallet Top-up management using Supabase and Stripe/PayPal
 * Milestone 4: Refactored to use privileged top_up_wallet_atomic RPC
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route GET /api/transactions
exports.getTransactions = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { page = 1, limit = 20, status, type } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('transactions')
            .select('*, orders(order_number), users(name, email)', { count: 'exact' });

        if (!isAdmin) query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);
        if (type) query = query.eq('type', type);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Map fields to camelCase for frontend
        const mappedData = (data || []).map(t => {
            const rawAmount = Number(t.amount) || 0;
            // Database stores amount as integer cents. Expose formatted Euro decimal and raw cents
            const euroDecimal = Number((rawAmount / 100).toFixed(2));
            return {
                _id: t.id,
                amount: euroDecimal,
                amountCents: rawAmount,
                currency: t.currency || 'eur',
                guestEmail: t.guest_email || null,
                type: t.type,
                status: t.status,
                paymentMethod: t.payment_method,
                providerName: t.provider_name,
                providerPaymentId: t.provider_payment_id,
                idempotencyKey: t.idempotency_key,
                description: t.description,
                createdAt: t.created_at,
                receiptUrl: t.receipt_url,
                stripePaymentId: t.stripe_payment_id,
                order: t.orders,
                user: t.users ? {
                    _id: t.user_id,
                    name: t.users.name,
                    email: t.users.email
                } : (t.guest_email ? {
                    _id: null,
                    name: 'Gast',
                    email: t.guest_email
                } : null)
            };
        });

        return res.status(200).json({
            success: true,
            count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            transactions: mappedData,
            data: mappedData
        });
    } catch (error) { next(error); }
};

// @route PUT /api/transactions/admin/:id/status
exports.adminUpdateTransactionStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const transactionId = req.params.id;

        // 1. Get the transaction details
        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchErr || !tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
        
        // If it was already completed, don't double-credit
        if (tx.status === 'completed' && status === 'completed') {
            return res.status(400).json({ success: false, message: 'Transaction already completed' });
        }

        // 2. If marked as completed, credit user wallet atomically via RPC
        if (status === 'completed' && tx.user_id) {
            const providerName = tx.provider_name || 'bank_transfer';
            const providerPaymentId = tx.provider_payment_id || `bt_${tx.id}`;
            const idempotencyKey = `adm_approve_${tx.id}`;

            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('top_up_wallet_atomic', {
                p_user_id: tx.user_id,
                p_amount_cents: Number(tx.amount),
                p_provider_name: providerName,
                p_provider_payment_id: providerPaymentId,
                p_idempotency_key: idempotencyKey,
                p_metadata: { description: `Bank Transfer approved by Admin (${req.user.id})` }
            });

            if (rpcError) {
                console.error('Error in top_up_wallet_atomic during admin approval:', rpcError.message);
                return res.status(409).json({ success: false, message: 'Failed to credit wallet: ' + rpcError.message });
            }
        } else {
            // Update transaction status for other transitions (e.g., failed, cancelled)
            const { error: updateErr } = await supabaseAdmin
                .from('transactions')
                .update({ status })
                .eq('id', transactionId);

            if (updateErr) throw updateErr;
        }

        const { data: updatedTx } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        return res.status(200).json({ success: true, data: updatedTx });
    } catch (error) { next(error); }
};

// @route GET /api/transactions/:id
exports.getTransaction = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .select('*, orders(order_number), users(name, email)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Transaction not found' });
        if (req.user.role !== 'admin' && data.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/create-topup-session
exports.createTopUpSession = async (req, res, next) => {
    let pendingTxId = null;
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 1.00) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag beträgt 1,00 €' });
        }
        if (numAmount > 5000.00) {
            return res.status(400).json({ success: false, message: 'Maximaler Betrag beträgt 5.000,00 €' });
        }
        const amountInCents = Math.round(numAmount * 100);

        // 1. Establish pending transaction audit record
        const { data: pendingTx, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: amountInCents,
                currency: 'eur',
                type: 'topup',
                status: 'pending',
                payment_method: 'stripe',
                provider_name: 'stripe',
                description: `Guthabenaufladung via Stripe: €${numAmount.toFixed(2)}`
            })
            .select('id')
            .single();

        if (txError) throw txError;
        pendingTxId = pendingTx.id;

        // 2. Create Stripe Checkout Session / Payment Intent
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'HandyLand Wallet Top-up',
                        description: `Guthabenaufladung für ${req.user.email || req.user.name}`
                    },
                    unit_amount: amountInCents
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet?canceled=true`,
            client_reference_id: req.user.id,
            metadata: {
                userId: req.user.id,
                transactionId: pendingTxId,
                type: 'topup',
                amountCents: String(amountInCents)
            }
        });

        // 3. Update pending transaction with stripe session/payment reference
        await supabaseAdmin
            .from('transactions')
            .update({
                stripe_payment_id: session.id,
                provider_payment_id: session.id,
                idempotency_key: `session_${session.id}`
            })
            .eq('id', pendingTxId);

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url,
            transactionId: pendingTxId
        });
    } catch (error) {
        if (pendingTxId) {
            await supabaseAdmin.from('transactions').update({ status: 'failed' }).eq('id', pendingTxId).catch(() => {});
        }
        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createStripeTopUpSession = exports.createTopUpSession;

// @route POST /api/transactions/confirm-topup
exports.confirmTopUp = async (req, res, next) => {
    try {
        const { sessionId, paymentIntentId } = req.body;
        const refId = sessionId || paymentIntentId;

        if (!refId) {
            return res.status(400).json({ success: false, message: 'Session ID or Payment Intent ID is required' });
        }

        let isPaid = false;
        let amountInCents = 0;
        let providerPaymentId = refId;

        let expectedTxId = null;

        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                isPaid = true;
                amountInCents = session.amount_total;
                providerPaymentId = session.payment_intent || session.id;
                expectedTxId = session.metadata?.transactionId;
            }
        } else if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status === 'succeeded') {
                isPaid = true;
                amountInCents = paymentIntent.amount;
                providerPaymentId = paymentIntent.id;
                expectedTxId = paymentIntent.metadata?.transactionId;
            }
        }

        if (!isPaid) {
            return res.status(400).json({ success: false, message: 'Payment has not been confirmed yet' });
        }

        // 1. Strict Ownership & Idempotency Check
        let query = supabaseAdmin.from('transactions').select('*');
        if (expectedTxId) {
            query = query.eq('id', expectedTxId);
        } else {
            query = query.eq('provider_payment_id', sessionId || paymentIntentId);
        }
        
        const { data: tx, error: fetchErr } = await query.single();

        if (fetchErr || !tx) {
            return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden' });
        }

        if (tx.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Nicht autorisiert' });
        }

        if (tx.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Transaktion wurde bereits verarbeitet' });
        }

        // Call atomic top-up RPC
        const idempotencyKey = `confirm_stripe_${providerPaymentId}`;
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('top_up_wallet_atomic', {
            p_user_id: req.user.id,
            p_amount_cents: amountInCents,
            p_provider_name: 'stripe',
            p_provider_payment_id: providerPaymentId,
            p_idempotency_key: idempotencyKey,
            p_metadata: { description: `Stripe Top-up Confirmed: €${(amountInCents / 100).toFixed(2)}` }
        });

        if (rpcError) {
            console.error('RPC Error during confirmTopUp:', rpcError.message);
            return res.status(409).json({ success: false, message: rpcError.message });
        }

        return res.status(200).json({
            success: true,
            message: 'Guthaben erfolgreich aufgeladen',
            data: rpcData
        });
    } catch (error) {
        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @route POST /api/transactions/paypal/create-topup
exports.createPayPalTopUp = async (req, res, next) => {
    let pendingTxId = null;
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 1.00) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag beträgt 1,00 €' });
        }
        if (numAmount > 5000.00) {
            return res.status(400).json({ success: false, message: 'Maximaler Betrag beträgt 5.000,00 €' });
        }
        const amountInCents = Math.round(numAmount * 100);

        // Record pending PayPal transaction
        const { data: pendingTx, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: amountInCents,
                currency: 'eur',
                type: 'topup',
                status: 'pending',
                payment_method: 'paypal',
                provider_name: 'paypal',
                description: `Guthabenaufladung via PayPal: €${numAmount.toFixed(2)}`
            })
            .select('id')
            .single();

        if (txError) throw txError;
        pendingTxId = pendingTx.id;

        // Generate PayPal Order
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secret = process.env.PAYPAL_SECRET;
        if (!clientId || !secret) {
            return res.status(503).json({ success: false, message: 'PayPal ist derzeit nicht konfiguriert' });
        }

        const auth = Buffer.from(clientId + ':' + secret).toString('base64');
        const tokenRes = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (!tokenRes.ok) throw new Error('PayPal authentication failed');
        const { access_token } = await tokenRes.json();

        const orderRes = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'EUR',
                        value: numAmount.toFixed(2)
                    },
                    custom_id: req.user.id,
                    description: `HandyLand Wallet Top-up: ${req.user.email}`
                }]
            })
        });

        if (!orderRes.ok) throw new Error('PayPal order creation failed');
        const orderData = await orderRes.json();

        await supabaseAdmin
            .from('transactions')
            .update({
                provider_payment_id: orderData.id,
                idempotency_key: `paypal_order_${orderData.id}`
            })
            .eq('id', pendingTxId);

        return res.status(200).json({
            success: true,
            orderId: orderData.id,
            transactionId: pendingTxId
        });
    } catch (error) {
        if (pendingTxId) {
            await supabaseAdmin.from('transactions').update({ status: 'failed' }).eq('id', pendingTxId).catch(() => {});
        }
        next(error);
    }
};

// @route POST /api/transactions/paypal/capture-topup
exports.capturePayPalTopUp = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'PayPal Order ID is required' });
        }

        // 1. Strict Ownership & Idempotency Check BEFORE capturing
        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('provider_payment_id', orderId)
            .single();

        if (fetchErr || !tx) {
            return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden' });
        }

        if (tx.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Nicht autorisiert' });
        }

        if (tx.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Transaktion wurde bereits verarbeitet' });
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secret = process.env.PAYPAL_SECRET;
        if (!clientId || !secret) {
            return res.status(503).json({ success: false, message: 'PayPal ist derzeit nicht konfiguriert' });
        }

        const auth = Buffer.from(clientId + ':' + secret).toString('base64');
        const tokenRes = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (!tokenRes.ok) throw new Error('PayPal authentication failed');
        const { access_token } = await tokenRes.json();

        const captureRes = await fetch(`${process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!captureRes.ok) {
            const errData = await captureRes.json().catch(() => ({}));
            return res.status(400).json({ success: false, message: 'PayPal capture failed', details: errData });
        }

        const captureData = await captureRes.json();
        if (captureData.status !== 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'PayPal order status is not COMPLETED' });
        }

        const captureItem = captureData.purchase_units?.[0]?.payments?.captures?.[0];
        const captureId = captureItem?.id || orderId;
        const amountCents = Math.round(Number(captureItem?.amount?.value || 0) * 100);

        // Atomic top-up RPC
        const idempotencyKey = `capture_paypal_${captureId}`;
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('top_up_wallet_atomic', {
            p_user_id: req.user.id,
            p_amount_cents: amountCents,
            p_provider_name: 'paypal',
            p_provider_payment_id: captureId,
            p_idempotency_key: idempotencyKey,
            p_metadata: { description: `PayPal Top-up Confirmed: €${(amountCents / 100).toFixed(2)}` }
        });

        if (rpcError) {
            console.error('RPC Error during capturePayPalTopUp:', rpcError.message);
            return res.status(409).json({ success: false, message: rpcError.message });
        }

        return res.status(200).json({
            success: true,
            message: 'PayPal Guthaben erfolgreich aufgeladen',
            data: rpcData
        });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/bank-transfer
exports.createBankTransferTopUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 5.00) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag beträgt 5,00 €' });
        }
        if (numAmount > 5000.00) {
            return res.status(400).json({ success: false, message: 'Maximaler Betrag beträgt 5.000,00 €' });
        }
        const amountInCents = Math.round(numAmount * 100);

        const { data, error } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: amountInCents,
                currency: 'eur',
                type: 'topup',
                status: 'pending',
                payment_method: 'bank_transfer',
                provider_name: 'bank_transfer',
                description: `Guthabenaufladung per Banküberweisung: €${numAmount.toFixed(2)}`
            })
            .select().single();

        if (error) throw error;

        // Notify admins about the new bank transfer
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins && admins.length > 0) {
            await supabaseAdmin.from('notifications').insert(
                admins.map(a => ({
                    user_id: a.id,
                    message: `Neue Banküberweisung (${numAmount.toFixed(2)}€) von ${req.user.name || 'User'}`,
                    type: 'info',
                    link: '/admin/transactions'
                }))
            ).catch(() => {});
        }

        return res.status(201).json({
            success: true,
            transactionId: data.id,
            transaction: data,
            data
        });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/:id/upload-receipt
// Uploads bank transfer receipt to private Supabase bucket and attaches signed URL
exports.uploadTransactionReceipt = async (req, res, next) => {
    try {
        const transactionId = req.params.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
        }

        // 1. File validation
        const maxSizeBytes = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSizeBytes) {
            return res.status(400).json({ success: false, message: 'Dateigröße überschreitet das Limit von 10 MB' });
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ success: false, message: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, PDF' });
        }

        // 2. Verify transaction ownership
        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchErr || !tx) {
            return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden' });
        }

        if (req.user && req.user.role !== 'admin' && tx.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Nicht autorisiert' });
        }

        // 3. Upload to private 'receipts' bucket
        const ext = req.file.mimetype === 'application/pdf' ? 'pdf' : (req.file.mimetype.split('/')[1] || 'jpg');
        const randomUUID = require('crypto').randomUUID ? require('crypto').randomUUID() : require('crypto').randomBytes(16).toString('hex');
        const storagePath = `receipts/${transactionId}/${randomUUID}.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
            .from('receipts')
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadErr) {
            console.error('Storage upload error for receipt:', uploadErr.message);
            return res.status(500).json({ success: false, message: 'Fehler beim Hochladen des Belegs: ' + uploadErr.message });
        }

        // 4. Generate 1-hour signed URL
        const { data: signedData, error: signedErr } = await supabaseAdmin.storage
            .from('receipts')
            .createSignedUrl(storagePath, 3600);

        const signedUrl = signedData?.signedUrl || storagePath;

        // 5. Update transaction record
        await supabaseAdmin
            .from('transactions')
            .update({ receipt_url: storagePath })
            .eq('id', transactionId);

        return res.status(200).json({
            success: true,
            message: 'Zahlungsbeleg erfolgreich hochgeladen',
            receiptPath: storagePath,
            signedUrl
        });
    } catch (error) {
        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Internal method used by webhooks or payment controller
exports.createTransaction = async (transactionData) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .insert(transactionData)
            .select().single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating transaction:', error.message);
        throw error;
    }
};

// Internal method used by webhooks
exports.updateTransactionStatus = async (stripePaymentId, status, receiptUrl = null) => {
    try {
        const updateData = { status };
        if (receiptUrl) updateData.receipt_url = receiptUrl;

        const { data, error } = await supabaseAdmin
            .from('transactions')
            .update(updateData)
            .or(`provider_payment_id.eq.${stripePaymentId},stripe_payment_id.eq.${stripePaymentId}`)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Error updating transaction in updateTransactionStatus:', error.message);
            return null;
        }

        if (!data) {
            console.warn(`[Webhook] Transaction not found for payment ID: ${stripePaymentId}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error updating transaction:', error.message);
        return null;
    }
};

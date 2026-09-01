/**
 * backend/controllers/transactionController.js
 * Transactions & Wallet Top-up management using Supabase and Stripe/PayPal
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

        // 1. Get the transaction and user details
        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('transactions')
            .select('*, users(balance)')
            .eq('id', transactionId)
            .single();

        if (fetchErr || !tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
        
        // If it was already completed, don't double-credit
        if (tx.status === 'completed' && status === 'completed') {
            return res.status(400).json({ success: false, message: 'Transaction already completed' });
        }

        // 2. Update transaction status
        const { data: updatedTx, error: updateErr } = await supabaseAdmin
            .from('transactions')
            .update({ status })
            .eq('id', transactionId)
            .select()
            .single();

        if (updateErr) throw updateErr;

        // 3. If marked as completed, credit user balance (convert cents to decimal euros)
        if (status === 'completed' && tx.user_id) {
            const currentBalance = Number(tx.users?.balance) || 0;
            const creditEuros = Number((Number(tx.amount) / 100).toFixed(2));
            const newBalance = Number((currentBalance + creditEuros).toFixed(2));

            await supabaseAdmin
                .from('users')
                .update({ balance: newBalance })
                .eq('id', tx.user_id);
        }

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
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 5) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag für Guthabenaufladung beträgt 5,00 €' });
        }
        if (numAmount > 5000) {
            return res.status(400).json({ success: false, message: 'Maximaler Aufladebetrag beträgt 5.000,00 €' });
        }
        const amountInCents = Math.round(numAmount * 100);

        // Create pending transaction in DB
        const { data: pendingTx, error: txErr } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: amountInCents,
                currency: 'eur',
                type: 'deposit',
                status: 'pending',
                payment_method: 'stripe',
                description: `Guthabenaufladung per Kreditkarte (Stripe): €${numAmount.toFixed(2)}`
            })
            .select()
            .single();

        if (txErr) throw txErr;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'HandyLand Guthabenaufladung',
                        description: `Wallet-Aufladung: €${numAmount.toFixed(2)}`
                    },
                    unit_amount: amountInCents
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${frontendUrl}/dashboard?tab=wallet&wallet=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/dashboard?tab=wallet&wallet=cancelled`,
            client_reference_id: req.user.id,
            metadata: {
                userId: req.user.id,
                transactionId: pendingTx.id,
                topupAmountCents: String(amountInCents)
            }
        });

        // Update transaction with stripe session ID
        await supabaseAdmin
            .from('transactions')
            .update({ stripe_payment_id: session.id })
            .eq('id', pendingTx.id);

        return res.status(200).json({
            success: true,
            url: session.url,
            sessionId: session.id,
            transactionId: pendingTx.id,
            data: { url: session.url, sessionId: session.id }
        });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/confirm-topup
exports.confirmTopUp = async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID ist erforderlich' });
        }

        // Retrieve Stripe session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Stripe-Sitzung nicht gefunden' });
        }

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Zahlung wurde noch nicht abgeschlossen' });
        }

        // Find transaction
        const { data: tx, error: txErr } = await supabaseAdmin
            .from('transactions')
            .select('*, users(id, balance)')
            .eq('stripe_payment_id', sessionId)
            .maybeSingle();

        if (txErr || !tx) {
            return res.status(404).json({ success: false, message: 'Zugehörige Transaktion nicht gefunden' });
        }

        // DOUBLE-CREDIT GUARD: If already completed, return success idempotently
        if (tx.status === 'completed') {
            return res.status(200).json({ success: true, message: 'Bereits verarbeitet', data: tx });
        }

        // Mark transaction completed
        await supabaseAdmin
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', tx.id);

        // Credit user balance in Euros atomically
        const creditEuros = Number((Number(tx.amount) / 100).toFixed(2));
        const currentBalance = Number(tx.users?.balance || 0);
        const newBalance = Number((currentBalance + creditEuros).toFixed(2));

        await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', tx.user_id);

        return res.status(200).json({
            success: true,
            message: 'Guthaben erfolgreich aufgeladen',
            newBalance,
            data: { ...tx, status: 'completed' }
        });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/paypal/create-topup
exports.createPayPalTopUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 5) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag beträgt 5,00 €' });
        }
        if (numAmount > 5000) {
            return res.status(400).json({ success: false, message: 'Maximaler Betrag beträgt 5.000,00 €' });
        }
        const amountInCents = Math.round(numAmount * 100);

        const { data: tx, error } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: amountInCents,
                currency: 'eur',
                type: 'deposit',
                status: 'pending',
                payment_method: 'paypal',
                description: `Guthabenaufladung per PayPal: €${numAmount.toFixed(2)}`
            })
            .select().single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            id: tx.id,
            transactionId: tx.id,
            data: { id: tx.id, amount: numAmount }
        });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/paypal/capture-topup
exports.capturePayPalTopUp = async (req, res, next) => {
    try {
        const { orderID, transactionId } = req.body;
        const lookupId = transactionId || orderID;

        // Find transaction
        let { data: tx, error: txErr } = await supabaseAdmin
            .from('transactions')
            .select('*, users(balance)')
            .eq('id', lookupId)
            .maybeSingle();

        if (txErr || !tx) {
            const { data: pendingTx } = await supabaseAdmin
                .from('transactions')
                .select('*, users(balance)')
                .eq('user_id', req.user.id)
                .eq('payment_method', 'paypal')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!pendingTx) return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden' });
            tx = pendingTx;
        }

        // Double-credit guard
        if (tx.status === 'completed') {
            return res.status(200).json({ success: true, message: 'Bereits verarbeitet' });
        }

        await supabaseAdmin.from('transactions').update({ status: 'completed' }).eq('id', tx.id);

        const creditEuros = Number((Number(tx.amount) / 100).toFixed(2));
        const currentBal = Number(tx.users?.balance || 0);
        const newBal = Number((currentBal + creditEuros).toFixed(2));

        await supabaseAdmin.from('users').update({ balance: newBal }).eq('id', tx.user_id);
        return res.status(200).json({ success: true, newBalance: newBal });
    } catch (error) { next(error); }
};

// @route POST /api/transactions/bank-transfer
exports.createBankTransferTopUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 5) {
            return res.status(400).json({ success: false, message: 'Mindestbetrag beträgt 5,00 €' });
        }
        if (numAmount > 5000) {
            return res.status(400).json({ success: false, message: 'Maximaler Betrag beträgt 5.000,00 €' });
        }
        const amountInCents = Math.round(numAmount * 100);

        const { data, error } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: amountInCents,
                currency: 'eur',
                type: 'deposit',
                status: 'pending',
                payment_method: 'bank_transfer',
                description: `Guthabenaufladung per Banküberweisung: €${numAmount.toFixed(2)}`
            })
            .select().single();

        if (error) throw error;

        // Notify admins about the new bank transfer
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins) {
            await supabaseAdmin.from('notifications').insert(
                admins.map(a => ({
                    user_id: a.id,
                    message: `Neue Banküberweisung (${numAmount.toFixed(2)}€) von ${req.user.name || 'User'}`,
                    type: 'info',
                    link: '/admin/transactions'
                }))
            );
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
exports.uploadTransactionReceipt = async (req, res, next) => {
    try {
        const transactionId = req.params.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Kein Beleg hochgeladen' });
        }

        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('transactions')
            .select('id, user_id')
            .eq('id', transactionId)
            .single();

        if (fetchErr || !tx) {
            return res.status(404).json({ success: false, message: 'Transaktion nicht gefunden' });
        }
        if (req.user.role !== 'admin' && tx.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Nicht autorisiert' });
        }

        // Upload file to Supabase storage receipts bucket
        const fileExt = (req.file.originalname || '').split('.').pop() || 'png';
        const fileName = `receipt-${transactionId}-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('receipts')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        let receiptUrl = `/uploads/${filePath}`;
        if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
                .from('receipts')
                .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
                receiptUrl = publicUrlData.publicUrl;
            }
        }

        // Update transaction record
        await supabaseAdmin
            .from('transactions')
            .update({ receipt_url: receiptUrl })
            .eq('id', transactionId);

        return res.status(200).json({
            success: true,
            message: 'Beleg erfolgreich hochgeladen',
            receiptUrl,
            data: { receiptUrl }
        });
    } catch (error) { next(error); }
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
            .eq('stripe_payment_id', stripePaymentId)
            .select().single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating transaction:', error.message);
        throw error;
    }
};

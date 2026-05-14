/**
 * backend/controllers/transactionController.js
 * Transactions management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

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
        const mappedData = (data || []).map(t => ({
            _id: t.id,
            amount: t.amount,
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
            } : null
        }));

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

        // 3. If marked as completed, credit user balance
        if (status === 'completed') {
            const currentBalance = tx.users?.balance || 0;
            const newBalance = Number(currentBalance) + Number(tx.amount);

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
// @route POST /api/transactions/bank-transfer
exports.createBankTransferTopUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const { data, error } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: req.user.id,
                amount: Number(amount),
                type: 'deposit',
                status: 'pending',
                payment_method: 'bank_transfer',
                description: 'Guthabenaufladung per Banküberweisung'
            })
            .select().single();

        if (error) throw error;

        // Notify admins about the new bank transfer
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins) {
            await supabaseAdmin.from('notifications').insert(
                admins.map(a => ({
                    user_id: a.id,
                    message: `Neue Banküberweisung (${amount}€) von ${req.user.name || 'User'}`,
                    type: 'info',
                    link: '/admin/transactions'
                }))
            );
        }

        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

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

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
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

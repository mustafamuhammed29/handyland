/**
 * backend/controllers/refundController.js
 * Refund management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route GET /api/refunds
exports.getRefunds = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { page = 1, limit = 20, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('refund_requests')
            .select('*, orders(order_number), refund_request_items(*), users!refund_requests_user_id_fkey(name, email)', { count: 'exact' });

        if (!isAdmin) query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);

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

// @route GET /api/refunds/:id
exports.getRefund = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('refund_requests')
            .select('*, orders(order_number), refund_request_items(*), users!refund_requests_user_id_fkey(name, email)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Refund request not found' });
        if (req.user.role !== 'admin' && data.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/refunds
exports.createRefund = async (req, res, next) => {
    try {
        const { orderId, reason, description, items } = req.body;
        if (!orderId || !reason) return res.status(400).json({ success: false, message: 'Order ID and reason are required' });

        // Verify order belongs to user
        const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
        if (orderError || !order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        // Check if within 14 days (widerrufsrecht)
        const orderDate = new Date(order.created_at);
        const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
        const withinWithdrawalPeriod = daysSinceOrder <= 14;

        // Create refund request
        const { data: refundReq, error } = await supabaseAdmin
            .from('refund_requests')
            .insert({
                user_id: req.user.id,
                order_id: orderId,
                reason, description, within_withdrawal_period
            })
            .select().single();
        if (error) throw error;

        // Add items if any
        if (items && items.length > 0) {
            const refundItems = items.map(i => ({
                refund_request_id: refundReq.id,
                product_id: i.productType === 'Product' ? i.itemId : null,
                accessory_id: i.productType === 'Accessory' ? i.itemId : null,
                product_type: i.productType || 'Product',
                name: i.name,
                quantity: i.quantity,
                price: i.price
            }));
            await supabaseAdmin.from('refund_request_items').insert(refundItems);
        }

        // Notify admins
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins) {
            await supabaseAdmin.from('notifications').insert(admins.map(a => ({
                user_id: a.id, message: `Neue Rücksendeanfrage (Bestellung ${order.order_number})`, link: `/admin/refunds/${refundReq.id}`
            })));
        }

        return res.status(201).json({ success: true, message: 'Refund request created', data: refundReq });
    } catch (error) { next(error); }
};

// @route PUT /api/refunds/:id/status (Admin)
exports.updateRefundStatus = async (req, res, next) => {
    try {
        const { status, adminNotes, refundAmount, processStripeRefund } = req.body;
        
        const { data: refundReq } = await supabaseAdmin.from('refund_requests').select('*, orders(payment_id, payment_method)').eq('id', req.params.id).single();
        if (!refundReq) return res.status(404).json({ success: false, message: 'Refund request not found' });

        const updateData = { status };
        if (adminNotes) updateData.admin_notes = adminNotes;
        if (refundAmount !== undefined) updateData.refund_amount = refundAmount;

        // Process Stripe refund if requested and status is processed
        if (status === 'processed' && processStripeRefund && refundReq.orders.payment_method === 'stripe' && refundReq.orders.payment_id) {
            try {
                const amountInCents = Math.round((refundAmount || refundReq.refund_amount || 0) * 100);
                const refund = await stripe.refunds.create({
                    payment_intent: refundReq.orders.payment_id,
                    amount: amountInCents > 0 ? amountInCents : undefined // full if undefined
                });
                updateData.stripe_refund_id = refund.id;
            } catch (stripeErr) {
                return res.status(400).json({ success: false, message: `Stripe Refund Error: ${stripeErr.message}` });
            }
        }

        if (status === 'processed' || status === 'rejected') {
            updateData.resolved_at = new Date().toISOString();
            updateData.resolved_by = req.user.id;
        }

        const { data, error } = await supabaseAdmin.from('refund_requests').update(updateData).eq('id', req.params.id).select().single();
        if (error) throw error;

        // Notify user
        await supabaseAdmin.from('notifications').insert({
            user_id: data.user_id,
            message: `Status Ihrer Rücksendeanfrage aktualisiert: ${status}`,
            link: `/dashboard/refunds/${data.id}`
        });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

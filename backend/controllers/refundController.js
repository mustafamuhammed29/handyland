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
            .select('*, orders(id, order_number, status, payment_method, total_amount), refund_request_items(*), users!refund_requests_user_id_fkey(name, email)', { count: 'exact' });

        if (!isAdmin) query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const formattedData = data.map(r => ({
            _id: r.id,
            status: r.status,
            reason: r.reason,
            description: r.description,
            withinWithdrawalPeriod: r.within_withdrawal_period,
            refundAmount: r.refund_amount,
            adminNotes: r.admin_notes,
            stripeRefundId: r.stripe_refund_id,
            createdAt: r.created_at,
            order: r.orders ? {
                _id: r.orders.id || r.order_id,
                orderNumber: r.orders.order_number,
                paymentMethod: r.orders.payment_method,
                totalAmount: r.orders.total_amount,
                status: r.orders.status
            } : { _id: r.order_id },
            user: {
                _id: r.user_id,
                firstName: r.users?.name ? r.users.name.split(' ')[0] : '',
                lastName: r.users?.name ? r.users.name.split(' ').slice(1).join(' ') : '',
                email: r.users?.email
            }
        }));

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data: formattedData
        });
    } catch (error) { next(error); }
};

// @route GET /api/refunds/:id
exports.getRefund = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('refund_requests')
            .select('*, orders(id, order_number, status, payment_method, total_amount), refund_request_items(*), users!refund_requests_user_id_fkey(name, email)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Refund request not found' });
        if (req.user.role !== 'admin' && data.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        const formattedData = {
            _id: data.id,
            status: data.status,
            reason: data.reason,
            description: data.description,
            withinWithdrawalPeriod: data.within_withdrawal_period,
            refundAmount: data.refund_amount,
            adminNotes: data.admin_notes,
            stripeRefundId: data.stripe_refund_id,
            createdAt: data.created_at,
            order: data.orders ? {
                _id: data.orders.id || data.order_id,
                orderNumber: data.orders.order_number,
                paymentMethod: data.orders.payment_method,
                totalAmount: data.orders.total_amount,
                status: data.orders.status
            } : { _id: data.order_id },
            user: {
                _id: data.user_id,
                firstName: data.users?.name ? data.users.name.split(' ')[0] : '',
                lastName: data.users?.name ? data.users.name.split(' ').slice(1).join(' ') : '',
                email: data.users?.email
            }
        };

        return res.status(200).json({ success: true, data: formattedData });
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

        // Check if refund request already exists for this order
        const { data: existingRefund } = await supabaseAdmin.from('refund_requests').select('id').eq('order_id', orderId).maybeSingle();
        if (existingRefund) {
            return res.status(400).json({ success: false, message: 'Es existiert bereits eine Rückgabeanfrage für diese Bestellung.' });
        }

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
                reason, description, within_withdrawal_period: withinWithdrawalPeriod
            })
            .select().single();
        if (error) throw error;

        // Update order status to reflect the return request
        await supabaseAdmin.from('orders').update({ status: 'return_requested' }).eq('id', orderId);

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
            link: `/dashboard?tab=orders`
        });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/refunds/:id
exports.deleteRefundRequest = async (req, res, next) => {
    try {
        const { data: refundReq } = await supabaseAdmin.from('refund_requests').select('order_id, user_id').eq('id', req.params.id).single();
        if (!refundReq) return res.status(404).json({ success: false, message: 'Refund request not found' });
        
        if (req.user.role !== 'admin' && refundReq.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { error } = await supabaseAdmin.from('refund_requests').delete().eq('id', req.params.id);
        if (error) throw error;

        // Revert order status to delivered
        await supabaseAdmin.from('orders').update({ status: 'delivered' }).eq('id', refundReq.order_id);

        return res.status(200).json({ success: true, message: 'Refund request deleted' });
    } catch (error) { next(error); }
};

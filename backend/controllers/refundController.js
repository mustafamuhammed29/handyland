/**
 * backend/controllers/refundController.js
 * Hardened Refund State Machine, Idempotency & Provider Reconciliation
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Valid state transitions
const ALLOWED_TRANSITIONS = {
    pending: ['under_review', 'processing', 'approved', 'rejected'],
    under_review: ['processing', 'approved', 'rejected'],
    approved: ['processing', 'processed', 'completed', 'failed', 'rejected'],
    processing: ['processed', 'completed', 'failed', 'rejected'],
    failed: ['processing', 'approved', 'rejected'],
    processed: [], // Terminal
    completed: [], // Terminal
    rejected: []   // Terminal
};

const isTerminalStatus = (status) => ['processed', 'completed', 'rejected'].includes(status);

// @route GET /api/refunds
exports.getRefunds = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'staff';
        const { page = 1, limit = 20, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('refund_requests')
            .select('*, orders!refund_requests_order_id_fkey(id, order_number, status, payment_method, payment_id, total_amount), refund_request_items(*), users!refund_requests_user_id_fkey(name, email)', { count: 'exact' });

        if (!isAdmin) query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const formattedData = (data || []).map(r => ({
            _id: r.id,
            id: r.id,
            status: r.status,
            reason: r.reason,
            description: r.description,
            withinWithdrawalPeriod: r.within_withdrawal_period,
            refundAmount: r.refund_amount,
            refundAmountCents: r.refund_amount_cents || Math.round((Number(r.refund_amount) || 0) * 100),
            refundMethod: r.refund_method || 'original_payment',
            gatewayRefundId: r.gateway_refund_id,
            stripeRefundId: r.stripe_refund_id || r.gateway_refund_id,
            idempotencyKey: r.idempotency_key,
            errorMessage: r.error_message,
            adminNotes: r.admin_notes,
            resolvedAt: r.resolved_at,
            createdAt: r.created_at,
            order: r.orders ? {
                _id: r.orders.id || r.order_id,
                id: r.orders.id || r.order_id,
                orderNumber: r.orders.order_number,
                paymentMethod: r.orders.payment_method,
                paymentId: r.orders.payment_id,
                totalAmount: r.orders.total_amount,
                status: r.orders.status
            } : { _id: r.order_id },
            user: {
                _id: r.user_id,
                id: r.user_id,
                firstName: r.users?.name ? r.users.name.split(' ')[0] : '',
                lastName: r.users?.name ? r.users.name.split(' ').slice(1).join(' ') : '',
                email: r.users?.email
            }
        }));

        return res.status(200).json({
            success: true,
            count,
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
            .select('*, orders!refund_requests_order_id_fkey(id, order_number, status, payment_method, payment_id, total_amount), refund_request_items(*), users!refund_requests_user_id_fkey(name, email)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Refund request not found' });
        const isAdmin = req.user.role === 'admin' || req.user.role === 'staff';
        if (!isAdmin && data.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        const formattedData = {
            _id: data.id,
            id: data.id,
            status: data.status,
            reason: data.reason,
            description: data.description,
            withinWithdrawalPeriod: data.within_withdrawal_period,
            refundAmount: data.refund_amount,
            refundAmountCents: data.refund_amount_cents || Math.round((Number(data.refund_amount) || 0) * 100),
            refundMethod: data.refund_method || 'original_payment',
            gatewayRefundId: data.gateway_refund_id,
            stripeRefundId: data.stripe_refund_id || data.gateway_refund_id,
            idempotencyKey: data.idempotency_key,
            errorMessage: data.error_message,
            adminNotes: data.admin_notes,
            resolvedAt: data.resolved_at,
            createdAt: data.created_at,
            order: data.orders ? {
                _id: data.orders.id || data.order_id,
                id: data.orders.id || data.order_id,
                orderNumber: data.orders.order_number,
                paymentMethod: data.orders.payment_method,
                paymentId: data.orders.payment_id,
                totalAmount: data.orders.total_amount,
                status: data.orders.status
            } : { _id: data.order_id },
            user: {
                _id: data.user_id,
                id: data.user_id,
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
        const { orderId, reason, description, items, idempotencyKey, refundAmount } = req.body;
        if (!orderId || !reason) return res.status(400).json({ success: false, message: 'Order ID and reason are required' });

        // Verify order belongs to user
        const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
        if (orderError || !order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        // Idempotency check: if request with idempotencyKey exists, return it
        if (idempotencyKey) {
            const { data: existingIdempotent } = await supabaseAdmin
                .from('refund_requests')
                .select('*')
                .eq('order_id', orderId)
                .eq('idempotency_key', idempotencyKey)
                .maybeSingle();

            if (existingIdempotent) {
                return res.status(200).json({ success: true, message: 'Refund request already exists (idempotent)', data: existingIdempotent });
            }
        }

        // Check if active (non-rejected, non-failed) refund request already exists for this order
        const { data: existingRefund } = await supabaseAdmin
            .from('refund_requests')
            .select('id, status')
            .eq('order_id', orderId)
            .in('status', ['pending', 'under_review', 'processing', 'approved', 'processed', 'completed'])
            .maybeSingle();

        if (existingRefund) {
            return res.status(400).json({ success: false, message: 'Es existiert bereits eine aktive Rückgabeanfrage für diese Bestellung.' });
        }

        // Check withdrawal period (14 days)
        const orderDate = new Date(order.created_at);
        const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
        const withinWithdrawalPeriod = daysSinceOrder <= 14;

        // Calculate requested amount (defaults to order total if not specified)
        const requestedEuros = Number(refundAmount) > 0 ? Number(refundAmount) : Number(order.total_amount);
        const requestedCents = Math.round(requestedEuros * 100);

        // Over-refund check
        const orderTotalCents = Math.round(Number(order.total_amount) * 100);
        if (requestedCents > orderTotalCents) {
            return res.status(400).json({ success: false, message: `Rückerstattungsbetrag (€${requestedEuros.toFixed(2)}) übersteigt den Bestellwert (€${Number(order.total_amount).toFixed(2)})` });
        }

        // Create refund request
        const { data: refundReq, error } = await supabaseAdmin
            .from('refund_requests')
            .insert({
                user_id: req.user.id,
                order_id: orderId,
                reason,
                description,
                within_withdrawal_period: withinWithdrawalPeriod,
                refund_amount: requestedEuros,
                refund_amount_cents: requestedCents,
                idempotency_key: idempotencyKey || null,
                status: 'pending'
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
        const { status, adminNotes, refundAmount, refundMethod = 'original_payment', processProviderRefund = true } = req.body;
        
        // 1. Fetch current refund request with order details
        const { data: refundReq, error: fetchErr } = await supabaseAdmin
            .from('refund_requests')
            .select('*, orders(id, order_number, payment_id, payment_method, total_amount, user_id, status)')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !refundReq) return res.status(404).json({ success: false, message: 'Refund request not found' });

        const currentStatus = refundReq.status || 'pending';

        // 2. Validate state machine transition
        const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowedNextStates.includes(status) && currentStatus !== status) {
            return res.status(400).json({
                success: false,
                message: `Ungültiger Statusübergang von '${currentStatus}' nach '${status}'. Erlaubte Übergänge: ${allowedNextStates.join(', ') || 'Keine (Endzustand)'}`
            });
        }

        const effectiveRefundEuros = refundAmount !== undefined ? Number(refundAmount) : Number(refundReq.refund_amount);
        const effectiveRefundCents = Math.round(effectiveRefundEuros * 100);
        const orderTotalCents = Math.round(Number(refundReq.orders.total_amount) * 100);

        // 3. Over-refund validation (for approved / processed / completed transitions)
        if (['approved', 'processing', 'processed', 'completed'].includes(status)) {
            if (effectiveRefundCents <= 0) {
                return res.status(400).json({ success: false, message: 'Rückerstattungsbetrag muss größer als 0 sein' });
            }

            // Check existing completed refunds on this order (excluding current request)
            const { data: siblingRefunds } = await supabaseAdmin
                .from('refund_requests')
                .select('id, refund_amount_cents, refund_amount, status')
                .eq('order_id', refundReq.order_id)
                .neq('id', refundReq.id)
                .in('status', ['processed', 'completed']);

            const totalAlreadyRefundedCents = (siblingRefunds || []).reduce((sum, r) => {
                const cents = r.refund_amount_cents ? Number(r.refund_amount_cents) : Math.round(Number(r.refund_amount || 0) * 100);
                return sum + cents;
            }, 0);

            if (totalAlreadyRefundedCents + effectiveRefundCents > orderTotalCents) {
                return res.status(400).json({
                    success: false,
                    message: `Gesamterstattungsbetrag (€${((totalAlreadyRefundedCents + effectiveRefundCents) / 100).toFixed(2)}) übersteigt den bezahlten Bestellwert (€${(orderTotalCents / 100).toFixed(2)})`
                });
            }
        }

        const updateData = {
            status,
            refund_amount: effectiveRefundEuros,
            refund_amount_cents: effectiveRefundCents,
            refund_method: refundMethod
        };
        if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

        // 4. Provider Reconciliation for finalization (processed / completed)
        if (['processed', 'completed'].includes(status) && processProviderRefund) {
            const orderPaymentMethod = refundReq.orders.payment_method;
            const orderPaymentId = refundReq.orders.payment_id;

            // Scenario A: Refund to Original Payment via Stripe
            if (refundMethod === 'original_payment' && orderPaymentMethod === 'stripe') {
                if (!orderPaymentId) {
                    return res.status(400).json({ success: false, message: 'Stripe Payment-ID fehlt für diese Bestellung' });
                }
                try {
                    const refund = await stripe.refunds.create({
                        payment_intent: orderPaymentId,
                        amount: effectiveRefundCents > 0 ? effectiveRefundCents : undefined
                    });
                    updateData.gateway_refund_id = refund.id;
                    updateData.stripe_refund_id = refund.id;
                } catch (stripeErr) {
                    // Do not mark completed on provider failure
                    await supabaseAdmin
                        .from('refund_requests')
                        .update({
                            status: 'failed',
                            error_message: stripeErr.message,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', req.params.id);

                    return res.status(400).json({
                        success: false,
                        message: `Stripe-Rückerstattungsfehler: ${stripeErr.message}. Lokaler Status wurde auf 'failed' gesetzt.`
                    });
                }
            }

            // Scenario B: Refund to Customer Wallet
            if (refundMethod === 'wallet' || orderPaymentMethod === 'wallet') {
                const targetUserId = refundReq.user_id || refundReq.orders.user_id;
                if (targetUserId) {
                    // Fetch user balance
                    const { data: userRec } = await supabaseAdmin
                        .from('users')
                        .select('balance')
                        .eq('id', targetUserId)
                        .single();

                    const currentBal = Number(userRec?.balance || 0);
                    const newBal = Number((currentBal + effectiveRefundEuros).toFixed(2));

                    // Atomically credit user balance
                    await supabaseAdmin
                        .from('users')
                        .update({ balance: newBal })
                        .eq('id', targetUserId);

                    // Insert wallet refund transaction in integer cents
                    await supabaseAdmin.from('transactions').insert({
                        user_id: targetUserId,
                        amount: effectiveRefundCents,
                        currency: 'eur',
                        type: 'refund',
                        status: 'completed',
                        payment_method: 'wallet',
                        description: `Rückerstattung für Bestellung #${refundReq.orders.order_number || refundReq.order_id.slice(0, 8)}`
                    });
                }
            }

            updateData.resolved_at = new Date().toISOString();
            updateData.resolved_by = req.user.id;
        }

        if (status === 'rejected') {
            updateData.resolved_at = new Date().toISOString();
            updateData.resolved_by = req.user.id;
        }

        // 5. Update refund request in DB
        const { data: updatedRefund, error: updateErr } = await supabaseAdmin
            .from('refund_requests')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        // 6. Synchronize Order Status
        if (['processed', 'completed'].includes(status)) {
            const isFullRefund = effectiveRefundCents >= orderTotalCents;
            await supabaseAdmin
                .from('orders')
                .update({ status: isFullRefund ? 'refunded' : 'partially_refunded' })
                .eq('id', refundReq.order_id);
        } else if (status === 'rejected') {
            await supabaseAdmin
                .from('orders')
                .update({ status: 'delivered' })
                .eq('id', refundReq.order_id);
        }

        // 7. Notify customer
        if (refundReq.user_id) {
            await supabaseAdmin.from('notifications').insert({
                user_id: refundReq.user_id,
                message: `Status Ihrer Rücksendeanfrage wurde aktualisiert: ${status}`,
                link: `/dashboard?tab=orders`
            });
        }

        return res.status(200).json({ success: true, data: updatedRefund });
    } catch (error) { next(error); }
};

// @route DELETE /api/refunds/:id
exports.deleteRefundRequest = async (req, res, next) => {
    try {
        const { data: refundReq } = await supabaseAdmin.from('refund_requests').select('order_id, user_id, status').eq('id', req.params.id).single();
        if (!refundReq) return res.status(404).json({ success: false, message: 'Refund request not found' });
        
        const isAdmin = req.user.role === 'admin' || req.user.role === 'staff';
        if (!isAdmin && refundReq.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Prevent deletion of processed/completed refunds
        if (isTerminalStatus(refundReq.status) && refundReq.status !== 'rejected') {
            return res.status(400).json({ success: false, message: 'Abgeschlossene Rückerstattungen können nicht gelöscht werden' });
        }

        const { error } = await supabaseAdmin.from('refund_requests').delete().eq('id', req.params.id);
        if (error) throw error;

        // Revert order status to delivered if still pending
        await supabaseAdmin.from('orders').update({ status: 'delivered' }).eq('id', refundReq.order_id);

        return res.status(200).json({ success: true, message: 'Refund request deleted' });
    } catch (error) { next(error); }
};

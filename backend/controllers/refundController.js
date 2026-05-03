const RefundRequest = require('../models/RefundRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');

// ─── Customer: Submit refund request ───────────────────────────────────────
// POST /api/refunds
// EU Widerrufsrecht: 14-day right of withdrawal (§ 312g BGB)
exports.submitRefundRequest = async (req, res) => {
    try {
        const { orderId, reason, description, items, customerConfirmedReturn } = req.body;

        if (!orderId || !reason) {
            return res.status(400).json({ success: false, message: 'orderId and reason are required.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {return res.status(404).json({ success: false, message: 'Order not found.' });}

        // Must belong to this user
        if (order.user?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        // Order must be delivered (or processing for defective/wrong items)
        const allowedStatuses = ['delivered', 'processing', 'shipped'];
        if (!allowedStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Refund can only be requested for delivered orders. Current status: ${order.status}`
            });
        }

        // Prevent duplicate pending request for same order
        const existing = await RefundRequest.findOne({ order: orderId, status: { $in: ['pending', 'under_review', 'approved'] } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A refund request already exists for this order.' });
        }

        // Check if within 14-day withdrawal period (EU law)
        const deliveredAt = order.deliveredAt || order.updatedAt;
        const daysDiff = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
        const withinWithdrawalPeriod = daysDiff <= 14;

        const refundItems = items?.length
            ? items
            : order.items.map(i => ({
                product:     i.product,
                productType: i.productType || 'Product',
                name:        i.name,
                quantity:    i.quantity,
                price:       i.price
              }));

        const refund = await RefundRequest.create({
            user: req.user.id,
            order: orderId,
            reason,
            description: description || '',
            items: refundItems,
            withinWithdrawalPeriod,
            customerConfirmedReturn: customerConfirmedReturn || false,
            refundAmount: order.totalAmount, // default = full order, admin may adjust
        });

        // Update order status to 'return_requested' so it's visible on customer side
        order.status = 'return_requested';
        await order.save();

        res.status(201).json({ success: true, refund });
    } catch (err) {
        console.error('submitRefundRequest error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── Customer: Get my refund requests ──────────────────────────────────────
// GET /api/refunds/my
exports.getMyRefunds = async (req, res) => {
    try {
        const refunds = await RefundRequest.find({ user: req.user.id })
            .populate('order', 'orderNumber totalAmount status createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, refunds });
    } catch (err) {
        console.error('getMyRefunds error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Admin: List all refund requests ───────────────────────────────────────
// GET /api/refunds
exports.getAllRefunds = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = status ? { status } : {};

        const [refunds, total] = await Promise.all([
            RefundRequest.find(filter)
                .populate('user', 'name firstName lastName email')
                .populate('order', 'orderNumber totalAmount paymentMethod paymentId createdAt')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            RefundRequest.countDocuments(filter)
        ]);

        res.status(200).json({ success: true, refunds, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('getAllRefunds error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Admin: Approve refund (optionally triggers Stripe refund) ─────────────
// PUT /api/refunds/:id/approve
exports.approveRefund = async (req, res) => {
    try {
        const { refundAmount, adminNotes, processStripe = false } = req.body;

        const refund = await RefundRequest.findById(req.params.id).populate('order');
        if (!refund) {return res.status(404).json({ success: false, message: 'Refund request not found.' });}

        const order = refund.order;
        const finalAmount = refundAmount || refund.refundAmount || order.totalAmount;

        let stripeRefundId = null;

        // Attempt Stripe refund if payment was by card
        if (processStripe && order.paymentId && ['card', 'stripe'].includes(order.paymentMethod)) {
            try {
                const Settings = require('../models/Settings');
                const settings = await Settings.findOne();
                const secretKey = settings?.payment?.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;
                if (secretKey) {
                    const stripe = require('stripe')(secretKey);
                    const stripeRefund = await stripe.refunds.create({
                        payment_intent: order.paymentId,
                        amount: Math.round(finalAmount * 100),
                    });
                    stripeRefundId = stripeRefund.id;
                }
            } catch (stripeErr) {
                console.error('[Refund] Stripe refund failed:', stripeErr.message);
                // Don't block approval — admin can manually refund
            }
        }

        // Update refund record
        refund.status = 'approved';
        refund.refundAmount = finalAmount;
        refund.adminNotes = adminNotes || '';
        refund.resolvedAt = new Date();
        refund.resolvedBy = req.user.id;
        if (stripeRefundId) {refund.stripeRefundId = stripeRefundId;}
        await refund.save();

        // Update order payment status
        await Order.findByIdAndUpdate(order._id, {
            paymentStatus: 'refunded',
            status: 'refunded'
        });

        // Notify customer via email
        try {
            const emailService = require('../utils/emailService');
            const user = await require('../models/User').findById(refund.user);
            if (user?.email) {
                await emailService.sendEmail({
                    email: user.email,
                    subject: `Ihre Rückerstattung wurde genehmigt — Bestellung #${order.orderNumber || order._id}`,
                    html: `
                        <h2>Rückerstattung genehmigt ✅</h2>
                        <p>Ihre Rückerstattungsanforderung für Bestellung <strong>#${order.orderNumber || order._id}</strong> wurde genehmigt.</p>
                        <p>Rückerstattungsbetrag: <strong>€${finalAmount.toFixed(2)}</strong></p>
                        ${adminNotes ? `<p>Hinweis: ${adminNotes}</p>` : ''}
                        <p>Die Rückerstattung wird innerhalb von 5–10 Werktagen auf Ihrem Konto gutgeschrieben.</p>
                    `
                });
            }
        } catch (emailErr) {
            console.error('[Refund] Email notification failed:', emailErr.message);
        }

        res.status(200).json({ success: true, refund, stripeRefundId });
    } catch (err) {
        console.error('approveRefund error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── Admin: Reject refund ──────────────────────────────────────────────────
// PUT /api/refunds/:id/reject
exports.rejectRefund = async (req, res) => {
    try {
        const { adminNotes } = req.body;
        const refund = await RefundRequest.findById(req.params.id).populate('order');
        if (!refund) {return res.status(404).json({ success: false, message: 'Refund request not found.' });}

        refund.status = 'rejected';
        refund.adminNotes = adminNotes || '';
        refund.resolvedAt = new Date();
        refund.resolvedBy = req.user.id;
        await refund.save();

        // Revert order status to delivered
        if (refund.order) {
            const orderId = refund.order._id || refund.order;
            await require('../models/Order').findByIdAndUpdate(orderId, { status: 'delivered' });
        }

        // Notify customer
        try {
            const emailService = require('../utils/emailService');
            const user = await require('../models/User').findById(refund.user);
            if (user?.email) {
                await emailService.sendEmail({
                    email: user.email,
                    subject: `Ihre Rückerstattungsanforderung — Bestellung #${refund.order?.orderNumber}`,
                    html: `
                        <h2>Rückerstattungsanforderung abgelehnt</h2>
                        <p>Ihre Anforderung für Bestellung <strong>#${refund.order?.orderNumber}</strong> wurde leider abgelehnt.</p>
                        ${adminNotes ? `<p>Grund: ${adminNotes}</p>` : ''}
                        <p>Bei Fragen kontaktieren Sie bitte unseren Kundendienst.</p>
                    `
                });
            }
        } catch (e) { /* non-critical */ }

        res.status(200).json({ success: true, refund });
    } catch (err) {
        console.error('rejectRefund error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Admin: Get single refund detail ───────────────────────────────────────
// GET /api/refunds/:id
exports.getRefundById = async (req, res) => {
    try {
        const refund = await RefundRequest.findById(req.params.id)
            .populate('user', 'name firstName lastName email phone')
            .populate('order')
            .populate('resolvedBy', 'name');

        if (!refund) {return res.status(404).json({ success: false, message: 'Not found.' });}
        res.status(200).json({ success: true, refund });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Admin: Update refund status (Generic) ──────────────────────────────────
// PUT /api/refunds/:id/status
exports.updateRefundStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const allowed = ['pending', 'under_review', 'approved', 'rejected', 'processed'];

        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const refund = await RefundRequest.findById(req.params.id).populate('order');
        if (!refund) {
            return res.status(404).json({ success: false, message: 'Refund request not found.' });
        }

        refund.status = status;
        if (adminNotes !== undefined) refund.adminNotes = adminNotes;
        
        if (['approved', 'rejected', 'processed'].includes(status)) {
            refund.resolvedAt = new Date();
            refund.resolvedBy = req.user.id;
        }

        await refund.save();

        // Synchronize Order Status based on Refund Status
        if (refund.order) {
            const order = await Order.findById(refund.order._id);
            if (order) {
                if (status === 'approved' || status === 'processed') {
                    order.status = 'refunded';
                    order.paymentStatus = 'refunded';
                } else if (status === 'under_review') {
                    order.status = 'return_requested';
                } else if (status === 'rejected') {
                    order.status = 'delivered'; 
                }
                await order.save();
            }
        }

        res.status(200).json({ success: true, refund });
    } catch (err) {
        console.error('updateRefundStatus error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Customer/Admin: Delete refund request ──────────────────────────────────
// DELETE /api/refunds/:id
exports.deleteRefundRequest = async (req, res) => {
    try {
        const refund = await RefundRequest.findById(req.params.id);
        if (!refund) {return res.status(404).json({ success: false, message: 'Refund request not found.' });}

        // Only owner can delete if pending, or admin can delete anytime
        const isOwner = refund.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAdmin && (!isOwner || refund.status !== 'pending')) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this request.' });
        }

        const orderId = refund.order;
        await refund.deleteOne();

        // If it was the active refund, revert order status back to delivered
        if (orderId) {
            const order = await Order.findById(orderId);
            if (order && order.status === 'return_requested') {
                order.status = 'delivered';
                await order.save();
            }
        }

        res.status(200).json({ success: true, message: 'Refund request deleted.' });
    } catch (err) {
        console.error('deleteRefundRequest error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

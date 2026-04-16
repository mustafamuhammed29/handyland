const mongoose = require('mongoose');

// ── XSS Protection ────────────────────────────────────────────────────────────
// Escapes HTML special characters to prevent XSS injection in server-rendered HTML
const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const RefundRequest = require('../models/RefundRequest'); // Added
const Coupon = require('../models/Coupon');
const Accessory = require('../models/Accessory');
const { createNotification } = require('../controllers/notificationController');
const { notify } = require('../utils/notificationService');
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('STRIPE_SECRET_KEY not found in .env, stripe functionality will be disabled');
    stripe = {
        refunds: { create: async () => ({ id: 'mock_refund_id' }) }
    };
}
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { emitOrderUpdate, emitNewOrder, emitAdminNotification } = require('../utils/socket');

// @desc    Apply Coupon
// @route   POST /api/orders/apply-coupon
// @access  Private
exports.applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        // Manual validity checks (coupon.isValid() does not exist)
        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
        }

        if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        if (cartTotal && coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            return res.status(400).json({ success: false, message: `Minimum order amount is €${coupon.minOrderValue}` });
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = ((cartTotal || 0) * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {discount = Math.min(discount, coupon.maxDiscount);}
        } else {
            discount = coupon.discountValue;
        }

        // Cap discount at total amount
        discount = Math.min(discount, cartTotal || discount);

        res.json({
            success: true,
            discount: parseFloat(discount.toFixed(2)),
            totalAfterDiscount: parseFloat(((cartTotal || 0) - discount).toFixed(2)),
            couponCode: coupon.code
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, shippingMethod, notes, couponCode, discountAmount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        // Calculate total amount
        let totalAmount = 0;
        const orderItems = [];

        // ── ATOMIC stock deduction (Issue #2 fix — prevents race conditions) ──────
        // Using findOneAndUpdate with $gte condition ensures stock is checked and
        // decremented atomically. If stock is insufficient, returns null (no update).
        for (const item of items) {
            let product;
            const quantityAmt = Number(item.quantity) || 1;
            
            if (item.productType === 'Product') {
                product = await Product.findOneAndUpdate(
                    { _id: item.product, stock: { $gte: quantityAmt } },
                    { $inc: { stock: -quantityAmt, sold: quantityAmt } },
                    { new: true }
                );
            } else if (item.productType === 'Accessory') {
                product = await Accessory.findOneAndUpdate(
                    { _id: item.product, stock: { $gte: quantityAmt } },
                    { $inc: { stock: -quantityAmt, sold: quantityAmt } },
                    { new: true }
                );
            }

            // null means either product not found OR insufficient stock (atomic check)
            if (!product) {
                // Rollback any stock already decremented in this loop
                for (const rolled of orderItems) {
                    if (rolled.productType === 'Product') {
                        await Product.findByIdAndUpdate(rolled.product, { $inc: { stock: rolled.quantity, sold: -rolled.quantity } });
                    } else if (rolled.productType === 'Accessory') {
                        await Accessory.findByIdAndUpdate(rolled.product, { $inc: { stock: rolled.quantity, sold: -rolled.quantity } });
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock or product not found: ${item.product}`
                });
            }

            const itemTotal = product.price * quantityAmt;
            totalAmount += itemTotal;

            orderItems.push({
                product: product._id,
                productType: item.productType,
                name: product.name || product.title,
                quantity: quantityAmt,
                price: product.price,
                image: product.image || product.images?.[0]
            });
        }

        // Calculate Tax and Shipping
        const taxRate = 0.19; // 19% Tax
        const shippingFee = totalAmount > 100 ? 0 : 5.99; // Free shipping over 100
        const taxAmount = totalAmount * taxRate;
        const appliedDiscount = discountAmount ? parseFloat(discountAmount) : 0;

        const finalAmount = Math.max(0, totalAmount + shippingFee + taxAmount - appliedDiscount);

        let statusToSet = 'pending';
        let paymentStatusToSet = 'pending';

        if (paymentMethod === 'wallet') {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Must be logged in to pay with wallet.' });
            }
            const User = require('../models/User');
            const currentUser = await User.findById(req.user._id);
            if (!currentUser || currentUser.balance < finalAmount) {
                // Rollback stock
                for (const rolled of orderItems) {
                    if (rolled.productType === 'Product') {
                        await Product.findByIdAndUpdate(rolled.product, { $inc: { stock: rolled.quantity, sold: -rolled.quantity } });
                    } else if (rolled.productType === 'Accessory') {
                        await Accessory.findByIdAndUpdate(rolled.product, { $inc: { stock: rolled.quantity, sold: -rolled.quantity } });
                    }
                }
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
            }
            
            // Deduct balance
            currentUser.balance -= finalAmount;
            await currentUser.save();
            
            statusToSet = 'processing';
            paymentStatusToSet = 'paid';
        }

        // Create the order
        const order = await Order.create({
            user: req.user ? req.user._id : undefined,
            items: orderItems,
            shippingAddress,
            contactEmail: req.body.contactEmail || (req.user ? req.user.email : undefined), // Track guest email
            paymentMethod,
            status: statusToSet,
            paymentStatus: paymentStatusToSet,
            totalAmount: finalAmount, // Store the final calculated amount
            tax: taxAmount,
            shippingFee,
            shippingMethod: shippingMethod || 'Standard',
            couponCode: couponCode || undefined,
            discountAmount: appliedDiscount,
            appliedPoints: req.body.appliedPoints || 0 // Store points applied for this order
        });

        // Smart Loyalty & Rewards Logic
        if (req.user) {
            const User = require('../models/User');
            const Settings = require('../models/Settings');

            const currentUser = await User.findById(req.user._id);
            const settingsDoc = await Settings.findOne() || {};
            const loyaltyConfig = settingsDoc.features?.loyalty || {
                enabled: true,
                earnRate: 10,
                redeemRate: 100,
                silverThreshold: 500,
                goldThreshold: 2000,
                platinumThreshold: 5000
            };

            if (currentUser && loyaltyConfig.enabled !== false) {
                // Deduct redeemed points (if any)
                const pointsToDeduct = req.body.appliedPoints || 0;
                let newLoyaltyPoints = (currentUser.loyaltyPoints || 0) - pointsToDeduct;

                // Grant points for this purchase
                const pointsEarned = Math.floor(totalAmount * (loyaltyConfig.earnRate || 10)); // Use pre-discount/tax total for points calculation
                newLoyaltyPoints += pointsEarned;

                // Simple auto-tiering mechanism based on points thresholds
                let newLevel = 1; // Regular
                if (newLoyaltyPoints >= (loyaltyConfig.platinumThreshold || 5000)) {newLevel = 4;} // Platinum
                else if (newLoyaltyPoints >= (loyaltyConfig.goldThreshold || 2000)) {newLevel = 3;} // Gold
                else if (newLoyaltyPoints >= (loyaltyConfig.silverThreshold || 500)) {newLevel = 2;} // Silver

                currentUser.loyaltyPoints = newLoyaltyPoints;
                currentUser.membershipLevel = newLevel;
                await currentUser.save();

                // Add tracking information to the order (for UI display)
                order.pointsEarned = pointsEarned;
                await order.save();
            }
        }
        // NOTE: Stock was already decremented atomically in the loop above (Issue #2 fix).

        if (paymentMethod === 'wallet') {
            await Transaction.create({
                user: req.user._id,
                order: order._id,
                amount: finalAmount,
                type: 'purchase',
                paymentMethod: 'wallet',
                status: 'completed',
                description: `Payment for order #${order.orderNumber}`
            });
        }

        // Record coupon usage (per-account tracking) — only for authenticated users
        if (couponCode && req.user) {
            const { recordCouponUsage } = require('./couponController');
            await recordCouponUsage(couponCode, req.user.id, req.user.email);
        }

        // Send order confirmation email (non-critical)
        try {
            await sendEmail({
                email: req.user.email,
                subject: 'Order Confirmation - HandyLand',
                html: emailTemplates.orderConfirmation(req.user.name, order)
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        // Send in-app notification
        try {
            await notify({
                userId: req.user.id,
                userEmail: req.user.email,
                userName: req.user.name,
                message: `Your order #${order.orderNumber} has been placed successfully! Total: €${order.totalAmount.toFixed(2)}`,
                type: 'success',
                link: `/dashboard`,
                category: 'orderUpdates'
            });
        } catch (notifError) { /* non-fatal */ }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });

        // 🔔 Real-time admin notification
        emitNewOrder(order);
        emitAdminNotification('new_order', {
            title: 'Neue Bestellung',
            body: `#${order.orderNumber} · ${orderItems.length} Artikel · €${finalAmount.toFixed(2)}`,
            icon: '🛎️',
            link: '/orders',
            orderNumber: order.orderNumber,
            total: finalAmount,
            customerName: shippingAddress?.fullName || (req.user ? req.user.name : 'Gast'),
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};


// @desc    Get all orders for logged in user
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { user: req.user.id };
        if (status) {query.status = status;}

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'name email');

        const count = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Make sure user is order owner or admin (if the order has a user)
        if (order.user) {
            if (!req.user || (order.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this order'
                });
            }
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Make sure user is order owner (Issue #3 fix: guard against guest/null orders)
        if (!order.user || order.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Can only cancel pending or processing orders
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status: ${order.status}`
            });
        }

        // FIX: Save old status BEFORE changing it so the rollback guard is correct
        const oldStatus = order.status;
        order.status = 'cancelled';
        await order.save();

        // Rollback stock only for 'processing' orders (stock was already deducted).
        // 'pending' orders also deduct stock on creation, so we roll back for both.
        // Only skip rollback if the order was never fulfilled (e.g. pending_payment).
        if (oldStatus !== 'pending_payment') {
            for (const item of order.items) {
                if (item.productType === 'Product') {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, sold: -item.quantity } });
                } else if (item.productType === 'Accessory') {
                    await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, sold: -item.quantity } });
                }
            }
        }

        // FIXED: Rollback coupon usage on cancellation (FIX 3)
        if (order.couponCode) {
            const Coupon = require('../models/Coupon');
            await Coupon.findOneAndUpdate(
                { code: order.couponCode.toUpperCase() },
                { $inc: { usedCount: -1 } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};


// ============ ADMIN ONLY ENDPOINTS ============

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'name email phone');

        const count = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, trackingNumber, note, adminNote } = req.body;

        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const oldStatus = order.status;

        if (status) {
            order.status = status;

            // Rollback stock and sold count if order is cancelled by admin
            // Issue #6 fix: include 'pending' in rollback — stock is deducted at order creation
            // for ALL statuses, so cancelling a 'pending' order must restore stock too.
            if (status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'pending_payment') {
                for (const item of order.items) {
                    if (item.productType === 'Product') {
                        const Product = require('../models/Product');
                        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, sold: -item.quantity } });
                    } else if (item.productType === 'Accessory') {
                        const Accessory = require('../models/Accessory');
                        await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, sold: -item.quantity } });
                    }
                }
            }
        }

        if (trackingNumber) {
            // Basic tracking number validation (alphanumeric, 8-20 chars)
            const trackingRegex = /^[A-Z0-9]{8,20}$/;
            if (!trackingRegex.test(trackingNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid tracking number format (Alphanumeric, 8-20 chars)'
                });
            }
            order.trackingNumber = trackingNumber;
        }

        if (note && order.statusHistory.length > 0) {
            order.statusHistory[order.statusHistory.length - 1].note = note;
        }

        await order.save();

        // Send status update email if status changed
        if (status && status !== oldStatus) {
            try {
                await sendEmail({
                    email: order.user.email,
                    subject: `Order Update: ${order.orderNumber}`,
                    html: emailTemplates.orderStatusUpdate(order.user.name, order, status, adminNote)
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        // Real-time notification via Socket.IO + persistent DB notification
        if (status && status !== oldStatus) {
            emitOrderUpdate(order.user?._id?.toString(), order);

            const statusLabels = {
                processing: 'قيد المعالجة',
                shipped: 'تم الشحن',
                delivered: 'تم التسليم ✅',
                cancelled: 'تم الإلغاء ❌',
                return_requested: 'طلب إرجاع',
                refunded: 'تم الاسترداد'
            };
            const label = statusLabels[status] || status;

            // Fire-and-forget — don't await so it never blocks the response
            notify({
                userId: order.user._id.toString(),
                message: `طلبك #${order.orderNumber} — ${label}${trackingNumber ? ` · رقم التتبع: ${trackingNumber}` : ''
                    }`,
                type: status === 'cancelled' ? 'warning' : status === 'delivered' ? 'success' : 'info',
                link: `/dashboard?tab=orders`
            }).catch(console.error);
        }

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};

// @desc    Get order invoice (HTML)
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.getInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email address');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Authorization
        const isAdmin = req.user && req.user.role === 'admin';
        const isOwner = req.user && order.user && order.user._id.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Block non-admins from downloading until admin has generated/approved the invoice
        if (!isAdmin && !order.invoiceGenerated) {
            return res.status(403).json({
                success: false,
                message: 'Die Rechnung wurde noch nicht vom Administrator erstellt. Bitte warten Sie.'
            });
        }

        // If admin is accessing for the first time, mark as generated
        if (isAdmin && !order.invoiceGenerated) {
            order.invoiceGenerated = true;
            order.invoiceGeneratedAt = new Date();
            await order.save();
        }

        // Fetch Dynamic Settings
        const Settings = require('../models/Settings');
        const settings = await Settings.findOne() || {};
        const invoiceSettings = settings.invoice || {
            companyName: 'HandyLand',
            companyAddress: 'Tech Street 123 - 10115 Berlin - Germany',
            vatNumber: 'DE123456789',
            footerText: 'Thank you for your business!',
            prefix: 'HL-'
        };
        const taxRate = settings.taxRate || 19;

        // Format Date
        const date = new Date(order.createdAt).toLocaleDateString('de-DE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // HTML Template
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice #${order.orderNumber}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .invoice-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #000; }
                    .logo span { color: #00bcd4; }
                    .invoice-details { text-align: right; }
                    .invoice-title { font-size: 32px; font-weight: bold; color: #333; text-transform: uppercase; margin: 0; }
                    .bill-to { margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .bill-to-section { width: 48%; }
                    h3 { font-size: 14px; text-transform: uppercase; color: #777; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { text-align: left; padding: 10px; background: #f9f9f9; border-bottom: 2px solid #ddd; text-transform: uppercase; font-size: 12px; }
                    td { padding: 10px; border-bottom: 1px solid #eee; }
                    .text-right { text-align: right; }
                    .totals { width: 300px; margin-left: auto; }
                    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
                    .totals-row.grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid ${invoiceSettings.primaryColor || '#333'}; margin-top: 10px; padding-top: 10px; color: ${invoiceSettings.primaryColor || '#000'} }
                    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <div class="logo">
                        ${invoiceSettings.logoUrl
                            ? `<img src="${invoiceSettings.logoUrl.startsWith('http') ? invoiceSettings.logoUrl : `${req.protocol}://${req.get('host')}${invoiceSettings.logoUrl}`}" alt="Logo" style="max-height: 40px; object-fit: contain;" />`
                            : `<span style="color: #000">${(invoiceSettings.companyName || 'HandyLand').replace('Land', '')}</span><span style="color: ${invoiceSettings.primaryColor || '#00bcd4'}">Land</span>`
                        }
                    </div>
                    <div class="invoice-details">
                        <div class="invoice-title" style="color: ${invoiceSettings.primaryColor || '#333'}">${invoiceSettings.titleLabel || 'Invoice'}</div>
                        <div>${invoiceSettings.dateLabel || 'Date:'} ${date}</div>
                        <div>${invoiceSettings.numberLabel || 'Invoice #:'} ${invoiceSettings.prefix || 'HL-'}${order.orderNumber}</div>
                        ${invoiceSettings.vatNumber ? `<div>${invoiceSettings.vatIdLabel || 'VAT ID:'} ${invoiceSettings.vatNumber}</div>` : ''}
                    </div>
                </div>

                <div class="bill-to">
                    <div class="bill-to-section">
                        <h3 style="border-bottom-color: ${invoiceSettings.primaryColor || '#eee'}; color: ${invoiceSettings.primaryColor || '#777'}">Bill To:</h3>
                        <div>${escapeHtml(order.shippingAddress.fullName)}</div>
                        <div>${escapeHtml(order.shippingAddress.street)}</div>
                        <div>${escapeHtml(order.shippingAddress.zipCode)} ${escapeHtml(order.shippingAddress.city)}</div>
                        <div>${escapeHtml(order.shippingAddress.country)}</div>
                        <div>${escapeHtml(order.shippingAddress.phone)}</div>
                    </div>
                    <div class="bill-to-section">
                        <h3 style="border-bottom-color: ${invoiceSettings.primaryColor || '#eee'}; color: ${invoiceSettings.primaryColor || '#777'}">Ship To:</h3>
                        <div>${escapeHtml(order.shippingAddress.fullName)}</div>
                        <div>${escapeHtml(order.shippingAddress.street)}</div>
                        <div>${escapeHtml(order.shippingAddress.zipCode)} ${escapeHtml(order.shippingAddress.city)}</div>
                        <div>${escapeHtml(order.shippingAddress.country)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>${invoiceSettings.itemLabel || 'Item'}</th>
                            <th>${invoiceSettings.quantityLabel || 'Quantity'}</th>
                            <th>${invoiceSettings.priceLabel || 'Price'}</th>
                            <th>${invoiceSettings.totalLabel || 'Total'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                        <tr>
                            <td>
                                <div><strong>${escapeHtml(item.name)}</strong></div>
                                <div style="font-size: 12px; color: #777;">${escapeHtml(item.productType)}</div>
                            </td>
                            <td class="text-right">${item.price.toFixed(2)}€</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${(item.price * item.quantity).toFixed(2)}€</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="totals-row">
                        <span>${invoiceSettings.subtotalLabel || 'Subtotal:'}</span>
                        <span>${(order.totalAmount - order.shippingFee - order.tax + order.discountAmount).toFixed(2)}€</span>
                    </div>
                    <div class="totals-row">
                        <span>${invoiceSettings.taxLabel || 'VAT'} (${taxRate}%):</span>
                        <span>${order.tax.toFixed(2)}€</span>
                    </div>
                    <div class="totals-row">
                        <span>${invoiceSettings.shippingLabel || 'Shipping:'}</span>
                        <span>${order.shippingFee.toFixed(2)}€</span>
                    </div>
                    ${order.discountAmount > 0 ? `
                    <div class="totals-row" style="color: green;">
                        <span>${invoiceSettings.discountLabel || 'Discount'} (${order.couponCode || 'Promo'}):</span>
                        <span>-${order.discountAmount.toFixed(2)}€</span>
                    </div>
                    ` : ''}
                    <div class="totals-row grand-total">
                        <span>${invoiceSettings.totalLabel || 'Total:'}</span>
                        <span>${order.totalAmount.toFixed(2)}€</span>
                    </div>
                </div>

                <div class="footer">
                    <p style="font-weight: bold; color: #555;">${invoiceSettings.footerText || 'Thank you for your business!'}</p>
                    <p>${invoiceSettings.companyAddress || 'Tech Street 123 - 10115 Berlin - Germany'}</p>
                    ${(invoiceSettings.bankName || invoiceSettings.iban || invoiceSettings.bic) ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; display: flex; justify-content: center; gap: 20px; font-size: 11px; color: #888;">
                        ${invoiceSettings.bankName ? `<span>Bank: ${invoiceSettings.bankName}</span>` : ''}
                        ${invoiceSettings.iban ? `<span>IBAN: ${invoiceSettings.iban}</span>` : ''}
                        ${invoiceSettings.bic ? `<span>BIC: ${invoiceSettings.bic}</span>` : ''}
                    </div>
                    ` : ''}
                    <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: ${invoiceSettings.primaryColor || '#333'}; color: #fff; border: none; cursor: pointer; border-radius: 5px;">${invoiceSettings.printBtnLabel || 'Print Invoice'}</button>
                    <button class="no-print" onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ccc; color: #333; border: none; cursor: pointer; border-radius: 5px; margin-left: 10px;">${invoiceSettings.closeBtnLabel || 'Close'}</button>
                </div>
            </body>
            </html>
        `;

        res.send(html);

    } catch (error) {
        res.status(500).send('Error generating invoice');
    }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
// FIXED: Replaced 6 separate countDocuments with single aggregation (FIX 4)
exports.getOrderStats = async (req, res) => {
    try {
        const [statusCounts, revenueData] = await Promise.all([
            Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        const counts = {};
        statusCounts.forEach(s => { counts[s._id] = s.count; });
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        res.status(200).json({
            success: true,
            stats: {
                totalOrders: total,
                pendingOrders: counts['pending'] || 0,
                processingOrders: counts['processing'] || 0,
                shippedOrders: counts['shipped'] || 0,
                deliveredOrders: counts['delivered'] || 0,
                cancelledOrders: counts['cancelled'] || 0,
                totalRevenue: revenueData[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};

// @desc    Get order sales timeline (Admin)
// @route   GET /api/orders/admin/timeline
// @access  Private/Admin
exports.getOrderTimeline = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const timeline = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Fill in missing days
        const tData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // format YYYY-MM-DD
            const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dayData = timeline.find(t => t._id === dateStr);
            tData.push({
                date: formattedDate,
                sales: dayData ? dayData.sales : 0
            });
        }

        res.status(200).json({
            success: true,
            timeline: tData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order timeline',
            error: error.message
        });
    }
};

// @desc    Request Refund
// @route   POST /api/orders/request-refund
// @access  Private
exports.requestRefund = async (req, res) => {
    try {
        const { orderId, reason, items, images } = req.body;
        const userId = req.user._id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check if refund already exists
        const existingRefund = await RefundRequest.findOne({ order: orderId, status: { $in: ['pending', 'approved', 'processing'] } });
        if (existingRefund) {
            return res.status(400).json({ success: false, message: 'Refund request already pending for this order' });
        }

        const refund = await RefundRequest.create({
            user: userId,
            order: orderId,
            reason,
            items,
            images,
            status: 'pending'
        });

        // Optional: Update order status to 'return_requested' if you have that status
        order.status = 'return_requested';
        await order.save();

        res.status(201).json({
            success: true,
            message: 'Refund request submitted successfully',
            refund
        });


    } catch (error) {
        console.error("Refund Request Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// FIXED: Removed duplicate generateInvoice — use getInvoice instead (FIX 7)
exports.generateInvoice = exports.getInvoice; // alias for backward compatibility

// @desc    Process refund (Admin)
// @route   PUT /api/orders/refund/:id
// @access  Private/Admin
exports.processRefund = async (req, res) => {
    try {
        const { status, adminComments } = req.body; // status: 'approved', 'rejected'
        const refundRequest = await RefundRequest.findById(req.params.id).populate('order');

        if (!refundRequest) {return res.status(404).json({ message: 'Refund request not found' });}

        refundRequest.status = status;
        refundRequest.adminComments = adminComments;

        if (status === 'approved') {
            // Here you would trigger Stripe refund if implemented
            // await stripe.refunds.create({ charge: refundRequest.order.paymentResult.id });
            refundRequest.refundAmount = refundRequest.order.totalAmount; // Confirm amount

            await createNotification(refundRequest.user, `Your refund request for Order #${refundRequest.order._id} has been APPROVED.`, 'success');
        } else if (status === 'rejected') {
            await createNotification(refundRequest.user, `Your refund request for Order #${refundRequest.order._id} has been REJECTED.`, 'error');
        }

        await refundRequest.save();

        // FIXED: Send email notification to user about refund status (FIX 6)
        try {
            const User = require('../models/User');
            const refundUser = await User.findById(refundRequest.user);
            if (refundUser) {
                await sendEmail({
                    email: refundUser.email,
                    subject: status === 'approved' ? 'Refund Approved - HandyLand' : 'Refund Request Update - HandyLand',
                    html: `
                        <h2>Hello ${refundUser.name},</h2>
                        <p>Your refund request for Order <strong>#${refundRequest.order.orderNumber || refundRequest.order._id}</strong> has been <strong>${status.toUpperCase()}</strong>.</p>
                        ${adminComments ? `<p><strong>Note from our team:</strong> ${adminComments}</p>` : ''}
                        <p>If you have questions, please contact our support team.</p>
                        <p>HandyLand Team</p>
                    `
                });
            }
        } catch (emailError) {
            console.error('Refund email failed:', emailError);
        }

        res.json(refundRequest);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // FIXED: Authorization check — only order owner or admin (FIX 1)
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.status = 'processing';
        const updatedOrder = await order.save();

        // Send in-app notification
        try {
            await notify({
                userId: order.user.toString(),
                message: `Payment confirmed for order #${order.orderNumber}. Your order is now being processed!`,
                type: 'success',
                link: `/dashboard`,
                category: 'orderUpdates'
            });
        } catch (notifError) { /* non-fatal */ }

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = async (req, res) => {
    try {
        // FIXED: Admin-only authorization check (FIX 1)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'delivered';
        const updatedOrder = await order.save();

        // Send in-app notification
        try {
            await notify({
                userId: order.user.toString(),
                message: `Your order #${order.orderNumber} has been delivered! Enjoy your purchase 🎉`,
                type: 'success',
                link: `/dashboard`,
                category: 'orderUpdates'
            });
        } catch (notifError) { /* non-fatal */ }

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload Payment Receipt (for Bank Transfer)
// @route   POST /api/orders/:id/receipt
// @access  Private
exports.uploadPaymentReceipt = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify order belongs to user (or allow if it's a guest order)
        if (order.user) {
            if (!req.user || (order.user.toString() !== req.user.id && req.user.role !== 'admin')) {
                return res.status(403).json({ success: false, message: 'Not authorized for this order' });
            }
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }

        // FIXED: Proxy-safe URL construction (FIX 5)
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const fileUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        order.paymentReceipt = fileUrl;
        order.statusHistory.push({
            status: order.status,
            note: 'Payment receipt uploaded by customer'
        });

        await order.save();

        res.json({ success: true, message: 'Receipt uploaded successfully', receiptUrl: fileUrl });
    } catch (error) {
        console.error("Receipt upload error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Approve Bank Transfer Payment
// @route   PUT /api/orders/admin/:id/approve-bank-transfer
// @access  Private/Admin
exports.approveBankTransfer = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentMethod !== 'bank_transfer') {
            return res.status(400).json({ success: false, message: 'Order is not a bank transfer' });
        }

        order.paymentStatus = 'paid';
        order.status = 'processing';
        order.statusHistory.push({
            status: 'processing',
            note: 'Bank transfer payment verified and approved by admin'
        });

        await order.save();

        res.json({ success: true, message: 'Payment verified successfully', order });
    } catch (error) {
        console.error("Approve payment error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

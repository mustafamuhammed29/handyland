const mongoose = require('mongoose');

// ── XSS Protection ────────────────────────────────────────────────────────────
// Escapes HTML special characters to prevent XSS injection in server-rendered HTML
const escapeHtml = (str) => {
    if (str === null || str === undefined) {return '';}
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
const User = require('../models/User');
const Settings = require('../models/Settings');
const ShippingMethod = require('../models/ShippingMethod');
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
const { sendEmail, sendTemplateEmail, emailTemplates } = require('../utils/emailService');
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
    const useTransactions = process.env.MONGO_USE_TRANSACTIONS === 'true';
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) {session.startTransaction();}

    try {
        const { items, shippingAddress, paymentMethod, shippingMethod, notes, couponCode } = req.body;

        if (!items || items.length === 0) {
            if (session) {await session.abortTransaction();}
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        let pointsToDeduct = req.body.appliedPoints ? parseFloat(req.body.appliedPoints) : 0;
        if (pointsToDeduct < 0) {pointsToDeduct = 0;}

        let currentUser;
        if (req.user) {
            let userQ = User.findById(req.user._id);
            if (session) {userQ = userQ.session(session);}
            currentUser = await userQ;

            if (pointsToDeduct > 0 && (!currentUser || (currentUser.loyaltyPoints || 0) < pointsToDeduct)) {
                if (session) {await session.abortTransaction();}
                return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
            }
        } else {
            pointsToDeduct = 0; // Guests cannot use points
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
        const taxRate = 0.19;

        let shippingQ = ShippingMethod.findOne({ name: shippingMethod });
        if (session) {shippingQ = shippingQ.session(session);}
        const shippingMethodDoc = await shippingQ;

        const shippingFee = shippingMethodDoc ? shippingMethodDoc.price : (totalAmount > 100 ? 0 : 5.99);

        const taxAmount = totalAmount - (totalAmount / (1 + taxRate));

        let appliedDiscount = 0;
        if (couponCode) {
            let couponQ = Coupon.findOne({ code: couponCode.toUpperCase() });
            if (session) {couponQ = couponQ.session(session);}
            const coupon = await couponQ;
            if (coupon && coupon.isActive && (!coupon.validUntil || new Date() <= new Date(coupon.validUntil))) {
                if (coupon.discountType === 'percentage') {
                    appliedDiscount = (totalAmount * coupon.discountValue) / 100;
                    if (coupon.maxDiscount) {appliedDiscount = Math.min(appliedDiscount, coupon.maxDiscount);}
                } else {
                    appliedDiscount = coupon.discountValue;
                }
                appliedDiscount = Math.min(appliedDiscount, totalAmount);
            }
        }

        const finalAmount = Math.max(0, totalAmount + shippingFee - appliedDiscount);

        let statusToSet = 'pending';
        let paymentStatusToSet = 'pending';

        if (paymentMethod === 'wallet') {
            if (!req.user) {
                if (session) {await session.abortTransaction();}
                return res.status(401).json({ success: false, message: 'Must be logged in to pay with wallet.' });
            }
            if (!currentUser || currentUser.balance < finalAmount) {
                if (session) {await session.abortTransaction();}
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
            }

            // Deduct balance
            currentUser.balance -= finalAmount;
            await currentUser.save({ session: session || null });

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
            const recipientEmail = req.user?.email || req.body.email || req.body.contactEmail || order.contactEmail;
            const recipientName = req.user?.name || req.body.fullName || 'Customer';
            if (recipientEmail) {
                await sendEmail({
                    email: recipientEmail,
                    subject: 'Order Confirmation - HandyLand',
                    message: `Thank you for your order! Your order number is ${order.orderNumber}.`
                });
            }
        } catch (emailError) {
        }

        // Send in-app notification (only for logged-in users)
        if (req.user) {
            try {
                await notify({
                    userId: req.user.id,
                    userEmail: req.user.email,
                    userName: req.user.name,
                    message: `Ihre Bestellung #${order.orderNumber} wurde erfolgreich aufgegeben! Gesamt: €${order.totalAmount.toFixed(2)}`,
                    type: 'success',
                    link: `/dashboard`,
                    category: 'orderUpdates'
                });
            } catch (notifError) { /* non-fatal */ }
        }

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
        } else {
            // Guest Order Check
            const reqEmail = req.query.email ? req.query.email.toLowerCase() : null;
            const orderEmail = order.contactEmail ? order.contactEmail.toLowerCase() : null;
            if (!req.user || req.user.role !== 'admin') {
                if (!reqEmail || reqEmail !== orderEmail) {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to view this guest order. Please provide matching email parameter.'
                    });
                }
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

        // Refund Wallet Balance
        if (order.paymentMethod === 'wallet' && order.paymentStatus === 'paid') {
            const User = require('../models/User');
            await User.findByIdAndUpdate(order.user, { $inc: { balance: order.totalAmount } });
            await Transaction.create({
                user: order.user,
                amount: order.totalAmount,
                type: 'refund',
                description: `Refund for cancelled order #${order.orderNumber}`,
                status: 'completed',
                order: order._id
            });
            order.paymentStatus = 'refunded';
            await order.save();
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
        const { status, page = 1, limit = 20, search, startDate, endDate } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {query.createdAt.$gte = new Date(startDate);}
            if (endDate) {query.createdAt.$lte = new Date(endDate);}
        }

        if (search) {
            // Need to search across orderNumber, or user's email/name.
            // Since user is a referenced field, we first need to find matching users if the search might be a user field.
            // A simple approach is to use regex on orderNumber. For populated fields, it's more complex.
            // Let's do a robust search:
            const User = require('../models/User');
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);

            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { user: { $in: userIds } }
            ];
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

                // Refund Wallet Balance
                if (order.paymentMethod === 'wallet' && order.paymentStatus === 'paid') {
                    const User = require('../models/User');
                    await User.findByIdAndUpdate(order.user, { $inc: { balance: order.totalAmount } });
                    await Transaction.create({
                        user: order.user,
                        amount: order.totalAmount,
                        type: 'refund',
                        description: `Refund for admin-cancelled order #${order.orderNumber}`,
                        status: 'completed',
                        order: order._id
                    });
                    order.paymentStatus = 'refunded';
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
                const variablesContext = {
                    customerName: order.user.name || 'Customer',
                    orderNumber: order.orderNumber,
                    status: status,
                    trackingNumber: order.trackingNumber || '',
                    adminNote: adminNote || '',
                    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
                };

                const sent = await sendTemplateEmail(order.user.email, 'order_status_update', variablesContext);

                if (!sent) {
                    await sendEmail({
                        email: order.user.email,
                        subject: `Order Update: ${order.orderNumber}`,
                        html: emailTemplates.orderStatusUpdate(order.user.name, order, status, adminNote)
                    });
                }
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        // Real-time notification via Socket.IO + persistent DB notification
        if (status && status !== oldStatus) {
            emitOrderUpdate(order.user?._id?.toString(), order);

            const statusLabels = {
                processing: 'wird bearbeitet 🔄',
                shipped: 'wurde versandt 📦',
                delivered: 'wurde geliefert ✅',
                cancelled: 'wurde storniert ❌',
                return_requested: 'Rückgabe beantragt',
                refunded: 'wurde erstattet'
            };
            const label = statusLabels[status] || status;

            // Fire-and-forget — don't await so it never blocks the response
            notify({
                userId: order.user._id.toString(),
                message: `Ihre Bestellung #${order.orderNumber} ${label}${trackingNumber ? ` · Sendungsnummer: ${trackingNumber}` : ''}`,
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

        const isRefunded = order.status === 'refunded' || order.paymentStatus === 'refunded';
        const titleLabel = isRefunded ? 'GUTSCHRIFT' : (invoiceSettings.titleLabel || 'RECHNUNG');
        const primaryColor = invoiceSettings.primaryColor || '#00bcd4';

        // HTML Template — Premium Branded Design
        const html = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleLabel} #${order.orderNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            color: #1e293b; 
            line-height: 1.5; 
            max-width: 850px; 
            margin: 0 auto; 
            padding: 40px;
            background: #fff;
        }
        
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 60px;
        }
        
        .brand-logo { 
            font-size: 28px; 
            font-weight: 800; 
            letter-spacing: -1px;
            color: #000;
        }
        .brand-logo span { color: ${primaryColor}; }
        
        .invoice-info { text-align: right; }
        .invoice-title { 
            font-size: 42px; 
            font-weight: 800; 
            color: ${isRefunded ? '#ef4444' : '#0f172a'}; 
            margin: 0;
            line-height: 1;
            letter-spacing: -2px;
        }
        
        .address-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            margin-bottom: 50px;
        }
        
        .address-box h3 { 
            font-size: 11px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            color: #64748b; 
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
        }
        
        .address-content { font-size: 14px; color: #334155; }
        .address-content strong { color: #0f172a; display: block; margin-bottom: 2px; }

        .meta-data {
            display: flex;
            gap: 30px;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            font-size: 13px;
        }
        .meta-item b { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { 
            text-align: left; 
            padding: 14px; 
            background: #0f172a; 
            color: #fff;
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        th:first-child { border-radius: 8px 0 0 0; }
        th:last-child { border-radius: 0 8px 0 0; text-align: right; }
        
        td { padding: 16px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .item-name { font-weight: 600; color: #0f172a; }
        .item-type { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; font-weight: 600; }
        
        .totals-container { 
            width: 320px; 
            margin-left: auto; 
            background: #f8fafc;
            padding: 24px;
            border-radius: 16px;
        }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #475569; }
        .total-row.grand { 
            margin-top: 16px; 
            padding-top: 16px; 
            border-top: 2px dashed #cbd5e1; 
            font-weight: 800; 
            font-size: 20px; 
            color: #0f172a; 
        }
        
        .footer { 
            margin-top: 80px; 
            padding-top: 30px; 
            border-top: 1px solid #e2e8f0; 
            font-size: 11px; 
            color: #94a3b8; 
            text-align: center;
        }
        .footer strong { color: #475569; }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-refund { background: #fee2e2; color: #991b1b; }

        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .totals-container { background: transparent; border: 1px solid #f1f5f9; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand-logo">
            ${invoiceSettings.logoUrl
                ? `<img src="${invoiceSettings.logoUrl.startsWith('http') ? invoiceSettings.logoUrl : `${req.protocol}://${req.get('host')}${invoiceSettings.logoUrl}`}" alt="Logo" style="max-height: 50px;" />`
                : `HANDY<span>LAND</span>`
            }
        </div>
        <div class="invoice-info">
            <h1 class="invoice-title">${titleLabel}</h1>
            <div style="font-weight: 600; margin-top: 5px;">#${invoiceSettings.prefix || 'HL-'}${order.orderNumber}</div>
        </div>
    </div>

    <div class="address-grid">
        <div class="address-box">
            <h3>Rechnungsempfänger</h3>
            <div class="address-content">
                <strong>${escapeHtml(order.shippingAddress.fullName)}</strong>
                ${escapeHtml(order.shippingAddress.street)}<br>
                ${escapeHtml(order.shippingAddress.zipCode)} ${escapeHtml(order.shippingAddress.city)}<br>
                ${escapeHtml(order.shippingAddress.country)}<br>
                ${order.user?.phone ? `T: ${escapeHtml(order.user.phone)}` : ''}
            </div>
        </div>
        <div class="address-box">
            <h3>Lieferadresse</h3>
            <div class="address-content">
                <strong>${escapeHtml(order.shippingAddress.fullName)}</strong>
                ${escapeHtml(order.shippingAddress.street)}<br>
                ${escapeHtml(order.shippingAddress.zipCode)} ${escapeHtml(order.shippingAddress.city)}<br>
                ${escapeHtml(order.shippingAddress.country)}
            </div>
        </div>
    </div>

    <div class="meta-data">
        <div class="meta-item"><b>Belegdatum</b>${date}</div>
        <div class="meta-item"><b>Zahlungsart</b>${escapeHtml(order.paymentMethod).toUpperCase()}</div>
        <div class="meta-item"><b>Status</b>
            <span class="badge ${isRefunded ? 'badge-refund' : 'badge-paid'}">
                ${isRefunded ? 'Rückerstattet' : 'Bezahlt'}
            </span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Artikelbeschreibung</th>
                <th style="text-align: right">Menge</th>
                <th style="text-align: right">Einzelpreis</th>
                <th style="text-align: right">Gesamt</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => `
            <tr>
                <td>
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-type">${item.productType === 'Product' ? 'Mobilgerät' : 'Zubehör'}</div>
                </td>
                <td style="text-align: right">${item.quantity}</td>
                <td style="text-align: right">${item.price.toFixed(2)}€</td>
                <td style="text-align: right; font-weight: 600;">${(item.price * item.quantity).toFixed(2)}€</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals-container">
        <div class="total-row">
            <span>Netto Zwischensumme</span>
            <span>${(order.totalAmount - order.shippingFee - order.tax + order.discountAmount).toFixed(2)}€</span>
        </div>
        <div class="total-row">
            <span>MwSt. (${taxRate}%)</span>
            <span>${order.tax.toFixed(2)}€</span>
        </div>
        <div class="total-row">
            <span>Versandkosten</span>
            <span>${order.shippingFee.toFixed(2)}€</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="total-row" style="color: #059669; font-weight: 600;">
            <span>Rabatt (${order.couponCode || 'PROMO'})</span>
            <span>-${order.discountAmount.toFixed(2)}€</span>
        </div>
        ` : ''}
        <div class="total-row grand">
            <span>${isRefunded ? 'Gutschrift' : 'Gesamtbetrag'}</span>
            <span>${order.totalAmount.toFixed(2)}€</span>
        </div>
    </div>

    <div class="footer">
        <p><strong>${escapeHtml(invoiceSettings.companyName || 'HandyLand GmbH')}</strong></p>
        <p>${escapeHtml(invoiceSettings.companyAddress || 'Tech Street 1 - 10115 Berlin')}</p>
        <div style="margin-top: 10px;">
            ${invoiceSettings.vatNumber ? `USt-IdNr.: ${escapeHtml(invoiceSettings.vatNumber)} | ` : ''}
            Steuernummer: 112/5730/2344
        </div>
        <p style="margin-top: 20px; color: #475569; font-weight: 600;">${escapeHtml(invoiceSettings.footerText || 'Vielen Dank für Ihr Vertrauen in HandyLand!')}</p>
        
        <div class="no-print" style="margin-top: 40px;">
            <button onclick="window.print()" style="background: ${primaryColor}; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;">Rechnung Drucken</button>
            <button onclick="window.close()" style="background: #f1f5f9; color: #475569; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-left: 10px;">Schließen</button>
        </div>
    </div>
</body>
</html>`;

        res.set('Content-Type', 'text/html; charset=utf-8');
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
        const { status, adminComments } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
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
                const refundVars = {
                    customerName: refundUser.name || 'Customer',
                    orderNumber: refundRequest.order.orderNumber || refundRequest.order._id,
                    status: status === 'approved' ? 'genehmigt ✅' : 'abgelehnt ❌',
                    adminComments: adminComments ? `<strong>Hinweis vom Team:</strong> ${adminComments}` : ''
                };

                const sent = await sendTemplateEmail(refundUser.email, 'refund_status_update', refundVars);

                if (!sent) {
                    // Fallback: use hardcoded template
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
                message: `Zahlung für Bestellung #${order.orderNumber} bestätigt. Ihre Bestellung wird jetzt bearbeitet!`,
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
                message: `Ihre Bestellung #${order.orderNumber} wurde geliefert! Viel Freude mit Ihrem Kauf 🎉`,
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

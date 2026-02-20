const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const RefundRequest = require('../models/RefundRequest'); // Added
const Coupon = require('../models/Coupon');
const Accessory = require('../models/Accessory');
const { createNotification } = require('../controllers/notificationController');
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
const { emitOrderUpdate, emitNewOrder } = require('../utils/socket');

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

        if (!coupon.isValid()) {
            return res.status(400).json({ success: false, message: 'Coupon expired or limit reached' });
        }

        if (cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum order amount is ${coupon.minOrderAmount}€` });
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (cartTotal * coupon.amount) / 100;
        } else {
            discount = coupon.amount;
        }

        // Cap discount at total amount
        if (discount > cartTotal) discount = cartTotal;

        res.json({
            success: true,
            discount,
            totalAfterDiscount: cartTotal - discount,
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
        const { items, shippingAddress, paymentMethod, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        // Calculate total amount
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            let product;
            if (item.productType === 'Product') {
                product = await Product.findById(item.product);
            } else if (item.productType === 'Accessory') {
                product = await Accessory.findById(item.product);
            }

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`
                });
            }

            // Check Stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                product: product._id,
                productType: item.productType,
                name: product.name || product.title,
                quantity: item.quantity,
                price: product.price,
                image: product.image || product.images?.[0]
            });
        }

        // Calculate Tax and Shipping
        const taxRate = 0.19; // 19% Tax
        const shippingFee = totalAmount > 100 ? 0 : 5.99; // Free shipping over 100
        const taxAmount = totalAmount * taxRate;

        const finalAmount = totalAmount + shippingFee; // Tax is usually included in price in EU, but if not: + taxAmount

        // Create order
        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            totalAmount: finalAmount,
            tax: taxAmount,
            shippingFee,
            shippingAddress,
            paymentMethod,
            notes
        });

        // Update Stock
        for (const item of orderItems) {
            if (item.productType === 'Product') {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
            } else if (item.productType === 'Accessory') {
                await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
            }
        }

        // Send order confirmation email
        try {
            await sendEmail({
                email: req.user.email,
                subject: 'Order Confirmation - HandyLand',
                html: emailTemplates.orderConfirmation(req.user.name, order)
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the order if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
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
        if (status) query.status = status;

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

        // Make sure user is order owner or admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
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

        // Make sure user is order owner
        if (order.user.toString() !== req.user.id) {
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

        order.status = 'cancelled';
        await order.save();

        // Rollback Stock
        for (const item of order.items) {
            if (item.productType === 'Product') {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            } else if (item.productType === 'Accessory') {
                await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            }
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
        const { status, trackingNumber, note } = req.body;

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

            // Rollback stock if order is cancelled by admin
            if (status === 'cancelled' && oldStatus !== 'cancelled') {
                for (const item of order.items) {
                    if (item.productType === 'Product') {
                        const Product = require('../models/Product');
                        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
                    } else if (item.productType === 'Accessory') {
                        const Accessory = require('../models/Accessory');
                        await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
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
                    html: emailTemplates.orderStatusUpdate(order.user.name, order, status)
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        // Real-time notification via Socket.IO
        if (status && status !== oldStatus) {
            emitOrderUpdate(order.user?._id?.toString(), order);
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
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

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
                    .totals-row.grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
                    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <div class="logo">Handy<span>Land</span></div>
                    <div class="invoice-details">
                        <div class="invoice-title">Invoice</div>
                        <div>Date: ${date}</div>
                        <div>Invoice #: ${order.orderNumber}</div>
                    </div>
                </div>

                <div class="bill-to">
                    <div class="bill-to-section">
                        <h3>Bill To:</h3>
                        <div>${order.shippingAddress.fullName}</div>
                        <div>${order.shippingAddress.street}</div>
                        <div>${order.shippingAddress.zipCode} ${order.shippingAddress.city}</div>
                        <div>${order.shippingAddress.country}</div>
                        <div>${order.shippingAddress.phone}</div>
                    </div>
                    <div class="bill-to-section">
                        <h3>Ship To:</h3>
                        <div>${order.shippingAddress.fullName}</div>
                        <div>${order.shippingAddress.street}</div>
                        <div>${order.shippingAddress.zipCode} ${order.shippingAddress.city}</div>
                        <div>${order.shippingAddress.country}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Qty</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                        <tr>
                            <td>
                                <div><strong>${item.name}</strong></div>
                                <div style="font-size: 12px; color: #777;">${item.productType}</div>
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
                        <span>Subtotal:</span>
                        <span>${(order.totalAmount - order.shippingFee - order.tax + order.discountAmount).toFixed(2)}€</span>
                    </div>
                    <div class="totals-row">
                        <span>VAT (19%):</span>
                        <span>${order.tax.toFixed(2)}€</span>
                    </div>
                    <div class="totals-row">
                        <span>Shipping:</span>
                        <span>${order.shippingFee.toFixed(2)}€</span>
                    </div>
                    ${order.discountAmount > 0 ? `
                    <div class="totals-row" style="color: green;">
                        <span>Discount (${order.couponCode || 'Promo'}):</span>
                        <span>-${order.discountAmount.toFixed(2)}€</span>
                    </div>
                    ` : ''}
                    <div class="totals-row grand-total">
                        <span>Total:</span>
                        <span>${order.totalAmount.toFixed(2)}€</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>HandyLand GmbH - Tech Street 123 - 10115 Berlin - Germany</p>
                    <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #333; color: #fff; border: none; cursor: pointer; border-radius: 5px;">Print Invoice</button>
                    <button class="no-print" onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ccc; color: #333; border: none; cursor: pointer; border-radius: 5px; margin-left: 10px;">Close</button>
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
exports.getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const processingOrders = await Order.countDocuments({ status: 'processing' });
        const shippedOrders = await Order.countDocuments({ status: 'shipped' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue: totalRevenue[0]?.total || 0
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

// @desc    Generate Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.generateInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Generate HTML Invoice
        const html = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .header h1 { color: #333; }
                    .details { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; text-align: right; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>INVOICE</h1>
                    <div>
                        <p><strong>Order ID:</strong> ${order._id}</p>
                        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="details">
                    <p><strong>Billed To:</strong> ${order.user.name} (${order.user.email})</p>
                    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>€${item.price.toFixed(2)}</td>
                                <td>€${(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    <p>Total Amount: €${order.totalAmount.toFixed(2)}</p>
                </div>
            </body>
            </html>
        `;

        res.set('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error("Generate Invoice Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Process refund (Admin)
// @route   PUT /api/orders/refund/:id
// @access  Private/Admin
exports.processRefund = async (req, res) => {
    try {
        const { status, adminComments } = req.body; // status: 'approved', 'rejected'
        const refundRequest = await RefundRequest.findById(req.params.id).populate('order');

        if (!refundRequest) return res.status(404).json({ message: 'Refund request not found' });

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

        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.status = 'processing';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.status = 'delivered';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

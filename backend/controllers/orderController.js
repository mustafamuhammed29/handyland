/**
 * backend/controllers/orderController.js
 * Order management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const crypto = require('crypto');

const generateOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HL-${y}${m}${d}-${suffix}`;
};

// ── @route GET /api/orders ────────────────────────────────────
exports.getOrders = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('orders')
            .select('*, order_items(*)', { count: 'exact' });

        if (!isAdmin) query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);
        if (paymentStatus) query = query.eq('payment_status', paymentStatus);
        if (search) query = query.or(`order_number.ilike.%${search}%,shipping_email.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const ordersWithId = (data || []).map(o => ({ ...o, _id: o.id, items: o.order_items || [] }));

        return res.status(200).json({
            success: true,
            count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            orders: ordersWithId,
            data: ordersWithId
        });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/orders/:id ────────────────────────────────
exports.getOrder = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*), order_status_history(*)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Order not found' });

        // Users can only view own orders
        if (req.user.role !== 'admin' && data.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const mappedData = { ...data, _id: data.id, items: data.order_items || [] };

        return res.status(200).json({ success: true, data: mappedData });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/orders ───────────────────────────────────
exports.createOrder = async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod, couponCode, appliedPoints, shippingMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must have at least one item' });
        }

        // Validate stock and build order items
        let itemsTotal = 0;
        const orderItems = [];

        for (const item of items) {
            const table = item.productType === 'Product' ? 'products' : 'accessories';
            const { data: product, error } = await supabaseAdmin
                .from(table)
                .select('id, name, price, stock, image')
                .eq('id', item.productId)
                .single();

            if (error || !product) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
            if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

            itemsTotal += product.price * item.quantity;
            orderItems.push({
                product_id: item.productType === 'Product' ? item.productId : null,
                accessory_id: item.productType === 'Accessory' ? item.productId : null,
                product_type: item.productType,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                image: product.image || null
            });
        }

        // Apply coupon if provided
        let discountAmount = 0;
        if (couponCode) {
            const { data: coupon } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('is_active', true)
                .single();

            if (coupon && new Date(coupon.valid_until) > new Date() && itemsTotal >= coupon.min_order_value) {
                if (coupon.discount_type === 'percentage') {
                    discountAmount = (itemsTotal * coupon.discount_value) / 100;
                    if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount);
                } else {
                    discountAmount = coupon.discount_value;
                }
                discountAmount = Math.min(discountAmount, itemsTotal);
            }
        }

        // Loyalty points discount
        let pointsDiscount = 0;
        if (appliedPoints && appliedPoints > 0 && req.user.loyaltyPoints >= appliedPoints) {
            pointsDiscount = appliedPoints * 0.01; // 1 point = €0.01
        }

        // Get shipping fee
        let shippingFee = 4.99;
        if (shippingMethod) {
            const { data: shipping } = await supabaseAdmin
                .from('shipping_methods')
                .select('price')
                .eq('name', shippingMethod)
                .single();
            if (shipping) shippingFee = shipping.price;
        }

        const totalAmount = Math.max(0, itemsTotal + shippingFee - discountAmount - pointsDiscount);
        const pointsEarned = Math.floor(totalAmount);

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: generateOrderNumber(),
                user_id: req.user?.id || null,
                total_amount: Number(totalAmount.toFixed(2)),
                shipping_fee: shippingFee,
                shipping_method: shippingMethod || 'Standard',
                discount_amount: Number(discountAmount.toFixed(2)),
                coupon_code: couponCode || null,
                applied_points: appliedPoints || 0,
                points_earned: pointsEarned,
                payment_method: paymentMethod || 'card',
                shipping_full_name: shippingAddress.fullName,
                shipping_email: shippingAddress.email,
                shipping_phone: shippingAddress.phone,
                shipping_street: shippingAddress.street,
                shipping_city: shippingAddress.city,
                shipping_zip: shippingAddress.zipCode,
                shipping_country: shippingAddress.country || 'Germany',
                notes: req.body.notes || null
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Insert order items
        const itemsWithOrderId = orderItems.map(i => ({ ...i, order_id: order.id }));
        await supabaseAdmin.from('order_items').insert(itemsWithOrderId);

        // Initial status history
        await supabaseAdmin.from('order_status_history').insert({
            order_id: order.id,
            status: 'pending',
            note: 'Order created'
        });

        // Decrement stock
        for (const item of items) {
            const table = item.productType === 'Product' ? 'products' : 'accessories';
            await supabaseAdmin.rpc('decrement_stock', { table_name: table, item_id: item.productId, qty: item.quantity });
        }

        // Update coupon usage
        if (couponCode && discountAmount > 0) {
            await supabaseAdmin.rpc('increment_coupon_usage', { coupon_code: couponCode });
        }

        // Award loyalty points
        if (req.user?.id && pointsEarned > 0) {
            await supabaseAdmin.from('users').update({
                loyalty_points: supabaseAdmin.rpc('increment', { x: pointsEarned })
            }).eq('id', req.user.id);
        }

        // Clear cart
        if (req.user?.id) {
            const { data: cart } = await supabaseAdmin.from('carts').select('id').eq('user_id', req.user.id).single();
            if (cart) await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
        }

        const orderWithId = { ...order, _id: order.id };
        return res.status(201).json({ success: true, order: orderWithId, data: orderWithId });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/orders/:id/status (Admin) ─────────────────
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, note, trackingNumber } = req.body;

        const updateData = { status };
        if (trackingNumber) updateData.tracking_number = trackingNumber;

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: 'Order not found' });

        // Add to status history
        await supabaseAdmin.from('order_status_history').insert({
            order_id: req.params.id,
            status,
            note: note || null
        });

        // Create notification for user
        if (data.user_id) {
            await supabaseAdmin.from('notifications').insert({
                user_id: data.user_id,
                message: `Ihr Auftrag #${data.order_number} wurde aktualisiert: ${status}`,
                type: 'info',
                link: `/dashboard/orders/${data.id}`
            });
        }

        const orderWithId = { ...data, _id: data.id };
        return res.status(200).json({ success: true, order: orderWithId, data: orderWithId });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/orders/:id/cancel ────────────────────────
exports.cancelOrder = async (req, res, next) => {
    try {
        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single();

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
        if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
        }

        await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
        await supabaseAdmin.from('order_status_history').insert({ order_id: order.id, status: 'cancelled', note: req.body.reason || 'Cancelled by user' });

        // Restore stock
        const { data: items } = await supabaseAdmin.from('order_items').select('*').eq('order_id', order.id);
        for (const item of items || []) {
            const table = item.product_type === 'Product' ? 'products' : 'accessories';
            const id = item.product_type === 'Product' ? item.product_id : item.accessory_id;
            if (id) {
                const { data: p } = await supabaseAdmin.from(table).select('stock').eq('id', id).single();
                if (p) await supabaseAdmin.from(table).update({ stock: p.stock + item.quantity }).eq('id', id);
            }
        }

        return res.status(200).json({ success: true, message: 'Order cancelled' });
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/orders/admin/:id (Admin) ───────────────
exports.deleteOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // Check if order exists
        const { data: order, error: findError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .single();

        if (findError || !order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Delete related items manually in case there is no cascade
        await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
        await supabaseAdmin.from('order_status_history').delete().eq('order_id', orderId);

        // Delete the order itself
        const { error: deleteError } = await supabaseAdmin.from('orders').delete().eq('id', orderId);

        if (deleteError) throw deleteError;

        return res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/orders/stats (Admin) ─────────────────────
exports.getOrderStats = async (req, res, next) => {
    try {
        const { count: total } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
        const { count: pending } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: processing } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing');
        const { count: delivered } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered');

        const { data: revenue } = await supabaseAdmin.from('orders').select('total_amount').eq('payment_status', 'paid');
        const totalRevenue = (revenue || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

        return res.status(200).json({
            success: true,
            data: { total, pending, processing, delivered, totalRevenue: Number(totalRevenue.toFixed(2)) }
        });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/orders/admin/timeline (Admin) ─────────────
exports.getOrderTimeline = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('created_at, total_amount')
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) throw error;

        // Group by date for the chart
        const timeline = (data || []).reduce((acc, order) => {
            const date = new Date(order.created_at).toLocaleDateString();
            const existing = acc.find(item => item.date === date);
            if (existing) {
                existing.sales += Number(order.total_amount);
                existing.orders += 1;
            } else {
                acc.push({ date, sales: Number(order.total_amount), orders: 1 });
            }
            return acc;
        }, []);

        return res.status(200).json({ success: true, timeline, data: { timeline } });
    } catch (error) {
        next(error);
    }
};

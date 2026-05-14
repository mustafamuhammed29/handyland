/**
 * backend/controllers/cartController.js
 * Cart management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

const getCart = async (userId) => {
    // Get or create cart
    let { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!cart) {
        const { data: newCart, error } = await supabaseAdmin
            .from('carts')
            .insert({ user_id: userId })
            .select('id')
            .single();
        if (error) throw error;
        cart = newCart;
    }

    return cart;
};

const getCartWithItems = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('carts')
        .select(`
            id, updated_at,
            cart_items (
                id, product_id, accessory_id, product_type, quantity, added_at
            )
        `)
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

// ── @route GET /api/cart ──────────────────────────────────────
exports.getCart = async (req, res, next) => {
    try {
        const cartData = await getCartWithItems(req.user.id);

        if (!cartData || !cartData.cart_items?.length) {
            return res.status(200).json({ success: true, data: { items: [], totalItems: 0, totalAmount: 0 } });
        }

        // Fetch product/accessory details for each item
        const enrichedItems = await Promise.all(
            cartData.cart_items.map(async (item) => {
                const table = item.product_type === 'Product' ? 'products' : 'accessories';
                const id = item.product_type === 'Product' ? item.product_id : item.accessory_id;

                const { data: product } = await supabaseAdmin
                    .from(table)
                    .select('id, name, price, image, stock, is_active')
                    .eq('id', id)
                    .single();

                return { ...item, product };
            })
        );

        const totalAmount = enrichedItems.reduce((sum, item) => {
            return sum + ((item.product?.price || 0) * item.quantity);
        }, 0);

        return res.status(200).json({
            success: true,
            data: {
                id: cartData.id,
                items: enrichedItems,
                totalItems: enrichedItems.length,
                totalAmount: Number(totalAmount.toFixed(2))
            }
        });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/cart ─────────────────────────────────────
exports.addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1, productType = 'Product' } = req.body;

        if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

        // Verify product exists and has stock
        const table = productType === 'Product' ? 'products' : 'accessories';
        const { data: product, error: productError } = await supabaseAdmin
            .from(table)
            .select('id, stock, is_active, name')
            .eq('id', productId)
            .single();

        if (productError || !product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (!product.is_active) return res.status(400).json({ success: false, message: 'Product is not available' });
        if (product.stock < quantity) return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });

        const cart = await getCart(req.user.id);

        // Check if item already in cart
        const idField = productType === 'Product' ? 'product_id' : 'accessory_id';
        const { data: existing } = await supabaseAdmin
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cart.id)
            .eq(idField, productId)
            .single();

        if (existing) {
            // Update quantity
            const newQty = existing.quantity + Number(quantity);
            if (newQty > product.stock) return res.status(400).json({ success: false, message: 'Not enough stock' });

            await supabaseAdmin.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
        } else {
            // Insert new item
            await supabaseAdmin.from('cart_items').insert({
                cart_id: cart.id,
                [idField]: productId,
                product_type: productType,
                quantity: Number(quantity)
            });
        }

        // Update cart timestamp
        await supabaseAdmin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

        return exports.getCart(req, res, next);
    } catch (error) {
        next(error);
    }
};

exports.updateCartItem = async (req, res, next) => {
    try {
        const { id, quantity, productType = 'Product' } = req.body;
        
        if (!id) return res.status(400).json({ success: false, message: 'Product ID is required' });

        const cart = await getCart(req.user.id);
        const idField = (productType === 'Product' || productType === 'device') ? 'product_id' : 'accessory_id';

        if (!quantity || quantity < 1) {
            await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id).eq(idField, id);
            await supabaseAdmin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);
            return exports.getCart(req, res, next);
        }

        const { error } = await supabaseAdmin
            .from('cart_items')
            .update({ quantity: Number(quantity) })
            .eq('cart_id', cart.id)
            .eq(idField, id);

        if (error) throw error;
        
        await supabaseAdmin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

        return exports.getCart(req, res, next);
    } catch (error) {
        next(error);
    }
};

exports.syncCart = async (req, res, next) => {
    try {
        const { localItems = [] } = req.body;
        const cart = await getCart(req.user.id);

        if (localItems.length > 0) {
            await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
            
            const insertData = localItems.map(item => {
                const isAccessory = item.category === 'Accessory' || item.category === 'accessory';
                const d = {
                    cart_id: cart.id,
                    product_type: isAccessory ? 'Accessory' : 'Product',
                    quantity: item.quantity
                };
                if (isAccessory) d.accessory_id = item.id;
                else d.product_id = item.id;
                return d;
            });

            await supabaseAdmin.from('cart_items').insert(insertData);
            await supabaseAdmin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);
        }

        return exports.getCart(req, res, next);
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/cart/:itemId ───────────────────────────
exports.removeFromCart = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('id', req.params.itemId);

        if (error) throw error;
        return exports.getCart(req, res, next);
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/cart ───────────────────────────────────
exports.clearCart = async (req, res, next) => {
    try {
        const cart = await getCart(req.user.id);
        await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
        return res.status(200).json({ success: true, data: { items: [], totalItems: 0, totalAmount: 0 } });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/cart/all (Admin) ─────────────────────────
exports.getAllCarts = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('carts')
            .select(`
                id, updated_at, user_id,
                users (name, email),
                cart_items (
                    id, product_id, accessory_id, product_type, quantity
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Fetch product/accessory details for ALL carts
        const enrichedCarts = await Promise.all(
            (data || []).filter(c => c.cart_items?.length > 0).map(async (c) => {
                
                const enrichedItems = await Promise.all(
                    c.cart_items.map(async (item) => {
                        const table = item.product_type === 'Product' ? 'products' : 'accessories';
                        const id = item.product_type === 'Product' ? item.product_id : item.accessory_id;
        
                        if (!id) return item;

                        const { data: product } = await supabaseAdmin
                            .from(table)
                            .select('id, name, price, image, stock, is_active')
                            .eq('id', id)
                            .single();
        
                        return { ...item, product };
                    })
                );

                return {
                    ...c,
                    _id: c.id,
                    user: c.users,
                    items: enrichedItems
                };
            })
        );

        return res.status(200).json({ success: true, carts: enrichedCarts, data: enrichedCarts });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/cart/admin/:cartId/remind ──────────────
exports.sendCartReminder = async (req, res, next) => {
    try {
        const { cartId } = req.params;

        // Get cart to find user_id
        const { data: cart, error: cartError } = await supabaseAdmin
            .from('carts')
            .select('id, user_id')
            .eq('id', cartId)
            .single();

        if (cartError || !cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Get user info
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('email, name')
            .eq('id', cart.user_id)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get cart items
        const cartData = await getCartWithItems(cart.user_id);
        if (!cartData || !cartData.cart_items?.length) {
            return res.status(400).json({ success: false, message: 'User cart is empty' });
        }

        // Send reminder email
        try {
            const { sendTemplateEmail, sendEmail } = require('../utils/emailService');
            const sent = await sendTemplateEmail(user.email, 'cart_reminder', {
                userName: user.name || user.email.split('@')[0],
                itemCount: cartData.cart_items.length,
                cartUrl: `${process.env.FRONTEND_URL}/cart`
            });

            if (!sent) {
                await sendEmail({
                    email: user.email,
                    subject: 'HandyLand - Items in your cart are waiting!',
                    html: `<h2>Hi ${user.name || 'there'}!</h2><p>You have ${cartData.cart_items.length} item(s) waiting in your cart.</p><p><a href="${process.env.FRONTEND_URL}/cart">Complete your purchase</a></p>`,
                    message: `You have items in your cart at HandyLand.`
                });
            }
        } catch (emailErr) {
            console.warn('Cart reminder email failed:', emailErr.message);
        }

        return res.status(200).json({ success: true, message: 'Reminder sent successfully' });
    } catch (error) {
        next(error);
    }
};


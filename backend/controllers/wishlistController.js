/**
 * backend/controllers/wishlistController.js
 * Wishlist management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/wishlist
exports.getWishlist = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select(`
                id, product_type,
                products (id, name, price, image, stock, is_active),
                accessories (id, name, price, image, stock, is_active)
            `)
            .eq('user_id', req.user.id)
            .order('added_at', { ascending: false });

        if (error) throw error;

        // Clean up data formatting and filter out items where the linked product/accessory doesn't exist
        const formattedData = data
            .filter(item => item.product_type === 'Product' ? item.products !== null : item.accessories !== null)
            .map(item => ({
                id: item.id,
                productType: item.product_type,
                item: item.product_type === 'Product' ? item.products : item.accessories
            }));

        return res.status(200).json({ success: true, data: formattedData });
    } catch (error) { next(error); }
};

// @route POST /api/wishlist
exports.addToWishlist = async (req, res, next) => {
    try {
        const { itemId, productId, productType = 'Product' } = req.body;
        const actualItemId = itemId || productId;
        
        if (!actualItemId) return res.status(400).json({ success: false, message: 'Item ID is required' });

        const idField = productType === 'Product' ? 'product_id' : 'accessory_id';

        // Check if exists
        const { data: existing } = await supabaseAdmin
            .from('wishlists')
            .select('id')
            .eq('user_id', req.user.id)
            .eq(idField, actualItemId)
            .single();

        if (existing) return res.status(200).json({ success: true, message: 'Item already in wishlist' });

        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .insert({ user_id: req.user.id, product_type: productType, [idField]: actualItemId })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, message: 'Added to wishlist', data });
    } catch (error) { next(error); }
};

// @route DELETE /api/wishlist/:id
exports.removeFromWishlist = async (req, res, next) => {
    try {
        const itemId = req.params.itemId || req.params.id; // Support both just in case
        
        // Can be wishlist ID, or Product/Accessory ID
        let query = supabaseAdmin.from('wishlists').delete().eq('user_id', req.user.id);
        
        // Check if UUID
        if (itemId && itemId.length === 36) {
             query = query.or(`id.eq.${itemId},product_id.eq.${itemId},accessory_id.eq.${itemId}`);
        } else {
             return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }

        const { error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Removed from wishlist' });
    } catch (error) { next(error); }
};

// @route DELETE /api/wishlist
exports.clearWishlist = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('wishlists').delete().eq('user_id', req.user.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Wishlist cleared' });
    } catch (error) { next(error); }
};

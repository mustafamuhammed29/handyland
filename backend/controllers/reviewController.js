/**
 * backend/controllers/reviewController.js
 * Review management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/reviews/:itemId
exports.getItemReviews = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { page = 1, limit = 10, type = 'Product' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const idField = type === 'Product' ? 'product_id' : 'accessory_id';

        const { data, error, count } = await supabaseAdmin
            .from('reviews')
            .select('*, users(name, avatar)', { count: 'exact' })
            .eq(idField, itemId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);

        if (error) throw error;

        // Calc average
        const { data: allApproved } = await supabaseAdmin.from('reviews').select('rating').eq(idField, itemId).eq('is_approved', true);
        const avgRating = allApproved?.length ? allApproved.reduce((sum, r) => sum + r.rating, 0) / allApproved.length : 0;

        return res.status(200).json({
            success: true, count, avgRating: Number(avgRating.toFixed(1)),
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
    } catch (error) { next(error); }
};

// @route POST /api/reviews
exports.addReview = async (req, res, next) => {
    try {
        const { itemId, type = 'Product', rating, comment } = req.body;
        if (!itemId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Invalid rating or item ID' });
        }

        const idField = type === 'Product' ? 'product_id' : 'accessory_id';

        // Check if user already reviewed
        const { data: existing } = await supabaseAdmin.from('reviews').select('id').eq('user_id', req.user.id).eq(idField, itemId).single();
        if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this item' });

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({ user_id: req.user.id, [idField]: itemId, rating, comment: comment || '', is_approved: false })
            .select().single();

        if (error) throw error;

        // Notify admins
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins) {
            await supabaseAdmin.from('notifications').insert(
                admins.map(admin => ({ user_id: admin.id, message: 'Neue Bewertung zur Genehmigung', link: '/admin/reviews' }))
            );
        }

        return res.status(201).json({ success: true, message: 'Review submitted and pending approval', data });
    } catch (error) { next(error); }
};

// @route GET /api/reviews (Admin)
exports.getAllReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isApproved } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('reviews').select('*, users(name), products(name), accessories(name)', { count: 'exact' });
        if (isApproved !== undefined) query = query.eq('is_approved', isApproved === 'true');

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

// @route PUT /api/reviews/:id/approve (Admin)
exports.approveReview = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('reviews').update({ is_approved: req.body.isApproved !== false }).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Review not found' });

        // Update product/accessory average rating
        const idField = data.product_id ? 'product_id' : 'accessory_id';
        const itemId = data.product_id || data.accessory_id;
        const table = data.product_id ? 'products' : 'accessories';

        const { data: allApproved } = await supabaseAdmin.from('reviews').select('rating').eq(idField, itemId).eq('is_approved', true);
        const avg = allApproved?.length ? allApproved.reduce((sum, r) => sum + r.rating, 0) / allApproved.length : 0;

        await supabaseAdmin.from(table).update({ rating: Number(avg.toFixed(2)), num_reviews: allApproved.length }).eq('id', itemId);

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
    try {
        let query = supabaseAdmin.from('reviews').delete().eq('id', req.params.id);
        if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
        
        const { error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (error) { next(error); }
};

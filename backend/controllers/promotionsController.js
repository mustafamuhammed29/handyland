/**
 * backend/controllers/promotionsController.js
 * Promotions management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/promotions
exports.getPromotions = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { isActive } = req.query;

        let query = supabaseAdmin.from('promotions').select('*').order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('is_active', true)
                         .lte('starts_at', new Date().toISOString())
                         .gte('ends_at', new Date().toISOString());
        } else if (isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) { next(error); }
};

// @route POST /api/promotions (Admin)
exports.createPromotion = async (req, res, next) => {
    try {
        const { title, description, link, startsAt, endsAt, isActive } = req.body;
        
        const insertData = { title, description, link, starts_at: startsAt, ends_at: endsAt, is_active: isActive !== false };
        if (req.fileUrl) insertData.image = req.fileUrl;

        const { data, error } = await supabaseAdmin.from('promotions').insert(insertData).select().single();
        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/promotions/:id (Admin)
exports.updatePromotion = async (req, res, next) => {
    try {
        const { title, description, link, startsAt, endsAt, isActive } = req.body;
        const updateData = {};
        
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (link) updateData.link = link;
        if (startsAt) updateData.starts_at = startsAt;
        if (endsAt) updateData.ends_at = endsAt;
        if (isActive !== undefined) updateData.is_active = isActive;
        if (req.fileUrl) updateData.image = req.fileUrl;

        const { data, error } = await supabaseAdmin.from('promotions').update(updateData).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Promotion not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/promotions/:id (Admin)
exports.deletePromotion = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('promotions').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Promotion deleted' });
    } catch (error) { next(error); }
};

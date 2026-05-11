/**
 * backend/controllers/accessoriesController.js
 * Accessories management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/accessories
exports.getAccessories = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category, brand, search, sort = 'created_at', order = 'desc', isActive } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('accessories').select('*', { count: 'exact' });

        if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
        else query = query.eq('is_active', true);

        if (category && category !== 'All') query = query.ilike('category', category);
        if (brand && brand !== 'All') query = query.ilike('brand', brand);
        if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);

        query = query.order(sort, { ascending: order === 'asc' }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const accessoriesWithId = (data || []).map(a => ({ ...a, _id: a.id }));
        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            accessories: accessoriesWithId,
            data: accessoriesWithId
        });
    } catch (error) { next(error); }
};

// @route GET /api/accessories/:id
exports.getAccessory = async (req, res, next) => {
    try {
        const { id } = req.params;
        let query = supabaseAdmin.from('accessories').select('*');
        if (id.includes('-') && id.length === 36) query = query.eq('id', id);
        else query = query.eq('legacy_id', id);

        const { data, error } = await query.single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Accessory not found' });
        const accessoryWithId = { ...data, _id: data.id };
        return res.status(200).json({ success: true, accessory: accessoryWithId, data: accessoryWithId });
    } catch (error) { next(error); }
};

// @route POST /api/accessories
exports.createAccessory = async (req, res, next) => {
    try {
        const insertData = { ...req.body };
        if (req.fileUrl) insertData.image = req.fileUrl;
        
        // Supabase will automatically map the fields if names match exactly or close enough
        // Ideally we map them to snake_case
        const snakeCaseData = {};
        for (const [key, value] of Object.entries(insertData)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseData[snakeKey] = value;
        }

        const { data, error } = await supabaseAdmin.from('accessories').insert(snakeCaseData).select().single();
        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/accessories/:id
exports.updateAccessory = async (req, res, next) => {
    try {
        const updateData = {};
        for (const [key, value] of Object.entries(req.body)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateData[snakeKey] = value;
        }
        if (req.fileUrl) updateData.image = req.fileUrl;

        const { data, error } = await supabaseAdmin.from('accessories').update(updateData).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Accessory not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/accessories/:id
exports.deleteAccessory = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('accessories').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Accessory deleted' });
    } catch (error) { next(error); }
};

// @route GET /api/accessories/categories
exports.getCategories = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('accessories').select('category').eq('is_active', true);
        if (error) throw error;
        const categories = [...new Set(data.map(a => a.category).filter(Boolean))];
        return res.status(200).json({ success: true, categories, data: categories });
    } catch (error) { next(error); }
};

// @route GET /api/accessories/admin/stats
exports.getAccessoryStats = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('accessories')
            .select('stock, price, is_active');

        if (error) throw error;

        const active = (data || []).filter(a => a.is_active !== false);
        const stats = {
            totalAccessories: active.length,
            totalInventoryValue: active.reduce((sum, a) => sum + ((a.stock || 0) * (a.price || 0)), 0),
            lowStock: active.filter(a => (a.stock || 0) > 0 && (a.stock || 0) <= 5).length,
            outOfStock: active.filter(a => (a.stock || 0) === 0).length
        };

        return res.status(200).json({ success: true, data: stats });
    } catch (error) { next(error); }
};

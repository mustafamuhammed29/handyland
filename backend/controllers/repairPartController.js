/**
 * backend/controllers/repairPartController.js
 * Repair parts inventory management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/repair-parts
exports.getParts = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, search, category, lowStock } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('repair_parts').select('*, suppliers(name)', { count: 'exact' });

        if (category) query = query.eq('category', category);
        if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);

        query = query.order('name', { ascending: true }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        let finalData = data;
        let finalCount = count;

        if (lowStock === 'true') {
            finalData = data.filter(p => p.stock <= p.min_stock);
            finalCount = finalData.length;
        }

        return res.status(200).json({
            success: true, count: finalCount,
            pagination: { page: Number(page), limit: Number(limit), total: finalCount, pages: Math.ceil(finalCount / Number(limit)) },
            data: finalData
        });
    } catch (error) { next(error); }
};

// @route POST /api/repair-parts
exports.createPart = async (req, res, next) => {
    return res.status(409).json({
        success: false,
        error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
        message: 'Repair parts must be managed through the warehouse module.'
    });
};

// @route PUT /api/repair-parts/:id
exports.updatePart = async (req, res, next) => {
    return res.status(409).json({
        success: false,
        error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
        message: 'Repair parts must be managed through the warehouse module.'
    });
};

// @route DELETE /api/repair-parts/:id
exports.deletePart = async (req, res, next) => {
    return res.status(409).json({
        success: false,
        error: 'LEGACY_REPAIR_PARTS_MUTATION_DISABLED',
        message: 'Repair parts must be managed through the warehouse module.'
    });
};

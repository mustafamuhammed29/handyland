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
    try {
        const { name, sku, category, compatibleDevices, stock, minStock, costPrice, sellPrice, supplierId } = req.body;
        if (!name || !sku) return res.status(400).json({ success: false, message: 'Name and SKU are required' });

        const { data, error } = await supabaseAdmin
            .from('repair_parts')
            .insert({
                name, sku, category,
                compatible_devices: compatibleDevices || [],
                stock: stock || 0,
                min_stock: minStock || 2,
                cost_price: costPrice || 0,
                sell_price: sellPrice || 0,
                supplier_id: supplierId || null
            })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/repair-parts/:id
exports.updatePart = async (req, res, next) => {
    try {
        const { name, sku, category, compatibleDevices, stock, minStock, costPrice, sellPrice, supplierId, isActive } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (sku) updateData.sku = sku;
        if (category) updateData.category = category;
        if (compatibleDevices) updateData.compatible_devices = compatibleDevices;
        if (stock !== undefined) updateData.stock = stock;
        if (minStock !== undefined) updateData.min_stock = minStock;
        if (costPrice !== undefined) updateData.cost_price = costPrice;
        if (sellPrice !== undefined) updateData.sell_price = sellPrice;
        if (supplierId !== undefined) updateData.supplier_id = supplierId;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data, error } = await supabaseAdmin.from('repair_parts').update(updateData).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Part not found' });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/repair-parts/:id
exports.deletePart = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('repair_parts').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Part deleted' });
    } catch (error) { next(error); }
};

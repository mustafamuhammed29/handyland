/**
 * backend/controllers/shippingController.js
 * Shipping methods management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/shipping
exports.getShippingMethods = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { isActive } = req.query;

        let query = supabaseAdmin.from('shipping_methods').select('*').order('price', { ascending: true });

        if (!isAdmin) {
            query = query.eq('is_active', true);
        } else if (isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, error } = await query;
        if (error) throw error;
        
        const mapped = (data || []).map(m => ({
            _id: m.id,
            name: m.name,
            description: m.description,
            price: m.price,
            duration: m.estimated_days ? `${m.estimated_days} Days` : 'N/A',
            isExpress: false, // Default if column missing
            isActive: m.is_active
        }));

        return res.status(200).json({ success: true, count: mapped.length, data: mapped });
    } catch (error) { next(error); }
};

// @route GET /api/shipping/:id
exports.getShippingMethod = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('shipping_methods').select('*').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Shipping method not found' });
        const mapped = {
            _id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            duration: data.estimated_days ? `${data.estimated_days} Days` : 'N/A',
            isExpress: false,
            isActive: data.is_active
        };
        return res.status(200).json({ success: true, data: mapped });
    } catch (error) { next(error); }
};

// @route POST /api/shipping (Admin)
exports.createShippingMethod = async (req, res, next) => {
    try {
        const { name, description, price, duration, isActive } = req.body;
        if (!name || price === undefined) return res.status(400).json({ success: false, message: 'Name and price are required' });

        // Extract numbers from duration string if possible, or just use as is
        const estDays = typeof duration === 'string' ? (parseInt(duration) || 3) : 3;

        const { data, error } = await supabaseAdmin
            .from('shipping_methods')
            .insert({ name, description, price, estimated_days: estDays, is_active: isActive !== false })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data: { ...data, _id: data.id, duration: `${data.estimated_days} Days`, isActive: data.is_active } });
    } catch (error) { next(error); }
};

// @route PUT /api/shipping/:id (Admin)
exports.updateShippingMethod = async (req, res, next) => {
    try {
        const { name, description, price, duration, isActive } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (duration !== undefined) updateData.estimated_days = typeof duration === 'string' ? (parseInt(duration) || 3) : 3;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data, error } = await supabaseAdmin.from('shipping_methods').update(updateData).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Shipping method not found' });
        
        return res.status(200).json({ success: true, data: { ...data, _id: data.id, duration: `${data.estimated_days} Days`, isActive: data.is_active } });
    } catch (error) { next(error); }
};

// @route DELETE /api/shipping/:id (Admin)
exports.deleteShippingMethod = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('shipping_methods').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Shipping method deleted' });
    } catch (error) { next(error); }
};

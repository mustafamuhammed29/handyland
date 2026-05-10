/**
 * backend/controllers/repairController.js
 * Repair Devices Catalog using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// @route GET /api/repairs/catalog
exports.getRepairCatalog = async (req, res, next) => {
    try {
        const { page = 1, limit = 1000, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('repair_devices').select('*', { count: 'exact' });

        if (search) {
            query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({
            devices: data,
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
            totalDevices: count
        });
    } catch (error) { next(error); }
};

// @route GET /api/repairs/catalog/stats (Admin)
exports.getRepairCatalogStats = async (req, res, next) => {
    try {
        const { data: devices, error } = await supabaseAdmin.from('repair_devices').select('services, is_visible');
        if (error) throw error;

        let totalServices = 0;
        let totalCost = 0;
        let hiddenDevices = 0;

        devices.forEach(device => {
            if (!device.is_visible) hiddenDevices++;
            if (device.services && device.services.length > 0) {
                totalServices += device.services.length;
                device.services.forEach(srv => {
                    totalCost += (srv.price || 0);
                });
            }
        });

        const averageRepairPrice = totalServices > 0 ? (totalCost / totalServices) : 0;

        return res.json({
            success: true,
            stats: {
                totalDevices: devices.length,
                totalServices,
                averageRepairPrice: Number(averageRepairPrice.toFixed(2)),
                hiddenDevices
            }
        });
    } catch (error) { next(error); }
};

// @route POST /api/repairs/catalog
exports.createDevice = async (req, res, next) => {
    try {
        const { model, brand, image, services, isVisible } = req.body;
        const insertData = {
            legacy_id: uuidv4(),
            model,
            brand,
            image,
            services: services || [],
            is_visible: isVisible !== false
        };

        const { data, error } = await supabaseAdmin.from('repair_devices').insert(insertData).select().single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (error) { next(error); }
};

// @route PUT /api/repairs/catalog/:id
exports.updateDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { model, brand, image, services, isVisible, description } = req.body;
        
        const updateData = {};
        if (model) updateData.model = model;
        if (brand) updateData.brand = brand;
        if (image) updateData.image = image;
        if (services) updateData.services = services;
        if (isVisible !== undefined) updateData.is_visible = isVisible;
        
        let query = supabaseAdmin.from('repair_devices').update(updateData);
        
        if (id.includes('-') && id.length === 36) query = query.eq('id', id);
        else query = query.eq('legacy_id', id);

        const { data, error } = await query.select().single();
        if (error || !data) return res.status(404).json({ message: 'Device not found' });
        
        return res.json(data);
    } catch (error) { next(error); }
};

// @route PUT /api/repairs/catalog/:id/services
exports.updateDeviceServices = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { services } = req.body;

        let query = supabaseAdmin.from('repair_devices').update({ services });
        if (id.includes('-') && id.length === 36) query = query.eq('id', id);
        else query = query.eq('legacy_id', id);

        const { data, error } = await query.select().single();
        if (error || !data) return res.status(404).json({ message: 'Device not found' });
        
        return res.json(data);
    } catch (error) { next(error); }
};

// @route DELETE /api/repairs/catalog/:id
exports.deleteDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        let query = supabaseAdmin.from('repair_devices').delete();
        
        if (id.includes('-') && id.length === 36) query = query.eq('id', id);
        else query = query.eq('legacy_id', id);

        const { error } = await query;
        if (error) throw error;
        
        return res.json({ success: true, message: 'Device deleted' });
    } catch (error) { next(error); }
};

// @route POST /api/repairs/estimate
exports.estimateRepairCost = (req, res) => {
    const { device, issue } = req.body;

    if (!device || !issue || typeof device !== 'string' || typeof issue !== 'string') {
        return res.status(400).json({ success: false, message: 'Device and issue are required.' });
    }
    if (device.length > 100 || issue.length > 200) {
        return res.status(400).json({ success: false, message: 'Input too long.' });
    }

    let baseCost = 50;
    if (device.toLowerCase().includes('iphone')) baseCost += 30;
    if (device.toLowerCase().includes('macbook')) baseCost += 100;
    if (issue.toLowerCase().includes('screen') || issue.toLowerCase().includes('display')) baseCost += 80;
    if (issue.toLowerCase().includes('battery')) baseCost += 40;
    if (issue.toLowerCase().includes('water')) baseCost += 100;

    return res.json({
        device,
        issue,
        estimatedCost: baseCost,
        currency: 'EUR',
        note: 'This is a preliminary estimate. Final cost may vary after diagnostic.'
    });
};

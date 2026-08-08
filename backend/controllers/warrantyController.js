/**
 * backend/controllers/warrantyController.js
 * Warranty management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const generateWarrantyCode = () =>
    `WAR-${uuidv4().substring(0, 8).toUpperCase()}`;

// @route GET /api/warranties
exports.getWarranties = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('warranties')
            .select('*', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (search) query = query.or(`warranty_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Map to camelCase for frontend
        const mappedData = (data || []).map(w => ({
            _id: w.id,
            warrantyCode: w.warranty_code,
            customerName: w.customer_name,
            customerPhone: w.customer_phone,
            customerEmail: w.customer_email,
            itemType: w.item_type,
            itemName: w.item_name,
            imeiOrSerial: w.imei_or_serial,
            supplierName: w.supplier_name,
            startDate: w.start_date,
            durationDays: w.duration_days,
            endDate: w.end_date,
            status: w.status,
            notes: w.notes,
            createdAt: w.created_at
        }));

        return res.status(200).json({
            success: true, 
            count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data: mappedData
        });
    } catch (error) { next(error); }
};

// @route GET /api/warranties/:id
exports.getWarranty = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('warranties').select('*').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Warranty not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/warranties
exports.createWarranty = async (req, res, next) => {
    try {
        const { customerName, customerPhone, customerEmail, itemType, itemName, imeiOrSerial, supplierName, startDate, durationDays, notes } = req.body;

        const start = new Date(startDate || Date.now());
        const days = durationDays || 90;
        const endDate = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

        const { data, error } = await supabaseAdmin
            .from('warranties')
            .insert({
                warranty_code: generateWarrantyCode(),
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail || '',
                item_type: itemType,
                item_name: itemName,
                imei_or_serial: imeiOrSerial || '',
                supplier_name: supplierName || '',
                start_date: start.toISOString(),
                duration_days: days,
                end_date: endDate.toISOString(),
                notes: notes || ''
            })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/warranties/:id
exports.updateWarranty = async (req, res, next) => {
    try {
        const updateData = {};
        
        // Map frontend camelCase to db snake_case
        if (req.body.customerName !== undefined) updateData.customer_name = req.body.customerName;
        if (req.body.customerPhone !== undefined) updateData.customer_phone = req.body.customerPhone;
        if (req.body.customerEmail !== undefined) updateData.customer_email = req.body.customerEmail;
        if (req.body.status !== undefined) updateData.status = req.body.status;
        if (req.body.notes !== undefined) updateData.notes = req.body.notes;
        if (req.body.imeiOrSerial !== undefined) updateData.imei_or_serial = req.body.imeiOrSerial;
        if (req.body.itemType !== undefined) updateData.item_type = req.body.itemType;
        if (req.body.itemName !== undefined) updateData.item_name = req.body.itemName;
        if (req.body.supplierName !== undefined) updateData.supplier_name = req.body.supplierName;

        // Recalculate end_date if duration changed
        if (req.body.durationDays !== undefined || req.body.startDate !== undefined) {
            const { data: existing } = await supabaseAdmin.from('warranties').select('start_date, duration_days').eq('id', req.params.id).single();
            const start = new Date(req.body.startDate || existing.start_date);
            const days = req.body.durationDays !== undefined ? req.body.durationDays : existing.duration_days;
            updateData.end_date = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
            if (req.body.durationDays !== undefined) updateData.duration_days = days;
            if (req.body.startDate !== undefined) updateData.start_date = start.toISOString();
        }

        const { data, error } = await supabaseAdmin.from('warranties').update(updateData).eq('id', req.params.id).select().single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/warranties/:id
exports.deleteWarranty = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('warranties').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Warranty deleted' });
    } catch (error) { next(error); }
};

// @route GET /api/warranties/lookup/:code
exports.lookupWarranty = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('warranties')
            .select('warranty_code, customer_name, item_name, item_type, start_date, end_date, status, duration_days')
            .eq('warranty_code', req.params.code.toUpperCase())
            .single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Warranty not found' });

        // Auto-expire check
        if (data.status === 'Active' && new Date(data.end_date) < new Date()) {
            await supabaseAdmin.from('warranties').update({ status: 'Expired' }).eq('warranty_code', req.params.code);
            data.status = 'Expired';
        }

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

/**
 * backend/controllers/loanerController.js
 * Loaner Phones management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/loaners
exports.getLoaners = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('loaner_phones').select('*, users(name, email), repair_tickets(ticket_id)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (search) query = query.or(`name.ilike.%${search}%,imei.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = (data || []).map(l => ({ ...l, _id: l.id }));

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            loaners: mappedData,
            data: mappedData
        });
    } catch (error) { next(error); }
};

// @route GET /api/loaners/stats
exports.getLoanerStats = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('loaner_phones').select('status');
        if (error) throw error;

        const stats = {
            Total: data.length,
            Available: data.filter(l => l.status === 'available' || l.status === 'Available').length,
            Lent: data.filter(l => l.status === 'loaned' || l.status === 'Loaned' || l.status === 'Ausgeliehen').length,
            Maintenance: data.filter(l => l.status === 'maintenance' || l.status === 'Maintenance' || l.status === 'Wartung').length
        };

        return res.status(200).json({ success: true, data: stats });
    } catch (error) { next(error); }
};

// @route POST /api/loaners
exports.createLoaner = async (req, res, next) => {
    try {
        const { brand, model, name, imei, notes, status } = req.body;
        
        // Accept brand+model OR a combined name field
        const deviceName = name || (brand && model ? `${brand} ${model}` : brand || model);
        if (!deviceName || !imei) return res.status(400).json({ success: false, message: 'Gerätename und IMEI sind erforderlich' });

        // Normalize status from German frontend values to DB values
        const statusMap = { 'Available': 'available', 'Lent': 'loaned', 'Maintenance': 'maintenance' };
        const normalizedStatus = statusMap[status] || status || 'available';

        const { data, error } = await supabaseAdmin
            .from('loaner_phones')
            .insert({ name: deviceName, imei, notes, status: normalizedStatus })
            .select().single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'IMEI bereits vorhanden' });
            throw error;
        }

        return res.status(201).json({ success: true, data: { ...data, _id: data.id } });
    } catch (error) { next(error); }
};

// @route PUT /api/loaners/:id
exports.updateLoaner = async (req, res, next) => {
    try {
        const { brand, model, name, imei, status, notes } = req.body;
        const updateData = {};
        
        // Accept brand+model OR a combined name
        const deviceName = name || (brand && model ? `${brand} ${model}` : brand || model);
        if (deviceName) updateData.name = deviceName;
        if (imei) updateData.imei = imei;
        
        // Normalize status
        const statusMap = { 'Available': 'available', 'Lent': 'loaned', 'Maintenance': 'maintenance' };
        if (status) updateData.status = statusMap[status] || status;
        if (notes !== undefined) updateData.notes = notes;

        const { data, error } = await supabaseAdmin.from('loaner_phones').update(updateData).eq('id', req.params.id).select().single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'IMEI bereits vorhanden' });
            throw error;
        }
        if (!data) return res.status(404).json({ success: false, message: 'Leihgerät nicht gefunden' });

        return res.status(200).json({ success: true, data: { ...data, _id: data.id } });
    } catch (error) { next(error); }
};

// @route DELETE /api/loaners/:id
exports.deleteLoaner = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('loaner_phones').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Loaner phone deleted' });
    } catch (error) { next(error); }
};

// @route POST /api/loaners/:id/lend (alias for assignLoaner)
exports.assignLoaner = async (req, res, next) => {
    try {
        const { userId, ticketId, expectedReturn, customerName, customerPhone, customerEmail, dueDate, notes } = req.body;

        const updateData = {
            status: 'loaned',
            loaned_at: new Date().toISOString()
        };

        // Support both userId-based (old) and customer contact-based (new) approach
        if (userId) updateData.loaned_to = userId;
        if (ticketId) updateData.repair_ticket_id = ticketId;
        if (expectedReturn || dueDate) updateData.expected_return = expectedReturn || dueDate;

        // Store customer contact info in notes if provided
        if (customerName || customerPhone || customerEmail) {
            const contactInfo = [
                customerName ? `Name: ${customerName}` : '',
                customerPhone ? `Tel: ${customerPhone}` : '',
                customerEmail ? `Email: ${customerEmail}` : '',
                notes ? `Notizen: ${notes}` : ''
            ].filter(Boolean).join(' | ');
            updateData.notes = contactInfo;
        } else if (notes) {
            updateData.notes = notes;
        }

        const { data, error } = await supabaseAdmin
            .from('loaner_phones')
            .update(updateData)
            .eq('id', req.params.id)
            .select().single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Leihgerät nicht gefunden' });
        return res.status(200).json({ success: true, data: { ...data, _id: data.id } });
    } catch (error) { next(error); }
};

// @route POST /api/loaners/:id/return
exports.returnLoaner = async (req, res, next) => {
    try {
        const { status } = req.body;
        // Support Maintenance status from frontend
        const statusMap = { 'Maintenance': 'maintenance', 'Available': 'available' };
        const newStatus = statusMap[status] || status || 'available';

        const { data, error } = await supabaseAdmin
            .from('loaner_phones')
            .update({
                status: newStatus,
                loaned_to: null,
                repair_ticket_id: null,
                loaned_at: null,
                expected_return: null,
                notes: null
            })
            .eq('id', req.params.id)
            .select().single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Leihgerät nicht gefunden' });
        return res.status(200).json({ success: true, data: { ...data, _id: data.id } });
    } catch (error) { next(error); }
};

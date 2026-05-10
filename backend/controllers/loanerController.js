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

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
    } catch (error) { next(error); }
};

// @route POST /api/loaners
exports.createLoaner = async (req, res, next) => {
    try {
        const { name, imei, notes, status } = req.body;
        if (!name || !imei) return res.status(400).json({ success: false, message: 'Name and IMEI are required' });

        const { data, error } = await supabaseAdmin
            .from('loaner_phones')
            .insert({ name, imei, notes, status: status || 'available' })
            .select().single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'IMEI already exists' });
            throw error;
        }

        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/loaners/:id
exports.updateLoaner = async (req, res, next) => {
    try {
        const { name, imei, status, notes } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (imei) updateData.imei = imei;
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const { data, error } = await supabaseAdmin.from('loaner_phones').update(updateData).eq('id', req.params.id).select().single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'IMEI already exists' });
            throw error;
        }
        if (!data) return res.status(404).json({ success: false, message: 'Loaner phone not found' });

        return res.status(200).json({ success: true, data });
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

// @route POST /api/loaners/:id/assign
exports.assignLoaner = async (req, res, next) => {
    try {
        const { userId, ticketId, expectedReturn } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

        const { data, error } = await supabaseAdmin
            .from('loaner_phones')
            .update({
                status: 'loaned',
                loaned_to: userId,
                repair_ticket_id: ticketId || null,
                loaned_at: new Date().toISOString(),
                expected_return: expectedReturn || null
            })
            .eq('id', req.params.id)
            .select().single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Loaner phone not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/loaners/:id/return
exports.returnLoaner = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('loaner_phones')
            .update({
                status: 'available',
                loaned_to: null,
                repair_ticket_id: null,
                loaned_at: null,
                expected_return: null
            })
            .eq('id', req.params.id)
            .select().single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Loaner phone not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

/**
 * backend/controllers/repairTicketController.js
 * Repair ticket management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const crypto = require('crypto');

const generateTicketId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    return `REP-${year}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// ── @route GET /api/repairs ───────────────────────────────────
exports.getTickets = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { page = 1, limit = 20, status, serviceType, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('repair_tickets')
            .select('*', { count: 'exact' });

        if (!isAdmin) query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);
        if (serviceType) query = query.eq('service_type', serviceType);
        if (search) {
            query = query.or(`ticket_id.ilike.%${search}%,device.ilike.%${search}%,guest_email.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = (data || []).map(t => ({ ...t, _id: t.id }));

        return res.status(200).json({
            success: true,
            count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            tickets: mappedData,
            data: mappedData
        });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/repairs/:id ───────────────────────────────
exports.getTicket = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('repair_tickets')
            .select('*, repair_ticket_messages(*), repair_ticket_timeline(*)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Ticket not found' });

        if (req.user.role !== 'admin' && data.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/repairs/tickets/admin/stats ───────────────
exports.getTicketStats = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('repair_tickets').select('status, estimated_cost');
        if (error) throw error;

        const stats = {
            totalTickets: data.length,
            pendingTickets: data.filter(t => t.status === 'pending' || t.status === 'open').length,
            inProgressTickets: data.filter(t => t.status === 'in-progress' || t.status === 'diagnosing' || t.status === 'waiting-parts').length,
            completedTickets: data.filter(t => t.status === 'completed' || t.status === 'ready' || t.status === 'delivered').length,
            totalEstimatedRevenue: data.reduce((acc, t) => acc + (Number(t.estimated_cost) || 0), 0)
        };

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/repairs ──────────────────────────────────
exports.createTicket = async (req, res, next) => {
    try {
        const { device, issue, serviceType, notes, appointmentDate, guestContact } = req.body;

        if (!device || !issue) {
            return res.status(400).json({ success: false, message: 'Device and issue are required' });
        }

        const ticketId = generateTicketId();

        const insertData = {
            ticket_id: ticketId,
            user_id: req.user?.id || null,
            device,
            issue,
            service_type: serviceType || 'In-Store',
            notes: notes || null,
            appointment_date: appointmentDate || null,
            guest_name: guestContact?.name || null,
            guest_email: guestContact?.email || null,
            guest_phone: guestContact?.phone || null
        };

        const { data: ticket, error } = await supabaseAdmin
            .from('repair_tickets')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // Initial timeline entry
        await supabaseAdmin.from('repair_ticket_timeline').insert({
            ticket_id: ticket.id,
            status: 'pending',
            note: 'Repair ticket created'
        });

        return res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/repairs/:id/status (Admin) ────────────────
exports.updateStatus = async (req, res, next) => {
    try {
        const { status, technicianNotes, estimatedCost } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (technicianNotes) updateData.technician_notes = technicianNotes;
        if (estimatedCost !== undefined) updateData.estimated_cost = estimatedCost;

        const { data, error } = await supabaseAdmin
            .from('repair_tickets')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: 'Ticket not found' });

        // Add timeline entry
        if (status) {
            await supabaseAdmin.from('repair_ticket_timeline').insert({
                ticket_id: req.params.id,
                status,
                note: req.body.note || null
            });
        }

        // Notify user
        if (data.user_id) {
            await supabaseAdmin.from('notifications').insert({
                user_id: data.user_id,
                message: `Ihr Reparatur-Ticket ${data.ticket_id} wurde aktualisiert: ${status}`,
                type: 'info',
                link: `/dashboard/repairs/${data.id}`
            });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/repairs/:id/messages ────────────────────
exports.addMessage = async (req, res, next) => {
    try {
        const { text } = req.body;
        const role = req.user.role === 'admin' ? 'admin' : 'customer';

        const { data, error } = await supabaseAdmin
            .from('repair_ticket_messages')
            .insert({ ticket_id: req.params.id, role, text })
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/repairs/:id (Admin) ───────────────────
exports.deleteTicket = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('repair_tickets').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Ticket deleted' });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/repairs/lookup/:ticketId ──────────────────
exports.lookupTicket = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('repair_tickets')
            .select('ticket_id, device, issue, status, estimated_cost, appointment_date, service_type, repair_ticket_timeline(*)')
            .eq('ticket_id', req.params.ticketId)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Ticket not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

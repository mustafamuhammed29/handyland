/**
 * backend/controllers/messageController.js
 * Support messages using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/messages
exports.getMessages = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search, isArchived } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('messages')
            .select('*, message_replies(*)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (isArchived !== undefined) query = query.eq('is_archived', isArchived === 'true');
        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const messagesWithId = (data || []).map(m => ({ ...m, _id: m.id }));
        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            messages: messagesWithId,
            data: messagesWithId
        });
    } catch (error) { next(error); }
};

// @route GET /api/messages/:id
exports.getMessage = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('messages').select('*, message_replies(*)').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Message not found' });
        
        // Auto mark as read if admin opens it
        if (req.user.role === 'admin' && data.status === 'unread') {
            await supabaseAdmin.from('messages').update({ status: 'read' }).eq('id', data.id);
            data.status = 'read';
        }
        const messageWithId = { ...data, _id: data.id };
        return res.status(200).json({ success: true, message: messageWithId, data: messageWithId });
    } catch (error) { next(error); }
};

// @route POST /api/messages
exports.createMessage = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email and message are required' });
        }

        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert({ user_id: req.user?.id || null, name, email, message })
            .select().single();

        if (error) {
            console.error('DB_ERROR in createMessage:', JSON.stringify(error));
            throw error;
        }

        // Notify admins
        const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
        if (admins) {
            const notifs = admins.map(admin => ({
                user_id: admin.id,
                message: `Neue Nachricht von ${name}`,
                type: 'info',
                link: `/admin/messages/${data.id}`
            }));
            await supabaseAdmin.from('notifications').insert(notifs);
        }

        const messageWithId = { ...data, _id: data.id };
        return res.status(201).json({ success: true, msg: 'Message sent successfully', message: messageWithId, data: messageWithId });
    } catch (error) { next(error); }
};

// @route PUT /api/messages/:id/status
exports.updateMessageStatus = async (req, res, next) => {
    try {
        const { status, isArchived } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (isArchived !== undefined) updateData.is_archived = isArchived;

        const { data, error } = await supabaseAdmin.from('messages').update(updateData).eq('id', req.params.id).select().single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/messages/:id/reply
exports.replyToMessage = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Reply message is required' });

        const { data: msg } = await supabaseAdmin.from('messages').select('*').eq('id', req.params.id).single();
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

        const { data: reply, error } = await supabaseAdmin
            .from('message_replies')
            .insert({ message_id: msg.id, message, is_admin: req.user.role === 'admin' })
            .select().single();

        if (error) throw error;

        // Update status to replied
        if (req.user.role === 'admin') {
            await supabaseAdmin.from('messages').update({ status: 'replied' }).eq('id', msg.id);
        }

        const replyWithId = { ...reply, _id: reply.id };
        return res.status(201).json({ success: true, reply: replyWithId, data: replyWithId });
    } catch (error) { next(error); }
};

// @route DELETE /api/messages/:id
exports.deleteMessage = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('messages').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) { next(error); }
};

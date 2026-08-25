/**
 * backend/controllers/messageController.js
 * Support messages using Supabase
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');
const { sendEmail } = require('../utils/emailService');
const { emitAdminNotification } = require('../utils/socket');

// @route GET /api/messages
exports.getMessages = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search, isArchived } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from('messages')
            .select('*, message_replies(*)', { count: 'exact' });

        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            query = query.or(`user_id.eq.${req.user.id},email.eq.${req.user.email}`);
        } else if (req.user.role === 'staff') {
            query = query.or(`assigned_to.eq.${req.user.id},assigned_to.is.null`);
        }

        if (status) query = query.eq('status', status);
        if (isArchived !== undefined) query = query.eq('is_archived', isArchived === 'true');
        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const messagesWithId = (data || []).map(m => ({
            ...m,
            _id: m.id,
            replies: (m.message_replies || []).map(r => ({ ...r, _id: r.id }))
        }));

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
        
        // Auto mark as read if admin/staff opens it
        if ((req.user.role === 'admin' || req.user.role === 'staff') && data.status === 'unread') {
            await supabaseAdmin.from('messages').update({ status: 'read' }).eq('id', data.id);
            data.status = 'read';
        }
        const messageWithId = {
            ...data,
            _id: data.id,
            replies: (data.message_replies || []).map(r => ({ ...r, _id: r.id }))
        };
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

        const userId = req.user?.id || null;

        // Continuity check: Look for an existing non-closed message thread for this user/email
        let existingThreadQuery = supabaseAdmin
            .from('messages')
            .select('id, user_id, email, status')
            .neq('status', 'closed');

        if (userId) {
            existingThreadQuery = existingThreadQuery.or(`user_id.eq.${userId},email.eq.${email}`);
        } else {
            existingThreadQuery = existingThreadQuery.eq('email', email);
        }

        const { data: existingThreads } = await existingThreadQuery.order('created_at', { ascending: false }).limit(1);
        const activeThread = existingThreads && existingThreads.length > 0 ? existingThreads[0] : null;

        let targetMessageId;
        let finalThreadData;

        if (activeThread) {
            targetMessageId = activeThread.id;

            // Sync user_id if previously null
            if (userId && !activeThread.user_id) {
                await supabaseAdmin.from('messages').update({ user_id: userId }).eq('id', activeThread.id);
            }

            await supabaseAdmin.from('messages').update({ status: 'unread', updated_at: new Date().toISOString() }).eq('id', activeThread.id);

            const { error: replyErr } = await supabaseAdmin
                .from('message_replies')
                .insert({
                    message_id: activeThread.id,
                    message,
                    is_admin: false,
                    user_id: userId,
                    is_internal_note: false
                });

            if (replyErr) throw replyErr;

            const { data: updatedThread } = await supabaseAdmin
                .from('messages')
                .select('*, message_replies(*)')
                .eq('id', activeThread.id)
                .single();

            finalThreadData = updatedThread;
        } else {
            const { data: newMsg, error } = await supabaseAdmin
                .from('messages')
                .insert({ user_id: userId, name, email, message, status: 'unread' })
                .select('*, message_replies(*)').single();

            if (error) throw error;
            finalThreadData = newMsg;
            targetMessageId = newMsg.id;
        }

        const messageWithId = {
            ...finalThreadData,
            _id: finalThreadData.id,
            replies: (finalThreadData.message_replies || []).map(r => ({ ...r, _id: r.id }))
        };

        // Notify admins via socket
        const { emitAdminNotification, emitUserMessage } = require('../utils/socket');
        emitAdminNotification('new_message', {
            title: 'Neue Nachricht',
            body: `${name}: ${message.substring(0, 50)}...`,
            icon: '💬',
            link: `/messages?id=${targetMessageId}`
        });

        // Notify customer socket room
        if (userId) emitUserMessage(userId, { type: 'customer_sent', thread: messageWithId });
        if (email) emitUserMessage(email, { type: 'customer_sent', thread: messageWithId });

        // Save DB notification for admins
        const { data: admins } = await supabaseAdmin.from('users').select('id, email').eq('role', 'admin');
        if (admins) {
            const notifs = admins.map(admin => ({
                user_id: admin.id,
                message: `Neue Nachricht von ${name}: ${message.substring(0, 40)}...`,
                type: 'info',
                link: `/messages?id=${targetMessageId}`
            }));
            supabaseAdmin.from('notifications').insert(notifs).then(({ error: nErr }) => {
                if (nErr) console.error('❌ Notification DB insert warning:', nErr.message);
            });
        }

        return res.status(201).json({ success: true, msg: 'Message sent successfully', message: messageWithId, data: messageWithId });
    } catch (error) { next(error); }
};

// @route PUT /api/messages/:id/status
exports.updateMessageStatus = async (req, res, next) => {
    try {
        const { status, isArchived, assigned_to, priority } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (isArchived !== undefined) updateData.is_archived = isArchived;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
        if (priority) updateData.priority = priority;

        if (req.user.role === 'staff') {
            const { data: msg } = await supabaseAdmin.from('messages').select('assigned_to').eq('id', req.params.id).single();
            if (msg && msg.assigned_to && msg.assigned_to !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not allowed to modify this ticket' });
            }
        }

        const { data, error } = await supabaseAdmin.from('messages').update(updateData).eq('id', req.params.id).select().single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/messages/:id/reply
exports.replyToMessage = async (req, res, next) => {
    try {
        const { message, is_internal_note } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Reply message is required' });

        const { data: msg } = await supabaseAdmin.from('messages').select('*').eq('id', req.params.id).single();
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

        const isAdminOrStaff = req.user.role === 'admin' || req.user.role === 'staff';

        // Security Check: Non-admin/non-staff requester must own the message thread
        if (!isAdminOrStaff) {
            const isOwner = Boolean(msg.user_id && msg.user_id === req.user.id);
            if (!isOwner) {
                return res.status(403).json({ success: false, message: 'Not authorized to reply to this message' });
            }
        }

        const { data: reply, error } = await supabaseAdmin
            .from('message_replies')
            .insert({ 
                message_id: msg.id, 
                message, 
                is_admin: isAdminOrStaff,
                user_id: req.user.id,
                is_internal_note: isAdminOrStaff ? (is_internal_note || false) : false
            })
            .select().single();

        if (error) throw error;

        let updatedThread = msg;
        if (isAdminOrStaff && !is_internal_note) {
            await supabaseAdmin.from('messages').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', msg.id);

            const { data: freshThread } = await supabaseAdmin
                .from('messages')
                .select('*, message_replies(*)')
                .eq('id', msg.id)
                .single();

            if (freshThread) updatedThread = freshThread;

            // Emit real-time Socket.io push to customer
            const { emitUserMessage, emitNotification } = require('../utils/socket');
            const threadWithId = {
                ...updatedThread,
                _id: updatedThread.id,
                replies: (updatedThread.message_replies || []).map(r => ({ ...r, _id: r.id }))
            };

            const replyWithId = { ...reply, _id: reply.id };

            if (msg.user_id) {
                emitUserMessage(msg.user_id, { type: 'admin_reply', message: replyWithId, thread: threadWithId });
                emitNotification(msg.user_id, { message: `Neue Support-Antwort`, type: 'info', link: `/dashboard?tab=messages` });
            }
            if (msg.email) {
                emitUserMessage(msg.email, { type: 'admin_reply', message: replyWithId, thread: threadWithId });
            }

            // Send email to user as fallback
            const frontendUrl = process.env.FRONTEND_URL || 'https://front-end-rho-five-94.vercel.app';
            if (msg.email) {
                sendEmail({
                    email: msg.email,
                    subject: `Antwort auf Ihre Nachricht bei HandyLand`,
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;color:#0f172a;">
                            <h2 style="margin-top:0;">Hallo ${msg.name},</h2>
                            <p>Unser Support-Team hat auf Ihre Nachricht geantwortet:</p>
                            <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;color:#0f172a;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            <p>Mit freundlichen Grüßen,<br/>Ihr HandyLand Support-Team</p>
                        </div>
                    `,
                    message: `Hallo ${msg.name},\n\nUnser Support-Team hat geantwortet:\n\n${message}\n\nViele Grüße,\nIhr HandyLand Support-Team`
                }).catch(err => console.error('Failed to send reply email:', err.message));
            }
        }

        const replyWithId = { ...reply, _id: reply.id };
        const threadWithId = {
            ...updatedThread,
            _id: updatedThread.id,
            replies: (updatedThread.message_replies || []).map(r => ({ ...r, _id: r.id }))
        };

        return res.status(201).json({ success: true, reply: replyWithId, message: threadWithId, data: threadWithId });
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

// @route POST /api/messages/admin/send
exports.sendSingleAdminMessage = async (req, res, next) => {
    try {
        const { userId, name, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ success: false, message: 'Email and message are required' });
        }

        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert({ 
                user_id: userId || null, 
                name: name || 'Customer', 
                email, 
                message, 
                initiated_by_admin: true,
                status: 'replied',
                assigned_to: req.user.role === 'admin' || req.user.role === 'staff' ? req.user.id : null,
                priority: 'normal'
            })
            .select().single();

        if (error) throw error;

        sendEmail({
            email,
            subject: 'Nachricht vom HandyLand Support',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;color:#0f172a;">
                    <h2 style="margin-top:0;">Hallo ${name || 'Kunde'},</h2>
                    <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;color:#0f172a;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                    <p>Viele Grüße,<br/>Ihr HandyLand Support-Team</p>
                </div>
            `,
            message: `Hallo ${name || 'Kunde'},\n\n${message}\n\nViele Grüße,\nIhr HandyLand Support-Team`
        }).catch(e => console.error(e.message));

        const messageWithId = { ...data, _id: data.id };
        return res.status(201).json({ success: true, data: messageWithId });
    } catch (error) { next(error); }
};

// @route POST /api/messages/admin/bulk
exports.sendBulkAdminMessages = async (req, res, next) => {
    try {
        const { recipients, message } = req.body;
        if (!recipients || !Array.isArray(recipients) || !message) {
            return res.status(400).json({ success: false, message: 'Recipients and message required' });
        }

        const inserts = recipients.map(r => ({
            user_id: r.userId || null,
            name: r.name || 'Customer',
            email: r.email,
            message,
            initiated_by_admin: true,
            status: 'replied',
            assigned_to: req.user.role === 'admin' || req.user.role === 'staff' ? req.user.id : null
        }));

        const { error } = await supabaseAdmin.from('messages').insert(inserts);
        if (error) throw error;

        for (const r of recipients) {
            if (!r.email) continue;
            sendEmail({
                email: r.email,
                subject: 'Wichtige Nachricht von HandyLand',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;color:#0f172a;">
                        <h2 style="margin-top:0;">Hallo ${r.name || 'Kunde'},</h2>
                        <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;color:#0f172a;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <p>Viele Grüße,<br/>Ihr HandyLand-Team</p>
                    </div>
                `,
                message: `Hallo ${r.name || 'Kunde'},\n\n${message}\n\nViele Grüße,\nIhr HandyLand-Team`
            }).catch(e => console.error(e.message));
        }

        return res.status(201).json({ success: true, message: `Sent to ${recipients.length} customers` });
    } catch (error) { next(error); }
};

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

        if (req.user.role !== 'admin') {
            query = query.eq('user_id', req.user.id);
        }

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
        const { data: admins } = await supabaseAdmin.from('users').select('id, email').eq('role', 'admin');
        if (admins) {
            const notifs = admins.map(admin => ({
                user_id: admin.id,
                message: `Neue Nachricht von ${name}`,
                type: 'new_message',
                link: `/messages`
            }));
            await supabaseAdmin.from('notifications').insert(notifs);

            // Send real-time socket notification
            emitAdminNotification('new_message', {
                title: 'Neue Nachricht',
                body: `${name}: ${message.substring(0, 50)}...`,
                icon: '💬',
                link: '/messages'
            });

            // Send email to all admins
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            for (const admin of admins) {
                if (admin.email) {
                    sendEmail({
                        email: admin.email,
                        replyTo: email,
                        subject: `Neue Kontaktanfrage von ${name}`,
                        html: `
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;color:#0f172a;">
                                <h2 style="margin-top:0;">Neue Kontaktanfrage</h2>
                                <p><strong>Name:</strong> ${name}</p>
                                <p><strong>E-Mail:</strong> ${email}</p>
                                <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
                                    ${message.replace(/\n/g, '<br>')}
                                </div>
                                <a href="${frontendUrl}/admin/messages/${data.id}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Im Admin-Panel ansehen</a>
                            </div>
                        `,
                        message: `Neue Nachricht von ${name} (${email}):\n\n${message}`
                    }).catch(err => console.error('Failed to send admin email:', err.message));
                }
            }
        }

        // Send confirmation to the user
        sendEmail({
            email: email,
            subject: 'Wir haben Ihre Nachricht erhalten',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;color:#0f172a;">
                    <h2 style="margin-top:0;">Hallo ${name},</h2>
                    <p>Vielen Dank für Ihre Kontaktaufnahme. Wir haben Ihre Nachricht erhalten und werden uns so schnell wie möglich bei Ihnen melden.</p>
                    <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;color:#64748b;">
                        <strong>Ihre Nachricht:</strong><br/><br/>
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                    <p>Mit freundlichen Grüßen,<br/>Ihr HandyLand-Team</p>
                </div>
            `,
            message: `Hallo ${name},\n\nVielen Dank für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen.\n\nIhre Nachricht:\n${message}\n\nViele Grüße,\nIhr HandyLand-Team`
        }).catch(err => console.error('Failed to send user confirmation email:', err.message));

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

        // Update status to replied and send email to user
        if (req.user.role === 'admin') {
            await supabaseAdmin.from('messages').update({ status: 'replied' }).eq('id', msg.id);

            // Send email to the user
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
                            <p style="color:#64748b;font-size:14px;"><strong>Ihre ursprüngliche Nachricht:</strong></p>
                            <div style="background:#f1f5f9;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;color:#64748b;font-size:14px;font-style:italic;">
                                ${msg.message.replace(/\n/g, '<br>')}
                            </div>
                            <p>Mit freundlichen Grüßen,<br/>Ihr HandyLand Support-Team</p>
                            <div style="margin-top:24px;text-align:center;">
                                <a href="${frontendUrl}/dashboard" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Zum Kundenportal</a>
                            </div>
                        </div>
                    `,
                    message: `Hallo ${msg.name},\n\nUnser Support-Team hat geantwortet:\n\n${message}\n\nViele Grüße,\nIhr HandyLand Support-Team`
                }).catch(err => console.error('Failed to send reply email:', err.message));
            }
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
                status: 'replied'
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
            status: 'replied'
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

/**
 * backend/controllers/emailController.js
 * Email sending controller (simplified version)
 */
'use strict';

const nodemailer = require('nodemailer');
const { supabaseAdmin } = require('../config/supabase');

// Set up transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.sendEmail = async (req, res, next) => {
    try {
        const { to, subject, html, text, templateId, variables } = req.body;
        if (!to) return res.status(400).json({ success: false, message: 'Recipient is required' });

        let finalHtml = html;
        let finalSubject = subject;
        let finalText = text;

        // Use template if provided
        if (templateId) {
            const { data: template } = await supabaseAdmin.from('email_templates').select('*').eq('id', templateId).single();
            if (template && template.is_active) {
                finalHtml = template.body_html;
                finalSubject = template.subject;
                finalText = template.body_text;

                // Simple variable replacement {{var}}
                if (variables && typeof variables === 'object') {
                    for (const [key, value] of Object.entries(variables)) {
                        const regex = new RegExp(`{{${key}}}`, 'g');
                        if (finalHtml) finalHtml = finalHtml.replace(regex, value);
                        if (finalSubject) finalSubject = finalSubject.replace(regex, value);
                        if (finalText) finalText = finalText.replace(regex, value);
                    }
                }
            }
        }

        if (!finalSubject || (!finalHtml && !finalText)) {
            return res.status(400).json({ success: false, message: 'Subject and body are required' });
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@handyland.de',
            to,
            subject: finalSubject,
            text: finalText,
            html: finalHtml
        };

        const info = await transporter.sendMail(mailOptions);

        // Optional: log email sending to audit_logs
        if (req.user) {
            await supabaseAdmin.from('audit_logs').insert({
                user_id: req.user.id,
                action: 'send_email',
                resource: 'email',
                details: { to, subject: finalSubject, messageId: info.messageId }
            });
        }

        return res.status(200).json({ success: true, message: 'Email sent', messageId: info.messageId });
    } catch (error) { next(error); }
};

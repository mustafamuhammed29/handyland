const nodemailer = require('nodemailer');

// Clear cached SMTP config (kept for backward compatibility)
const clearSmtpCache = () => {};

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@handyland.de';
        const fromName = process.env.FROM_NAME || 'HandyLand';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: options.email,
            subject: options.subject,
        };

        if (options.replyTo) mailOptions.replyTo = options.replyTo;
        if (options.message) mailOptions.text = options.message;
        if (options.html) mailOptions.html = options.html;

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully via SMTP: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email via SMTP:', error.message);
        throw error;
    }
};

const sendOrderConfirmation = async (order) => {
    // Try to get email from user object if populated, otherwise use what's in shippingAddress or metadata
    let email = order.shippingAddress?.email;
    if (!email && order.user && order.user.email) {email = order.user.email;}

    // Fallback if still not found
    if (!email) {
        console.error("Could not find email for order confirmation", order._id);
        return;
    }

    let bankTransferInstructions = '';
    let bankTransferText = '';
    if (order.paymentMethod === 'bank_transfer') {
        try {
            const { supabaseAdmin } = require('../config/supabase');
            const { data } = await supabaseAdmin.from('settings').select('value').eq('key', 'payment').maybeSingle();
            if (data && data.value) {
                const p = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                const bt = p.bankTransfer || {};
                
                bankTransferText = `Bitte überweisen Sie den Betrag auf folgendes Konto:\nBank: ${bt.bankName}\nKontoinhaber: ${bt.accountHolder}\nIBAN: ${bt.iban}\nBIC: ${bt.bic}\nVerwendungszweck: ${order.orderNumber || order._id}\n`;
                
                bankTransferInstructions = `
                <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #f59e0b40;">
                    <h3 style="color:#fcd34d;margin-top:0;">Zahlungsinformationen (Vorkasse)</h3>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.5;">Bitte überweisen Sie den Gesamtbetrag auf das folgende Konto. Geben Sie als Verwendungszweck Ihre Bestellnummer <strong>${order.orderNumber || order._id}</strong> an.</p>
                    <table style="width:100%;color:#e2e8f0;font-size:14px;border-spacing:0;margin-top:16px;">
                        ${bt.bankName ? `<tr><td style="padding:4px 0;color:#94a3b8;">Bank:</td><td style="padding:4px 0;text-align:right;">${bt.bankName}</td></tr>` : ''}
                        ${bt.accountHolder ? `<tr><td style="padding:4px 0;color:#94a3b8;">Kontoinhaber:</td><td style="padding:4px 0;text-align:right;">${bt.accountHolder}</td></tr>` : ''}
                        ${bt.iban ? `<tr><td style="padding:4px 0;color:#94a3b8;">IBAN:</td><td style="padding:4px 0;text-align:right;font-family:monospace;letter-spacing:1px;">${bt.iban}</td></tr>` : ''}
                        ${bt.bic ? `<tr><td style="padding:4px 0;color:#94a3b8;">BIC:</td><td style="padding:4px 0;text-align:right;font-family:monospace;">${bt.bic}</td></tr>` : ''}
                    </table>
                </div>
                `;
            }
        } catch (e) { console.error("Failed to fetch bank details for email", e); }
    }

    const variablesContext = {
        orderNumber: order.orderNumber || order._id,
        totalAmount: order.totalAmount,
        bankTransferInstructions: bankTransferInstructions,
        bankTransferText: bankTransferText
    };

    const sent = await sendTemplateEmail(email, 'order_confirmation', variablesContext);

    if (!sent) {
        // Fallback hardcoded logic if the template was deleted from DB
        const html = `
            <h1>Vielen Dank für Ihre Bestellung!</h1>
            <p>Ihre Bestellnummer lautet <strong>${variablesContext.orderNumber}</strong></p>
            <p>Gesamtsumme: <strong>${variablesContext.totalAmount}€</strong></p>
            ${variablesContext.bankTransferInstructions}
            <p>Wir werden Sie benachrichtigen, sobald Ihre Bestellung versandt wird.</p>
        `;
        await sendEmail({
            email,
            subject: 'Bestellbestätigung - HandyLand',
            message: html.replace(/<[^>]*>?/gm, '') + '\n' + variablesContext.bankTransferText,
            html
        });
    }
};

// Template helper using Supabase
const sendTemplateEmail = async (email, templateName, variablesContext = {}) => {
    try {
        const { supabaseAdmin } = require('../config/supabase');
        const { data: template, error } = await supabaseAdmin
            .from('email_templates')
            .select('*')
            .eq('name', templateName)
            .eq('is_active', true)
            .maybeSingle();

        if (error || !template) {
            console.warn(`⚠️ Email template '${templateName}' not found or inactive. Falling back to default.`);
            return false;
        }

        let html = template.body_html || '';
        let text = template.body_text || '';
        let subject = template.subject || '';

        // Replace all {{variableName}} in subject, html, text
        for (const [key, value] of Object.entries(variablesContext)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            text = text.replace(regex, value);
            subject = subject.replace(regex, value);
        }

        await sendEmail({ email, subject, html, message: text });
        return true;
    } catch (error) {
        console.error(`❌ Error sending template email '${templateName}':`, error);
        return false;
    }
};

const STATUS_LABELS = {
    pending: { label: 'Ausstehend', emoji: '⏳', color: '#f59e0b' },
    processing: { label: 'In Bearbeitung', emoji: '📦', color: '#3b82f6' },
    shipped: { label: 'Versandt', emoji: '🚚', color: '#8b5cf6' },
    delivered: { label: 'Zugestellt', emoji: '✅', color: '#10b981' },
    cancelled: { label: 'Storniert', emoji: '❌', color: '#ef4444' },
};

const emailTemplates = {
    orderConfirmation: (name, order) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:32px;text-align:center;">
                <h1 style="margin:0;font-size:24px;color:#fff;">HandyLand</h1>
                <p style="color:#94a3b8;margin:8px 0 0;">Bestellbestätigung</p>
            </div>
            <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 16px;">Hallo ${name || 'Kunde'} 👋</h2>
                <p style="color:#94a3b8;">Vielen Dank für Ihre Bestellung! Wir haben sie erhalten und bereiten sie vor.</p>
                <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:#94a3b8;">Bestellnummer</span>
                        <strong style="color:#fff;">${order.orderNumber}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">Gesamtsumme</span>
                        <strong style="color:#10b981;">€${order.totalAmount?.toFixed(2) || '0.00'}</strong>
                    </div>
                </div>
                ${order.paymentMethod === 'bank_transfer' ? order.bankTransferInstructions : ''}
            </div>
            <div style="padding:16px 32px;background:#1e293b;text-align:center;">
                <p style="color:#64748b;font-size:12px;margin:0;">© HandyLand. Alle Rechte vorbehalten.</p>
            </div>
        </div>
    `,

    orderStatusUpdate: (name, order, newStatus, adminNote) => {
        const s = STATUS_LABELS[newStatus] || { label: newStatus, emoji: '📋', color: '#3b82f6' };
        return `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:32px;text-align:center;">
                <h1 style="margin:0;font-size:24px;color:#fff;">HandyLand</h1>
                <p style="color:#94a3b8;margin:8px 0 0;">Aktualisierung des Bestellstatus</p>
            </div>
            <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 8px;">Hallo ${name || 'Kunde'} 👋</h2>
                <p style="color:#94a3b8;margin:0 0 24px;">Ihr Bestellstatus wurde aktualisiert.</p>

                <div style="text-align:center;padding:24px;background:#1e293b;border-radius:12px;margin-bottom:24px;border:1px solid ${s.color}40;">
                    <div style="font-size:40px;margin-bottom:8px;">${s.emoji}</div>
                    <div style="font-size:20px;font-weight:bold;color:${s.color};">${s.label}</div>
                </div>

                <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:${adminNote ? '16px' : '24px'};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:#94a3b8;">Bestellnummer</span>
                        <strong style="color:#fff;">${order.orderNumber}</strong>
                    </div>
                    ${order.trackingNumber ? `
                    <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #334155;">
                        <span style="color:#94a3b8;">Sendungsnummer</span>
                        <strong style="color:#a78bfa;font-family:monospace;">${order.trackingNumber}</strong>
                    </div>` : ''}
                </div>

                ${adminNote ? `
                <div style="background:#1e3a5f;border:1px solid #3b82f640;border-radius:8px;padding:16px;margin-bottom:24px;">
                    <p style="color:#93c5fd;font-size:12px;font-weight:bold;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Nachricht von unserem Team</p>
                    <p style="color:#e2e8f0;margin:0;font-style:italic;">"${adminNote}"</p>
                </div>` : ''}

                <a href="${process.env.FRONTEND_URL || 'https://front-end-rho-five-94.vercel.app'}/dashboard?tab=orders"
                   style="display:block;text-align:center;background:#3b82f6;color:#fff;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;">
                    Meine Bestellungen ansehen →
                </a>
            </div>
            <div style="padding:16px 32px;background:#1e293b;text-align:center;">
                <p style="color:#64748b;font-size:12px;margin:0;">© HandyLand. Alle Rechte vorbehalten.</p>
            </div>
        </div>
        `;
    }
};

const sendVerificationEmail = async (email, userName, verificationUrl) => {
    const variablesContext = {
        userName: userName || 'User',
        verificationUrl: verificationUrl
    };

    const sent = await sendTemplateEmail(email, 'verify_email', variablesContext);

    if (!sent) {
        // Fallback HTML if DB template is missing or inactive
        const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:32px;text-align:center;">
                <h1 style="margin:0;font-size:24px;color:#fff;">HandyLand</h1>
                <p style="color:#94a3b8;margin:8px 0 0;">Bestätige deine E-Mail-Adresse</p>
            </div>
            <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 16px;">Hallo ${userName || 'Kunde'} 👋</h2>
                <p style="color:#94a3b8;line-height:1.6;">Vielen Dank für deine Registrierung bei HandyLand! Bitte klicke auf den folgenden Button, um deine E-Mail-Adresse zu bestätigen und dein Konto zu aktivieren:</p>
                <div style="text-align:center;margin:32px 0;">
                    <a href="${verificationUrl}" style="background:linear-gradient(to right, #06b6d4, #3b82f6);color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">E-Mail jetzt bestätigen →</a>
                </div>
                <p style="color:#64748b;font-size:13px;line-height:1.5;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/><a href="${verificationUrl}" style="color:#38bdf8;">${verificationUrl}</a></p>
            </div>
            <div style="padding:16px 32px;background:#1e293b;text-align:center;">
                <p style="color:#64748b;font-size:12px;margin:0;">© HandyLand. Alle Rechte vorbehalten.</p>
            </div>
        </div>
        `;

        await sendEmail({
            email,
            subject: 'Bestätige deine E-Mail-Adresse - HandyLand',
            message: `Hallo ${userName},\n\nBitte bestätige deine E-Mail-Adresse: ${verificationUrl}`,
            html
        });
    }
    return true;
};

module.exports = {
    sendEmail,
    sendOrderConfirmation,
    sendTemplateEmail,
    sendVerificationEmail,
    emailTemplates,
    clearSmtpCache
};

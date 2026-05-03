const nodemailer = require('nodemailer');

// Cache DB config to avoid querying on every email
let _dbSmtpConfig = null;
let _dbSmtpLastFetch = 0;
const DB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get SMTP config: DB first → .env fallback
 */
const getSmtpConfig = async () => {
    // Try DB config (cached)
    const now = Date.now();
    if (!_dbSmtpConfig || (now - _dbSmtpLastFetch) > DB_CACHE_TTL) {
        try {
            const Settings = require('../models/Settings');
            const settings = await Settings.findOne().lean();
            if (settings?.smtp?.isConfigured && settings.smtp.host && settings.smtp.user && settings.smtp.pass) {
                const { decrypt } = require('./encryption');
                _dbSmtpConfig = {
                    host: settings.smtp.host,
                    port: settings.smtp.port || 587,
                    secure: settings.smtp.secure || false,
                    user: settings.smtp.user,
                    pass: decrypt(settings.smtp.pass),
                    fromEmail: settings.smtp.fromEmail || settings.smtp.user,
                    fromName: settings.smtp.fromName || 'HandyLand',
                    source: 'database'
                };
            } else {
                _dbSmtpConfig = null;
            }
            _dbSmtpLastFetch = now;
        } catch (e) {
            // Silently fall through to .env
            _dbSmtpConfig = null;
        }
    }

    if (_dbSmtpConfig) return _dbSmtpConfig;

    // Fallback to .env
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER,
            fromName: process.env.FROM_NAME || 'HandyLand',
            source: 'env'
        };
    }

    return null;
};

/** Clear cached SMTP config (call after admin updates settings) */
const clearSmtpCache = () => {
    _dbSmtpConfig = null;
    _dbSmtpLastFetch = 0;
};

const sendEmail = async (options) => {
    const config = await getSmtpConfig();

    if (config) {
        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: {
                    user: config.user,
                    pass: config.pass
                }
            });

            const message = {
                from: `${config.fromName} <${config.fromEmail}>`,
                to: options.email,
                replyTo: options.replyTo, // Add replyTo support
                subject: options.subject,
                text: options.message, // Plain text body
                html: options.html // HTML body
            };

            const info = await transporter.sendMail(message);
            console.log('📧 Email sent successfully: %s (via %s)', info.messageId, config.source);
        } catch (error) {
            console.error('❌ Error sending email via SMTP:', error.message);
            console.log('⚠️ Overriding to mock email since real email failed.');
            console.log('----------------------------------------------------');
            console.log('📧 Mock Email Service (SMTP failed)');
            console.log(`To: ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body: ${options.html || options.message}`);
            console.log('----------------------------------------------------');

            // Only throw here if you strictly want the API to fail. For development/robustness, we log and swallow the error.
            // throw new Error('Email service failed: ' + error.message);
        }
    } else {
        console.log('----------------------------------------------------');
        console.log('📧 Mock Email Service (No SMTP Configured)');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.html || options.message}`);
        console.log('----------------------------------------------------');
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

    const variablesContext = {
        orderNumber: order.orderNumber || order._id,
        totalAmount: order.totalAmount
    };

    const sent = await sendTemplateEmail(email, 'order_confirmation', variablesContext);

    if (!sent) {
        // Fallback hardcoded logic if the template was deleted from DB
        const html = `
            <h1>Thank you for your order!</h1>
            <p>Your Order ID is <strong>${variablesContext.orderNumber}</strong></p>
            <p>Total: <strong>${variablesContext.totalAmount}€</strong></p>
            <p>We will notify you when your order ships.</p>
        `;
        await sendEmail({
            email,
            subject: 'Order Confirmation - HandyLand',
            message: html.replace(/<[^>]*>?/gm, ''),
            html
        });
    }
};

const EmailTemplate = require('../models/EmailTemplate');

const sendTemplateEmail = async (email, templateName, variablesContext = {}) => {
    try {
        const template = await EmailTemplate.findOne({ name: templateName, isActive: true });
        if (!template) {
            console.warn(`⚠️ Email template '${templateName}' not found or inactive. Falling back to default.`);
            return false;
        }

        let html = template.html;
        let subject = template.subject;

        // Replace all {{variableName}} in HTML and Subject
        for (const [key, value] of Object.entries(variablesContext)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            subject = subject.replace(regex, value);
        }

        await sendEmail({
            email,
            subject,
            html,
            message: html.replace(/<[^>]*>?/gm, '') // Strip HTML tags for plain text fallback
        });
        return true;
    } catch (error) {
        console.error(`❌ Error sending template email '${templateName}':`, error);
        return false;
    }
};

const STATUS_LABELS = {
    pending: { label: 'Pending', emoji: '⏳', color: '#f59e0b' },
    processing: { label: 'Processing', emoji: '📦', color: '#3b82f6' },
    shipped: { label: 'Shipped', emoji: '🚚', color: '#8b5cf6' },
    delivered: { label: 'Delivered', emoji: '✅', color: '#10b981' },
    cancelled: { label: 'Cancelled', emoji: '❌', color: '#ef4444' },
};

const emailTemplates = {
    orderConfirmation: (name, order) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:32px;text-align:center;">
                <h1 style="margin:0;font-size:24px;color:#fff;">HandyLand</h1>
                <p style="color:#94a3b8;margin:8px 0 0;">Order Confirmation</p>
            </div>
            <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 16px;">Hi ${name || 'Customer'} 👋</h2>
                <p style="color:#94a3b8;">Thank you for your order! We've received it and are getting it ready.</p>
                <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:#94a3b8;">Order Number</span>
                        <strong style="color:#fff;">${order.orderNumber}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">Total</span>
                        <strong style="color:#10b981;">€${order.totalAmount?.toFixed(2) || '0.00'}</strong>
                    </div>
                </div>
            </div>
            <div style="padding:16px 32px;background:#1e293b;text-align:center;">
                <p style="color:#64748b;font-size:12px;margin:0;">© HandyLand. All rights reserved.</p>
            </div>
        </div>
    `,

    orderStatusUpdate: (name, order, newStatus, adminNote) => {
        const s = STATUS_LABELS[newStatus] || { label: newStatus, emoji: '📋', color: '#3b82f6' };
        return `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:32px;text-align:center;">
                <h1 style="margin:0;font-size:24px;color:#fff;">HandyLand</h1>
                <p style="color:#94a3b8;margin:8px 0 0;">Order Status Update</p>
            </div>
            <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 8px;">Hi ${name || 'Customer'} 👋</h2>
                <p style="color:#94a3b8;margin:0 0 24px;">Your order status has been updated.</p>

                <div style="text-align:center;padding:24px;background:#1e293b;border-radius:12px;margin-bottom:24px;border:1px solid ${s.color}40;">
                    <div style="font-size:40px;margin-bottom:8px;">${s.emoji}</div>
                    <div style="font-size:20px;font-weight:bold;color:${s.color};">${s.label}</div>
                </div>

                <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:${adminNote ? '16px' : '24px'};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:#94a3b8;">Order Number</span>
                        <strong style="color:#fff;">${order.orderNumber}</strong>
                    </div>
                    ${order.trackingNumber ? `
                    <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #334155;">
                        <span style="color:#94a3b8;">Tracking Number</span>
                        <strong style="color:#a78bfa;font-family:monospace;">${order.trackingNumber}</strong>
                    </div>` : ''}
                </div>

                ${adminNote ? `
                <div style="background:#1e3a5f;border:1px solid #3b82f640;border-radius:8px;padding:16px;margin-bottom:24px;">
                    <p style="color:#93c5fd;font-size:12px;font-weight:bold;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Message from our team</p>
                    <p style="color:#e2e8f0;margin:0;font-style:italic;">"${adminNote}"</p>
                </div>` : ''}

                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?tab=orders"
                   style="display:block;text-align:center;background:#3b82f6;color:#fff;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;">
                    View My Orders →
                </a>
            </div>
            <div style="padding:16px 32px;background:#1e293b;text-align:center;">
                <p style="color:#64748b;font-size:12px;margin:0;">© HandyLand. All rights reserved.</p>
            </div>
        </div>
        `;
    }
};

module.exports = {
    sendEmail,
    sendOrderConfirmation,
    sendTemplateEmail,
    emailTemplates,
    clearSmtpCache
};

const Settings = require('../models/Settings');
const { clearCache } = require('../middleware/cache');
const User = require('../models/User');
const Review = require('../models/Review');
const RepairTicket = require('../models/RepairTicket');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const fs = require('fs');
const path = require('path');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            // Create default settings if not exists
            settings = await Settings.create({});
        }

        const settingsObj = settings.toObject();

        // Secure Payment Config (Mask Secret Key and Webhook Secret)
        if (settingsObj.payment) {
            if (settingsObj.payment.stripe) {
                settingsObj.payment.stripe.secretKey = undefined; // Do not expose secret key
                settingsObj.payment.stripe.webhookSecret = undefined; // Do not expose webhook secret
            }
            if (settingsObj.payment.paypal) {
                settingsObj.payment.paypal.clientSecret = undefined; // Do not expose PayPal secret
            }
        }

        // Fetch Coupon Details for Promo Popup
        if (settingsObj.promoPopup && settingsObj.promoPopup.enabled && settingsObj.promoPopup.couponCode) {
            const coupon = await Coupon.findOne({ code: settingsObj.promoPopup.couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                settingsObj.promoPopup.couponDetails = {
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue || coupon.amount,
                    validUntil: coupon.validUntil,
                    usageLimit: coupon.usageLimit,
                    usedCount: coupon.usedCount,
                };
            }
        }

        res.status(200).json(settingsObj);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get public payment configuration (safe for frontend — no secret keys)
// @route   GET /api/settings/payment-config
// @access  Public
exports.getPaymentConfig = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        const p = settings?.payment || {};

        res.status(200).json({
            stripe: {
                enabled: p.stripe?.enabled || false,
                publicKey: p.stripe?.publicKey || process.env.STRIPE_PUBLIC_KEY || ''
            },
            paypal: {
                enabled: p.paypal?.enabled || false,
                clientId: p.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || ''
            },
            klarna:      { enabled: p.klarna?.enabled || false },
            sepa:        { enabled: p.sepa?.enabled || false },
            sofort:      { enabled: p.sofort?.enabled || false },
            bankTransfer: {
                enabled: p.bankTransfer?.enabled !== false,
                bankName:       p.bankTransfer?.bankName || '',
                accountHolder:  p.bankTransfer?.accountHolder || '',
                iban:           p.bankTransfer?.iban || '',
                bic:            p.bankTransfer?.bic || '',
                instructions:   p.bankTransfer?.instructions || ''
            },
            cashOnDelivery: { enabled: p.cashOnDelivery?.enabled !== false }
        });
    } catch (error) {
        console.error("Error fetching payment config:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        const updateData = {};
        const allowedFields = [
            'siteName', 'contactEmail', 'footerText', 'navbar', 'language',
            'hero', 'stats', 'valuation', 'content',
            'repairArchive', 'sections', 'contactSection', 'footerSection',
            'freeShippingThreshold', 'payment', 'announcementBanner', 'promoPopup', 'socialAuth',
            'invoice', 'seo', 'taxRate', 'vipTiers', 'ecoImpact', 'quickReplies', 'maintenanceMode', 'features', 'accountSuspension', 'productFaqs', 'accessoryFaqs', 'accessoryCategories'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (!settings) {
            settings = await Settings.create(updateData);
        } else {
            // Use findOneAndUpdate to ensure atomic update
            settings = await Settings.findOneAndUpdate(
                {},
                { $set: updateData },
                { new: true, runValidators: true, upsert: true } // upsert creates if not found
            );
        }

        clearCache('/api/settings');

        // Sync MAINTENANCE_MODE file for server.js middleware
        if (req.body.maintenanceMode !== undefined) {
            const MAINTENANCE_FLAG = path.join(__dirname, '../MAINTENANCE_MODE');
            if (req.body.maintenanceMode.enabled) {
                try {
                    fs.writeFileSync(MAINTENANCE_FLAG, JSON.stringify({
                        title: req.body.maintenanceMode.title,
                        message: req.body.maintenanceMode.message,
                        estimatedTime: req.body.maintenanceMode.estimatedTime,
                        statusText1: req.body.maintenanceMode.statusText1,
                        statusText2: req.body.maintenanceMode.statusText2
                    }));
                } catch(e) { console.error('Failed to create MAINTENANCE_MODE file', e); }
            } else {
                if (fs.existsSync(MAINTENANCE_FLAG)) {
                    try {
                        fs.unlinkSync(MAINTENANCE_FLAG);
                    } catch(e) { console.error('Failed to remove MAINTENANCE_MODE file', e); }
                }
            }
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ── SMTP Settings ────────────────────────────────────────────────────────────

const { encrypt, decrypt } = require('../utils/encryption');

// @desc    Get SMTP settings (password masked)
// @route   GET /api/settings/smtp
// @access  Private/Admin
exports.getSmtpSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        const smtp = settings?.smtp || {};

        res.status(200).json({
            success: true,
            data: {
                host: smtp.host || process.env.SMTP_HOST || '',
                port: smtp.port || parseInt(process.env.SMTP_PORT) || 587,
                secure: smtp.secure || false,
                user: smtp.user || process.env.SMTP_USER || '',
                pass: smtp.isConfigured ? '••••••••' : '',
                fromEmail: smtp.fromEmail || process.env.FROM_EMAIL || '',
                fromName: smtp.fromName || process.env.FROM_NAME || 'HandyLand',
                isConfigured: smtp.isConfigured || false,
                source: smtp.isConfigured ? 'database' : (process.env.SMTP_HOST ? 'env' : 'none')
            }
        });
    } catch (error) {
        console.error("Error fetching SMTP settings:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update SMTP settings (encrypts password)
// @route   PUT /api/settings/smtp
// @access  Private/Admin
exports.updateSmtpSettings = async (req, res) => {
    try {
        const { host, port, secure, user, pass, fromEmail, fromName } = req.body;

        if (!host || !user) {
            return res.status(400).json({ success: false, message: 'SMTP Host und Benutzer sind erforderlich.' });
        }

        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});

        const smtpData = {
            host,
            port: parseInt(port) || 587,
            secure: secure || false,
            user,
            fromEmail: fromEmail || user,
            fromName: fromName || 'HandyLand',
            isConfigured: true
        };

        // Only encrypt if password changed (not the mask)
        if (pass && pass !== '••••••••') {
            smtpData.pass = encrypt(pass);
        } else {
            // Keep existing encrypted password
            smtpData.pass = settings.smtp?.pass || '';
        }

        settings = await Settings.findOneAndUpdate(
            {},
            { $set: { smtp: smtpData } },
            { new: true, upsert: true }
        );

        clearCache('/api/settings');

        // Clear emailService SMTP cache so new config takes effect immediately
        const { clearSmtpCache } = require('../utils/emailService');
        clearSmtpCache();

        res.status(200).json({
            success: true,
            message: 'SMTP-Einstellungen erfolgreich gespeichert.',
            data: {
                ...smtpData,
                pass: '••••••••' // Never return actual password
            }
        });
    } catch (error) {
        console.error("Error updating SMTP settings:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Test SMTP connection
// @route   POST /api/settings/smtp/test
// @access  Private/Admin
exports.testSmtpConnection = async (req, res) => {
    try {
        const { host, port, secure, user, pass, fromEmail, fromName } = req.body;
        const nodemailer = require('nodemailer');

        // Resolve password: use provided or decrypt from DB
        let actualPass = pass;
        if (!pass || pass === '••••••••') {
            const settings = await Settings.findOne();
            if (settings?.smtp?.pass) {
                actualPass = decrypt(settings.smtp.pass);
            } else {
                actualPass = process.env.SMTP_PASS || '';
            }
        }

        if (!host || !user || !actualPass) {
            return res.status(400).json({
                success: false,
                message: 'Bitte alle SMTP-Felder ausfüllen.'
            });
        }

        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port) || 587,
            secure: secure || false,
            auth: { user, pass: actualPass },
            connectionTimeout: 10000,
            greetingTimeout: 5000
        });

        // Verify connection
        await transporter.verify();

        // Send a test email to the admin
        await transporter.sendMail({
            from: `${fromName || 'HandyLand'} <${fromEmail || user}>`,
            to: user,
            subject: '✅ HandyLand SMTP Verbindungstest',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
                    <h2 style="color:#06b6d4;margin:0 0 16px;">✅ SMTP Verbindung erfolgreich!</h2>
                    <p style="color:#94a3b8;line-height:1.6;">Ihre E-Mail-Einstellungen funktionieren einwandfrei. HandyLand kann jetzt E-Mails über diesen Server versenden.</p>
                    <hr style="border:1px solid #1e293b;margin:20px 0;">
                    <p style="color:#64748b;font-size:12px;">Server: ${host}:${port} | Benutzer: ${user}</p>
                </div>
            `
        });

        res.status(200).json({
            success: true,
            message: 'Verbindung erfolgreich! Test-E-Mail wurde gesendet.'
        });

    } catch (error) {
        console.error("[SMTP Test] Failed:", error.message);
        res.status(400).json({
            success: false,
            message: `Verbindung fehlgeschlagen: ${error.message}`
        });
    }
};

// ── Social Auth Settings ─────────────────────────────────────────────────────

// @desc    Get Social Auth settings (secrets masked)
// @route   GET /api/settings/social-auth
// @access  Private/Admin
exports.getSocialAuthSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        const socialAuth = settings?.socialAuth || {};

        res.status(200).json({
            success: true,
            data: {
                google: {
                    enabled: socialAuth.google?.enabled || false,
                    clientId: socialAuth.google?.clientId || process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: socialAuth.google?.isConfigured ? '••••••••' : '',
                    isConfigured: socialAuth.google?.isConfigured || false,
                    source: socialAuth.google?.isConfigured ? 'database' : (process.env.GOOGLE_CLIENT_ID ? 'env' : 'none')
                },
                facebook: {
                    enabled: socialAuth.facebook?.enabled || false,
                    appId: socialAuth.facebook?.appId || process.env.FACEBOOK_APP_ID || '',
                    appSecret: socialAuth.facebook?.isConfigured ? '••••••••' : '',
                    isConfigured: socialAuth.facebook?.isConfigured || false,
                    source: socialAuth.facebook?.isConfigured ? 'database' : (process.env.FACEBOOK_APP_ID ? 'env' : 'none')
                }
            }
        });
    } catch (error) {
        console.error("Error fetching Social Auth settings:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update Social Auth settings (encrypts secrets)
// @route   PUT /api/settings/social-auth
// @access  Private/Admin
exports.updateSocialAuthSettings = async (req, res) => {
    try {
        const { google, facebook } = req.body;

        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});

        const socialAuthData = settings.socialAuth || { google: {}, facebook: {} };

        // Process Google
        if (google) {
            socialAuthData.google.enabled = google.enabled;
            socialAuthData.google.clientId = google.clientId;
            
            if (google.clientId) {
                socialAuthData.google.isConfigured = true;
            }

            if (google.clientSecret && google.clientSecret !== '••••••••') {
                socialAuthData.google.clientSecret = encrypt(google.clientSecret);
            } else if (!google.clientSecret) {
                socialAuthData.google.clientSecret = '';
                socialAuthData.google.isConfigured = false;
            }
        }

        // Process Facebook
        if (facebook) {
            socialAuthData.facebook.enabled = facebook.enabled;
            socialAuthData.facebook.appId = facebook.appId;
            
            if (facebook.appId) {
                socialAuthData.facebook.isConfigured = true;
            }

            if (facebook.appSecret && facebook.appSecret !== '••••••••') {
                socialAuthData.facebook.appSecret = encrypt(facebook.appSecret);
            } else if (!facebook.appSecret) {
                socialAuthData.facebook.appSecret = '';
                socialAuthData.facebook.isConfigured = false;
            }
        }

        settings = await Settings.findOneAndUpdate(
            {},
            { $set: { socialAuth: socialAuthData } },
            { new: true, upsert: true }
        );

        clearCache('/api/settings');

        // Reload passport strategies dynamically!
        const { initSocialStrategies } = require('../config/passport');
        await initSocialStrategies();

        res.status(200).json({
            success: true,
            message: 'Social Login-Einstellungen erfolgreich gespeichert.',
            data: {
                google: {
                    ...socialAuthData.google,
                    clientSecret: socialAuthData.google.isConfigured ? '••••••••' : ''
                },
                facebook: {
                    ...socialAuthData.facebook,
                    appSecret: socialAuthData.facebook.isConfigured ? '••••••••' : ''
                }
            }
        });
    } catch (error) {
        console.error("Error updating Social Auth settings:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

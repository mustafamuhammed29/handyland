/**
 * backend/controllers/settingsController.js
 * Settings & translations using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { clearCache } = require('../middleware/cache');

// ── @route GET /api/settings ──────────────────────────────────
exports.getSettings = async (req, res, next) => {
    try {
        const { group } = req.query;
        let query = supabaseAdmin.from('settings').select('*');
        if (group) query = query.eq('group', group);

        const { data, error } = await query;
        if (error) throw error;

        // Convert array to object key-value pairs
        const settings = {};
        data.forEach(item => { 
            try {
                // Try to parse as JSON if it looks like an object/array
                if (typeof item.value === 'string' && (item.value.startsWith('{') || item.value.startsWith('['))) {
                    let parsed = JSON.parse(item.value);
                    if (item.key === 'payment') {
                        for (const provider of Object.keys(parsed)) {
                            if (parsed[provider]) {
                                delete parsed[provider].secretKey;
                                delete parsed[provider].webhookSecret;
                            }
                        }
                    }
                    settings[item.key] = parsed;
                } else {
                    settings[item.key] = item.value;
                }
            } catch (e) {
                settings[item.key] = item.value;
            }
        });

        return res.status(200).json({ success: true, settings, data: settings });
    } catch (error) { next(error); }
};

// ── @route GET /api/settings/payment-config ───────────────────
exports.getPaymentConfig = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('value')
            .eq('key', 'payment')
            .single();

        if (error || !data || !data.value) {
            return res.status(200).json({ success: true, data: {} });
        }

        let paymentSettings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;

        // Clean out secret keys before sending to frontend
        const safeSettings = {};
        for (const [provider, config] of Object.entries(paymentSettings)) {
            safeSettings[provider] = { ...config };
            delete safeSettings[provider].secretKey;
        }

        return res.status(200).json({ success: true, data: safeSettings });
    } catch (error) {
        next(error);
    }
};

const normalizeHostname = (hostname) => {
    if (typeof hostname !== 'string') return '';
    let normalized = hostname.trim().toLowerCase();
    if (!normalized) return '';
    // Strip surrounding brackets for IPv6 if present
    if (normalized.startsWith('[') && normalized.endsWith(']')) {
        normalized = normalized.slice(1, -1);
    }
    // Remove exactly one trailing dot if present
    if (normalized.endsWith('.')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
};

exports.normalizeHostname = normalizeHostname;

const getApprovedMediaHosts = () => {
    const hosts = new Set();
    if (process.env.SUPABASE_URL) {
        try {
            const host = normalizeHostname(new URL(process.env.SUPABASE_URL).hostname);
            if (host) hosts.add(host);
        } catch (_e) {
            // Ignore invalid SUPABASE_URL string
        }
    }
    // In test/development environment only, allow localhost and 127.0.0.1
    if (process.env.NODE_ENV !== 'production') {
        hosts.add('localhost');
        hosts.add('127.0.0.1');
    }
    if (process.env.ALLOWED_MEDIA_HOSTS) {
        process.env.ALLOWED_MEDIA_HOSTS.split(',')
            .map(h => normalizeHostname(h))
            .filter(Boolean)
            .forEach(h => hosts.add(h));
    }
    return hosts;
};

// Allowed relative media path prefixes
const ALLOWED_RELATIVE_MEDIA_PREFIXES = ['/media/hero/', '/media/uploads/', '/media/'];

const isPrivateOrLoopbackHost = (rawHostname) => {
    const hostname = normalizeHostname(rawHostname);
    if (!hostname) return true;

    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
        return true;
    }

    // Helper to test IPv4 string
    const isPrivateIpv4 = (ipStr) => {
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = ipStr.match(ipv4Regex);
        if (!match) return false;
        const [_, b0, b1, b2, b3] = match.map(Number);
        if ([b0, b1, b2, b3].some(b => b < 0 || b > 255)) return true; // Malformed octet

        if (b0 === 0) return true; // Current network (0.0.0.0/8)
        if (b0 === 10) return true; // 10.0.0.0/8
        if (b0 === 127) return true; // 127.0.0.0/8 Loopback
        if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 Link-local
        if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12
        if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16
        return false;
    };

    // Check direct IPv4
    if (isPrivateIpv4(hostname)) {
        return true;
    }

    // IPv6 checks
    const lower = hostname.toLowerCase();

    // Loopback ::1 or 0:0:0:0:0:0:0:1
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1' || lower === '::') {
        return true;
    }

    // IPv4-mapped IPv6: ::ffff:a.b.c.d or ::ffff:7f00:1 (hex format)
    if (lower.startsWith('::ffff:') || lower.startsWith('0:0:0:0:0:ffff:')) {
        const mappedPart = lower.split(':ffff:')[1];
        if (mappedPart) {
            // Check if dotted decimal: e.g. 127.0.0.1
            if (isPrivateIpv4(mappedPart)) {
                return true;
            }
            // Check if hex: e.g. 7f00:0001
            const hexParts = mappedPart.split(':');
            if (hexParts.length === 2) {
                const high = parseInt(hexParts[0], 16);
                const low = parseInt(hexParts[1], 16);
                if (!isNaN(high) && !isNaN(low)) {
                    const b0 = (high >> 8) & 0xff;
                    const b1 = high & 0xff;
                    const b2 = (low >> 8) & 0xff;
                    const b3 = low & 0xff;
                    if (isPrivateIpv4(`${b0}.${b1}.${b2}.${b3}`)) {
                        return true;
                    }
                }
            }
            return true; // Any unrecognized mapped IP is rejected for safety
        }
    }

    // Unique Local Addresses (fc00::/7 -> prefix fc or fd)
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
        return true;
    }

    // Link-Local Unicast (fe80::/10 -> prefixes fe8, fe9, fea, feb)
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
        return true;
    }

    return false;
};

exports.isPrivateOrLoopbackHost = isPrivateOrLoopbackHost;

const isValidMediaUrl = (urlStr) => {
    if (typeof urlStr !== 'string') return false;
    const trimmed = urlStr.trim();
    if (!trimmed) return false;

    // Check relative path: must start with an allowed media prefix, no traversal, no double slashes
    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//') || trimmed.includes('/../') || trimmed.includes('/..') || /[<>"'`\s]/.test(trimmed)) {
            return false;
        }
        return ALLOWED_RELATIVE_MEDIA_PREFIXES.some(prefix => trimmed.startsWith(prefix));
    }

    try {
        const parsed = new URL(trimmed);

        // Reject dangerous/unsupported protocols
        const protocol = parsed.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
            return false;
        }

        // In production, strictly enforce https:
        if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
            return false;
        }

        const hostname = normalizeHostname(parsed.hostname);
        if (!hostname) return false;

        // In production, reject private/loopback/link-local addresses (even if in ALLOWED_MEDIA_HOSTS)
        if (process.env.NODE_ENV === 'production' && isPrivateOrLoopbackHost(hostname)) {
            return false;
        }

        const approvedHosts = getApprovedMediaHosts();

        // Exact match required — NO generic wildcard matching
        return approvedHosts.has(hostname);
    } catch (err) {
        return false;
    }
};

exports.isValidMediaUrl = isValidMediaUrl;

// ── @route PUT /api/settings (Admin) ──────────────────────────
exports.updateSettings = async (req, res, next) => {
    try {
        let updates = req.body;
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid body', error: 'Invalid body' });
        }
        
        // If the frontend accidentally sends the GET response format back
        if (updates.success !== undefined && updates.settings) {
            updates = updates.settings;
        }

        // Prevent reserved keys from being saved
        delete updates.success;
        delete updates.data;
        delete updates.settings;

        // Validate and merge Hero Media settings if present
        if (updates.hero) {
            let heroObj = updates.hero;
            if (typeof heroObj === 'string') {
                try {
                    heroObj = JSON.parse(heroObj);
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Invalid hero settings payload' });
                }
            }

            if (heroObj && typeof heroObj === 'object') {
                // Preserve existing hero fields if partial updates are provided
                const { data: existingHeroRow } = await supabaseAdmin.from('settings').select('value').eq('key', 'hero').maybeSingle();
                let existingHero = null;
                if (existingHeroRow && existingHeroRow.value) {
                    try {
                        existingHero = typeof existingHeroRow.value === 'string' ? JSON.parse(existingHeroRow.value) : existingHeroRow.value;
                    } catch (err) {
                        existingHero = null;
                    }
                }

                if (existingHero && typeof existingHero === 'object') {
                    heroObj = {
                        ...existingHero,
                        ...heroObj,
                        media: heroObj.media ? {
                            ...(existingHero.media || {}),
                            ...(heroObj.media || {})
                        } : existingHero.media
                    };
                }

                if (heroObj.media) {
                    const { mode, videoUrl, posterUrl } = heroObj.media;
                    if (mode !== undefined) {
                        if (mode !== 'content' && mode !== 'video') {
                            return res.status(400).json({
                                success: false,
                                message: 'Invalid Hero media mode. Mode must be either "content" or "video".'
                            });
                        }

                        if (mode === 'video') {
                            if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
                                return res.status(400).json({
                                    success: false,
                                    message: 'A valid video URL is required when Hero media mode is set to video.'
                                });
                            }

                            if (!isValidMediaUrl(videoUrl)) {
                                return res.status(400).json({
                                    success: false,
                                    message: 'Video URL must be a valid relative path (/media/hero/...) or hosted on an approved storage domain.'
                                });
                            }

                            if (posterUrl && typeof posterUrl === 'string' && posterUrl.trim()) {
                                if (!isValidMediaUrl(posterUrl)) {
                                    return res.status(400).json({
                                        success: false,
                                        message: 'Poster URL must be a valid relative path (/media/hero/...) or hosted on an approved storage domain.'
                                    });
                                }
                            }
                        }
                    }
                }

                updates.hero = heroObj;
            }
        }

        // Preserve payment secrets if they are not provided
        if (updates.payment) {
            const { data: existingData } = await supabaseAdmin.from('settings').select('value').eq('key', 'payment').single();
            if (existingData && existingData.value) {
                let existingPayment = typeof existingData.value === 'string' ? JSON.parse(existingData.value) : existingData.value;
                for (const provider of Object.keys(updates.payment)) {
                    if (existingPayment[provider]) {
                        if (!updates.payment[provider].secretKey) {
                            updates.payment[provider].secretKey = existingPayment[provider].secretKey;
                        }
                        if (!updates.payment[provider].webhookSecret && existingPayment[provider].webhookSecret) {
                            updates.payment[provider].webhookSecret = existingPayment[provider].webhookSecret;
                        }
                    }
                }
            }
        }

        const rows = Object.entries(updates)
            .filter(([key, value]) => value !== undefined && !['createdAt', 'updatedAt'].includes(key)) // Skip undefined values and timestamps
            .map(([key, value]) => {
            // Determine group based on key if possible, or leave as 'general'
            let group = 'general';
            if (['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'].includes(key)) group = 'email';
            if (['google_client_id', 'facebook_app_id'].includes(key)) group = 'social';
            
            return { 
                key, 
                value: typeof value === 'string' ? value : JSON.stringify(value),
                group 
            };
        });

        const { error } = await supabaseAdmin.from('settings').upsert(rows, { onConflict: 'key' });
        if (error) throw error;

        clearCache('/api/settings');

        return res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) { next(error); }
};

// ── SMTP Email Server Management ──────────────────────────────
const { encrypt, decrypt } = require('../utils/encryption');
const nodemailer = require('nodemailer');

exports.getSmtpSettings = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('settings')
            .select('key, value')
            .in('key', ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name']);
        
        if (error) throw error;

        const s = {};
        data.forEach(item => { s[item.key] = item.value; });

        const config = {
            host: s.smtp_host || process.env.EMAIL_HOST || '',
            port: parseInt(s.smtp_port) || parseInt(process.env.EMAIL_PORT) || 587,
            secure: s.smtp_secure === 'true' || process.env.EMAIL_SECURE === 'true',
            user: s.smtp_user || process.env.EMAIL_USER || '',
            pass: s.smtp_pass ? '********' : '',
            fromEmail: s.smtp_from_email || process.env.EMAIL_FROM || '',
            fromName: s.smtp_from_name || process.env.EMAIL_FROM_NAME || 'HandyLand',
            isConfigured: !!s.smtp_host,
            source: s.smtp_host ? 'database' : (process.env.EMAIL_HOST ? 'env' : 'none')
        };

        return res.status(200).json({ success: true, data: config });
    } catch (error) { next(error); }
};

exports.updateSmtpSettings = async (req, res, next) => {
    try {
        let { host, port, secure, user, pass, fromEmail, fromName } = req.body;
        
        // Clean host in case user entered http://
        if (host) host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        // Auto-correct secure flag for common ports to prevent SSL wrong version number error
        port = parseInt(port) || 587;
        if (port === 587) secure = false; // 587 uses STARTTLS
        if (port === 465) secure = true;  // 465 uses Implicit TLS
        
        const updates = [
            { key: 'smtp_host', value: host, group: 'email' },
            { key: 'smtp_port', value: port.toString(), group: 'email' },
            { key: 'smtp_secure', value: secure.toString(), group: 'email' },
            { key: 'smtp_user', value: user, group: 'email' },
            { key: 'smtp_from_email', value: fromEmail, group: 'email' },
            { key: 'smtp_from_name', value: fromName, group: 'email' }
        ];

        if (pass && pass !== '********') {
            updates.push({ key: 'smtp_pass', value: encrypt(pass), group: 'email' });
        }

        const { error } = await supabaseAdmin.from('settings').upsert(updates, { onConflict: 'key' });
        if (error) throw error;

        clearCache('/api/settings');

        return res.status(200).json({ success: true, message: 'SMTP settings updated' });
    } catch (error) { next(error); }
};

exports.testSmtpConnection = async (req, res, next) => {
    try {
        let { host, port, secure, user, pass, fromEmail } = req.body;
        
        if (pass === '********' || !pass) {
            const { data } = await supabaseAdmin.from('settings').select('value').eq('key', 'smtp_pass').single();
            if (data && data.value) {
                const { decrypt } = require('../utils/encryption');
                pass = decrypt(data.value);
            }
        }
        
        if (host) host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        port = parseInt(port) || 587;
        if (port === 587) secure = false;
        if (port === 465) secure = true;
        
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        });

        await transporter.verify();

        // Send test email
        await transporter.sendMail({
            from: `"${user}" <${fromEmail || user}>`,
            to: fromEmail || user,
            subject: "HandyLand SMTP Test",
            text: "SMTP connection successful! Your email server is correctly configured.",
            html: "<b>SMTP connection successful!</b><br>Your email server is correctly configured."
        });

        return res.status(200).json({ success: true, message: 'Connection successful and test email sent!' });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ── Social Auth Management ───────────────────────────────────

exports.getSocialAuthSettings = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('settings')
            .select('key, value')
            .in('key', [
                'google_enabled', 'google_client_id', 'google_client_secret',
                'facebook_enabled', 'facebook_app_id', 'facebook_app_secret'
            ]);
        
        if (error) throw error;

        const s = {};
        data.forEach(item => { s[item.key] = item.value; });

        const config = {
            google: {
                enabled: s.google_enabled === 'true',
                clientId: s.google_client_id || '',
                clientSecret: s.google_client_secret ? '********' : '',
                isConfigured: !!s.google_client_id,
                source: s.google_client_id ? 'database' : (process.env.GOOGLE_CLIENT_ID ? 'env' : 'none')
            },
            facebook: {
                enabled: s.facebook_enabled === 'true',
                appId: s.facebook_app_id || '',
                appSecret: s.facebook_app_secret ? '********' : '',
                isConfigured: !!s.facebook_app_id,
                source: s.facebook_app_id ? 'database' : (process.env.FACEBOOK_APP_ID ? 'env' : 'none')
            }
        };

        return res.status(200).json({ success: true, data: config });
    } catch (error) { next(error); }
};

exports.updateSocialAuthSettings = async (req, res, next) => {
    try {
        const { google, facebook } = req.body;
        
        const updates = [
            { key: 'google_enabled', value: google.enabled.toString(), group: 'social' },
            { key: 'google_client_id', value: google.clientId, group: 'social' },
            { key: 'facebook_enabled', value: facebook.enabled.toString(), group: 'social' },
            { key: 'facebook_app_id', value: facebook.appId, group: 'social' }
        ];

        if (google.clientSecret && google.clientSecret !== '********') {
            updates.push({ key: 'google_client_secret', value: encrypt(google.clientSecret), group: 'social' });
        }
        if (facebook.appSecret && facebook.appSecret !== '********') {
            updates.push({ key: 'facebook_app_secret', value: encrypt(facebook.appSecret), group: 'social' });
        }

        const { error } = await supabaseAdmin.from('settings').upsert(updates, { onConflict: 'key' });
        if (error) throw error;

        clearCache('/api/settings');

        return res.status(200).json({ success: true, message: 'Social Auth settings updated' });
    } catch (error) { next(error); }
};

// ── @route GET /api/translations/:lang ────────────────────────
exports.getTranslations = async (req, res, next) => {
    try {
        const { lang } = req.params;
        const { namespace = 'common' } = req.query;

        const { data, error } = await supabaseAdmin
            .from('translations')
            .select('key, value')
            .eq('language', lang)
            .eq('namespace', namespace);

        if (error) throw error;

        const translations = {};
        data.forEach(item => { translations[item.key] = item.value; });

        return res.status(200).json({ success: true, data: translations });
    } catch (error) { next(error); }
};

// ── @route PUT /api/translations/:lang (Admin) ────────────────
exports.updateTranslations = async (req, res, next) => {
    try {
        const { lang } = req.params;
        const { namespace = 'common' } = req.query;
        const translations = req.body; // { "hello": "Hallo", ... }

        for (const [key, value] of Object.entries(translations)) {
            await supabaseAdmin.from('translations')
                .upsert({ key, language: lang, namespace, value }, { onConflict: 'key,language,namespace' });
        }

        clearCache('/api/translations');

        return res.status(200).json({ success: true, message: 'Translations updated' });
    } catch (error) { next(error); }
};

// ── @route POST /api/settings/invoice/test (Admin) ──────────────
exports.generateTestInvoice = async (req, res, next) => {
    try {
        const { orderData, invoiceSettings } = req.body;
        const PDFDocument = require('pdfkit');
        
        // Ensure required fields
        if (!orderData || !invoiceSettings) {
            return res.status(400).json({ success: false, message: 'Missing orderData or invoiceSettings' });
        }

        // Add dummy created_at and order_number if missing
        if (!orderData.created_at) orderData.created_at = new Date().toISOString();
        if (!orderData.order_number) orderData.order_number = 'TEST-9999';

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=test-invoice.pdf`);
        
        doc.pipe(res);

        // Generate PDF using professional template
        const { generatePDF } = require('../utils/invoiceGenerator');
        await generatePDF(doc, orderData, invoiceSettings);

        doc.end();
    } catch (error) {
        next(error);
    }
};

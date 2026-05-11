/**
 * backend/controllers/settingsController.js
 * Settings & translations using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

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
                    settings[item.key] = JSON.parse(item.value);
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

// ── @route PUT /api/settings (Admin) ──────────────────────────
exports.updateSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid body' });
        }

        const rows = Object.entries(updates)
            .filter(([_, value]) => value !== undefined) // Skip undefined values
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
            auth: { user, pass }
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

        return res.status(200).json({ success: true, message: 'Translations updated' });
    } catch (error) { next(error); }
};

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
        const updates = req.body; // e.g. { store_name: "HandyLand", ... }
        
        for (const [key, value] of Object.entries(updates)) {
            await supabaseAdmin.from('settings')
                .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' });
        }

        return res.status(200).json({ success: true, message: 'Settings updated' });
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

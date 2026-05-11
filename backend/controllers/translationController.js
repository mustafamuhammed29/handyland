'use strict';
/**
 * backend/controllers/translationController.js
 * Translations CRUD — migrated from MongoDB to Supabase.
 *
 * Supabase schema (public.translations):
 *   id UUID, key TEXT, namespace TEXT, language TEXT, value TEXT
 *   UNIQUE(key, language)
 */

const { supabaseAdmin } = require('../config/supabase');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Collapse flat rows [ {key, language, value} ] into nested { key: {lang: value} }
function rowsToMap(rows) {
    const map = {};
    for (const row of rows) {
        if (!map[row.key]) map[row.key] = { _id: row.id, key: row.key, namespace: row.namespace, values: {} };
        map[row.key].values[row.language] = row.value;
    }
    return Object.values(map);
}

// ── @route GET /api/translations ─────────────────────────────────────────────
exports.getAllTranslations = async (req, res) => {
    try {
        const { search, page = 1, limit = 0 } = req.query;

        let query = supabaseAdmin.from('translations').select('*').order('namespace').order('key');
        if (search) {
            query = query.or(`key.ilike.%${search}%,namespace.ilike.%${search}%,value.ilike.%${search}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const grouped = rowsToMap(data || []);

        res.status(200).json({
            success: true,
            count: grouped.length,
            data: grouped,
            totalPages: 1,
            currentPage: 1
        });
    } catch (error) {
        console.error('getAllTranslations error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ── @route GET /api/translations/locales/:lang ───────────────────────────────
exports.getTranslationsByLocale = async (req, res) => {
    try {
        const { lang } = req.params;

        const { data, error } = await supabaseAdmin
            .from('translations')
            .select('key, value, language')
            .in('language', [lang, 'en']);

        if (error) throw error;

        // Build result: prefer requested lang, fallback to 'en'
        const enMap = {};
        const langMap = {};

        for (const row of (data || [])) {
            if (row.language === 'en') enMap[row.key] = row.value;
            if (row.language === lang) langMap[row.key] = row.value;
        }

        const result = {};
        const allKeys = new Set([...Object.keys(enMap), ...Object.keys(langMap)]);
        for (const key of allKeys) {
            const val = langMap[key] || enMap[key] || '';
            // Reject polluted values (key stored as its own value)
            result[key] = val === key ? '' : val;
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('getTranslationsByLocale error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// ── @route PUT /api/translations/:id ─────────────────────────────────────────
exports.updateTranslation = async (req, res) => {
    try {
        const { id } = req.params;
        const { values } = req.body;

        if (!values || typeof values !== 'object') {
            return res.status(400).json({ success: false, error: 'values object required' });
        }

        // Fetch existing row to get key & namespace
        const { data: existing, error: fetchErr } = await supabaseAdmin
            .from('translations').select('key, namespace').eq('id', id).single();
        if (fetchErr || !existing) return res.status(404).json({ success: false, error: 'Translation not found' });

        // Upsert each language value
        const upserts = Object.entries(values).map(([lang, val]) => ({
            key: existing.key,
            namespace: existing.namespace,
            language: lang,
            value: val
        }));

        const { error } = await supabaseAdmin.from('translations').upsert(upserts, { onConflict: 'key,language' });
        if (error) throw error;

        res.status(200).json({ success: true, data: { _id: id, key: existing.key, values } });
    } catch (error) {
        console.error('updateTranslation error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ── @route POST /api/translations ────────────────────────────────────────────
exports.createTranslation = async (req, res) => {
    try {
        const { key, namespace = 'translation', values = {} } = req.body;
        if (!key) return res.status(400).json({ success: false, error: 'key is required' });

        // Check duplicate
        const { data: existing } = await supabaseAdmin
            .from('translations').select('id').eq('key', key).eq('language', 'de').limit(1);
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Translation key already exists' });
        }

        const rows = Object.entries(values).map(([lang, val]) => ({ key, namespace, language: lang, value: val }));
        if (rows.length === 0) rows.push({ key, namespace, language: 'de', value: '' });

        const { error } = await supabaseAdmin.from('translations').insert(rows);
        if (error) throw error;

        // Fetch newly created to get an ID for one of the rows
        const { data: created } = await supabaseAdmin.from('translations').select('id').eq('key', key).limit(1).single();

        res.status(201).json({ success: true, data: { _id: created?.id, key, namespace, values } });
    } catch (error) {
        console.error('createTranslation error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ── @route DELETE /api/translations/:id ──────────────────────────────────────
exports.deleteTranslation = async (req, res) => {
    try {
        const { id } = req.params;

        // Get key first, then delete all languages for that key
        const { data: row } = await supabaseAdmin.from('translations').select('key').eq('id', id).single();
        if (!row) return res.status(404).json({ success: false, error: 'Translation not found' });

        const { error } = await supabaseAdmin.from('translations').delete().eq('key', row.key);
        if (error) throw error;

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error('deleteTranslation error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ── @route POST /api/translations/missing/:lang/:namespace ───────────────────
exports.saveMissingTranslation = async (req, res) => {
    try {
        const { lang, namespace } = req.params;
        const keys = Object.keys(req.body || {});

        if (!keys.length) return res.status(200).json({ success: true });

        const upserts = [];
        for (const key of keys) {
            const rawVal = req.body[key] || '';
            // Reject polluted values where key === value (i18next saveMissing behavior)
            const value = rawVal === key ? '' : rawVal;
            const ns = key.includes('.') ? key.split('.')[0] : (namespace || 'translation');
            upserts.push({ key, namespace: ns, language: lang, value });
        }

        // Use ignoreDuplicates to avoid overwriting existing real values
        const { error } = await supabaseAdmin.from('translations')
            .upsert(upserts, { onConflict: 'key,language', ignoreDuplicates: true });

        if (error) console.warn('saveMissingTranslation upsert warn:', error.message);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('saveMissing error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ── @route POST /api/translations/auto-translate ─────────────────────────────
exports.autoTranslate = async (req, res) => {
    try {
        const { text, from = 'en', toLangs = ['de', 'ar', 'tr', 'ru', 'fa'] } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

        const results = {};
        for (const lang of toLangs) {
            try {
                const response = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${lang}&de=test@example.com`
                );
                const data = await response.json();
                const translated = data?.responseData?.translatedText || text;
                results[lang] = translated.includes('MYMEMORY') ? text : translated;
            } catch (e) {
                results[lang] = text;
            }
        }

        res.status(200).json({ success: true, translated: results });
    } catch (error) {
        console.error('autoTranslate error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

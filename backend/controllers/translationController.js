const Translation = require('../models/Translation');
const { clearCache } = require('../middleware/cache');

// @desc    Get all translations (Admin panel format)
// @route   GET /api/translations
// @access  Private/Admin
exports.getAllTranslations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 0; // 0 means no limit
        const skip = (page - 1) * (limit || 0);
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query.$or = [
                { key: { $regex: search, $options: 'i' } },
                { namespace: { $regex: search, $options: 'i' } },
                { 'values.en': { $regex: search, $options: 'i' } },
                { 'values.de': { $regex: search, $options: 'i' } }
            ];
        }

        const count = await Translation.countDocuments(query);
        const translationsQuery = Translation.find(query).sort({ namespace: 1, key: 1 });
        
        if (limit > 0) {
            translationsQuery.skip(skip).limit(limit);
        }

        const translations = await translationsQuery;

        res.status(200).json({
            success: true,
            count,
            data: translations,
            totalPages: limit > 0 ? Math.ceil(count / limit) : 1,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get compacted translations for i18next engine based on language code
// @route   GET /api/translations/locales/:lang
// @access  Public
exports.getTranslationsByLocale = async (req, res) => {
    try {
        const { lang } = req.params;

        const translations = await Translation.find();

        const result = {};

        translations.forEach(doc => {
            const rawValue = doc.values[lang];
            const rawEn    = doc.values['en'];

            // FIX: If the stored value equals the key name, it is polluted data
            // (i18next saveMissing sends the key itself as a placeholder).
            // Return empty string so the UI shows '-' instead of the key.
            const cleanValue = (v) =>
                v && v !== doc.key ? v : null;

            const value = cleanValue(rawValue) || cleanValue(rawEn) || '';
            result[doc.key] = value;
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching locale:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Update a specific translation row
// @route   PUT /api/translations/:id
// @access  Private/Admin
exports.updateTranslation = async (req, res) => {
    try {
        const translation = await Translation.findById(req.params.id);
        if (!translation) {
            return res.status(404).json({ success: false, error: 'Translation not found' });
        }

        // We only update the language values container to prevent key mismatches in frontend
        if (req.body.values) {
            translation.values = {
                ...translation.values,
                ...req.body.values
            };
        }

        await translation.save();
        clearCache('/api/translations');

        res.status(200).json({
            success: true,
            data: translation
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Add a new translation key
// @route   POST /api/translations
// @access  Private/Admin
exports.createTranslation = async (req, res) => {
    try {
        const { key, namespace, values } = req.body;

        if (!key) {
             return res.status(400).json({ success: false, error: 'Translation key is required' });
        }

        const existing = await Translation.findOne({ key });
        if (existing) {
             return res.status(400).json({ success: false, error: 'Translation key already exists' });
        }

        const translation = await Translation.create({
            key,
            namespace: namespace || 'translation',
            values: values || {}
        });

        clearCache('/api/translations');

        res.status(201).json({
            success: true,
            data: translation
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Translation key already exists' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete a translation key
// @route   DELETE /api/translations/:id
// @access  Private/Admin
exports.deleteTranslation = async (req, res) => {
    try {
        const translation = await Translation.findById(req.params.id);
        if (!translation) {
             return res.status(404).json({ success: false, error: 'Translation not found' });
        }

        await translation.deleteOne();
        clearCache('/api/translations');

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Auto-capture missing translation key from frontend
// @route   POST /api/translations/missing/:lang/:namespace
// @access  Public
exports.saveMissingTranslation = async (req, res) => {
    try {
        const { lang, namespace } = req.params;
        const keys = Object.keys(req.body);

        if (!keys || keys.length === 0) {
            return res.status(200).json({ success: true, message: 'No keys provided' });
        }

        let updated = false;

        for (const key of keys) {
            // FIX: i18next sends the key itself as the fallback value when a key is missing.
            // e.g. body = { "valuation.newValuation": "valuation.newValuation" }
            // We must reject this — storing the key as a value poisons the DB.
            const rawFallback = req.body[key] || '';
            const fallbackValue = rawFallback === key ? '' : rawFallback;

            const existing = await Translation.findOne({ key });

            if (!existing) {
                // Register the key so admins can fill it in the Translation Manager
                const dbNamespace = key.includes('.') ? key.split('.')[0] : (namespace || 'translation');
                await Translation.create({
                    key,
                    namespace: dbNamespace,
                    values: {
                        // Only store a real value — never the key name
                        ...(fallbackValue ? { [lang]: fallbackValue } : {})
                    }
                });
                updated = true;
            } else if (fallbackValue && !existing.values[lang]) {
                // Only fill in a genuinely missing language slot with a real value
                existing.values[lang] = fallbackValue;
                existing.markModified('values');
                await existing.save();
                updated = true;
            }
        }

        if (updated) {
            clearCache('/api/translations');
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('saveMissing error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Auto-translate a text to multiple languages using a public API
// @route   POST /api/translations/auto-translate
// @access  Private/Admin
exports.autoTranslate = async (req, res) => {
    try {
        const { text, from = 'en', toLangs = ['de', 'ar', 'tr', 'ru', 'fa'] } = req.body;
        if (!text) {return res.status(400).json({ success: false, error: 'Text is required for translation' });}

        const results = {};

        // Loop through target languages and translate using free MyMemory API
        for (const lang of toLangs) {
            try {
                // MyMemory has a 500 words/day limit for free anonymous usage, sufficient for key translations.
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${lang}&de=test@example.com`);
                const data = await response.json();

                if (data.responseData && data.responseData.translatedText) {
                    // MyMemory sometimes echoes the search query or includes "MYMEMORY WARNING"
                    const translated = data.responseData.translatedText;
                    if (!translated.includes('MYMEMORY')) {
                        results[lang] = translated;
                    } else {
                        results[lang] = text;
                    }
                } else {
                    results[lang] = text;
                }
            } catch(e) {
                console.error(`Translation fail for ${lang}:`, e.message);
                results[lang] = text;
            }
        }

        res.status(200).json({ success: true, translated: results });
    } catch (error) {
        console.error('autoTranslate error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

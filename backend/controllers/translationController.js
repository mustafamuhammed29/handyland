const Translation = require('../models/Translation');
const { clearCache } = require('../middleware/cache');

// @desc    Get all translations (Admin panel format)
// @route   GET /api/translations
// @access  Private/Admin
exports.getAllTranslations = async (req, res) => {
    try {
        const translations = await Translation.find().sort({ namespace: 1, key: 1 });
        res.status(200).json({
            success: true,
            count: translations.length,
            data: translations
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

        // Find all translation rows that have a value for the requested language
        const translations = await Translation.find();

        // Compact into the { "key.nested": "value" } structure i18next expects
        const result = {};

        translations.forEach(doc => {
            // We use the 'en' translation as fallback if the target string is empty
            const value = doc.values[lang] || doc.values['en'] || doc.key;

            // i18next handles dot notation ('nav.home') natively, meaning we can just return a flat key map
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

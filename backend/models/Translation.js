const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Translation key is required'],
        unique: true,
        trim: true,
        index: true
    },
    namespace: {
        type: String,
        default: 'translation',
        trim: true
    },
    values: {
        en: { type: String, default: '' },
        de: { type: String, default: '' },
        ar: { type: String, default: '' },
        tr: { type: String, default: '' },
        ru: { type: String, default: '' },
        fa: { type: String, default: '' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Translation', TranslationSchema);

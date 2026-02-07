const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        enum: ['agb', 'datenschutz', 'impressum', 'kundenservice', 'ueber-uns']
    },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);

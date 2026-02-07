const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: String,
    contactEmail: String,
    footerText: String,
    navbar: {
        logoText: String,
        logoAccentText: String,
        showLanguageSwitcher: Boolean
    },
    hero: {
        headline: String,
        subheadline: String,
        bgStart: String,
        bgEnd: String,
        accentColor: String,
        buttonMarket: String,
        buttonValuation: String,
        heroImage: String,
        productName: String,
        productPrice: String,
        productLabel: String,
        stat1Title: String,
        stat1Value: String,
        stat2Title: String,
        stat2Value: String,
        trustBadge1: String,
        trustBadge2: String,
        trustBadge3: String
    },
    stats: {
        devicesRepaired: Number,
        happyCustomers: Number,
        averageRating: Number,
        marketExperience: Number
    },
    valuation: {
        step1Title: String,
        step1Subtitle: String,
        step1ModelTitle: String,
        step2Title: String,
        step3Title: String,
        resetBtn: String,
        saveBtn: String,
        sellBtn: String,
        brands: [{
            id: String,
            name: String,
            icon: String
        }],
        models: [{
            id: String,
            name: String,
            brandId: String,
            basePrice: Number
        }],
        storageOptions: [{
            label: String,
            multiplier: Number
        }],
        conditionOptions: [{
            id: String,
            label: String,
            multiplier: Number,
            color: String
        }],
        batteryOptions: [{
            id: String,
            label: String,
            multiplier: Number
        }]
    },
    content: {
        accessoriesTitle: String,
        accessoriesSubtitle: String,
        repairTitle: String,
        repairSubtitle: String
    },
    repairArchive: {
        title: String,
        subtitle: String,
        buttonText: String,
        totalRepairs: Number
    },
    sections: {
        hero: { type: Boolean, default: true },
        stats: { type: Boolean, default: true },
        repairGallery: { type: Boolean, default: true },
        marketplace: { type: Boolean, default: true },
        accessories: { type: Boolean, default: true },
        contact: { type: Boolean, default: true }
    },
    contactSection: {
        address: String,
        phone: String,
        email: String,
        formTitle: String,
        formButton: String,
        mapUrl: String,
        socialLinks: {
            facebook: String,
            instagram: String,
            twitter: String,
            linkedin: String,
            youtube: String
        }
    },
    footerSection: {
        tagline: String,
        copyright: String
    }
}, { timestamps: true });

// We expect only one settings document
module.exports = mongoose.model('Settings', settingsSchema);

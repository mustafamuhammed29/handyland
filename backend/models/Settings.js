const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: String,
    contactEmail: String,
    freeShippingThreshold: {
        type: Number,
        default: 100
    },
    footerText: String,
    language: {
        type: String,
        default: 'de',
        enum: ['de', 'en', 'ar', 'tr', 'ru', 'fa']
    },
    navbar: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    hero: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    valuation: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    stats: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    payment: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
            paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox' },
            bankTransfer: {
                enabled: false,
                instructions: '',
                bankName: '',
                accountHolder: '',
                iban: '',
                bic: ''
            },
            cashOnDelivery: { enabled: true }
        }
    },
    repairArchive: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    sections: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    footerSection: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    contactSection: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    announcementBanner: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            enabled: false,
            text: '',
            color: 'blue',
            dismissible: true,
            link: '',
            linkText: ''
        }
    },
    promoPopup: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            enabled: false,
            title: '',
            message: '',
            couponCode: '',
            delay: 5
        }
    },
    socialAuth: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            google: false,
            facebook: false
        }
    },
    quickReplies: {
        type: [String],
        default: [
            "We have received your message and are looking into it.",
            "Please provide us with your order number so we can investigate further.",
            "Your repair is currently in progress. We will update you soon.",
            "Thank you for reaching out. Your issue has been resolved."
        ]
    },
    seo: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            defaultMetaTitle: 'HandyLand - E-Commerce & Repair Services',
            defaultMetaDescription: 'Your one-stop shop for electronics, mobile phones, and reliable repair services.',
            defaultKeywords: 'handyland, electronics, mobile repair, buy phones, sell phones',
            defaultOgImage: '',
            faviconUrl: '',
            googleAnalyticsId: '',
            facebookPixelId: ''
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

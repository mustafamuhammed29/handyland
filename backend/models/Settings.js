const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: String,
    contactEmail: String,
    freeShippingThreshold: {
        type: Number,
        default: 100
    },
    footerText: String,
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
            paypal: { enabled: false, clientId: '' },
            bankTransfer: { enabled: false, instructions: '' },
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
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

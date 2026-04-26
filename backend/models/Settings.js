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
    features: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            comparisonEngine: true,
            cartUpselling: true,
            whatsappOrders: {
                enabled: false,
                phoneNumber: '',
                message: 'مرحباً، أود الاستفسار عن هذا الطلب/الخدمة:'
            },
            loyalty: {
                enabled: true,
                earnRate: 10,
                redeemRate: 100,
                silverThreshold: 500,
                goldThreshold: 2000,
                platinumThreshold: 5000
            }
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
    },
    taxRate: {
        type: Number,
        default: 19
    },
    vipTiers: {
        type: mongoose.Schema.Types.Mixed,
        default: [
            { id: 'bronze', name: 'Bronze', color: 'from-[#cd7f32] to-[#8b5a2b]', minSpent: 0, maxSpent: 500 },
            { id: 'silver', name: 'Silver', color: 'from-slate-300 to-slate-500', minSpent: 500, maxSpent: 2000 },
            { id: 'gold', name: 'Gold', color: 'from-amber-400 to-yellow-600', minSpent: 2000, maxSpent: 5000 },
            { id: 'platinum', name: 'Platinum', color: 'from-slate-200 to-slate-400', minSpent: 5000, maxSpent: 10000 },
            { id: 'diamond', name: 'Diamond', color: 'from-cyan-300 to-blue-500', minSpent: 10000, maxSpent: 50000 }
        ]
    },
    ecoImpact: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            enabled: true,
            co2PerDevice: 79,
            eWastePerDevice: 0.18
        }
    },
    invoice: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            logoUrl: '',
            primaryColor: '#00bcd4',
            companyName: 'HandyLand GmbH',
            companyAddress: 'Tech Street 123 - 10115 Berlin - Germany',
            vatNumber: 'DE123456789',
            bankName: '',
            iban: '',
            bic: '',
            footerText: 'Thank you for your business!',
            prefix: 'HL-',
            titleLabel: 'Invoice',
            dateLabel: 'Date:',
            numberLabel: 'Invoice #:',
            vatIdLabel: 'VAT ID:',
            subtotalLabel: 'Subtotal:',
            taxLabel: 'VAT',
            shippingLabel: 'Shipping:',
            discountLabel: 'Discount',
            totalLabel: 'Total:',
            printBtnLabel: 'Print Invoice',
            closeBtnLabel: 'Close',
            itemLabel: 'Item',
            quantityLabel: 'Quantity',
            priceLabel: 'Price'
        }
    },
    maintenanceMode: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            enabled: false,
            title: 'Wartungsarbeiten',
            message: 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!',
            estimatedTime: 'wenige Minuten',
            statusText1: 'System wird diagnostiziert...',
            statusText2: 'Neue Reparaturen werden angewendet...'
        }
    },
    accountSuspension: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            title: 'Account Suspended',
            subtitle: 'حسابك محظور من قِبَل الإدارة',
            message: 'Your account has been suspended. Please contact support for assistance.',
            supportEmail: 'support@handyland.com',
            supportLabel: 'Contact Support'
        }
    },
    productFaqs: {
        type: mongoose.Schema.Types.Mixed,
        default: [
            {
                question: 'Ist das Gerät ohne Simlock?',
                answer: 'Ja, alle unsere Geräte sind werksseitig entsperrt (ohne Simlock) und können mit jedem Netzbetreiber weltweit verwendet werden.'
            },
            {
                question: 'Was ist im Lieferumfang enthalten?',
                answer: 'Jedes Smartphone wird mit einem kompatiblen Ladekabel geliefert. Um Elektroschrott zu reduzieren, sind Netzteil und Kopfhörer nicht im Standard-Lieferumfang enthalten.'
            },
            {
                question: 'Wie lange ist die Garantie?',
                answer: 'Wir bieten standardmäßig 12 Monate Garantie auf alle unsere generalüberholten und neuen Geräte. Dies deckt alle technischen Defekte ab.'
            },
            {
                question: 'Kann ich das Gerät zurückgeben?',
                answer: 'Ja, Sie haben ein 14-tägiges Rückgaberecht ohne Angabe von Gründen, sofern sich das Gerät im gleichen Zustand wie bei der Lieferung befindet.'
            }
        ]
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

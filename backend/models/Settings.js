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
    smtp: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            host: '',
            port: 587,
            secure: false,
            user: '',
            pass: '',        // AES-256 encrypted
            fromEmail: '',
            fromName: 'HandyLand',
            isConfigured: false
        }
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
            google: { enabled: false, clientId: '', clientSecret: '', isConfigured: false },
            facebook: { enabled: false, appId: '', appSecret: '', isConfigured: false }
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
    },
    accessoryFaqs: {
        type: mongoose.Schema.Types.Mixed,
        default: [
            {
                question: 'Sind Ladekabel im Lieferumfang enthalten?',
                answer: 'Ja, unsere Ladegeräte und Kabel werden in der Originalverpackung oder als hochwertiges Zubehör geliefert.'
            },
            {
                question: 'Passen die Hüllen für alle Modelle?',
                answer: 'Bitte überprüfen Sie die Kompatibilitätsliste auf der Produktseite. Jede Hülle ist passgenau für spezifische Modelle gefertigt.'
            },
            {
                question: 'Wie lange ist die Garantie auf Zubehör?',
                answer: 'Wir bieten standardmäßig 6 Monate Garantie auf unser gesamtes Zubehör. Dies deckt Herstellungsfehler ab.'
            }
        ]
    },
    accessoryCategories: {
        type: mongoose.Schema.Types.Mixed,
        default: [
            { id: 'audio', label: 'Audio', icon: 'Headphones' },
            { id: 'power', label: 'Energie', icon: 'Zap' },
            { id: 'protection', label: 'Schutz', icon: 'Shield' },
            { id: 'wearables', label: 'Wearables', icon: 'Watch' }
        ]
    },
    cookieConsent: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            enabled: true,
            title: 'Ihre Privatsphäre ist uns wichtig',
            message: 'Wir verwenden Cookies für eine Reihe von Auswertungen, um damit Ihren Besuch auf unserer Website kontinuierlich verbessern zu können (z. B. damit Ihnen Ihre Login-Daten erhalten bleiben).\n\nSie können Ihre Einstellungen ändern und verschiedenen Arten von Cookies erlauben, auf Ihrem Rechner gespeichert zu werden, während Sie unsere Webseite besuchen. Sie können auf Ihrem Rechner gespeicherte Cookies ebenso weitgehend wieder entfernen. Bitte bedenken Sie aber, dass dadurch Teile unserer Website möglicherweise nicht mehr in der gedachten Art und Weise nutzbar sind.',
            acceptAllBtn: 'Alle akzeptieren',
            rejectAllBtn: 'Ich lehne ab',
            manageBtn: 'Einstellungen ändern',
            saveBtn: 'Einstellungen speichern',
            strictlyNecessaryTitle: 'Technisch notwendige Cookies',
            strictlyNecessaryDesc: 'Erforderlich für die sichere Funktion der Website. Kann nicht deaktiviert werden.',
            functionalTitle: 'Funktions Cookies',
            functionalDesc: 'Ermöglicht der Website, erweiterte Funktionalität und Personalisierung bereitzustellen.',
            analyticsTitle: 'Tracking und Performance Cookies',
            analyticsDesc: 'Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, um die Benutzererfahrung zu verbessern.',
            marketingTitle: 'Targeting und Werbung Cookies',
            marketingDesc: 'Wird verwendet, um Werbung zu liefern, die relevanter für Sie und Ihre Interessen ist.'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

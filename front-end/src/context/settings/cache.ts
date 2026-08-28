import { Settings, ServiceTerminalSettings, ServiceTerminalService, LocalizedText, ServiceTerminalIcon } from './types';

export const DEFAULT_SERVICE_TERMINAL: ServiceTerminalSettings = {
    enabled: true,
    eyebrow: {
        de: 'SERVICE TERMINAL',
        en: 'SERVICE TERMINAL',
        ar: 'محطة الخدمات',
    },
    title: {
        de: 'Professionelle Reparaturen',
        en: 'Professional Repairs',
        ar: 'إصلاحات احترافية',
    },
    servicesLinkLabel: {
        de: 'Alle Services',
        en: 'All Services',
        ar: 'كل الخدمات',
    },
    servicesLinkUrl: '/repair',
    services: [
        {
            id: 'display',
            enabled: true,
            title: {
                de: 'Displayreparatur',
                en: 'Screen Repair',
                ar: 'إصلاح الشاشة',
            },
            priceLabel: {
                de: 'ab €149',
                en: 'from €149',
                ar: 'ابتداءً من 149€',
            },
            icon: 'monitor',
            iconColor: '#22d3ee',
            cardBackground: '#062033',
            order: 1,
        },
        {
            id: 'battery',
            enabled: true,
            title: {
                de: 'Akkutausch',
                en: 'Battery Replacement',
                ar: 'تبديل البطارية',
            },
            priceLabel: {
                de: 'ab €39',
                en: 'from €39',
                ar: 'ابتداءً من 39€',
            },
            icon: 'battery',
            iconColor: '#34d399',
            cardBackground: '#06252a',
            order: 2,
        },
        {
            id: 'charging-port',
            enabled: true,
            title: {
                de: 'Ladebuchse',
                en: 'Charging Port',
                ar: 'منفذ الشحن',
            },
            priceLabel: {
                de: 'ab €29',
                en: 'from €29',
                ar: 'ابتداءً من 29€',
            },
            icon: 'smartphone',
            iconColor: '#fbbf24',
            cardBackground: '#211817',
            order: 3,
        },
        {
            id: 'diagnosis',
            enabled: true,
            title: {
                de: 'Diagnose',
                en: 'Diagnostics',
                ar: 'تشخيص',
            },
            priceLabel: {
                de: 'Kostenlos',
                en: 'Free',
                ar: 'مجاناً',
            },
            icon: 'wrench',
            iconColor: '#c084fc',
            cardBackground: '#160d35',
            order: 4,
        },
    ],
    cta: {
        enabled: true,
        title: {
            de: 'Kostenlose Diagnose für dein Gerät',
            en: 'Free diagnosis for your device',
            ar: 'تشخيص مجاني لجهازك',
        },
        description: {
            de: 'Wir reparieren alle Marken – iPhone, Samsung, Huawei & mehr.',
            en: 'We repair all brands – iPhone, Samsung, Huawei & more.',
            ar: 'نصلح جميع العلامات التجارية – iPhone وSamsung وHuawei والمزيد.',
        },
        buttonLabel: {
            de: 'Jetzt buchen',
            en: 'Book now',
            ar: 'احجز الآن',
        },
        buttonUrl: '/repair',
    },
};

const mergeLocalizedText = (def: LocalizedText, incoming?: Partial<LocalizedText>): LocalizedText => ({
    de: typeof incoming?.de === 'string' && incoming.de.trim() !== '' ? incoming.de : def.de,
    en: typeof incoming?.en === 'string' && incoming.en.trim() !== '' ? incoming.en : def.en,
    ar: typeof incoming?.ar === 'string' && incoming.ar.trim() !== '' ? incoming.ar : def.ar,
});

export const mergeServiceTerminalSettings = (
    defaults: ServiceTerminalSettings,
    incoming?: any
): ServiceTerminalSettings => {
    if (!incoming || typeof incoming !== 'object') {
        return defaults;
    }

    const mergedServices: ServiceTerminalService[] = Array.isArray(incoming.services)
        ? incoming.services.map((item: any, index: number) => {
            const fallbackDef = defaults.services.find(s => s.id === item?.id) || defaults.services[index] || defaults.services[0];
            return {
                id: typeof item?.id === 'string' && item.id.trim() ? item.id : `service-${index + 1}`,
                enabled: typeof item?.enabled === 'boolean' ? item.enabled : true,
                title: mergeLocalizedText(fallbackDef.title, item?.title),
                priceLabel: mergeLocalizedText(fallbackDef.priceLabel, item?.priceLabel),
                icon: (['monitor', 'battery', 'smartphone', 'wrench', 'camera', 'zap', 'shield', 'headphones'].includes(item?.icon)
                    ? item.icon
                    : fallbackDef.icon) as ServiceTerminalIcon,
                iconColor: typeof item?.iconColor === 'string' && item.iconColor.trim() ? item.iconColor : fallbackDef.iconColor,
                cardBackground: typeof item?.cardBackground === 'string' && item.cardBackground.trim() ? item.cardBackground : fallbackDef.cardBackground,
                order: typeof item?.order === 'number' ? item.order : index + 1,
            };
        })
        : defaults.services;

    return {
        enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : defaults.enabled,
        eyebrow: mergeLocalizedText(defaults.eyebrow, incoming.eyebrow),
        title: mergeLocalizedText(defaults.title, incoming.title),
        servicesLinkLabel: mergeLocalizedText(defaults.servicesLinkLabel, incoming.servicesLinkLabel),
        servicesLinkUrl: typeof incoming.servicesLinkUrl === 'string' && incoming.servicesLinkUrl.trim()
            ? incoming.servicesLinkUrl
            : defaults.servicesLinkUrl,
        services: mergedServices,
        cta: {
            enabled: typeof incoming.cta?.enabled === 'boolean' ? incoming.cta.enabled : defaults.cta.enabled,
            title: mergeLocalizedText(defaults.cta.title, incoming.cta?.title),
            description: mergeLocalizedText(defaults.cta.description, incoming.cta?.description),
            buttonLabel: mergeLocalizedText(defaults.cta.buttonLabel, incoming.cta?.buttonLabel),
            buttonUrl: typeof incoming.cta?.buttonUrl === 'string' && incoming.cta.buttonUrl.trim()
                ? incoming.cta.buttonUrl
                : defaults.cta.buttonUrl,
        },
    };
};

export const defaultSettings: Settings = {
    hero: {
        bgStart: '#0f172a',
        bgEnd: '#020617',
        headline: '',
        subheadline: '',
        accentColor: '#22d3ee',
        buttonMarket: '',
        buttonValuation: '',
        trustBadge1: '',
        trustBadge2: '',
        trustBadge3: '',
        heroImage: '',
        productLabel: '',
        productName: '',
        productPrice: '',
        stat1Title: '',
        stat1Value: '',
        stat2Title: '',
        stat2Value: ''
    },
    promoPopup: {
        enabled: false,
        title: '',
        message: '',
        couponCode: '',
        delay: 5
    },
    featuredServices: {
        tagline: 'Was wir anbieten',
        heading: 'Alles rund um dein Gerät',
        cards: [
            {
                id: 'buy',
                iconName: 'ShoppingBag',
                title: 'Kaufen',
                desc: 'Geprüfte Smartphones & Tablets zu fairen Preisen.',
                cta: 'Zum Marktplatz',
                route: '/marketplace',
                gradient: 'from-cyan-500/20 to-blue-500/10',
                border: 'hover:border-cyan-500/50',
                iconColor: 'text-cyan-400',
                ctaColor: 'text-cyan-400 group-hover:text-cyan-300',
            },
            {
                id: 'sell',
                iconName: 'Zap',
                title: 'Verkaufen',
                desc: 'Dein Gerät bewerten lassen und sofort ein Angebot erhalten.',
                cta: 'Gerät bewerten',
                route: '/valuation',
                gradient: 'from-amber-500/20 to-orange-500/10',
                border: 'hover:border-amber-500/50',
                iconColor: 'text-amber-400',
                ctaColor: 'text-amber-400 group-hover:text-amber-300',
            },
            {
                id: 'repair',
                iconName: 'Wrench',
                title: 'Reparieren',
                desc: 'Professionelle Reparaturen für alle Geräte — schnell & günstig.',
                cta: 'Reparatur anfragen',
                route: '/repair',
                gradient: 'from-purple-500/20 to-indigo-500/10',
                border: 'hover:border-purple-500/50',
                iconColor: 'text-purple-400',
                ctaColor: 'text-purple-400 group-hover:text-purple-300',
            }
        ]
    },
    repairPreviewCards: [
        { iconName: 'Monitor', label: 'Displayreparatur', price: 'ab €49', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { iconName: 'Battery', label: 'Akkutausch', price: 'ab €39', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { iconName: 'Smartphone', label: 'Ladebuchse', price: 'ab €29', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { iconName: 'Wrench', label: 'Diagnose', price: 'Kostenlos', color: 'text-purple-400', bg: 'bg-purple-500/10' }
    ],
    serviceTerminal: DEFAULT_SERVICE_TERMINAL,
    valuation: {
        step1Title: 'Select Manufacturer'
    },
    content: {
        accessoriesTitle: '',
        accessoriesSubtitle: '',
        repairTitle: '',
        repairSubtitle: ''
    },
    stats: {
        devicesRepaired: 0,
        happyCustomers: 0,
        averageRating: 0,
        marketExperience: 0,
        successRate: 0
    },
    productFaqs: [
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
    ],
    repairArchive: {
        title: '',
        subtitle: '',
        buttonText: '',
        totalRepairs: 0
    },
    sections: {
        hero: true,
        stats: true,
        repairGallery: true,
        marketplace: true,
        accessories: true,
        contact: true,
        marketplacePage: true,
        valuationPage: true,
        repairPage: true,
        trackRepairPage: true,
        authSystem: true
    },
    footerSection: {
        aboutText: '',
        tagline: '',
        copyright: '',
        quickLinks: true,
        legalLinks: true,
        newsletter: true,
        socialLinks: true,
        columns: [
            {
                title: 'Shop',
                links: [
                    { label: 'MARKTPLATZ', url: '/marketplace' },
                    { label: 'ZUBEHÖR', url: '/accessories' },
                    { label: 'GERÄT VERKAUFEN', url: '/valuation' }
                ]
            },
            {
                title: 'Services',
                links: [
                    { label: 'REPARATUR', url: '/repair' },
                    { label: 'REPARATUR VERFOLGEN', url: '/track-repair' },
                    { label: 'SUPPORT', url: '/contact' }
                ]
            }
        ],
        bottomLinks: []
    },
    navbar: {
        logoText: 'HANDY',
        logoAccentText: 'LAND',
        showLanguageSwitcher: true,
        links: [
            { labelKey: 'nav.home', defaultLabel: 'Home', path: '/', iconName: 'Home' },
            { labelKey: 'nav.marketplace', defaultLabel: 'Marketplace', path: '/marketplace', iconName: 'ShoppingBag' },
            { labelKey: 'nav.repair', defaultLabel: 'Repair', path: '/repair', iconName: 'Wrench' },
            { labelKey: 'nav.valuation', defaultLabel: 'Sell', path: '/valuation', iconName: 'BarChart3' }
        ]
    },
    socialAuth: {
        google: false,
        facebook: false
    },
    cookieConsent: {
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
    },
    theme: {
        primaryColor: '#06b6d4', // cyan-500
        secondaryColor: '#3b82f6' // blue-500
    }
};

export const getCachedSettings = (): Settings => {
    try {
        const cached = localStorage.getItem('handyland_settings');
        const cachedAt = localStorage.getItem('handyland_settings_at');
        if (cached) {
            // Only use cache if it's less than 5 minutes old to prevent stale flash
            const ageMs = Date.now() - parseInt(cachedAt || '0', 10);
            if (ageMs > 5 * 60 * 1000) return defaultSettings; // Cache too old, use defaults

            const parsed = JSON.parse(cached);
            return {
                ...defaultSettings,
                ...parsed,
                hero: { ...defaultSettings.hero, ...(parsed.hero || {}) },
                content: { ...defaultSettings.content, ...(parsed.content || {}) },
                stats: { ...defaultSettings.stats, ...(parsed.stats || {}) },
                repairArchive: { ...defaultSettings.repairArchive, ...(parsed.repairArchive || {}) },
                valuation: { ...defaultSettings.valuation, ...(parsed.valuation || {}) },
                sections: { ...defaultSettings.sections, ...(parsed.sections || {}) },
                contactSection: { ...defaultSettings.contactSection, ...(parsed.contactSection || {}) },
                footerSection: { ...defaultSettings.footerSection, ...(parsed.footerSection || {}) },
                navbar: { ...defaultSettings.navbar, ...(parsed.navbar || {}) },
                socialAuth: { ...defaultSettings.socialAuth, ...(parsed.socialAuth || {}) },
                theme: { ...defaultSettings.theme, ...(parsed.theme || {}) },
                announcementBanner: { ...defaultSettings.announcementBanner, ...(parsed.announcementBanner || {}) },
                promoPopup: { ...defaultSettings.promoPopup, ...(parsed.promoPopup || {}) },
                cookieConsent: { ...defaultSettings.cookieConsent, ...(parsed.cookieConsent || {}) },
                repairPreviewCards: parsed.repairPreviewCards || defaultSettings.repairPreviewCards,
                serviceTerminal: mergeServiceTerminalSettings(DEFAULT_SERVICE_TERMINAL, parsed.serviceTerminal),
                featuredServices: parsed.featuredServices || defaultSettings.featuredServices,
                seo: { ...(parsed.seo || {}) },
            };
        }
    } catch { }
    return defaultSettings;
};

export const hasFreshCache = (): boolean => {
    try {
        const cachedAt = localStorage.getItem('handyland_settings_at');
        if (!cachedAt) return false;
        const ageMs = Date.now() - parseInt(cachedAt, 10);
        return ageMs < 5 * 60 * 1000; // Fresh if less than 5 minutes old
    } catch { return false; }
};

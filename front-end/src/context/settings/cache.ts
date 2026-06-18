import { Settings } from './types';

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

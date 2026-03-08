import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { api, clearCache } from '../utils/api';

interface HeroSettings {
    bgStart: string;
    bgEnd: string;
    headline: string;
    subheadline: string;
    // FIXED: Added Arabic subheadline field for admin control
    subheadlineAr?: string;
    accentColor: string;
    buttonMarket?: string;
    buttonValuation?: string;
    trustBadge1?: string;
    trustBadge2?: string;
    trustBadge3?: string;
    heroImage?: string;
    productLabel?: string;
    productName?: string;
    productPrice?: string;
    stat1Title?: string;
    stat1Value?: string;
    stat2Title?: string;
    stat2Value?: string;
}

interface ContentSettings {
    accessoriesTitle: string;
    accessoriesSubtitle: string;
    repairTitle: string;
    repairSubtitle: string;
}

interface StatsSettings {
    devicesRepaired: number;
    happyCustomers: number;
    averageRating: number;
    marketExperience: number;
}

interface RepairArchiveSettings {
    title: string;
    subtitle: string;
    buttonText: string;
    totalRepairs: number;
}

interface SectionSettings {
    hero: boolean;
    stats: boolean;
    repairGallery: boolean;
    marketplace: boolean;
    accessories: boolean;
    contact: boolean;
}

interface FooterSettings {
    aboutText: string;
    tagline?: string;
    copyright?: string;
    quickLinks: boolean;
    legalLinks: boolean;
    newsletter: boolean;
    socialLinks: boolean;
    columns?: { title: string; links: { label: string; url: string }[] }[];
    bottomLinks?: { label: string; url: string }[];
}

interface Settings {
    siteName?: string;
    contactEmail?: string;
    footerText?: string;
    navbar?: {
        logoText?: string;
        logoAccentText?: string;
        showLanguageSwitcher?: boolean;
        links?: { labelKey?: string; defaultLabel: string; path: string; iconName?: string }[];
    };
    hero: HeroSettings;
    valuation: {
        step1Title: string;
        step2Title?: string;
        step3Title?: string;
        screenConditions?: { id: string; title: string; desc: string; }[];
        bodyConditions?: { id: string; title: string; desc: string; }[];
    };
    content: ContentSettings;
    stats: StatsSettings;
    repairArchive: RepairArchiveSettings;
    sections: SectionSettings;
    footerSection?: FooterSettings;
    contactSection?: {
        address?: string;
        phone?: string;
        email?: string;
        mapUrl?: string;
        formTitle?: string;
        formButton?: string;
        socialLinks?: {
            facebook?: string;
            instagram?: string;
            twitter?: string;
            linkedin?: string;
            youtube?: string;
        };
        whatsappPhone?: string;
        whatsappMessage?: string;
    };
    announcementBanner?: {
        enabled?: boolean;
        text?: string;
        color?: string;
        dismissible?: boolean;
        link?: string;
        linkText?: string;
    };
    promoPopup?: {
        enabled?: boolean;
        title?: string;
        message?: string;
        couponCode?: string;
        delay?: number;
        couponDetails?: {
            discountType: 'percentage' | 'fixed';
            discountValue: number;
            validUntil: string;
            usageLimit: number | null;
            usedCount: number;
        };
    };
    socialAuth?: {
        google?: boolean;
        facebook?: boolean;
    };
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
    };
    freeShippingThreshold?: number;
    payment?: {
        stripe?: {
            enabled: boolean;
            publishableKey: string;
        };
        paypal?: {
            enabled: boolean;
            clientId: string;
            mode: 'sandbox' | 'live';
        };
        bankTransfer?: {
            enabled: boolean;
            instructions: string;
        };
    };
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => Promise<void>;
    loading: boolean;
    error: boolean;
}

const defaultSettings: Settings = {
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
        marketExperience: 0
    },
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
        contact: true
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
                    { label: 'Marketplace', url: '/marketplace' },
                    { label: 'Accessories', url: '/accessories' },
                    { label: 'Sell Device', url: '/valuation' }
                ]
            },
            {
                title: 'Services',
                links: [
                    { label: 'Repair', url: '/repair' },
                    { label: 'Track Repair', url: '/track-repair' },
                    { label: 'Support', url: '/contact' }
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
            { labelKey: 'home', defaultLabel: 'Home', path: '/', iconName: 'Home' },
            { labelKey: 'market', defaultLabel: 'Marketplace', path: '/marketplace', iconName: 'ShoppingBag' },
            { labelKey: 'repair', defaultLabel: 'Repair', path: '/repair', iconName: 'Wrench' },
            { labelKey: 'valuation', defaultLabel: 'Sell', path: '/valuation', iconName: 'BarChart3' }
        ]
    },
    socialAuth: {
        google: false,
        facebook: false
    },
    theme: {
        primaryColor: '#06b6d4', // cyan-500
        secondaryColor: '#3b82f6' // blue-500
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Read cached settings from localStorage for instant render without flash
    const getCachedSettings = (): Settings => {
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
                };
            }
        } catch { }
        return defaultSettings;
    };

    const hasFreshCache = (): boolean => {
        try {
            const cachedAt = localStorage.getItem('handyland_settings_at');
            if (!cachedAt) return false;
            const ageMs = Date.now() - parseInt(cachedAt, 10);
            return ageMs < 5 * 60 * 1000; // Fresh if less than 5 minutes old
        } catch { return false; }
    };

    const [settings, setSettings] = useState<Settings>(getCachedSettings);
    // Only skip loading spinner if we have a FRESH cache (< 5 mins old)
    const [loading, setLoading] = useState(!hasFreshCache());
    const [error, setError] = useState(false);
    const { addToast } = useToast();

    // Inject dynamic CSS variables into document root whenever theme settings change
    useEffect(() => {
        if (settings.theme) {
            const root = document.documentElement;
            if (settings.theme.primaryColor) {
                root.style.setProperty('--color-primary', settings.theme.primaryColor);
            }
            if (settings.theme.secondaryColor) {
                root.style.setProperty('--color-secondary', settings.theme.secondaryColor);
            }
        }
    }, [settings.theme]);

    useEffect(() => {
        const fetchSettings = async (isBackgroundPolling = false) => {
            try {
                const response = await api.get<Settings>('/api/settings');
                const data = response as any;
                const safeData = (data || {}) as Partial<Settings>;

                const merged: Settings = {
                    ...defaultSettings,
                    ...safeData,
                    hero: { ...defaultSettings.hero, ...(safeData.hero || {}) },
                    content: { ...defaultSettings.content, ...(safeData.content || {}) },
                    stats: { ...defaultSettings.stats, ...(safeData.stats || {}) },
                    repairArchive: { ...defaultSettings.repairArchive, ...(safeData.repairArchive || {}) },
                    valuation: { ...defaultSettings.valuation, ...(safeData.valuation || {}) },
                    sections: { ...defaultSettings.sections, ...(safeData.sections || {}) },
                    contactSection: { ...defaultSettings.contactSection, ...(safeData.contactSection || {}) },
                    footerSection: { ...defaultSettings.footerSection, ...(safeData.footerSection || {}) },
                    navbar: { ...defaultSettings.navbar, ...(safeData.navbar || {}) },
                    socialAuth: { ...defaultSettings.socialAuth, ...(safeData.socialAuth || {}) },
                    theme: { ...defaultSettings.theme, ...(safeData.theme || {}) },
                    announcementBanner: { ...defaultSettings.announcementBanner, ...(safeData.announcementBanner || {}) },
                    promoPopup: { ...defaultSettings.promoPopup, ...(safeData.promoPopup || {}) },
                };

                setSettings(merged);
                if (!isBackgroundPolling) setLoading(false);

                // Cache full settings AND store timestamp for freshness check
                try {
                    localStorage.setItem('handyland_settings', JSON.stringify(merged));
                    localStorage.setItem('handyland_settings_at', Date.now().toString());
                } catch { }
                if (merged.siteName) {
                    localStorage.setItem('handyland_sitename', merged.siteName);
                }
            } catch (error) {
                console.error("Failed to load global settings", error);
                if (!isBackgroundPolling) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchSettings();

        // Implement polling every 30 seconds to keep settings in sync
        const pollInterval = setInterval(() => {
            fetchSettings(true);
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);

    const updateSettings = async (newSettings: Settings) => {
        try {
            // Optimistic update
            setSettings(newSettings);

            // Persist to backend
            await api.put('/api/settings', newSettings);

            // Clear cache and refetch to ensure UI matches database
            clearCache('/api/settings');
            const response = await api.get<Settings>('/api/settings');
            const freshData = (response as any || {}) as Partial<Settings>;

            setSettings(prev => ({
                ...prev,
                ...freshData,
                hero: { ...prev.hero, ...(freshData.hero || {}) },
                content: { ...prev.content, ...(freshData.content || {}) },
                stats: { ...prev.stats, ...(freshData.stats || {}) },
                repairArchive: { ...prev.repairArchive, ...(freshData.repairArchive || {}) },
                valuation: { ...prev.valuation, ...(freshData.valuation || {}) },
                sections: { ...prev.sections, ...(freshData.sections || {}) },
                contactSection: { ...prev.contactSection, ...(freshData.contactSection || {}) },
                footerSection: { ...prev.footerSection, ...(freshData.footerSection || {}) },
                navbar: { ...prev.navbar, ...(freshData.navbar || {}) },
                socialAuth: { ...prev.socialAuth, ...(freshData.socialAuth || {}) },
                theme: { ...prev.theme, ...(freshData.theme || {}) },
            }));

            addToast('Settings updated', 'success');
        } catch (error) {
            console.error("Failed to update settings", error);
            addToast('Failed to update settings', 'error');
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading, error }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

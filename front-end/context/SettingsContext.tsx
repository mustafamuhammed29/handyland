import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { api, clearCache } from '../utils/api';

interface HeroSettings {
    bgStart: string;
    bgEnd: string;
    headline: string;
    subheadline: string;
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
}

interface Settings {
    siteName?: string;
    contactEmail?: string;
    footerText?: string;
    navbar?: {
        logoText?: string;
        logoAccentText?: string;
        showLanguageSwitcher?: boolean;
    };
    hero: HeroSettings;
    valuation: {
        step1Title: string;
        step2Title?: string;
        step3Title?: string;
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
        socialLinks: true
    },
    navbar: {
        logoText: 'HANDY',
        logoAccentText: 'LAND',
        showLanguageSwitcher: true
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get<Settings>('/api/settings');
                // The interceptor unwraps the response, so 'response' IS the data.
                // We cast to 'any' here because TS might expect AxiosResponse structure.
                const data = response as any;

                // Deep merge defaults with fetched data
                // ✅ FIXED: Add fallbacks to prevent "Cannot read properties of undefined"
                const safeData = (data || {}) as Partial<Settings>;

                setSettings(prev => ({
                    ...prev,
                    ...safeData,
                    hero: { ...prev.hero, ...(safeData.hero || {}) },
                    content: { ...prev.content, ...(safeData.content || {}) },
                    stats: { ...prev.stats, ...(safeData.stats || {}) },
                    repairArchive: { ...prev.repairArchive, ...(safeData.repairArchive || {}) },
                    valuation: { ...prev.valuation, ...(safeData.valuation || {}) },
                    sections: { ...prev.sections, ...(safeData.sections || {}) },
                    contactSection: { ...prev.contactSection, ...(safeData.contactSection || {}) },
                    footerSection: { ...prev.footerSection, ...(safeData.footerSection || {}) },
                    navbar: { ...prev.navbar, ...(safeData.navbar || {}) },
                }));

                setLoading(false);
            } catch (error) {
                console.error("Failed to load global settings", error);
                setError(true);
                setLoading(false);
            }
        };

        fetchSettings();
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

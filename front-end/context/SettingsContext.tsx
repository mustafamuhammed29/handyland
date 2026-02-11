import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { api } from '../utils/api';

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
                const data = await api.get<Settings>('/api/settings');

                // Deep merge defaults with fetched data
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    hero: { ...prev.hero, ...data.hero },
                    content: { ...prev.content, ...data.content },
                    stats: { ...prev.stats, ...data.stats },
                    repairArchive: { ...prev.repairArchive, ...data.repairArchive },
                    valuation: { ...prev.valuation, ...data.valuation },
                    sections: { ...prev.sections, ...data.sections },
                    contactSection: { ...prev.contactSection, ...data.contactSection },
                    footerSection: { ...prev.footerSection, ...data.footerSection },
                    navbar: { ...prev.navbar, ...data.navbar },
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

            addToast('Settings updated', 'success');
        } catch (error) {
            console.error("Failed to update settings", error);
            addToast('Failed to update settings', 'error');
            // could revert here if needed
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

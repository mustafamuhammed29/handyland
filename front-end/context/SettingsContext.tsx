import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

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

interface Settings {
    siteName?: string;
    contactEmail?: string;
    footerText?: string;
    hero: HeroSettings;
    valuation: {
        step1Title: string;
        step2Title?: string;
        step3Title?: string;
    };
    content: ContentSettings;
    stats: StatsSettings;
    repairArchive: RepairArchiveSettings;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => Promise<void>;
    loading: boolean;
}

const defaultSettings: Settings = {
    hero: {
        bgStart: '#0f172a',
        bgEnd: '#020617',
        headline: 'NEXT GEN\nTRADING',
        subheadline: 'Experience the future of device trading.',
        accentColor: '#22d3ee',
        buttonMarket: 'Markt betreten',
        buttonValuation: 'Gerät bewerten',
        trustBadge1: 'VERIFIED SELLERS',
        trustBadge2: '24/7 SUPPORT',
        trustBadge3: '4.9★ RATED'
    },
    valuation: {
        step1Title: 'Select Manufacturer'
    },
    content: {
        accessoriesTitle: 'Gear Arsenal',
        accessoriesSubtitle: 'Equip your hardware with premium modules.',
        repairTitle: 'Service Terminal',
        repairSubtitle: 'Transparent pricing for advanced hardware repair'
    },
    stats: {
        devicesRepaired: 5000,
        happyCustomers: 12500,
        averageRating: 4.9,
        marketExperience: 10
    },
    repairArchive: {
        title: 'Digital Repair Archive',
        subtitle: 'Archive_System_V2.0',
        buttonText: 'View All Repairs',
        totalRepairs: 1240
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (!response.ok) throw new Error('Failed to fetch settings');
                const data = await response.json();

                // Deep merge defaults with fetched data
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    hero: { ...prev.hero, ...data.hero },
                    content: { ...prev.content, ...data.content },
                    stats: { ...prev.stats, ...data.stats },
                    repairArchive: { ...prev.repairArchive, ...data.repairArchive },
                    valuation: { ...prev.valuation, ...data.valuation }
                }));

                setLoading(false);
            } catch (error) {
                console.error("Failed to load global settings", error);
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateSettings = async (newSettings: Settings) => {
        const optimistic = { ...settings, ...newSettings };
        setSettings(optimistic);
        addToast('Settings updated', 'success');
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
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

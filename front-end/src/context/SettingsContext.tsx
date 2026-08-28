import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { api, clearCache } from '../utils/api';
import { Settings, SettingsContextType, FooterSettings } from './settings/types';
import { defaultSettings, getCachedSettings, hasFreshCache, DEFAULT_SERVICE_TERMINAL, mergeServiceTerminalSettings } from './settings/cache';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

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

    // Removed forced language matching to allow users to preserve their language choice in localStorage

    useEffect(() => {
        const fetchSettings = async (isBackgroundPolling = false) => {
            try {
                const response = await api.get<Settings>('/api/settings');
                const data = response as any;
                
                // FIX: Extract the actual settings object from the response
                const safeData = (data.settings || data.data || data || {}) as Partial<Settings>;

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
                    footerSection: { ...defaultSettings.footerSection, ...(safeData.footerSection || {}) } as FooterSettings,
                    navbar: { ...defaultSettings.navbar, ...(safeData.navbar || {}) },
                    socialAuth: { ...defaultSettings.socialAuth, ...(safeData.socialAuth || {}) },
                    theme: { ...defaultSettings.theme, ...(safeData.theme || {}) },
                    announcementBanner: { ...defaultSettings.announcementBanner, ...(safeData.announcementBanner || {}) },
                    promoPopup: { ...defaultSettings.promoPopup, ...(safeData.promoPopup || {}) },
                    cookieConsent: { ...defaultSettings.cookieConsent, ...(safeData.cookieConsent || {}) },
                    repairPreviewCards: safeData.repairPreviewCards || defaultSettings.repairPreviewCards,
                    serviceTerminal: mergeServiceTerminalSettings(DEFAULT_SERVICE_TERMINAL, safeData.serviceTerminal),
                    featuredServices: safeData.featuredServices || defaultSettings.featuredServices,
                    seo: { ...(safeData.seo || {}) },
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
            } catch (error: any) {
                console.error("Failed to load global settings", error);
                
                // Check if this is a maintenance mode response (503)
                if (error?.response?.status === 503 && error?.response?.data?.maintenance) {
                    if (!isBackgroundPolling) setLoading(false);
                    // Redirect to maintenance page instead of showing error
                    if (window.location.pathname !== '/maintenance') {
                        window.location.href = '/maintenance';
                    }
                    return;
                }
                
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
            const data = response as any;
            const freshData = (data.settings || data.data || data || {}) as Partial<Settings>;

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
                footerSection: { ...prev.footerSection, ...(freshData.footerSection || {}) } as FooterSettings,
                navbar: { ...prev.navbar, ...(freshData.navbar || {}) },
                socialAuth: { ...prev.socialAuth, ...(freshData.socialAuth || {}) },
                theme: { ...prev.theme, ...(freshData.theme || {}) },
                cookieConsent: { ...prev.cookieConsent, ...(freshData.cookieConsent || {}) },
                repairPreviewCards: freshData.repairPreviewCards || prev.repairPreviewCards,
                serviceTerminal: freshData.serviceTerminal
                    ? mergeServiceTerminalSettings(prev.serviceTerminal || DEFAULT_SERVICE_TERMINAL, freshData.serviceTerminal)
                    : prev.serviceTerminal,
                featuredServices: freshData.featuredServices || prev.featuredServices,
                seo: { ...(freshData.seo || {}) },
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

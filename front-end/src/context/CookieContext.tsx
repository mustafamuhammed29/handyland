import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp?: string;
}

interface CookieContextType {
    preferences: CookiePreferences | null;
    hasConsented: boolean; // True if they made a choice (accept/reject/partial)
    acceptAll: () => void;
    rejectAll: () => void;
    savePreferences: (prefs: Partial<CookiePreferences>) => void;
}

const defaultPreferences: CookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false,
};

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
    const [hasConsented, setHasConsented] = useState(false);

    useEffect(() => {
        // Load preferences on mount
        const saved = localStorage.getItem('handyland_cookie_consent');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPreferences(parsed);
                setHasConsented(true);
                applyConsent(parsed);
            } catch (e) {
                console.error("Failed to parse cookie consent");
            }
        }
    }, []);

    const applyConsent = (prefs: CookiePreferences) => {
        // Enforce cookie behavior
        if (!prefs.analytics) {
            // Delete analytics cookies if they exist
            document.cookie = "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        if (!prefs.marketing) {
            // Delete marketing cookies
            document.cookie = "_fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        
        // Push to dataLayer if using Google Tag Manager
        if (typeof window !== 'undefined' && 'dataLayer' in window) {
            (window as any).dataLayer.push({
                event: 'cookie_consent_update',
                consent: prefs
            });
        }
    };

    const saveAndApply = (prefs: CookiePreferences) => {
        const fullPrefs = { ...prefs, timestamp: new Date().toISOString() };
        localStorage.setItem('handyland_cookie_consent', JSON.stringify(fullPrefs));
        setPreferences(fullPrefs);
        setHasConsented(true);
        applyConsent(fullPrefs);
    };

    const acceptAll = () => {
        saveAndApply({ necessary: true, analytics: true, marketing: true });
    };

    const rejectAll = () => {
        // We MUST save the rejection choice, otherwise the banner shows on every page load
        saveAndApply({ necessary: true, analytics: false, marketing: false });
    };

    const savePreferences = (customPrefs: Partial<CookiePreferences>) => {
        saveAndApply({ ...defaultPreferences, ...customPrefs, necessary: true });
    };

    return (
        <CookieContext.Provider value={{ preferences, hasConsented, acceptAll, rejectAll, savePreferences }}>
            {children}
        </CookieContext.Provider>
    );
};

export const useCookieConsent = () => {
    const context = useContext(CookieContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieProvider');
    }
    return context;
};

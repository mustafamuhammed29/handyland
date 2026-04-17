import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import i18n from '../i18n'; // FIX 1: bridge the two language systems
import { useSettings } from './SettingsContext';

// FIXED: Centralized language state management (FIX 9)
interface LanguageContextType {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED: LanguageCode[] = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings } = useSettings();

    const [lang, setLangState] = useState<LanguageCode>(() => {
        // 1st priority: user's own saved preference
        const stored = localStorage.getItem('handyland_lang') as LanguageCode;
        if (SUPPORTED.includes(stored)) return stored;

        // 2nd priority: browser language
        const browserLang = (navigator.language || navigator.languages?.[0]).split('-')[0] as LanguageCode;
        if (SUPPORTED.includes(browserLang)) return browserLang;

        // 3rd priority: default German
        return 'de';
    });

    // Track if user has explicitly chosen a language
    const hasUserPreference = !!localStorage.getItem('handyland_lang');

    // When admin settings load (language field), apply it for new visitors
    // who haven't manually chosen a language yet
    useEffect(() => {
        if (!hasUserPreference && settings?.language && SUPPORTED.includes(settings.language as LanguageCode)) {
            const adminDefault = settings.language as LanguageCode;
            if (adminDefault !== lang) {
                setLangState(adminDefault);
                i18n.changeLanguage(adminDefault);
            }
        }
    }, [settings?.language]);

    const setLang = (newLang: LanguageCode) => {
        setLangState(newLang);
        localStorage.setItem('handyland_lang', newLang);
        i18n.changeLanguage(newLang); // FIX 1: tell i18next to switch language too
    };

    useEffect(() => {
        // FIX 1: sync i18next with the initial lang from localStorage on first mount
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
        document.documentElement.dir = (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLang = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLang must be used within LanguageProvider');
    return ctx;
};

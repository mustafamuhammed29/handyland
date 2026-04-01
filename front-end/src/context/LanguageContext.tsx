import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import i18n from '../i18n'; // FIX 1: bridge the two language systems

// FIXED: Centralized language state management (FIX 9)
interface LanguageContextType {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED: LanguageCode[] = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<LanguageCode>(() => {
        const stored = localStorage.getItem('handyland_lang') as LanguageCode;
        return SUPPORTED.includes(stored) ? stored : 'de';
    });

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

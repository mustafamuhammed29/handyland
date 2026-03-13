import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';

// FIXED: Centralized language state management (FIX 9)
interface LanguageContextType {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<LanguageCode>(() => {
        return (localStorage.getItem('handyland_lang') as LanguageCode) || 'de';
    });

    const setLang = (newLang: LanguageCode) => {
        setLangState(newLang);
        localStorage.setItem('handyland_lang', newLang);
    };

    useEffect(() => {
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

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../types';
import i18n from '../i18n';

interface LanguageContextType {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED: LanguageCode[] = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const appliedServerDefault = useRef(false);

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

    // Fetch admin default language directly (no context dependency)
    // Only for NEW visitors who haven't chosen a language yet
    useEffect(() => {
        if (appliedServerDefault.current) return;
        const hasUserPref = !!localStorage.getItem('handyland_lang');
        if (hasUserPref) return;

        const fetchDefault = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                const serverLang = data?.language as LanguageCode;
                if (serverLang && SUPPORTED.includes(serverLang) && serverLang !== lang) {
                    appliedServerDefault.current = true;
                    setLangState(serverLang);
                    i18n.changeLanguage(serverLang);
                }
            } catch {
                // silently fail
            }
        };
        fetchDefault();
    }, []);

    const setLang = (newLang: LanguageCode) => {
        setLangState(newLang);
        localStorage.setItem('handyland_lang', newLang);
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
        // Use requestAnimationFrame to avoid DOM conflicts with React reconciler
        requestAnimationFrame(() => {
            document.documentElement.dir = (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
        });
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

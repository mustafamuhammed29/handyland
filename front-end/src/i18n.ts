import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
    .use(HttpBackend) // Load translations from /public/locales
    .use(LanguageDetector) // Detect language
    .use(initReactI18next) // Pass the i18n instance to react-i18next
    .init({
        fallbackLng: 'de', // Default language if fallback fails
        supportedLngs: ['de', 'en', 'ar'], // List of supported languages
        debug: false,

        // Set to true to use suspense, false to render immediately without suspense
        react: {
            useSuspense: false,
        },

        interpolation: {
            escapeValue: false, // Not needed for react as it escapes by default
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        }
    });

export default i18n;

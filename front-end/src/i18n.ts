import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    supportedLngs: ['de', 'en', 'ar', 'tr', 'ru', 'fa'],
    debug: false,
    react: { useSuspense: false },
    interpolation: { escapeValue: false },
    detection: {
      // FIX 3: extended order — querystring lets ?lang=ar override for testing
      order: ['localStorage', 'querystring', 'navigator'],
      lookupLocalStorage: 'handyland_lang',
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
    backend: {
      // Load from static public/locales files — complete, version-controlled, always correct.
      // The Supabase-backed /api/translations/locales/:lang has incomplete DE keys so we bypass it.
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Still report missing keys to the backend so the admin can track gaps
      addPath: '/api/translations/missing/{{lng}}/{{ns}}',
    },
    saveMissing: true,
  });

export default i18n;

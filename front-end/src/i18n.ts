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
      loadPath: `/api/translations/locales/{{lng}}?namespace={{ns}}`,
      parse: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          return parsed.data || parsed;
        } catch (e) {
          return {};
        }
      },
      addPath: `/api/translations/missing/{{lng}}/{{ns}}`,
    },
    saveMissing: import.meta.env.DEV,
  });

export default i18n;

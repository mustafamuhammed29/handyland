import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { LanguageCode } from '../types';

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { lang, setLang } = useLang();

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);   // Update react-i18next
    setLang(code);               // Update LanguageContext (RTL + legacy components)
    localStorage.setItem('handyland_lang', code); // Persist
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-2 px-3 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all border border-slate-700/50 outline-none">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">
          {LANGUAGES.find(l => l.code === lang)?.flag} {lang.toUpperCase()}
        </span>
      </button>
      <div className="absolute top-10 right-0 w-40 bg-slate-800 rounded-xl shadow-xl shadow-black/50 overflow-hidden border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {LANGUAGES.map(({ code, label, flag }) => (
          <button
            key={code}
            onClick={() => changeLanguage(code)}
            className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
              ${lang === code ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

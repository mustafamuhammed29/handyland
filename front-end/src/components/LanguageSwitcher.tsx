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
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' }
];

interface LanguageSwitcherProps {
  align?: 'left' | 'right';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ align = 'right' }) => {
  const { i18n } = useTranslation();
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);   // Update react-i18next
    setLang(code);               // Update LanguageContext (RTL + legacy components)
    localStorage.setItem('handyland_lang', code); // Persist
    setIsOpen(false);
  };

  return (
    <div className="relative h-10" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-full flex items-center justify-center gap-2 px-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all border border-transparent outline-none"
      >
        <Globe className="w-5 h-5 text-slate-500 dark:text-slate-400 transition-colors" />
        <span className="text-xs font-bold uppercase mt-px tracking-wider">
          {lang}
        </span>
      </button>
      <div className={`absolute top-[calc(100%+0.5rem)] ${align === 'left' ? 'left-0' : 'right-0'} w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-slate-700/50 transition-all duration-200 z-[100] origin-top ${isOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
        {LANGUAGES.map(({ code, label, flag }) => (
          <button
            key={code}
            onClick={() => changeLanguage(code)}
            className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
              ${lang === code ? 'bg-brand-primary text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <span className="text-lg">{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('handyland_lang', lng); // Persist manually in App format
    };

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 p-2 px-3 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all border border-slate-700/50 outline-none">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{i18n.resolvedLanguage || 'DE'}</span>
            </button>
            <div className="absolute top-10 right-0 w-32 bg-slate-800 rounded-xl shadow-xl shadow-black/50 overflow-hidden border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button
                    onClick={() => changeLanguage('de')}
                    className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i18n.resolvedLanguage === 'de' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                    Deutsch
                </button>
                <button
                    onClick={() => changeLanguage('en')}
                    className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i18n.resolvedLanguage === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                    English
                </button>
                <button
                    onClick={() => changeLanguage('ar')}
                    className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i18n.resolvedLanguage === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                    العربية
                </button>
            </div>
        </div>
    );
};

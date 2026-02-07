import React, { useState, useEffect } from 'react';
import { ViewState, LanguageCode } from '../types';
import { translations } from '../i18n';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Facebook, Instagram, Twitter, Linkedin, Youtube, Send } from 'lucide-react';

import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  setView: (view: ViewState) => void;
  lang: LanguageCode;
}

export const Footer: React.FC<FooterProps> = ({ setView, lang }) => {
  const t = translations[lang];
  const { settings: globalSettings } = useSettings();

  const settings = {
    companyInfo: {
      name: (globalSettings?.siteName || 'HANDYLAND').toUpperCase(),
      tagline: globalSettings?.footerSection?.tagline || 'The premier digital ecosystem for smartphone assets.',
      copyright: globalSettings?.footerSection?.copyright || '© 2026 HANDYLAND DIGITAL TRADEFIX GMBH'
    },
    columns: [],
    bottomLinks: []
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock fetch - immediate completion
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <footer className="bg-slate-950 border-t border-slate-900 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto py-16 px-4">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-12 mb-12 ${settings.columns.length === 0 ? 'md:grid-cols-1' : settings.columns.length === 1 ? 'md:grid-cols-2' : settings.columns.length === 2 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          {/* Company Info */}
          <div className={settings.columns.length <= 1 ? 'col-span-1' : 'col-span-1 md:col-span-2'}>
            <Link to="/" className="text-3xl font-black text-white tracking-tighter uppercase cursor-pointer inline-block">
              {settings.companyInfo.name.split('LAND')[0]}
              <span className="text-cyan-400">LAND</span>
            </Link>
            <p className="text-slate-500 mt-4 max-w-sm leading-relaxed">
              {settings.companyInfo.tagline}
            </p>
          </div>

          {/* Dynamic Columns */}
          {settings.columns.map((column, index) => (
            <div key={index}>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em]">
                {column.title}
              </h4>
              <ul className="space-y-4 text-sm text-slate-500">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.url}
                      className="hover:text-cyan-400 transition-colors uppercase font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-mono">
          <span>{settings.companyInfo.copyright}</span>

          {/* Legal Links (Dynamic) */}
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/agb" className="hover:text-white uppercase transition-colors">AGB</Link>
            <Link to="/datenschutz" className="hover:text-white uppercase transition-colors">Datenschutz</Link>
            <Link to="/impressum" className="hover:text-white uppercase transition-colors">Impressum</Link>
            <Link to="/kundenservice" className="hover:text-white uppercase transition-colors">Kundenservice</Link>
            <Link to="/uber-uns" className="hover:text-white uppercase transition-colors">Über Uns</Link>
          </div>

          {/* Bottom Links from Settings (if any) */}
          {settings.bottomLinks && settings.bottomLinks.length > 0 && (
            <div className="flex gap-6">
              {settings.bottomLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.url}
                  className="hover:text-white uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

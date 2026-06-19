import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Facebook, Instagram, Twitter, Linkedin, Youtube, Send } from 'lucide-react';

import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  lang: LanguageCode;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const { t } = useTranslation();
  const { settings: globalSettings } = useSettings();

  const settings = {
    companyInfo: {
      name: (globalSettings?.siteName || 'HANDYLAND').toUpperCase(),
      tagline: globalSettings?.footerSection?.tagline || t('footer.tagline', 'Der globale Standard für Premium-Gerätehandel und Reparatur.'),
      copyright: globalSettings?.footerSection?.copyright || '© 2026 HANDYLAND'
    },
    columns: globalSettings?.footerSection?.columns || [
      {
        title: t('footer.shopTitle', 'SHOP'),
        links: [
          { label: t('footer.marketplace', 'MARKTPLATZ'), url: '/marketplace' },
          { label: t('footer.accessories', 'ZUBEHÖR'), url: '/accessories' },
          { label: t('footer.sellDevice', 'GERÄT VERKAUFEN'), url: '/valuation' },
        ]
      },
      {
        title: t('footer.servicesTitle', 'SERVICES'),
        links: [
          { label: t('footer.repair', 'REPARATUR'), url: '/repair' },
          { label: t('footer.trackRepair', 'REPARATUR VERFOLGEN'), url: '/track-repair' },
          { label: t('footer.support', 'SUPPORT'), url: '/kundenservice' },
        ]
      },
      {
        title: t('footer.aboutTitle', 'UNTERNEHMEN'),
        links: [
          { label: t('footer.aboutUs', 'ÜBER UNS'), url: '/uber-uns' },
          { label: t('footer.customerService', 'KUNDENSERVICE'), url: '/kundenservice' },
          { label: t('footer.impressum', 'IMPRESSUM'), url: '/impressum' },
        ]
      }
    ],
    bottomLinks: globalSettings?.footerSection?.bottomLinks || []
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock fetch - immediate completion
    setLoading(false);
  }, []);

    const finalColumns = settings.columns.map(col => {
      let filteredLinks = col.links;

      if (globalSettings?.sections?.marketplacePage === false) {
          filteredLinks = filteredLinks.filter(l => !l.url.includes('/market'));
      }
      if (globalSettings?.sections?.valuationPage === false) {
          filteredLinks = filteredLinks.filter(l => !l.url.includes('/valuation'));
      }
      if (globalSettings?.sections?.repairPage === false) {
          filteredLinks = filteredLinks.filter(l => !l.url.includes('/repair'));
      }
      // Assuming track-repair is in services list too
      if (globalSettings?.sections?.trackRepairPage === false) {
          filteredLinks = filteredLinks.filter(l => !l.url.includes('/track-repair'));
      }

      return { ...col, links: filteredLinks };
    });

    // Always ensure UNTERNEHMEN column exists — the DB may override columns without it
    const hasUnternehmen = finalColumns.some(
      col => col.title === 'UNTERNEHMEN' || col.title === t('footer.aboutTitle', 'UNTERNEHMEN')
    );
    if (!hasUnternehmen) {
      finalColumns.push({
        title: t('footer.aboutTitle', 'UNTERNEHMEN'),
        links: [
          { label: t('footer.aboutUs', 'ÜBER UNS'), url: '/uber-uns' },
          { label: t('footer.customerService', 'KUNDENSERVICE'), url: '/kundenservice' },
          { label: t('footer.impressum', 'IMPRESSUM'), url: '/impressum' },
        ]
      });
    }

  if (loading) {
    return (
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto py-16 px-4">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-800 border-t-brand-primary rounded-full animate-spin"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 mt-auto relative z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div className="max-w-7xl mx-auto pt-12 pb-28 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 md:gap-12 mb-10 md:mb-12">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase cursor-pointer inline-block">
              {settings.companyInfo.name.split('LAND')[0]}
              <span className="text-brand-primary">LAND</span>
            </Link>
            <p className="text-slate-500 mt-4 max-w-sm leading-relaxed">
              {settings.companyInfo.tagline}
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Visit our Facebook page" className="p-2 rounded-full bg-slate-200 hover:bg-brand-primary dark:bg-slate-900 dark:hover:bg-brand-primary hover:text-black text-slate-500 dark:text-slate-400 transition-colors shadow-sm">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Visit our Instagram page" className="p-2 rounded-full bg-slate-200 hover:bg-brand-primary dark:bg-slate-900 dark:hover:bg-brand-primary hover:text-black text-slate-500 dark:text-slate-400 transition-colors shadow-sm">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter" aria-label="Visit our Twitter page" className="p-2 rounded-full bg-slate-200 hover:bg-brand-primary dark:bg-slate-900 dark:hover:bg-brand-primary hover:text-black text-slate-500 dark:text-slate-400 transition-colors shadow-sm">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Dynamic Columns */}
          {finalColumns.map((column, index) => (
            <div key={index} className="col-span-1">
              <h4 className="text-slate-900 dark:text-white font-bold mb-4 md:mb-6 uppercase text-xs tracking-[0.2em]">
                {column.title}
              </h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-slate-500">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.url}
                      className="hover:text-brand-primary transition-colors uppercase font-medium"
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
        <div className="pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-mono">
          <span>{settings.companyInfo.copyright}</span>

          {/* Legal Links (Dynamic) */}
          <div className="flex flex-wrap justify-center gap-6">
            {globalSettings?.sections?.trackRepairPage !== false && (
                <Link to="/track-repair" className="hover:text-brand-primary uppercase transition-colors text-brand-primary font-bold">{t('hero.trackRepair')}</Link>
            )}
            <Link to="/agb" className="hover:text-slate-900 dark:hover:text-white uppercase transition-colors">AGB</Link>
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white uppercase transition-colors">Datenschutz</Link>
            <Link to="/impressum" className="hover:text-slate-900 dark:hover:text-white uppercase transition-colors">Impressum</Link>
            <Link to="/kundenservice" className="hover:text-slate-900 dark:hover:text-white uppercase transition-colors">Kundenservice</Link>
            <Link to="/uber-uns" className="hover:text-slate-900 dark:hover:text-white uppercase transition-colors">Über Uns</Link>
          </div>

          {/* Bottom Links from Settings (if any) */}
          {settings.bottomLinks && settings.bottomLinks.length > 0 && (
            <div className="flex gap-6">
              {settings.bottomLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.url}
                  className="hover:text-slate-900 dark:hover:text-white uppercase"
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

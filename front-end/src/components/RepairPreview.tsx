import React from 'react';
import { Link } from 'react-router-dom';
import {
    Monitor,
    Battery,
    Smartphone,
    Wrench,
    Camera,
    Zap,
    Shield,
    Headphones,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_SERVICE_TERMINAL } from '../context/settings/cache';
import { LocalizedText, ServiceTerminalIcon, ServiceTerminalSettings } from '../context/settings/types';

const SERVICE_ICONS = {
    monitor: Monitor,
    battery: Battery,
    smartphone: Smartphone,
    wrench: Wrench,
    camera: Camera,
    zap: Zap,
    shield: Shield,
    headphones: Headphones,
} as const;

const getLocalizedText = (
    value: LocalizedText | { de?: string; en?: string; ar?: string } | undefined,
    language: string
): string => {
    if (!value) return '';
    const langKey = language as 'de' | 'en' | 'ar';
    return value[langKey] || value.de || value.en || value.ar || '';
};

const sanitizeUrl = (url: string | undefined, fallback: string = '/repair'): string => {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
        return fallback;
    }
    return trimmed || fallback;
};

const isExternalUrl = (url: string): boolean => {
    const lower = url.toLowerCase();
    return lower.startsWith('http://') || lower.startsWith('https://');
};

export const RepairPreview: React.FC = () => {
    const { i18n } = useTranslation();
    const { settings } = useSettings();

    const rawLang = (i18n.language || 'de').toLowerCase().split('-')[0];
    const lang: 'de' | 'en' | 'ar' = rawLang === 'ar' ? 'ar' : rawLang === 'en' ? 'en' : 'de';
    const isRtl = lang === 'ar';

    const terminal: ServiceTerminalSettings = settings?.serviceTerminal || DEFAULT_SERVICE_TERMINAL;

    // If section is explicitly disabled, do not render
    if (terminal.enabled === false) {
        return null;
    }

    const eyebrow = getLocalizedText(terminal.eyebrow, lang) || getLocalizedText(DEFAULT_SERVICE_TERMINAL.eyebrow, lang);
    const title = getLocalizedText(terminal.title, lang) || getLocalizedText(DEFAULT_SERVICE_TERMINAL.title, lang);
    const linkLabel = getLocalizedText(terminal.servicesLinkLabel, lang) || getLocalizedText(DEFAULT_SERVICE_TERMINAL.servicesLinkLabel, lang);
    const linkUrl = sanitizeUrl(terminal.servicesLinkUrl, '/repair');

    const hasExplicitServices = Array.isArray(terminal?.services);

    const displayServices = hasExplicitServices
        ? terminal.services
            .filter(s => Boolean(s?.enabled))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .slice(0, 8)
        : DEFAULT_SERVICE_TERMINAL.services;

    const ctaEnabled = terminal.cta?.enabled !== false;
    const ctaTitle = getLocalizedText(terminal.cta?.title, lang) || getLocalizedText(DEFAULT_SERVICE_TERMINAL.cta.title, lang);
    const ctaDesc = getLocalizedText(terminal.cta?.description, lang) || getLocalizedText(DEFAULT_SERVICE_TERMINAL.cta.description, lang);
    const ctaBtnLabel = getLocalizedText(terminal.cta?.buttonLabel, lang) || getLocalizedText(DEFAULT_SERVICE_TERMINAL.cta.buttonLabel, lang);
    const ctaBtnUrl = sanitizeUrl(terminal.cta?.buttonUrl, '/repair');

    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    return (
        <section
            dir={isRtl ? 'rtl' : 'ltr'}
            className="py-12 md:py-16 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-500 dark:text-cyan-400 mb-1">
                            {eyebrow}
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                            {title}
                        </h2>
                    </div>

                    {isExternalUrl(linkUrl) ? (
                        <a
                            href={linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors group shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
                        >
                            <span>{linkLabel}</span>
                            <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                        </a>
                    ) : (
                        <Link
                            to={linkUrl}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors group shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
                        >
                            <span>{linkLabel}</span>
                            <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                {/* Repair Types Grid */}
                {displayServices.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        {displayServices.map((service, index) => {
                            const IconComponent = SERVICE_ICONS[service.icon as ServiceTerminalIcon] || Wrench;
                            const serviceTitle = getLocalizedText(service.title, lang) || service.id;
                            const servicePrice = getLocalizedText(service.priceLabel, lang) || '';

                            return (
                                <div
                                    key={service.id || `service-card-${index}`}
                                    style={{
                                        backgroundColor: service.cardBackground || '#062033',
                                    }}
                                    className="flex flex-col items-center text-center p-4 md:p-5 rounded-2xl border border-white/10 dark:border-white/[0.08] shadow-sm hover:shadow-md hover:border-white/20 transition-all"
                                >
                                    <span
                                        aria-hidden="true"
                                        style={{ color: service.iconColor || '#22d3ee' }}
                                        className="mb-3 p-2.5 rounded-xl bg-black/20"
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </span>
                                    <p className="text-xs sm:text-sm font-bold text-white mb-1 truncate w-full">
                                        {serviceTitle}
                                    </p>
                                    <p
                                        style={{ color: service.iconColor || '#22d3ee' }}
                                        className="text-xs font-mono font-bold"
                                    >
                                        {servicePrice}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* CTA Banner */}
                {ctaEnabled && (
                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 overflow-hidden shadow-lg">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-white mb-1">
                                    {ctaTitle}
                                </h3>
                                <p className="text-sm text-blue-200">
                                    {ctaDesc}
                                </p>
                            </div>

                            {isExternalUrl(ctaBtnUrl) ? (
                                <a
                                    href={ctaBtnUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 font-black px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg min-h-[44px] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    <span>{ctaBtnLabel}</span>
                                    <ArrowIcon className="w-4 h-4" />
                                </a>
                            ) : (
                                <Link
                                    to={ctaBtnUrl}
                                    className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 font-black px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg min-h-[44px] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    <span>{ctaBtnLabel}</span>
                                    <ArrowIcon className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

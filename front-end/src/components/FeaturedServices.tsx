import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

export const FeaturedServices: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { settings } = useSettings();

    const isRtl = (i18n.language || 'de').startsWith('ar');
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    const featuredConfig = settings?.featuredServices || {
        tagline: t('home.services.tagline', 'Was wir anbieten'),
        heading: t('home.services.heading', 'Alles rund um dein Gerät'),
        cards: [
            {
                id: 'buy',
                iconName: 'ShoppingBag',
                title: t('home.services.buyTitle', 'Kaufen'),
                desc: t('home.services.buyDesc', 'Geprüfte Smartphones & Tablets zu fairen Preisen.'),
                cta: t('home.services.buyCta', 'Zum Marktplatz'),
                route: '/marketplace',
                gradient: 'from-cyan-500/20 to-blue-500/10',
                border: 'hover:border-cyan-500/50',
                iconColor: 'text-cyan-400',
                ctaColor: 'text-cyan-400 group-hover:text-cyan-300',
            },
            {
                id: 'sell',
                iconName: 'Zap',
                title: t('home.services.sellTitle', 'Verkaufen'),
                desc: t('home.services.sellDesc', 'Dein Gerät bewerten lassen und sofort ein Angebot erhalten.'),
                cta: t('home.services.sellCta', 'Gerät bewerten'),
                route: '/valuation',
                gradient: 'from-amber-500/20 to-orange-500/10',
                border: 'hover:border-amber-500/50',
                iconColor: 'text-amber-400',
                ctaColor: 'text-amber-400 group-hover:text-amber-300',
            },
            {
                id: 'repair',
                iconName: 'Wrench',
                title: t('home.services.repairTitle', 'Reparieren'),
                desc: t('home.services.repairDesc', 'Professionelle Reparaturen für alle Geräte — schnell & günstig.'),
                cta: t('home.services.repairCta', 'Reparatur anfragen'),
                route: '/repair',
                gradient: 'from-purple-500/20 to-indigo-500/10',
                border: 'hover:border-purple-500/50',
                iconColor: 'text-purple-400',
                ctaColor: 'text-purple-400 group-hover:text-purple-300',
            },
        ]
    };

    const getIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Layers;
        return <IconComponent className="w-7 h-7" />;
    };

    const isCardComingSoon = (route: string) => {
        if (route === '/marketplace' && settings?.sections?.marketplacePageComingSoon) return true;
        if (route === '/valuation' && settings?.sections?.valuationPageComingSoon) return true;
        if (route === '/repair' && settings?.sections?.repairPageComingSoon) return true;
        if (route === '/accessories' && settings?.sections?.accessoriesPageComingSoon) return true;
        return false;
    };

    const isCardDisabled = (route: string) => {
        if (route === '/marketplace' && settings?.sections?.marketplacePage === false && !settings?.sections?.marketplacePageComingSoon) return true;
        if (route === '/valuation' && settings?.sections?.valuationPage === false && !settings?.sections?.valuationPageComingSoon) return true;
        if (route === '/repair' && settings?.sections?.repairPage === false && !settings?.sections?.repairPageComingSoon) return true;
        if (route === '/accessories' && settings?.sections?.accessoriesPage === false && !settings?.sections?.accessoriesPageComingSoon) return true;
        return false;
    };

    const availableCards = (featuredConfig.cards || []).filter(s => !isCardDisabled(s.route));

    if (availableCards.length === 0) return null;

    return (
        <section
            dir={isRtl ? 'rtl' : 'ltr'}
            className="py-16 md:py-20 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-10 md:mb-14">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-primary mb-3">
                        {featuredConfig.tagline}
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                        {featuredConfig.heading}
                    </h2>
                </div>

                {/* Service Cards */}
                <div className={`grid grid-cols-1 ${availableCards.length === 2 ? 'sm:grid-cols-2 max-w-4xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4 md:gap-6`}>
                    {availableCards.map(s => {
                        const comingSoon = isCardComingSoon(s.route);

                        return (
                            <button
                                key={s.id}
                                onClick={() => navigate(s.route)}
                                className={`group relative text-left rtl:text-right p-6 md:p-8 rounded-2xl bg-gradient-to-br ${s.gradient} border border-slate-200 dark:border-slate-800 ${s.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full cursor-pointer`}
                            >
                                {/* Coming Soon Badge */}
                                {comingSoon && (
                                    <span className="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm shadow-sm">
                                        {t('comingSoon', 'Demnächst!')}
                                    </span>
                                )}

                                {/* Icon */}
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-5 ${s.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                    {getIcon(s.iconName)}
                                </div>

                                {/* Title & desc */}
                                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-2">
                                    {s.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                                    {s.desc}
                                </p>

                                {/* CTA */}
                                <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${s.ctaColor} transition-colors`}>
                                    {s.cta}
                                    <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

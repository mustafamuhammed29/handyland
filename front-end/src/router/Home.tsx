import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageCode } from '../types';
import { useSettings } from '../context/SettingsContext';
import { SEO } from '../components/SEO';

// Lazy-load home components
const Hero = React.lazy(() => import('../components/Hero').then(m => ({ default: m.Hero })));
const Stats = React.lazy(() => import('../components/Stats').then(m => ({ default: m.Stats })));
const FeaturedServices = React.lazy(() => import('../components/FeaturedServices').then(m => ({ default: m.FeaturedServices })));
const FeaturedProducts = React.lazy(() => import('../components/FeaturedProducts').then(m => ({ default: m.FeaturedProducts })));
const RepairPreview = React.lazy(() => import('../components/RepairPreview').then(m => ({ default: m.RepairPreview })));
const RepairGallery = React.lazy(() => import('../components/RepairGallery').then(m => ({ default: m.RepairGallery })));

export const Home = ({ lang }: { lang: LanguageCode }) => {
    const { settings } = useSettings();
    const { t } = useTranslation();
    const sections = settings?.sections || { hero: true, stats: true, marketplace: true, repairPage: true, accessories: true };

    return (
        <>
            <SEO canonical="https://handyland.com" />
            {sections.hero !== false && <Suspense fallback={<div className="h-[70vh]" />}><Hero lang={lang} /></Suspense>}
            {sections.stats !== false && <Suspense fallback={<div className="h-48" />}><Stats /></Suspense>}

            {/* 3 Core Services */}
            <Suspense fallback={<div className="h-48" />}>
                <FeaturedServices />
            </Suspense>

            {/* Featured Marketplace Products — 4 items preview */}
            {sections.marketplace !== false && (
                <Suspense fallback={<div className="h-48" />}>
                    <FeaturedProducts
                        type="marketplace"
                        title={t('home.featuredProducts', 'Aktuelle Angebote')}
                        seeAllLabel={t('home.seeAllProducts', 'Alle Produkte')}
                        seeAllRoute="/marketplace"
                        apiEndpoint="/api/products?limit=8&featured=true"
                    />
                </Suspense>
            )}

            {/* Repair Preview — brief CTA, no full catalog */}
            {sections.repairPage !== false && (
                <Suspense fallback={<div className="h-48" />}>
                    <RepairPreview />
                </Suspense>
            )}

            {/* Repair Gallery */}
            {sections.repairGallery !== false && (
                <Suspense fallback={<div className="h-48" />}>
                    <RepairGallery />
                </Suspense>
            )}

            {/* Featured Accessories — 4 items preview */}
            {sections.accessories !== false && (
                <Suspense fallback={<div className="h-48" />}>
                    <FeaturedProducts
                        type="accessories"
                        title={t('home.featuredAccessories', 'Premium Zubehör')}
                        seeAllLabel={t('home.seeAllAccessories', 'Alle Zubehör')}
                        seeAllRoute="/accessories"
                        apiEndpoint="/api/accessories?limit=8"
                    />
                </Suspense>
            )}
        </>
    );
};

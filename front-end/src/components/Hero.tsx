import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageCode } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, Zap, Smartphone, Search, Star, Hexagon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface HeroProps {
    lang: LanguageCode;
}

export const Hero: React.FC<HeroProps> = ({ lang }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isRTL = lang === 'ar';
    const { settings } = useSettings();
    const { theme } = useTheme();

    // FIXED C-3: Use refs + rAF instead of setState to avoid 60 re-renders/sec
    const textRef = useRef<HTMLDivElement>(null);
    const visualRef = useRef<HTMLDivElement>(null);
    const rafId = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Cancel any pending frame to avoid stacking
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => {
                const x = (e.clientX - window.innerWidth / 2) / 40;
                const y = (e.clientY - window.innerHeight / 2) / 40;
                if (textRef.current) {
                    textRef.current.style.transform = `translate(${x * -0.5}px, ${y * -0.5}px)`;
                }
                if (visualRef.current) {
                    visualRef.current.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                }
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <div
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden perspective-container transition-colors duration-300 bg-slate-50 dark:bg-slate-950"
            style={theme === 'dark' ? {
                background: `linear-gradient(to bottom right, ${settings.hero.bgStart || '#0f172a'}, ${settings.hero.bgEnd || '#020617'})`
            } : undefined}
        >

            {/* Floating Abstract Shapes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-28 md:pt-16 lg:pt-0">

                {/* Text Content */}
                <div
                    ref={textRef}
                    className="space-y-8 order-2 lg:order-1 transition-transform duration-100 ease-out"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-700">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: settings.hero.accentColor }}></span>
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: settings.hero.accentColor }}>{settings.hero.tagline || t('home.tagline', "DEUTSCHLANDS #1 TECH-HUB")}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-tight tracking-tight whitespace-pre-line">
                        {settings.hero.headline}
                    </h1>

                    <p className="text-base md:text-lg text-slate-400 max-w-lg leading-relaxed border-l-2 border-slate-800 pl-4 md:pl-6">
                        {/* FIXED: Use admin-controlled Arabic subheadline if available, fallback to hardcoded */}
                        {lang === 'ar'
                            ? (settings.hero.subheadlineAr || 'اكتشف مستقبل تجارة الهواتف. منصة تفاعلية للبيع، الشراء، والصيانة بدقة ألمانية.')
                            : settings.hero.subheadline}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="group relative px-8 py-4 bg-brand-primary text-black font-extrabold text-lg rounded-full overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg shadow-brand-primary/25"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center gap-2">
                                {settings.hero.buttonMarket || t('hero.shopNow')} {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                            </span>
                        </button>

                        <button
                            onClick={() => navigate('/valuation')}
                            className="px-8 py-4 rounded-full border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 glass-modern shadow-sm"
                        >
                            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" /> {settings.hero.buttonValuation || t('hero.sellDevice')}
                        </button>
                        
                        <button
                            onClick={() => navigate('/track-repair')}
                            className="px-8 py-4 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 backdrop-blur-md shadow-sm"
                        >
                            <Search className="w-5 h-5" /> {t('hero.trackRepair')}
                        </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 pt-6 md:pt-8">
                        <div className="group flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-emerald-500/30 transition-all">
                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] md:text-xs font-mono text-slate-300 group-hover:text-emerald-300 transition-colors">{settings.hero.trustBadge1 || 'VERIFIED SELLERS'}</span>
                        </div>
                        <div className="group flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-blue-500/30 transition-all">
                            <Hexagon className="w-4 h-4 md:w-5 md:h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] md:text-xs font-mono text-slate-300 group-hover:text-blue-300 transition-colors">{settings.hero.trustBadge2 || '24/7 SUPPORT'}</span>
                        </div>
                        <div className="group flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-purple-500/30 transition-all">
                            <Star className="w-4 h-4 md:w-5 md:h-5 text-purple-400 group-hover:scale-110 transition-transform fill-purple-400" />
                            <span className="text-[10px] md:text-xs font-mono text-slate-300 group-hover:text-purple-300 transition-colors">{settings.hero.trustBadge3 || '4.9★ RATED'}</span>
                        </div>
                    </div>
                </div>

                {/* 3D Visual */}
                <div className="order-1 lg:order-2 relative h-[400px] md:h-[500px] lg:h-[700px] flex items-center justify-center preserve-3d">

                    {/* Main Phone Card - Rotates opposite to mouse */}
                    <div
                        className="relative w-64 md:w-80 h-[400px] md:h-[500px] rounded-[2.5rem] md:rounded-[3rem] bg-slate-900 border-[6px] md:border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden transform transition-all duration-100 ease-out cursor-pointer hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:border-cyan-800/50"
                        onClick={() => {
                            if (settings.hero.productName) {
                                navigate(`/marketplace?search=${encodeURIComponent(settings.hero.productName)}`);
                            } else {
                                navigate('/marketplace');
                            }
                        }}
                        ref={visualRef}
                        style={{
                            transform: 'translateZ(50px)',
                            transition: 'transform 0.1s ease-out'
                        }}
                    >
                        {/* Screen Content */}
                        <div className="flex-1 bg-black relative overflow-hidden">
                            <img
                                src={settings.hero.heroImage || "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=600&auto=format&fit=crop"}
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                                alt="App Screen"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                            {/* UI Elements on Phone */}
                            <div className="absolute bottom-6 md:bottom-8 left-5 md:left-6 right-5 md:right-6">
                                <div className="flex justify-between items-end mb-4 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-brand-primary text-[10px] md:text-xs font-bold mb-1 truncate">{settings.hero.productLabel || 'CURRENT OFFER'}</div>
                                        <div className="text-white text-lg md:text-xl font-black leading-tight break-words line-clamp-2 md:line-clamp-3">{settings.hero.productName || 'iPhone 15 Pro'}</div>
                                    </div>
                                    <div className="text-white text-lg md:text-xl font-bold whitespace-nowrap shrink-0">{settings.hero.productPrice || '€950'}</div>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-primary w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Floating Elements (Parallax Layers) */}
                    <div
                        className="absolute top-[15%] md:top-1/4 right-[2%] sm:right-4 md:-right-4 lg:-right-20 xl:-right-24 glass-modern p-2 md:p-4 rounded-xl md:rounded-2xl shrink-0 z-20 md:max-w-none"
                        style={{ transform: 'translateZ(80px)' }}
                    >
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                <Smartphone className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[9px] md:text-xs text-slate-400 whitespace-nowrap">{settings.hero.stat1Title || t('home.deviceSold', 'Geräte verkauft')}</div>
                                <div className="text-[11px] md:text-base text-slate-900 dark:text-white font-bold whitespace-nowrap">{settings.hero.stat1Value || t('home.thisWeek', '+24% diese Woche')}</div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="absolute bottom-[40%] md:bottom-[35%] lg:bottom-[45%] left-[2%] sm:left-0 md:-left-4 lg:-left-20 xl:-left-24 glass-modern p-2 md:p-4 rounded-xl md:rounded-2xl shrink-0 z-20 md:max-w-none"
                        style={{ transform: 'translateZ(100px)' }}
                    >
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                <Star className="w-4 h-4 md:w-5 md:h-5 fill-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[9px] md:text-xs text-slate-400 whitespace-nowrap">{settings.hero.stat2Title || t('home.customerRating', 'Kundenbewertung')}</div>
                                <div className="text-[11px] md:text-base text-slate-900 dark:text-white font-bold whitespace-nowrap">{settings.hero.stat2Value || t('home.excellent', '4.9/5.0 Ausgezeichnet')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Circle Graphic Behind */}
                    <div
                        className="absolute inset-0 border border-slate-800 rounded-full scale-125 opacity-20 -z-10"
                        style={{ transform: 'translateZ(-50px) scale(1)' }}
                    ></div>
                    <div
                        className="absolute inset-0 border border-dashed border-slate-700 rounded-full scale-110 opacity-20 -z-10"
                        style={{ transform: 'translateZ(-50px) rotate(0deg)' }}
                    ></div>

                </div>

            </div>
        </div>
    );
};
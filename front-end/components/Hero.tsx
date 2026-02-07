import React, { useState, useEffect } from 'react';
import { ViewState, LanguageCode } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, Zap, Smartphone, Search, Star, Hexagon } from 'lucide-react';
import { translations } from '../i18n';
import { useSettings } from '../context/SettingsContext';

interface HeroProps {
    setView: (view: ViewState) => void;
    lang: LanguageCode;
}

export const Hero: React.FC<HeroProps> = ({ setView, lang }) => {
    const t = translations[lang];
    const isRTL = lang === 'ar';
    const { settings } = useSettings();

    // Mouse Parallax State
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX - window.innerWidth / 2) / 40;
            const y = (e.clientY - window.innerHeight / 2) / 40;
            setOffset({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden perspective-container transition-colors duration-700"
            style={{
                background: `linear-gradient(to bottom right, ${settings.hero.bgStart}, ${settings.hero.bgEnd})`
            }}
        >

            {/* Floating Abstract Shapes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <div
                    className="space-y-8 order-2 lg:order-1"
                    style={{ transform: `translate(${offset.x * -0.5}px, ${offset.y * -0.5}px)` }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-700">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: settings.hero.accentColor }}></span>
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: settings.hero.accentColor }}>Germany's #1 Tech Hub</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight whitespace-pre-line">
                        {settings.hero.headline}
                    </h1>

                    <p className="text-lg text-slate-400 max-w-lg leading-relaxed border-l-2 border-slate-800 pl-6">
                        {lang === 'ar'
                            ? 'اكتشف مستقبل تجارة الهواتف. منصة تفاعلية للبيع، الشراء، والصيانة بدقة ألمانية.'
                            : settings.hero.subheadline}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => setView(ViewState.MARKETPLACE)}
                            className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden hover:scale-105 transition-transform duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center gap-2">
                                {settings.hero.buttonMarket || t.ctaMarket} {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                            </span>
                        </button>

                        <button
                            onClick={() => setView(ViewState.VALUATION)}
                            className="px-8 py-4 rounded-full border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5 text-yellow-400" /> {settings.hero.buttonValuation || t.ctaValue}
                        </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center gap-6 pt-8">
                        <div className="group flex items-center gap-2 px-4 py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-emerald-500/30 transition-all">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-mono text-slate-300 group-hover:text-emerald-300 transition-colors">{settings.hero.trustBadge1 || 'VERIFIED SELLERS'}</span>
                        </div>
                        <div className="group flex items-center gap-2 px-4 py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-blue-500/30 transition-all">
                            <Hexagon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-mono text-slate-300 group-hover:text-blue-300 transition-colors">{settings.hero.trustBadge2 || '24/7 SUPPORT'}</span>
                        </div>
                        <div className="group flex items-center gap-2 px-4 py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-purple-500/30 transition-all">
                            <Star className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform fill-purple-400" />
                            <span className="text-xs font-mono text-slate-300 group-hover:text-purple-300 transition-colors">{settings.hero.trustBadge3 || '4.9★ RATED'}</span>
                        </div>
                    </div>
                </div>

                {/* 3D Visual */}
                <div className="order-1 lg:order-2 relative h-[500px] lg:h-[700px] flex items-center justify-center preserve-3d">

                    {/* Main Phone Card - Rotates opposite to mouse */}
                    <div
                        className="relative w-72 md:w-80 h-[500px] rounded-[3rem] bg-slate-900 border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-100 ease-out"
                        style={{
                            transform: `rotateY(${offset.x}deg) rotateX(${-offset.y}deg) translateZ(50px)`,
                            boxShadow: `${-offset.x * 2}px ${-offset.y * 2}px 50px rgba(0,0,0,0.5)`
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
                            <div className="absolute bottom-8 left-6 right-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <div className="text-cyan-400 text-xs font-bold mb-1">{settings.hero.productLabel || 'CURRENT OFFER'}</div>
                                        <div className="text-white text-2xl font-black">{settings.hero.productName || 'iPhone 15 Pro'}</div>
                                    </div>
                                    <div className="text-white text-xl font-bold">{settings.hero.productPrice || '€950'}</div>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Floating Elements (Parallax Layers) */}
                    <div
                        className="absolute top-1/4 right-10 lg:-right-10 glass-modern p-4 rounded-2xl animate-bounce duration-[3000ms]"
                        style={{ transform: `translateZ(80px) translateX(${offset.x * 1.5}px)` }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">{settings.hero.stat1Title || 'Device Sold'}</div>
                                <div className="text-white font-bold">{settings.hero.stat1Value || '+24% this week'}</div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="absolute bottom-1/4 left-0 lg:-left-12 glass-modern p-4 rounded-2xl animate-bounce duration-[4000ms]"
                        style={{ transform: `translateZ(100px) translateX(${offset.x * 2}px)` }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Star className="w-5 h-5 fill-purple-400" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">{settings.hero.stat2Title || 'Customer Rating'}</div>
                                <div className="text-white font-bold">{settings.hero.stat2Value || '4.9/5.0 Excellent'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Circle Graphic Behind */}
                    <div
                        className="absolute inset-0 border border-slate-800 rounded-full scale-125 opacity-20 -z-10"
                        style={{ transform: `translateZ(-50px) scale(${1 + (offset.y * 0.005)})` }}
                    ></div>
                    <div
                        className="absolute inset-0 border border-dashed border-slate-700 rounded-full scale-110 opacity-20 -z-10"
                        style={{ transform: `translateZ(-50px) rotate(${offset.x * 2}deg)` }}
                    ></div>

                </div>

            </div>
        </div>
    );
};
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageCode } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, Zap, Smartphone, Search, Star, Hexagon, Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface HeroProps {
    lang: LanguageCode;
}

const isSafeClientMediaUrl = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Allowed relative paths
    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//') || trimmed.includes('/../') || trimmed.includes('/..') || /[<>"'`\s]/.test(trimmed)) {
            return false;
        }
        return trimmed.startsWith('/media/hero/') || trimmed.startsWith('/media/uploads/') || trimmed.startsWith('/media/');
    }

    try {
        const parsed = new URL(trimmed);
        const protocol = parsed.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') return false;

        // In production, enforce HTTPS and reject private/loopback/link-local hosts
        if (import.meta.env.PROD) {
            if (protocol !== 'https:') return false;
            const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
            if (
                host === 'localhost' ||
                host === '127.0.0.1' ||
                host === '::1' ||
                host.startsWith('10.') ||
                host.startsWith('192.168.') ||
                host.startsWith('169.254.') ||
                host.endsWith('.local') ||
                host.endsWith('.internal')
            ) {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
};

export const Hero: React.FC<HeroProps> = ({ lang }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isRTL = lang === 'ar';
    const { settings } = useSettings();
    const { theme } = useTheme();

    const textRef = useRef<HTMLDivElement>(null);
    const visualRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const rafId = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const mediaSettings = settings.hero?.media;
    const isConfiguredVideoMode =
        mediaSettings?.mode === 'video' &&
        typeof mediaSettings.videoUrl === 'string' &&
        isSafeClientMediaUrl(mediaSettings.videoUrl);
    const shouldShowVideo = isConfiguredVideoMode && !videoError;

    // Detect user accessibility preference for reduced motion
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        if (mediaQuery.matches) {
            setIsPlaying(false);
        }

        const handler = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
            if (e.matches && videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // 3D Parallax effect on mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => {
                const x = (e.clientX - window.innerWidth / 2) / 40;
                const y = (e.clientY - window.innerHeight / 2) / 40;
                if (textRef.current) {
                    textRef.current.style.transform = `translate(${x * -0.5}px, ${y * -0.5}px)`;
                }
                if (visualRef.current) {
                    visualRef.current.style.transform = `translateZ(50px) rotateY(${x}deg) rotateX(${-y}deg)`;
                }
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    // Auto-play video according to preferences
    useEffect(() => {
        if (shouldShowVideo && videoRef.current) {
            if (prefersReducedMotion) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(() => {
                    // Browser prevented autoplay
                    setIsPlaying(false);
                });
            }
        }
    }, [shouldShowVideo, prefersReducedMotion, mediaSettings?.videoUrl]);

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(() => {});
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div
            className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden perspective-container transition-colors duration-300 bg-slate-50 dark:bg-slate-950 pt-28 sm:pt-32 lg:pt-24 pb-12"
            style={theme === 'dark' ? {
                background: `linear-gradient(to bottom right, ${settings.hero.bgStart || '#0f172a'}, ${settings.hero.bgEnd || '#020617'})`
            } : undefined}
        >

            {/* Floating Abstract Glow Shapes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">

                {/* Left: Text & CTA Content */}
                <div
                    ref={textRef}
                    className="w-full lg:w-1/2 order-2 lg:order-1 space-y-6 md:space-y-8 mb-4 md:mb-0 transition-transform duration-100 ease-out flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                    <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-700">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: settings.hero.accentColor }}></span>
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: settings.hero.accentColor }}>{t('home.tagline', "DEUTSCHLANDS #1 TECH-HUB")}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[1.1] md:leading-none tracking-tight whitespace-pre-line">
                        {settings.hero.headline && settings.hero.headline.trim().length > 1 ? settings.hero.headline : t('home.headline', 'HandyLand Premium Tech Hub')}
                    </h1>

                    <p className="text-base md:text-lg text-slate-400 max-w-lg leading-relaxed border-l-0 lg:border-l-2 border-slate-800 pl-0 lg:pl-4 md:pl-6 mx-auto lg:mx-0 text-center lg:text-left">
                        {lang === 'ar'
                            ? (settings.hero.subheadlineAr || 'اكتشف مستقبل تجارة الهواتف. منصة تفاعلية للبيع، الشراء، والصيانة بدقة ألمانية.')
                            : settings.hero.subheadline}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 md:gap-4 pt-4 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="w-full sm:flex-1 min-w-[140px] group relative px-4 py-3.5 md:px-8 md:py-4 bg-brand-primary text-black font-bold md:font-extrabold text-xs md:text-lg rounded-full overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg shadow-brand-primary/25 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center justify-center gap-1 md:gap-2 text-center">
                                {settings.hero.buttonMarket || t('hero.shopNow')} {isRTL ? <ArrowLeft className="w-3 h-3 md:w-5 md:h-5 shrink-0" /> : <ArrowRight className="w-3 h-3 md:w-5 md:h-5 shrink-0" />}
                            </span>
                        </button>

                        <div className="flex flex-col sm:contents gap-3">
                            <button
                                onClick={() => navigate('/valuation')}
                                className="w-full sm:flex-1 min-w-[140px] px-3 py-3 md:px-8 md:py-4 rounded-full border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm md:text-base hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 glass-modern shadow-sm text-center"
                            >
                                <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-400 fill-amber-400/20 shrink-0" /> 
                                <span>{settings.hero.buttonValuation || t('hero.sellDevice')}</span>
                            </button>
                            
                            <button
                                onClick={() => navigate('/track-repair')}
                                className="w-full sm:flex-1 min-w-[140px] px-3 py-3 md:px-8 md:py-4 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 font-bold text-sm md:text-base hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 backdrop-blur-md shadow-sm text-center"
                            >
                                <Search className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> 
                                <span>{t('hero.trackRepair')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-6 pt-4 md:pt-8 mb-6 md:mb-12 w-full">
                        <div className="group flex flex-col items-center justify-center text-center md:flex-row md:text-left border border-slate-200 dark:border-slate-800/50 rounded-lg px-2 py-1.5 md:px-4 md:py-2 bg-white/50 dark:bg-slate-900/30 hover:border-emerald-500/30 transition-all flex-1 min-w-[100px] max-w-[30%] md:max-w-none">
                            <ShieldCheck className="w-4 h-4 mb-1 md:mb-0 md:mr-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] md:text-xs leading-tight font-mono text-slate-600 dark:text-slate-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors">{settings.hero.trustBadge1 || t('hero.trustBadge1', 'VERIFIZIERTE HÄNDLER')}</span>
                        </div>
                        <div className="group flex flex-col items-center justify-center text-center md:flex-row md:text-left border border-slate-200 dark:border-slate-800/50 rounded-lg px-2 py-1.5 md:px-4 md:py-2 bg-white/50 dark:bg-slate-900/30 hover:border-blue-500/30 transition-all flex-1 min-w-[100px] max-w-[30%] md:max-w-none">
                            <Hexagon className="w-4 h-4 mb-1 md:mb-0 md:mr-2 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] md:text-xs leading-tight font-mono text-slate-600 dark:text-slate-300 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">{settings.hero.trustBadge2 || t('hero.trustBadge2', '24/7 SUPPORT')}</span>
                        </div>
                        <div className="group flex flex-col items-center justify-center text-center md:flex-row md:text-left border border-slate-200 dark:border-slate-800/50 rounded-lg px-2 py-1.5 md:px-4 md:py-2 bg-white/50 dark:bg-slate-900/30 hover:border-purple-500/30 transition-all flex-1 min-w-[100px] max-w-[30%] md:max-w-none">
                            <Star className="w-4 h-4 mb-1 md:mb-0 md:mr-2 text-purple-500 group-hover:scale-110 transition-transform fill-purple-500/50" />
                            <span className="text-[10px] md:text-xs leading-tight font-mono text-slate-600 dark:text-slate-300 group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors">{settings.hero.trustBadge3 || t('hero.trustBadge3', '4,9★ BEWERTET')}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Configurable Media Slot (Video Mode vs Content Mode) */}
                <div className="relative w-full lg:w-1/2 order-1 lg:order-2 h-[340px] sm:h-[400px] md:h-[500px] lg:h-[700px] flex items-center justify-center preserve-3d">

                    {shouldShowVideo ? (
                        /* ── VIDEO MODE ────────────────────────────────────────── */
                        <div
                            ref={visualRef}
                            className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[500px] aspect-[4/3] sm:aspect-video rounded-3xl md:rounded-[2.5rem] bg-slate-950/80 border-4 md:border-[6px] border-slate-800/80 shadow-2xl flex flex-col overflow-hidden transform transition-all duration-100 ease-out group hover:border-cyan-500/50 hover:shadow-[0_0_35px_rgba(6,182,212,0.3)] backdrop-blur-xl"
                            style={{
                                transform: 'translateZ(50px)',
                                transition: 'transform 0.1s ease-out'
                            }}
                        >
                            {/* Video Element */}
                            <video
                                ref={videoRef}
                                src={mediaSettings.videoUrl}
                                poster={mediaSettings.posterUrl || settings.hero?.heroImage}
                                aria-label={mediaSettings.altText || 'HandyLand Tech Showcase Video'}
                                title={mediaSettings.altText || 'HandyLand Tech Showcase'}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onError={() => setVideoError(true)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="w-full h-full object-cover"
                            />

                            {/* Atmospheric Vignette & Contrast Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none"></div>

                            {/* Accessible Interactive Play/Pause Control Button */}
                            <button
                                type="button"
                                onClick={togglePlayPause}
                                aria-label={isPlaying ? t('hero.pauseVideo', 'Video pausieren') : t('hero.playVideo', 'Video abspielen')}
                                className="absolute bottom-4 right-4 z-30 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md shadow-lg hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            >
                                {isPlaying ? (
                                    <Pause size={16} className="text-cyan-400" />
                                ) : (
                                    <Play size={16} className="text-cyan-400 ml-0.5" />
                                )}
                            </button>

                            {/* Corner Tech Glow Badge */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-700/60 backdrop-blur-md">
                                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
                                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                                    {mediaSettings.altText ? mediaSettings.altText.substring(0, 20) : 'HANDYLAND LIVE'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* ── CONTENT MODE (3D Phone Mockup) ────────────────────── */
                        <>
                            {/* Main Phone Card - Rotates opposite to mouse */}
                            <div
                                className="relative w-56 sm:w-64 md:w-80 h-[320px] sm:h-[380px] md:h-[500px] rounded-[2.5rem] md:rounded-[3rem] bg-slate-900 border-[6px] md:border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden transform transition-all duration-100 ease-out cursor-pointer hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:border-cyan-800/50"
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
                                                <div className="text-brand-primary text-[10px] md:text-xs font-bold mb-1 truncate">{(!settings.hero.productLabel || settings.hero.productLabel === 'FEATURED DEVICE') ? t('home.featuredDevice', 'EMPFOHLENES GERÄT') : settings.hero.productLabel}</div>
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
                                className="absolute hidden md:block top-3 md:top-1/4 right-2 sm:right-4 md:-right-4 lg:-right-20 xl:-right-24 glass-modern p-2 md:p-4 rounded-xl md:rounded-2xl shrink-0 z-20 max-w-[160px] md:max-w-none overflow-hidden"
                                style={{ transform: 'translateZ(80px)' }}
                            >
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                        <Smartphone className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <div className="text-[9px] md:text-xs text-slate-400 whitespace-normal leading-tight">{settings.hero.stat1Title || t('home.deviceSold', 'Geräte verkauft')}</div>
                                        <div className="text-[11px] md:text-base text-cyan-400 font-bold whitespace-normal leading-tight">{settings.hero.stat1Value || t('home.thisWeek', '+24% diese Woche')}</div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="absolute hidden md:block bottom-[40%] md:bottom-[35%] lg:bottom-[45%] left-2 sm:left-0 md:-left-4 lg:-left-20 xl:-left-24 glass-modern p-2 md:p-4 rounded-xl md:rounded-2xl shrink-0 z-20 max-w-[calc(100%-16px)] md:max-w-none overflow-hidden"
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
                        </>
                    )}

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
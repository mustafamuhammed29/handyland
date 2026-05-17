import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sparkles, Smartphone, ScanLine, ChevronLeft, ChevronRight, Laptop, Tablet, Gamepad2, Watch, Headphones, Camera, Monitor, Speaker, MousePointer2 } from 'lucide-react';
import { api } from '../../utils/api';
import { AppFrame } from './AppFrame';
import { LazyImage } from '../ui/LazyImage';

// ─── Lucide Icon Mapping ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
    Smartphone, Tablet, Laptop, Gamepad2, Watch, Headphones, ScanLine, Search, Sparkles,
    Camera, Monitor, Speaker, MousePointer2
};

// ─── Initial Category Config (Fallback) ───────────────────────────────────────
const INITIAL_CATEGORIES = [
    { id: 'Smartphone',  label: 'Smartphones',    emoji: '📱', icon: Smartphone,  color: 'blue' },
    { id: 'Tablet',      label: 'Tablets',         emoji: '⬛', icon: Tablet,      color: 'purple' },
    { id: 'Laptop',      label: 'Laptops',         emoji: '💻', icon: Laptop,      color: 'indigo' },
    { id: 'Gaming',      label: 'Spielekonsolen',  emoji: '🎮', icon: Gamepad2,    color: 'red' },
    { id: 'Smartwatch',  label: 'Smartwatches',    emoji: '⌚', icon: Watch,       color: 'emerald' },
    { id: 'Audio',       label: 'Audio & Kopfhörer',emoji: '🎧', icon: Headphones, color: 'amber' },
];

// ─── Initial Brand Logo Map (Fallback) ────────────────────────────────────────
const INITIAL_BRAND_LOGOS: Record<string, string> = {
    'Apple':     'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    'Samsung':   'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
    'Google':    'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    'Xiaomi':    'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg',
    'Sony':      'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
    'OPPO':      'https://upload.wikimedia.org/wikipedia/commons/8/88/Oppo_logo.png',
    'OnePlus':   'https://upload.wikimedia.org/wikipedia/commons/8/87/OnePlus_Logo.svg',
    'Dell':      'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg',
    'Lenovo':    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg',
    'HP':        'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg',
    'Microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    'Nintendo':  'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg',
    'Garmin':    'https://upload.wikimedia.org/wikipedia/commons/2/20/Garmin_Logo_2006.svg',
    'Bose':      'https://upload.wikimedia.org/wikipedia/commons/d/db/Bose_wordmark.svg',
};

// ─── Series Grouping Helper ───────────────────────────────────────────────────
const getSeriesName = (brand: string, modelName: string, category: string): string => {
    if (category === 'Smartphone') {
        if (brand === 'Apple' && modelName.includes('iPhone')) {
            const match = modelName.match(/iPhone \d+|iPhone SE|iPhone XS|iPhone XR|iPhone X$/i);
            return match ? match[0] : 'Other iPhones';
        }
        if (brand === 'Samsung' && modelName.includes('Galaxy')) {
            if (modelName.includes('Z Fold')) return 'Galaxy Z Fold';
            if (modelName.includes('Z Flip')) return 'Galaxy Z Flip';
            const match = modelName.match(/Galaxy (S|A|M)\d+/i);
            return match ? match[0] : 'Other Galaxies';
        }
        if (brand === 'Google' && modelName.includes('Pixel')) {
            const match = modelName.match(/Pixel \d+/i);
            return match ? match[0] : 'Other Pixels';
        }
        if (brand === 'Xiaomi') {
            if (modelName.includes('Redmi')) return 'Redmi Note';
            const match = modelName.match(/Xiaomi \d+/i);
            return match ? match[0] : 'Xiaomi';
        }
    }
    if (category === 'Tablet') {
        if (brand === 'Apple') {
            if (modelName.includes('iPad Pro')) return 'iPad Pro';
            if (modelName.includes('iPad Air')) return 'iPad Air';
            if (modelName.includes('iPad mini')) return 'iPad mini';
            return 'iPad';
        }
        if (brand === 'Samsung') {
            const match = modelName.match(/Tab S\d+|Tab A\d+/i);
            return match ? `Galaxy ${match[0]}` : 'Galaxy Tab';
        }
    }
    if (category === 'Laptop') {
        if (brand === 'Apple') {
            if (modelName.includes('MacBook Pro 16')) return 'MacBook Pro 16"';
            if (modelName.includes('MacBook Pro 14')) return 'MacBook Pro 14"';
            if (modelName.includes('MacBook Air 15')) return 'MacBook Air 15"';
            if (modelName.includes('MacBook Air 13') || modelName.includes('MacBook Air M1')) return 'MacBook Air 13"';
        }
        if (brand === 'Dell') {
            if (modelName.includes('XPS')) return 'XPS';
            if (modelName.includes('Latitude')) return 'Latitude';
            return 'Inspiron';
        }
        if (brand === 'Lenovo') {
            if (modelName.includes('ThinkPad')) return 'ThinkPad';
            if (modelName.includes('Yoga')) return 'Yoga';
            return 'IdeaPad';
        }
    }
    if (category === 'Gaming') {
        if (modelName.includes('PlayStation 5')) return 'PlayStation 5';
        if (modelName.includes('PlayStation 4')) return 'PlayStation 4';
        if (modelName.includes('Xbox Series')) return 'Xbox Series';
        if (modelName.includes('Xbox One')) return 'Xbox One';
        if (modelName.includes('Switch')) return 'Nintendo Switch';
    }
    if (category === 'Smartwatch') {
        if (brand === 'Apple') {
            if (modelName.includes('Ultra')) return 'Apple Watch Ultra';
            if (modelName.includes('SE')) return 'Apple Watch SE';
            const match = modelName.match(/Series \d+/i);
            return match ? `Apple Watch ${match[0]}` : 'Apple Watch';
        }
        if (brand === 'Samsung') {
            if (modelName.includes('Ultra')) return 'Galaxy Watch Ultra';
            if (modelName.includes('Classic')) return 'Galaxy Watch Classic';
            const match = modelName.match(/Watch \d+/i);
            return match ? `Galaxy ${match[0]}` : 'Galaxy Watch';
        }
    }
    if (category === 'Audio') {
        if (brand === 'Apple') {
            if (modelName.includes('AirPods Pro')) return 'AirPods Pro';
            if (modelName.includes('AirPods Max')) return 'AirPods Max';
            return 'AirPods';
        }
        if (brand === 'Sony') {
            if (modelName.includes('WH')) return 'WH Series';
            if (modelName.includes('WF')) return 'WF Series';
        }
        if (brand === 'Bose') return 'QuietComfort';
        if (brand === 'Samsung') return 'Galaxy Buds';
    }
    // Generic fallback
    const words = modelName.split(' ');
    return words.slice(0, Math.min(3, words.length)).join(' ');
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isCategoryMatch = (deviceCat: string, targetId: string) => {
    if (!deviceCat || !targetId) return false;
    const d = deviceCat.toLowerCase().trim();
    const t = targetId.toLowerCase().trim();
    
    // 1. Exact or plural match
    if (d === t || d === t + 's' || d === t.replace(/s$/, '')) return true;
    
    // 2. German/English mapping & Substring matching
    const mapping: Record<string, string[]> = {
        'smartphone': ['handy', 'mobiltelefon', 'phone'],
        'tablet': ['tablet', 'ipad'],
        'laptop': ['computer', 'notebook', 'macbook', 'laptop'],
        'gaming': ['konsole', 'console', 'playstation', 'xbox', 'nintendo', 'gaming'],
        'smartwatch': ['uhr', 'watch', 'apple watch'],
        'audio': ['kopfhörer', 'headphones', 'airpods', 'audio']
    };
    
    const equivalents = mapping[t] || [];
    return equivalents.some(eq => d.includes(eq) || eq.includes(d));
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ValuationLanding = ({
    t,
    searchTerm,
    setSearchTerm,
    apiDevices,
    startWizard,
    mode,
    quoteData,
    handlePrevStep,
    step,
    displayPrice
}: any) => {
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [brandLogos, setBrandLogos] = useState(INITIAL_BRAND_LOGOS);
    const [funnelStep, setFunnelStep] = useState<'category' | 'brand' | 'series' | 'model'>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

    // Fetch dynamic config
    useEffect(() => {
        const fetchDynamicConfig = async () => {
            try {
                const [catRes, brandRes] = await Promise.all([
                    api.get('/api/valuation/categories'),
                    api.get('/api/valuation/brands')
                ]);
                
                if (catRes.data.success && catRes.data.data?.length > 0) {
                    const mappedCats = catRes.data.data
                        .filter((c: any) => c.is_active)
                        .map((c: any) => ({
                            id: c.name,
                            label: c.label,
                            emoji: c.emoji,
                            icon: ICON_MAP[c.icon_name] || Smartphone,
                            color: c.color || 'blue'
                        }));
                    setCategories(mappedCats);
                }
                
                if (brandRes.data.success && brandRes.data.data?.length > 0) {
                    const mappedBrands: Record<string, string> = {};
                    brandRes.data.data.forEach((b: any) => {
                        mappedBrands[b.name] = b.logo_url;
                    });
                    setBrandLogos(mappedBrands);
                }
            } catch (err) {
                console.error("Failed to fetch valuation config", err);
            }
        };
        fetchDynamicConfig();
    }, []);

    const isSearching = searchTerm.trim().length > 0;

    // Available categories (always show all, but we could mark those with devices)
    const availableCategories = useMemo(() => {
        return categories;
    }, [categories]);



    // Available brands for selected category
    const availableBrands = useMemo((): string[] => {
        if (!selectedCategory || !apiDevices) return [];
        const filtered = apiDevices.filter((d: any) => isCategoryMatch(d.category, selectedCategory));
        const brandSet = new Set<string>(filtered.map((d: any) => d.brand).filter(Boolean));
        return Array.from(brandSet).sort((a: string, b: string) => a.localeCompare(b));
    }, [selectedCategory, apiDevices]);

    // Series for selected brand+category
    const brandSeries = useMemo(() => {
        if (!selectedBrand || !selectedCategory || !apiDevices) return [];
        const filtered = apiDevices.filter((d: any) => d.brand === selectedBrand && isCategoryMatch(d.category, selectedCategory));
        const seriesSet = new Set(filtered.map((d: any) => getSeriesName(d.brand, d.modelName, d.category)));
        return Array.from(seriesSet as Set<string>).sort((a: string, b: string) => a.localeCompare(b));
    }, [selectedBrand, selectedCategory, apiDevices]);

    // Models for selected series
    const seriesModels = useMemo(() => {
        if (!selectedSeries || !selectedBrand || !selectedCategory || !apiDevices) return [];
        return apiDevices
            .filter((d: any) => d.brand === selectedBrand && isCategoryMatch(d.category, selectedCategory) && getSeriesName(d.brand, d.modelName, d.category) === selectedSeries)
            .sort((a: any, b: any) => b.basePrice - a.basePrice);
    }, [selectedSeries, selectedBrand, selectedCategory, apiDevices]);

    // Global search
    const searchFilteredDevices = useMemo(() => {
        if (!isSearching || !apiDevices) return [];
        const term = searchTerm.toLowerCase();
        return apiDevices.filter((d: any) =>
            (d.modelName?.toLowerCase() || '').includes(term) ||
            (d.brand?.toLowerCase() || '').includes(term) ||
            (d.category?.toLowerCase() || '').includes(term)
        );
    }, [searchTerm, apiDevices]);

    // Handlers
    const handleCategorySelect = (cat: string) => {
        setSelectedCategory(cat);
        setSelectedBrand(null);
        setSelectedSeries(null);
        setFunnelStep('brand');
        setSearchTerm('');
    };
    const handleBrandSelect = (brand: string) => {
        setSelectedBrand(brand);
        setSelectedSeries(null);
        setFunnelStep('series');
    };
    const handleSeriesSelect = (series: string) => {
        setSelectedSeries(series);
        setFunnelStep('model');
    };
    const handleBack = () => {
        if (funnelStep === 'model') setFunnelStep('series');
        else if (funnelStep === 'series') setFunnelStep('brand');
        else if (funnelStep === 'brand') { setFunnelStep('category'); setSelectedBrand(null); }
    };

    const catInfo = categories.find(c => c.id === selectedCategory);

    return (
        <div className="w-full relative z-10 pt-20 md:pt-28 pb-12">
            {/* Hero Header */}
            <div className="max-w-5xl mx-auto mb-8 text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-full text-sm mb-2 shadow-sm">
                    <Sparkles size={16} /> {t('valuation.badge', 'Sell your device — fast & fair')}
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('valuation.title', 'Verkaufe mit')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">HandyLand</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                    {t('valuation.subtitle', 'Sofortangebot für dein Gerät — Smartphones, Tablets, Laptops, Konsolen & mehr.')}
                </p>
            </div>

            {/* Trust Badges */}
            <div className="max-w-3xl mx-auto mb-10 flex flex-wrap items-center justify-center gap-6">
                {[
                    { icon: '⭐', label: t('valuation.trust.top_rated', 'Top bewertet') },
                    { icon: '📦', label: t('valuation.trust.free_shipping', 'Kostenloser Versand') },
                    { icon: '⚡', label: t('valuation.trust.fast_payout', 'Schnelle Auszahlung') },
                    { icon: '🔒', label: t('valuation.trust.secure_process', 'Sicherer Prozess') }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                        <span>{item.icon}</span>{item.label}
                    </div>
                ))}
            </div>

            {/* App Frame */}
            <AppFrame
                title={t('valuation.app_frame.title', 'Gerät finden')}
                subtitle={t('valuation.app_frame.subtitle', 'Wähle dein Gerät aus, um ein Sofortangebot zu erhalten')}
                icon={<ScanLine className="w-7 h-7" />}
                mode={mode}
                quoteData={quoteData}
                handlePrevStep={handlePrevStep}
                step={step}
                displayPrice={displayPrice}
            >
                {/* Search Bar */}
                <div className="relative mb-6 max-w-3xl mx-auto group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500" />
                    <div className="relative flex items-center bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-2 shadow-sm transition-all focus-within:border-blue-500">
                        <div className="pl-4 pr-2"><Search className="text-blue-500" size={22} /></div>
                        <input
                            type="text"
                            placeholder={t('valuation.search', 'Suche nach iPhone, MacBook, PS5...')}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value.length > 0) setFunnelStep('category');
                            }}
                            className="w-full bg-transparent py-3.5 text-lg focus:outline-none font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                        />
                        {searchTerm && (
                            <button
                                title={t('valuation.clear_search', 'Suche löschen')}
                                onClick={() => setSearchTerm('')}
                                className="mr-3 p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-slate-500 text-xs font-bold px-2"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Funnel or Search results */}
                {isSearching ? (
                    <SearchResults devices={searchFilteredDevices} searchTerm={searchTerm} onSelect={startWizard} t={t} />
                ) : (
                    <div className="mt-6">
                        {/* Breadcrumb */}
                        {funnelStep !== 'category' && (
                            <div className="flex items-center gap-2 mb-5">
                                <button
                                    title="Zurück"
                                    onClick={handleBack}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1.5 text-sm font-semibold">
                                    <button onClick={() => { setFunnelStep('category'); setSelectedBrand(null); setSelectedSeries(null); }} className="text-slate-400 hover:text-blue-500 transition-colors">{t('valuation.categories', 'Kategorien')}</button>
                                    {selectedCategory && (
                                        <>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            <button onClick={() => { setFunnelStep('brand'); setSelectedSeries(null); }} className="text-slate-400 hover:text-blue-500 transition-colors">{catInfo?.label}</button>
                                        </>
                                    )}
                                    {funnelStep === 'series' && selectedBrand && (
                                        <>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="text-slate-700 dark:text-slate-200">{selectedBrand}</span>
                                        </>
                                    )}
                                    {funnelStep === 'model' && (
                                        <>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            <button onClick={() => setFunnelStep('series')} className="text-slate-400 hover:text-blue-500 transition-colors">{selectedBrand}</button>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="text-slate-700 dark:text-slate-200">{selectedSeries}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step: Category */}
                        {funnelStep === 'category' && (
                            <div className="space-y-12">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">{t('valuation.what_to_sell', 'Was möchtest du verkaufen?')}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {availableCategories.map(cat => {
                                            const Icon = cat.icon;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    title={cat.label}
                                                    onClick={() => handleCategorySelect(cat.id)}
                                                    className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col items-center justify-center gap-3 hover:-translate-y-1"
                                                >
                                                    <span className="text-5xl">{cat.emoji}</span>
                                                    <span className="font-bold text-base text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">{cat.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Popular Devices Section */}
                                {apiDevices && apiDevices.length > 0 && (
                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('valuation.popular_devices', 'Beliebte Geräte')}</h3>
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-wider">{t('valuation.top_offers', 'Top-Angebote')}</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {apiDevices.slice(0, 8).map((device: any) => (
                                                <DeviceCard key={device._id || device.id} device={device} onClick={() => startWizard(device)} t={t} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step: Brand */}
                        {funnelStep === 'brand' && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">{t('valuation.which_brand', 'Welche Marke?')}</h3>
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    {availableBrands.map((brand: string) => (
                                        <button
                                            key={brand}
                                            title={brand}
                                            onClick={() => handleBrandSelect(brand)}
                                            className="group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col items-center justify-center w-full sm:w-44 aspect-[4/3] hover:-translate-y-1"
                                        >
                                            {brandLogos[brand] ? (
                                                <img src={brandLogos[brand]} alt={brand} className="w-16 h-16 object-contain mb-2 opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all dark:invert" />
                                            ) : (
                                                <span className="text-4xl mb-2">🏷️</span>
                                            )}
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{brand}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step: Series */}
                        {funnelStep === 'series' && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">{t('valuation.which_series', 'Welche Modellreihe?')}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {(brandSeries as string[]).map((series: string) => (
                                        <button
                                            key={series}
                                            title={series}
                                            onClick={() => handleSeriesSelect(series)}
                                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500 shadow-sm hover:shadow-md transition-all text-center relative overflow-hidden"
                                        >
                                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent group-hover:bg-blue-500 transition-colors" />
                                            <span className="font-bold text-base text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{series}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step: Model */}
                        {funnelStep === 'model' && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">{t('valuation.which_model', 'Welches Modell genau?')}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {seriesModels.map((device: any) => (
                                        <DeviceCard key={device._id} device={device} onClick={() => startWizard(device)} t={t} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AppFrame>
        </div>
    );
};

// ─── Device Card ──────────────────────────────────────────────────────────────
const DeviceCard = ({ device, onClick, t }: { device: any; onClick: () => void; t?: any }) => (
    <button
        onClick={onClick}
        title={device.modelName}
        className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 transition-all shadow-sm hover:shadow-xl flex flex-col items-center justify-center gap-4 overflow-hidden hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600"
    >
        <div className="absolute top-2.5 right-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full text-center leading-tight shadow-sm backdrop-blur-sm">
            {t ? t('valuation.up_to', 'Bis zu') : 'Bis zu'} €{device.basePrice || 0}
        </div>
        
        <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-3 shadow-inner group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors mt-4">
            {device.imageUrl ? (
                <LazyImage src={device.imageUrl} alt={device.modelName} className="object-contain w-full h-full drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
            ) : (
                <Smartphone className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors" />
            )}
        </div>
        
        <div className="text-center w-full z-10 flex flex-col items-center gap-1">
            <div className="font-extrabold text-[15px] text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{device.modelName}</div>
            
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">{device.brand}</span>
                {device.validStorages && device.validStorages.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                        {device.validStorages.length} {t ? t('common.variants', 'Varianten') : 'Varianten'}
                    </span>
                )}
            </div>
        </div>
    </button>
);

// ─── Search Results ───────────────────────────────────────────────────────────
const SearchResults = ({ devices, searchTerm, onSelect, t }: { devices: any[]; searchTerm: string; onSelect: (d: any) => void; t?: any }) => (
    <div>
        {devices.length === 0 ? (
            <div className="py-16 text-center">
                <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold text-lg">{t ? t('valuation.no_devices_found', 'Keine Geräte gefunden für') : 'Keine Geräte gefunden für'} &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-slate-400 text-sm mt-2">{t ? t('valuation.try_another_term', 'Versuche es mit einem anderen Begriff') : 'Versuche es mit einem anderen Begriff'}</p>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {devices.map((device: any) => (
                        <DeviceCard key={device._id} device={device} onClick={() => onSelect(device)} t={t} />
                    ))}
                </div>
            </>
        )}
    </div>
);

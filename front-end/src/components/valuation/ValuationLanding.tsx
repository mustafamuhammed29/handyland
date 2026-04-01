import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Smartphone, ScanLine, ChevronLeft, ChevronRight, Laptop, Tablet, Gamepad2, Watch, Headphones } from 'lucide-react';
import { AppFrame } from './AppFrame';
import { LazyImage } from '../ui/LazyImage';

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'Smartphone',  label: 'Smartphones',    emoji: '📱', icon: Smartphone,  color: 'blue' },
    { id: 'Tablet',      label: 'Tablets',         emoji: '⬛', icon: Tablet,      color: 'purple' },
    { id: 'Laptop',      label: 'Laptops',         emoji: '💻', icon: Laptop,      color: 'indigo' },
    { id: 'Gaming',      label: 'Spielekonsolen',  emoji: '🎮', icon: Gamepad2,    color: 'red' },
    { id: 'Smartwatch',  label: 'Smartwatches',    emoji: '⌚', icon: Watch,       color: 'emerald' },
    { id: 'Audio',       label: 'Audio & Kopfhörer',emoji: '🎧', icon: Headphones, color: 'amber' },
];

// ─── Brand Logo Map ───────────────────────────────────────────────────────────
const BrandLogos: Record<string, string> = {
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

    const [funnelStep, setFunnelStep] = useState<'category' | 'brand' | 'series' | 'model'>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

    const isSearching = searchTerm.trim().length > 0;

    // Available categories (only show those with actual devices)
    const availableCategories = useMemo(() => {
        if (!apiDevices) return CATEGORIES;
        const presentCats = new Set(apiDevices.map((d: any) => d.category));
        return CATEGORIES.filter(c => presentCats.has(c.id));
    }, [apiDevices]);

    // Available brands for selected category
    const availableBrands = useMemo(() => {
        if (!selectedCategory || !apiDevices) return [];
        const filtered = apiDevices.filter((d: any) => d.category === selectedCategory);
        const brandSet = new Set(filtered.map((d: any) => d.brand).filter(Boolean));
        return Array.from(brandSet) as string[];
    }, [selectedCategory, apiDevices]);

    // Series for selected brand+category
    const brandSeries = useMemo(() => {
        if (!selectedBrand || !selectedCategory || !apiDevices) return [];
        const filtered = apiDevices.filter((d: any) => d.brand === selectedBrand && d.category === selectedCategory);
        const seriesSet = new Set(filtered.map((d: any) => getSeriesName(d.brand, d.modelName, d.category)));
        return Array.from(seriesSet as Set<string>).sort((a: string, b: string) => b.localeCompare(a));
    }, [selectedBrand, selectedCategory, apiDevices]);

    // Models for selected series
    const seriesModels = useMemo(() => {
        if (!selectedSeries || !selectedBrand || !selectedCategory || !apiDevices) return [];
        return apiDevices
            .filter((d: any) => d.brand === selectedBrand && d.category === selectedCategory && getSeriesName(d.brand, d.modelName, d.category) === selectedSeries)
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

    const catInfo = CATEGORIES.find(c => c.id === selectedCategory);

    return (
        <div className="w-full relative z-10">
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
                    { icon: '⭐', label: 'Top bewertet' },
                    { icon: '📦', label: 'Kostenloser Versand' },
                    { icon: '⚡', label: 'Schnelle Auszahlung' },
                    { icon: '🔒', label: 'Sicherer Prozess' }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                        <span>{item.icon}</span>{item.label}
                    </div>
                ))}
            </div>

            {/* App Frame */}
            <AppFrame
                title="Gerät finden"
                subtitle="Wähle dein Gerät aus, um ein Sofortangebot zu erhalten"
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
                                title="Suche löschen"
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
                    <SearchResults devices={searchFilteredDevices} searchTerm={searchTerm} onSelect={startWizard} />
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
                                    <button onClick={() => { setFunnelStep('category'); setSelectedBrand(null); setSelectedSeries(null); }} className="text-slate-400 hover:text-blue-500 transition-colors">Kategorien</button>
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
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">Was möchtest du verkaufen?</h3>
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
                        )}

                        {/* Step: Brand */}
                        {funnelStep === 'brand' && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">Welche Marke?</h3>
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    {availableBrands.map((brand: string) => (
                                        <button
                                            key={brand}
                                            title={brand}
                                            onClick={() => handleBrandSelect(brand)}
                                            className="group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col items-center justify-center w-full sm:w-44 aspect-[4/3] hover:-translate-y-1"
                                        >
                                            {BrandLogos[brand] ? (
                                                <img src={BrandLogos[brand]} alt={brand} className="w-16 h-16 object-contain mb-2 opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all dark:invert" />
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
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">Welche Modellreihe?</h3>
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
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">Welches Modell genau?</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {seriesModels.map((device: any) => (
                                        <DeviceCard key={device._id} device={device} onClick={() => startWizard(device)} />
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
const DeviceCard = ({ device, onClick }: { device: any; onClick: () => void }) => (
    <button
        onClick={onClick}
        title={device.modelName}
        className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 transition-all shadow-sm hover:shadow-xl flex flex-col items-center justify-center gap-3 overflow-hidden hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600"
    >
        <div className="absolute top-2.5 right-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full text-center leading-tight">
            Bis zu {device.basePrice}€
        </div>
        <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-2.5 shadow-inner group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
            {device.imageUrl ? (
                <LazyImage src={device.imageUrl} alt={device.modelName} className="object-contain w-full h-full drop-shadow" />
            ) : (
                <Smartphone className="w-9 h-9 text-slate-300 dark:text-slate-600" />
            )}
        </div>
        <div className="text-center w-full z-10">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{device.modelName}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">{device.brand}</div>
        </div>
    </button>
);

// ─── Search Results ───────────────────────────────────────────────────────────
const SearchResults = ({ devices, searchTerm, onSelect }: { devices: any[]; searchTerm: string; onSelect: (d: any) => void }) => (
    <div>
        {devices.length === 0 ? (
            <div className="py-16 text-center">
                <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold text-lg">Keine Geräte gefunden für &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-slate-400 text-sm mt-2">Versuche es mit einem anderen Begriff</p>
            </div>
        ) : (
            <>
                <p className="text-sm text-slate-500 mb-4 font-medium">{devices.length} Gerät{devices.length !== 1 ? 'e' : ''} gefunden</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {devices.map((device: any) => (
                        <DeviceCard key={device._id} device={device} onClick={() => onSelect(device)} />
                    ))}
                </div>
            </>
        )}
    </div>
);

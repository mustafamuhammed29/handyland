import React from 'react';
import { Search, Sparkles, Smartphone, ScanLine } from 'lucide-react';
import { AppFrame } from './AppFrame';
import { LazyImage } from '../ui/LazyImage';

export const ValuationLanding = ({
    t,
    popularModels,
    searchTerm,
    setSearchTerm,
    brands,
    brandFilter,
    setBrandFilter,
    filteredDevices,
    startWizard,
    mode,
    quoteData,
    handlePrevStep,
    step,
    displayPrice
}: any) => {
    return (
        <div className="w-full relative z-10 duration-700">
            <div className="max-w-5xl mx-auto mb-8 text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-full text-sm mb-2 shadow-sm">
                    <Sparkles size={16} /> {t('valuation.badge')}
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('valuation.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">HandyLand</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                    {t('valuation.subtitle')}
                </p>
            </div>

            <div className="max-w-3xl mx-auto mb-10 flex flex-wrap items-center justify-center gap-6">
                {[
                    { icon: '⭐', label: t('valuation.stats.rating') }, 
                    { icon: '📦', label: t('valuation.stats.shipping') }, 
                    { icon: '⚡', label: t('valuation.stats.payout') }, 
                    { icon: '🔒', label: t('valuation.stats.secure') }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                        <span className="text-base">{item.icon}</span>{item.label}
                    </div>
                ))}
            </div>

            <div>
                <AppFrame
                    title="Gerät finden"
                    subtitle="Wähle dein Modell aus, um sofort zu starten"
                    icon={<ScanLine className="w-7 h-7" />}
                    mode={mode}
                    quoteData={quoteData}
                    handlePrevStep={handlePrevStep}
                    step={step}
                    displayPrice={displayPrice}
                >
                    <div className="relative mb-6 max-w-3xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-2 shadow-sm transition-all focus-within:border-blue-500 dark:focus-within:border-blue-500">
                            <div className="pl-4 pr-2"><Search className="text-blue-500" size={24} /></div>
                            <input
                                type="text"
                                placeholder={t('valuation.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent py-4 text-xl focus:outline-none font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    </div>

                    {!searchTerm && popularModels.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6 max-w-3xl mx-auto">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center">Beliebt:</span>
                            {popularModels.map((m: string) => (
                                <button key={m} onClick={() => setSearchTerm(m)}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700">
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}

                    {brands.length > 2 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {brands.map((b: string) => (
                                <button key={b} onClick={() => setBrandFilter(b)}
                                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${brandFilter === b
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600'
                                        }`}>
                                    {b === 'all' ? 'Alle' : b}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredDevices.map((device: any) => (
                            <button
                                key={device._id}
                                onClick={() => startWizard(device)}
                                className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 transition-all shadow-sm hover:shadow-xl text-left flex flex-col items-center justify-center gap-4 overflow-hidden hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-800/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    bis {device.basePrice}€
                                </div>
                                <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-3 shadow-inner group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                    <LazyImage
                                        src={device.imageUrl || device.image || device.images?.[0]}
                                        alt={device.modelName}
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                                <div className="text-center w-full z-10">
                                    <div className="font-extrabold text-base text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={device.modelName}>{device.modelName}</div>
                                    <div className="text-xs font-medium text-slate-400 mt-0.5">{device.brand}</div>
                                </div>
                            </button>
                        ))}
                        {filteredDevices.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 font-medium text-lg">
                                Keine Geräte gefunden für "{searchTerm}"
                            </div>
                        )}
                    </div>
                </AppFrame>
            </div>
        </div>
    );
};

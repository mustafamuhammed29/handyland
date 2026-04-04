import React from 'react';
import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterSidebarProps {
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    selectedCondition: string;
    setSelectedCondition: (val: string) => void;
    minPrice: string;
    setMinPrice: (val: string) => void;
    maxPrice: string;
    setMaxPrice: (val: string) => void;
    filterBrand: string;
    setFilterBrand: (val: string) => void;
    brands: string[];
    selectedRam: string;
    setSelectedRam: (val: string) => void;
    selectedStorage: string;
    setSelectedStorage: (val: string) => void;
    ramOptions: string[];
    storageOptions: string[];
    conditions: string[];
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
    showFilters,
    setShowFilters,
    selectedCondition,
    setSelectedCondition,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    filterBrand,
    setFilterBrand,
    brands,
    selectedRam,
    setSelectedRam,
    selectedStorage,
    setSelectedStorage,
    ramOptions,
    storageOptions,
    conditions
}) => {
    const { t } = useTranslation();
    return (
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="sticky top-24 flex flex-col gap-4">
                <div className="flex justify-between items-end gap-4 md:hidden">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('marketplace.title', 'MARKT')}<span className="text-brand-primary">{t('marketplace.titleAccent', 'PLATZ')}</span></h2>
                        <div className="h-1 w-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters" className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showFilters ? 'bg-black/5 dark:bg-white/5 text-brand-primary border border-black/10 dark:border-white/10' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white glass-modern'}`}><Filter className="w-5 h-5" /></button>
                </div>

                <div className={`glass-modern p-5 rounded-3xl border border-black/10 dark:border-white/10 flex-col gap-5 transition-all duration-300 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-5 h-5 text-brand-primary" />
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('marketplace.filters', 'Filter')}</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('marketplace.condition', 'ZUSTAND')}</label>
                        <select aria-label="Filter by Condition" value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors">
                            <option value="">{t('marketplace.allConditions', 'Alle Zustände')}</option>
                            {conditions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('marketplace.priceRange', 'PREISBEREICH')}</label>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors" />
                            <span className="text-slate-400">-</span>
                            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors" />
                        </div>
                    </div>

                    <div className="w-full h-px bg-black/5 dark:bg-white/10"></div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('marketplace.brand', 'MARKE')}</label>
                        <div className="flex flex-wrap gap-2">
                            {brands.map(brand => (
                                <button key={brand} onClick={() => setFilterBrand(brand)} className={`px-4 py-2 md:py-1.5 rounded-xl md:rounded-lg text-xs md:text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterBrand === brand ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-black/5 dark:bg-white/10"></div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('marketplace.specs', 'SPEZIFIKATIONEN')}</label>
                        <select aria-label="Filter by RAM" value={selectedRam} onChange={(e) => setSelectedRam(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors mb-2">
                            <option value="">{t('marketplace.anyRam', 'Beliebiger RAM')}</option>
                            {ramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select aria-label="Filter by Storage" value={selectedStorage} onChange={(e) => setSelectedStorage(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors">
                            <option value="">{t('marketplace.anyStorage', 'Beliebiger Speicher')}</option>
                            {storageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * backend/admin/src/components/WarehouseManager/components/CatalogBrandView.tsx
 * Level 1: Responsive brand selection grid for German warehouse staff.
 */

import React from 'react';
import { Smartphone, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Info, Box } from 'lucide-react';
import type { BrandSummary } from '../utils/catalogHelpers';

interface CatalogBrandViewProps {
    brands: BrandSummary[];
    onSelectBrand: (brand: string) => void;
    loading: boolean;
}

export const CatalogBrandView: React.FC<CatalogBrandViewProps> = ({
    brands,
    onSelectBrand,
    loading
}) => {
    if (loading && brands.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4" />
                <p className="text-slate-400 text-sm">Katalog wird geladen …</p>
            </div>
        );
    }

    if (brands.length === 0) {
        return (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                <Box className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-lg font-bold text-white mb-1">Keine Marken gefunden</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Es sind aktuell keine Ersatzteile im Katalog vorhanden. Bitte legen Sie ein Ersatzteil an.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                        Hersteller & Marken
                    </h3>
                    <p className="text-xs text-slate-400">
                        Wählen Sie eine Marke, um passende Modelle anzuzeigen.
                    </p>
                </div>
                <span className="text-xs bg-slate-800/80 text-slate-300 px-3 py-1 rounded-full border border-slate-700/50">
                    {brands.length} {brands.length === 1 ? 'Marke' : 'Marken'}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {brands.map((b) => {
                    const lowOrMissingCount = (b.lowStockCount || 0) + (b.outOfStockCount || 0);

                    let statusBadge: React.ReactNode = null;
                    if (b.partCount === 0) {
                        statusBadge = (
                            <span className="inline-flex items-center gap-1 text-cyan-400 text-[11px] font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                <Info size={12} />
                                <span>0 Artikel</span>
                            </span>
                        );
                    } else if (b.totalAvailable <= 0) {
                        statusBadge = (
                            <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-semibold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                <XCircle size={12} />
                                <span>Nicht verfügbar</span>
                            </span>
                        );
                    } else if (lowOrMissingCount > 0) {
                        statusBadge = (
                            <span
                                className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20"
                                title={`Niedriger Bestand bei ${lowOrMissingCount} Artikel(n)`}
                            >
                                <AlertTriangle size={12} />
                                <span>Niedriger Bestand</span>
                            </span>
                        );
                    } else {
                        statusBadge = (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <CheckCircle2 size={12} />
                                <span>Auf Lager</span>
                            </span>
                        );
                    }

                    return (
                        <button
                            key={b.brand}
                            type="button"
                            onClick={() => onSelectBrand(b.brand)}
                            className="group text-left relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
                                        <Smartphone size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-400 transition-colors">
                                        <span className="text-xs font-semibold">Modelle</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>

                                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                                    {b.brand}
                                </h4>

                                <div className="grid grid-cols-2 gap-2 py-2.5 my-2 border-y border-slate-800/70 text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Modelle</span>
                                        <span className="text-white font-semibold text-sm">{b.modelCount}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Artikel angezeigt</span>
                                        <span className="text-white font-semibold text-sm">{b.partCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/60 text-xs mt-1">
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Verfügbar gesamt</span>
                                    <span className={b.totalAvailable > 0 ? 'text-emerald-400 font-bold text-xs' : 'text-slate-500 font-semibold text-xs'}>
                                        {b.totalAvailable} Stk.
                                    </span>
                                </div>

                                <div>
                                    {statusBadge}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

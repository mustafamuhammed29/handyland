/**
 * backend/admin/src/components/WarehouseManager/components/CatalogModelView.tsx
 * Level 2: Responsive model overview grid for German warehouse staff.
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, Search, CheckCircle2, AlertTriangle, XCircle, Layers } from 'lucide-react';
import type { ModelSummary } from '../utils/catalogHelpers';

interface CatalogModelViewProps {
    brand: string;
    models: ModelSummary[];
    onSelectModel: (modelName: string) => void;
    onBackToBrands: () => void;
}

export const CatalogModelView: React.FC<CatalogModelViewProps> = ({
    brand,
    models,
    onSelectModel,
    onBackToBrands
}) => {
    const [modelSearch, setModelSearch] = useState('');

    const filteredModels = useMemo(() => {
        if (!modelSearch.trim()) return models;
        const q = modelSearch.trim().toLowerCase();
        return models.filter(
            m => m.modelName.toLowerCase().includes(q) || m.deviceFamily.toLowerCase().includes(q)
        );
    }, [models, modelSearch]);

    return (
        <div className="space-y-5">
            {/* Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <button
                        type="button"
                        onClick={onBackToBrands}
                        className="hover:text-blue-400 font-medium transition-colors"
                    >
                        Ersatzteilkatalog
                    </button>
                    <span>/</span>
                    <span className="text-white font-bold">{brand}</span>
                </div>

                <button
                    type="button"
                    onClick={onBackToBrands}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Zurück zu Marken</span>
                </button>
            </div>

            {/* Header & Quick Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{brand} – Modelle</span>
                        <span className="text-xs font-normal bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                            {models.length} {models.length === 1 ? 'Modell' : 'Modelle'}
                        </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Wählen Sie ein Modell, um passende Ersatzteile anzuzeigen.
                    </p>
                </div>

                {/* Local search within models */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder={`${brand}-Modell filtern …`}
                        className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Models Grid */}
            {filteredModels.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                    <p className="text-slate-400 text-sm">
                        Keine passenden {brand}-Modelle für „{modelSearch}“ gefunden.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {filteredModels.map((m) => {
                        let statusBadge = (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <CheckCircle2 size={12} />
                                <span>Bestand verfügbar</span>
                            </span>
                        );

                        if (m.stockStatus === 'out_of_stock') {
                            statusBadge = (
                                <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-semibold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                    <XCircle size={12} />
                                    <span>Nicht verfügbar</span>
                                </span>
                            );
                        } else if (m.stockStatus === 'low') {
                            statusBadge = (
                                <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                    <AlertTriangle size={12} />
                                    <span>Niedriger Bestand</span>
                                </span>
                            );
                        }

                        return (
                            <button
                                key={m.modelName}
                                type="button"
                                onClick={() => onSelectModel(m.modelName)}
                                className="group text-left relative bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-4 transition-all duration-150 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[11px] text-slate-400 font-mono tracking-wide">
                                            {m.deviceFamily}
                                        </span>
                                        <ChevronRight size={15} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </div>

                                    <h4 className="text-base font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                                        {m.modelName}
                                    </h4>
                                </div>

                                <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 flex items-center gap-1">
                                            <Layers size={13} />
                                            <span>Artikel</span>
                                        </span>
                                        <span className="text-white font-semibold">{m.partCount} Typen</span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">Verfügbar</span>
                                        <span className="text-emerald-400 font-bold">{m.totalAvailable} Stk.</span>
                                    </div>

                                    <div className="pt-1">
                                        {statusBadge}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

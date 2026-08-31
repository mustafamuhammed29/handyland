/**
 * backend/admin/src/components/WarehouseManager/components/CatalogSearchView.tsx
 * Search results view grouped by Brand & Model with contextual navigation.
 */

import React, { useMemo } from 'react';
import { Search, ChevronRight, ArrowRight } from 'lucide-react';
import { getBrandName, getModelName, getCategoryLabelDE, getQualityLabelDE } from '../utils/catalogHelpers';
import type { WarehousePart } from '../types';

interface CatalogSearchViewProps {
    searchTerm: string;
    parts: WarehousePart[];
    onSelectModel: (brand: string, modelName: string) => void;
    onClearSearch: () => void;
}

export const CatalogSearchView: React.FC<CatalogSearchViewProps> = ({
    searchTerm,
    parts,
    onSelectModel,
    onClearSearch
}) => {
    // Filter and group search results
    const groupedResults = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return [];

        const matchingParts = parts.filter(p => {
            const matchSku = p.sku.toLowerCase().includes(term);
            const matchName = p.name.toLowerCase().includes(term);
            const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(term) : false;
            const matchBrand = p.brand ? p.brand.toLowerCase().includes(term) : false;
            const matchFamily = p.deviceFamily ? p.deviceFamily.toLowerCase().includes(term) : false;
            const matchDevice = p.compatibleDevices ? p.compatibleDevices.some(d => d.toLowerCase().includes(term)) : false;
            return matchSku || matchName || matchBarcode || matchBrand || matchFamily || matchDevice;
        });

        // Group by Brand -> Model
        const map = new Map<string, Map<string, WarehousePart[]>>();

        for (const part of matchingParts) {
            const brand = getBrandName(part);
            const model = getModelName(part);

            if (!map.has(brand)) {
                map.set(brand, new Map());
            }
            const modelMap = map.get(brand)!;
            if (!modelMap.has(model)) {
                modelMap.set(model, []);
            }
            modelMap.get(model)!.push(part);
        }

        const groups: Array<{
            brand: string;
            models: Array<{
                modelName: string;
                parts: WarehousePart[];
            }>;
        }> = [];

        for (const [brand, modelMap] of map.entries()) {
            const modelList: Array<{ modelName: string; parts: WarehousePart[] }> = [];
            for (const [modelName, partList] of modelMap.entries()) {
                modelList.push({ modelName, parts: partList });
            }
            groups.push({ brand, models: modelList });
        }

        return groups;
    }, [parts, searchTerm]);

    const totalMatches = useMemo(() => {
        let count = 0;
        for (const g of groupedResults) {
            for (const m of g.models) {
                count += m.parts.length;
            }
        }
        return count;
    }, [groupedResults]);

    if (totalMatches === 0) {
        return (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                <Search className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-white mb-1">Keine Ersatzteile gefunden</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto mb-4">
                    Keine Ersatzteile gefunden. Prüfen Sie SKU, Bezeichnung oder Filter.
                </p>
                <button
                    type="button"
                    onClick={onClearSearch}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                >
                    Suche zurücksetzen
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                        Suchergebnisse für „{searchTerm}“
                    </h3>
                    <p className="text-xs text-slate-400">
                        {totalMatches} {totalMatches === 1 ? 'Treffer' : 'Treffer'} gefunden, gruppiert nach Marke und Modell.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClearSearch}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                    Suche schließen
                </button>
            </div>

            <div className="space-y-6">
                {groupedResults.map((group) => (
                    <div key={group.brand} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-md">
                                {group.brand}
                            </span>
                            <div className="h-px bg-slate-800 flex-1" />
                        </div>

                        <div className="space-y-3">
                            {group.models.map((m) => (
                                <div
                                    key={m.modelName}
                                    className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
                                >
                                    {/* Model Bar */}
                                    <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 font-mono">{group.brand} ·</span>
                                            <span className="text-sm font-bold text-white">{m.modelName}</span>
                                            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                {m.parts.length} {m.parts.length === 1 ? 'Artikel' : 'Artikel'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onSelectModel(group.brand, m.modelName)}
                                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                        >
                                            <span>Modell-Katalog öffnen</span>
                                            <ArrowRight size={13} />
                                        </button>
                                    </div>

                                    {/* Parts Table */}
                                    <div className="divide-y divide-slate-800/50">
                                        {m.parts.map((p) => {
                                            const catLabel = getCategoryLabelDE(p);
                                            const qualLabel = getQualityLabelDE(p.quality);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => onSelectModel(group.brand, m.modelName)}
                                                    className="p-3 hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                                >
                                                    <div className="flex items-start sm:items-center gap-3">
                                                        <span className="font-mono text-xs font-bold text-blue-400 shrink-0">
                                                            {p.sku}
                                                        </span>
                                                        <div>
                                                            <div className="text-xs font-medium text-white">
                                                                {p.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                                                    {catLabel}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {qualLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs self-end sm:self-auto shrink-0">
                                                        <span className="font-bold text-emerald-400">
                                                            {p.availableQuantity} Stk. verfügbar
                                                        </span>
                                                        <ChevronRight size={15} className="text-slate-500" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

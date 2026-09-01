/**
 * backend/admin/src/components/WarehouseManager/components/CatalogPartsView.tsx
 * Level 3: Model-specific parts table with German category chips, quality/stock filters, and safe actions.
 */

import React, { useState, useMemo } from 'react';
import {
    ArrowLeft,
    Plus,
    Edit2,
    PowerOff,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Boxes,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../../context/ConfirmContext';
import { api } from '../../../utils/api';
import { AddPartModal } from './AddPartModal';
import { EditPartModal } from './EditPartModal';
import { getCategoryLabelDE, getQualityLabelDE } from '../utils/catalogHelpers';
import type { WarehousePart, WarehouseLocation } from '../types';

interface CatalogPartsViewProps {
    brand: string;
    modelName: string;
    parts: WarehousePart[];
    locations?: WarehouseLocation[];
    onBackToModels: () => void;
    onRefresh: () => void;
    onNavigateToMovements?: () => void;
}

export const CatalogPartsView: React.FC<CatalogPartsViewProps> = ({
    brand,
    modelName,
    parts,
    locations = [],
    onBackToModels,
    onRefresh,
    onNavigateToMovements
}) => {
    const { confirm } = useConfirm();

    // Filters state
    const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
    const [selectedQuality, setSelectedQuality] = useState<string>('Alle Qualitäten');
    const [selectedStockStatus, setSelectedStockStatus] = useState<string>('Alle Bestände');
    const [localSearch, setLocalSearch] = useState<string>('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<WarehousePart | null>(null);
    const [discontinuingId, setDiscontinuingId] = useState<string | null>(null);

    // Extract categories present for this model
    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        for (const p of parts) {
            set.add(getCategoryLabelDE(p));
        }
        return ['Alle', ...Array.from(set).sort()];
    }, [parts]);

    // Model parts summary
    const summary = useMemo(() => {
        let totalAvail = 0;
        let totalOnHand = 0;
        let lowCount = 0;
        let outCount = 0;

        for (const p of parts) {
            totalAvail += p.availableQuantity || 0;
            totalOnHand += p.onHandQuantity || 0;
            if (p.availableQuantity <= 0) outCount++;
            else if (p.availableQuantity <= p.minStock) lowCount++;
        }

        return {
            totalParts: parts.length,
            totalAvailable: totalAvail,
            totalOnHand: totalOnHand,
            lowStockCount: lowCount,
            outOfStockCount: outCount
        };
    }, [parts]);

    // Filter parts
    const filteredParts = useMemo(() => {
        return parts.filter(p => {
            // Category filter
            if (selectedCategory !== 'Alle') {
                const cat = getCategoryLabelDE(p);
                if (cat !== selectedCategory) return false;
            }

            // Quality filter
            if (selectedQuality !== 'Alle Qualitäten') {
                const qLabel = getQualityLabelDE(p.quality);
                if (selectedQuality === 'Original / OEM' && qLabel !== 'Original / OEM') return false;
                if (selectedQuality === 'Kompatibel' && qLabel !== 'Kompatibel') return false;
                if (selectedQuality === 'Refurbished' && qLabel !== 'Refurbished') return false;
            }

            // Stock filter
            if (selectedStockStatus !== 'Alle Bestände') {
                if (selectedStockStatus === 'Auf Lager' && (p.availableQuantity <= p.minStock || p.availableQuantity <= 0)) return false;
                if (selectedStockStatus === 'Niedriger Bestand' && (p.availableQuantity <= 0 || p.availableQuantity > p.minStock)) return false;
                if (selectedStockStatus === 'Nicht verfügbar' && p.availableQuantity > 0) return false;
            }

            // Search filter
            if (localSearch.trim()) {
                const s = localSearch.trim().toLowerCase();
                const matchSku = p.sku.toLowerCase().includes(s);
                const matchName = p.name.toLowerCase().includes(s);
                const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(s) : false;
                if (!matchSku && !matchName && !matchBarcode) return false;
            }

            return true;
        });
    }, [parts, selectedCategory, selectedQuality, selectedStockStatus, localSearch]);

    // Safe Discontinue Handler
    const handleDiscontinue = async (part: WarehousePart) => {
        if (part.onHandQuantity > 0 || part.availableQuantity > 0) {
            toast.error('Ausmustern nicht möglich: Das Ersatzteil hat noch aktiven Lagerbestand.');
            return;
        }

        const isConfirmed = await confirm({
            title: `Ersatzteil ausmustern?`,
            message: `Möchten Sie das Ersatzteil „${part.name}“ (${part.sku}) wirklich ausmustern? Es kann danach nicht mehr eingebucht werden.`,
            confirmLabel: 'Ausmustern',
            cancelLabel: 'Abbrechen',
            variant: 'danger'
        });

        if (!isConfirmed) return;

        setDiscontinuingId(part.id);
        try {
            const res = await api.post(`/api/warehouse/parts/${part.id}/discontinue`);
            if (res.data?.success) {
                toast.success('Ersatzteil wurde erfolgreich ausgemustert.');
                onRefresh();
            } else {
                toast.error(res.data?.message || 'Fehler beim Ausmustern des Ersatzteils.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Ersatzteil konnte nicht ausgemustert werden.';
            toast.error(msg);
        } finally {
            setDiscontinuingId(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* Breadcrumb Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <button
                        type="button"
                        onClick={onBackToModels}
                        className="hover:text-blue-400 font-medium transition-colors"
                    >
                        Ersatzteilkatalog
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={onBackToModels}
                        className="hover:text-blue-400 font-medium transition-colors"
                    >
                        {brand}
                    </button>
                    <span>/</span>
                    <span className="text-white font-bold">{modelName}</span>
                </div>

                <button
                    type="button"
                    onClick={onBackToModels}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Zurück zu {brand}-Modellen</span>
                </button>
            </div>

            {/* Header & Context Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Ersatzteile für {modelName}</span>
                        <span className="text-xs font-normal bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                            {summary.totalParts} {summary.totalParts === 1 ? 'Artikel' : 'Artikel'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                        <span>Verfügbar: <strong className="text-emerald-400 font-bold">{summary.totalAvailable} Stk.</strong></span>
                        <span>•</span>
                        <span>Gesamtbestand: <strong className="text-white">{summary.totalOnHand} Stk.</strong></span>
                        {summary.lowStockCount > 0 && (
                            <>
                                <span>•</span>
                                <span className="text-amber-400 font-medium">{summary.lowStockCount} mit niedrigem Bestand</span>
                            </>
                        )}
                        {summary.outOfStockCount > 0 && (
                            <>
                                <span>•</span>
                                <span className="text-red-400 font-medium">{summary.outOfStockCount} nicht vorrätig</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Ersatzteil für dieses Modell anlegen</span>
                    </button>
                </div>
            </div>

            {/* Category Chips Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {availableCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                isSelected
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                            }`}
                        >
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Secondary Filters Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="SKU oder Bezeichnung suchen …"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Quality Filter */}
                    <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                        <option value="Alle Qualitäten">Alle Qualitäten</option>
                        <option value="Original / OEM">Original / OEM</option>
                        <option value="Kompatibel">Kompatibel</option>
                        <option value="Refurbished">Refurbished</option>
                    </select>

                    {/* Stock Filter */}
                    <select
                        value={selectedStockStatus}
                        onChange={(e) => setSelectedStockStatus(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                        <option value="Alle Bestände">Alle Bestände</option>
                        <option value="Auf Lager">Auf Lager</option>
                        <option value="Niedriger Bestand">Niedriger Bestand</option>
                        <option value="Nicht verfügbar">Nicht verfügbar</option>
                    </select>
                </div>
            </div>

            {/* Parts Result Table */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="py-3 px-4">SKU</th>
                                <th className="py-3 px-4">Ersatzteil</th>
                                <th className="py-3 px-4">Kategorie</th>
                                <th className="py-3 px-4">Qualität</th>
                                <th className="py-3 px-4 text-center">Verfügbar</th>
                                <th className="py-3 px-4 text-center">Reserviert</th>
                                <th className="py-3 px-4 text-center">Min-Bestand</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredParts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400">
                                        Keine Ersatzteile gefunden. Prüfen Sie SKU, Bezeichnung oder Filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredParts.map((p) => {
                                    const catLabel = getCategoryLabelDE(p);
                                    const qualLabel = getQualityLabelDE(p.quality);
                                    const isDiscontinued = p.status === 'discontinued';
                                    const isLow = p.availableQuantity <= p.minStock && p.availableQuantity > 0;
                                    const isOut = p.availableQuantity <= 0;

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                                            {/* SKU */}
                                            <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                                                {p.sku}
                                            </td>

                                            {/* Name */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-white max-w-sm truncate" title={p.name}>
                                                    {p.name}
                                                </div>
                                                {p.barcode && (
                                                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                                                        Barcode: {p.barcode}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="py-3.5 px-4 text-slate-300">
                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700/50">
                                                    {catLabel}
                                                </span>
                                            </td>

                                            {/* Quality */}
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                                    qualLabel === 'Original / OEM'
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                }`}>
                                                    {qualLabel}
                                                </span>
                                            </td>

                                            {/* Available */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`font-bold ${
                                                    isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>
                                                    {p.availableQuantity} Stk.
                                                </span>
                                            </td>

                                            {/* Reserved */}
                                            <td className="py-3.5 px-4 text-center text-slate-400">
                                                {p.reservedQuantity > 0 ? (
                                                    <span className="text-amber-400 font-semibold">{p.reservedQuantity} Stk.</span>
                                                ) : (
                                                    '0'
                                                )}
                                            </td>

                                            {/* Min Stock */}
                                            <td className="py-3.5 px-4 text-center text-slate-400">
                                                {p.minStock} Stk.
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4 text-center">
                                                {isDiscontinued ? (
                                                    <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                                                        <XCircle size={12} />
                                                        <span>Ausgemustert</span>
                                                    </span>
                                                ) : isOut ? (
                                                    <span className="inline-flex items-center gap-1 text-red-400 text-[11px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                                        <XCircle size={12} />
                                                        <span>Nicht verfügbar</span>
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                        <AlertTriangle size={12} />
                                                        <span>Niedriger Bestand</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        <CheckCircle2 size={12} />
                                                        <span>Auf Lager</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingPart(p)}
                                                        title="Ersatzteil bearbeiten"
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/60"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>

                                                    {!isDiscontinued && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDiscontinue(p)}
                                                            disabled={discontinuingId === p.id || p.onHandQuantity > 0}
                                                            title={
                                                                p.onHandQuantity > 0
                                                                    ? 'Ausmustern nur bei Lagerbestand 0 möglich'
                                                                    : 'Ersatzteil ausmustern'
                                                            }
                                                            className="p-1.5 bg-red-950/40 hover:bg-red-900/60 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 rounded-lg transition-colors border border-red-800/40"
                                                        >
                                                            <PowerOff size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Context notice on movements */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                <Boxes size={15} className="text-blue-400 shrink-0" />
                <span>Lagerbestand wird ausschließlich über Lagerbewegungen geändert.</span>
            </div>

            {/* Add Part Modal */}
            <AddPartModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={onRefresh}
                initialBrand={brand}
                initialDeviceFamily={parts[0]?.deviceFamily || modelName}
                initialCompatibleDevice={modelName}
                existingParts={parts}
                locations={locations}
            />

            {/* Edit Part Modal */}
            <EditPartModal
                isOpen={!!editingPart}
                part={editingPart}
                onClose={() => setEditingPart(null)}
                onSuccess={() => {
                    setEditingPart(null);
                    onRefresh();
                }}
                onNavigateToMovements={onNavigateToMovements}
            />
        </div>
    );
};

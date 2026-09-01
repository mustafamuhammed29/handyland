/**
 * backend/admin/src/components/WarehouseManager/components/CatalogModelView.tsx
 * Level 2: Responsive model overview grid with First-Class Model Management (Phase 3A).
 */

import React, { useState, useMemo } from 'react';
import {
    ArrowLeft,
    ChevronRight,
    Search,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Layers,
    Plus,
    MoreVertical,
    Edit2,
    Power,
    PowerOff,
    Archive,
    PlusCircle,
    Info,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import { AddModelModal } from './AddModelModal';
import { EditModelModal } from './EditModelModal';
import { DiscontinueModelPartsModal } from './DiscontinueModelPartsModal';
import { useConfirm } from '../../../context/ConfirmContext';
import type { DeviceModel } from '../types';

interface CatalogModelViewProps {
    brand: string;
    models: DeviceModel[];
    onSelectModel: (model: DeviceModel) => void;
    onBackToBrands: () => void;
    onRefresh: () => void;
    onOpenAddPartForModel?: (brand: string, modelName: string, deviceFamily: string, modelId?: string) => void;
}

export const CatalogModelView: React.FC<CatalogModelViewProps> = ({
    brand,
    models,
    onSelectModel,
    onBackToBrands,
    onRefresh,
    onOpenAddPartForModel
}) => {
    const { confirm } = useConfirm();
    const [modelSearch, setModelSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Modals state
    const [isAddModelOpen, setIsAddModelOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
    const [discontinuingModel, setDiscontinuingModel] = useState<DeviceModel | null>(null);

    const filteredModels = useMemo(() => {
        return models.filter((m) => {
            if (statusFilter === 'active' && !m.isActive) return false;
            if (statusFilter === 'inactive' && m.isActive) return false;

            if (modelSearch.trim()) {
                const q = modelSearch.trim().toLowerCase();
                const matchName = (m.modelName || '').toLowerCase().includes(q);
                const matchFamily = (m.deviceFamily || '').toLowerCase().includes(q);
                if (!matchName && !matchFamily) return false;
            }

            return true;
        });
    }, [models, modelSearch, statusFilter]);

    const handleDeactivate = async (m: DeviceModel) => {
        setOpenMenuId(null);
        const ok = await confirm({
            title: 'Modell deaktivieren?',
            message: `Möchten Sie das Modell „${m.modelName}“ wirklich deaktivieren? Bestehende Ersatzteile und Lagerbestände bleiben erhalten. Für dieses Modell können danach keine neuen Ersatzteile angelegt werden.`,
            confirmLabel: 'Modell deaktivieren',
            cancelLabel: 'Abbrechen',
            variant: 'warning'
        });

        if (!ok) return;

        try {
            const res = await api.post(`/api/warehouse/models/${m.id}/deactivate`);
            if (res.data?.success) {
                toast.success(`Modell „${m.modelName}“ wurde deaktiviert.`);
                onRefresh();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Fehler beim Deaktivieren des Modells.');
        }
    };

    const handleReactivate = async (m: DeviceModel) => {
        setOpenMenuId(null);
        const ok = await confirm({
            title: 'Modell reaktivieren?',
            message: `Möchten Sie das Modell „${m.modelName}“ reaktivieren? Danach können wieder neue Ersatzteile für dieses Modell angelegt werden.`,
            confirmLabel: 'Modell reaktivieren',
            cancelLabel: 'Abbrechen',
            variant: 'info'
        });

        if (!ok) return;

        try {
            const res = await api.post(`/api/warehouse/models/${m.id}/reactivate`);
            if (res.data?.success) {
                toast.success(`Modell „${m.modelName}“ wurde reaktiviert.`);
                onRefresh();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Fehler beim Reaktivieren des Modells.');
        }
    };

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

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAddModelOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                    >
                        <Plus size={14} />
                        <span>Neues Gerätemodell anlegen</span>
                    </button>

                    <button
                        type="button"
                        onClick={onBackToBrands}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Zurück zu Marken</span>
                    </button>
                </div>
            </div>

            {/* Header & Quick Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{brand} – Modelle</span>
                        <span className="text-xs font-normal bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                            {filteredModels.length} {filteredModels.length === 1 ? 'Modell' : 'Modelle'}
                        </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Wählen Sie ein Modell, um passende Ersatzteile anzuzeigen oder das Modell zu verwalten.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter Tabs */}
                    <div className="bg-slate-900/90 border border-slate-700/70 p-1 rounded-xl flex items-center gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1 rounded-lg font-medium transition-colors ${statusFilter === 'active' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Aktive
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 rounded-lg font-medium transition-colors ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Alle
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('inactive')}
                            className={`px-3 py-1 rounded-lg font-medium transition-colors ${statusFilter === 'inactive' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Inaktive
                        </button>
                    </div>

                    {/* Local search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            placeholder={`${brand}-Modell filtern …`}
                            className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-blue-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Models Grid */}
            {filteredModels.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                    <p className="text-slate-400 text-sm mb-3">
                        Keine passenden {brand}-Modelle gefunden.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsAddModelOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                    >
                        <Plus size={14} />
                        <span>Neues Modell für {brand} anlegen</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {filteredModels.map((m) => {
                        const isMenuOpen = openMenuId === m.id;
                        const isEmptyModel = m.partCount === 0;

                        let statusBadge = (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <CheckCircle2 size={12} />
                                <span>Bestand verfügbar</span>
                            </span>
                        );

                        if (!m.isActive) {
                            statusBadge = (
                                <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-semibold bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700">
                                    <PowerOff size={12} className="text-slate-500" />
                                    <span>Deaktiviert</span>
                                </span>
                            );
                        } else if (isEmptyModel) {
                            statusBadge = (
                                <span className="inline-flex items-center gap-1 text-cyan-400 text-[11px] font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                    <Info size={12} />
                                    <span>0 Artikel im Katalog</span>
                                </span>
                            );
                        } else if (m.totalAvailable <= 0) {
                            statusBadge = (
                                <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-semibold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                    <XCircle size={12} />
                                    <span>Nicht verfügbar</span>
                                </span>
                            );
                        } else if (m.lowStockCount > 0) {
                            statusBadge = (
                                <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                    <AlertTriangle size={12} />
                                    <span>Niedriger Bestand</span>
                                </span>
                            );
                        }

                        return (
                            <div
                                key={m.id || m.modelName}
                                className={`group relative bg-slate-900/70 hover:bg-slate-800/80 border ${!m.isActive ? 'border-slate-800/40 opacity-75' : 'border-slate-800/80 hover:border-blue-500/40'} rounded-xl p-4 transition-all duration-150 shadow-sm hover:shadow-md flex flex-col justify-between`}
                            >
                                <div>
                                    {/* Top Family & Action Menu */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[11px] text-slate-400 font-mono tracking-wide">
                                            {m.deviceFamily}
                                        </span>

                                        {/* Action Menu */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(isMenuOpen ? null : m.id);
                                                }}
                                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                                                title="Modellaktionen"
                                            >
                                                <MoreVertical size={14} />
                                            </button>

                                            {isMenuOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-20"
                                                        onClick={() => setOpenMenuId(null)}
                                                    />
                                                    <div className="absolute right-0 top-7 z-30 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-1 text-xs animate-fadeIn">
                                                        {m.isActive && onOpenAddPartForModel && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(null);
                                                                    onOpenAddPartForModel(m.brand, m.modelName, m.deviceFamily, m.id);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-blue-400 hover:bg-blue-950/40 hover:text-blue-300 transition-colors font-semibold"
                                                            >
                                                                <PlusCircle size={14} />
                                                                <span>Ersatzteil anlegen</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(null);
                                                                onSelectModel(m);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                                        >
                                                            <Layers size={14} />
                                                            <span>Zugehörige Ersatzteile anzeigen</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(null);
                                                                setEditingModel(m);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                            <span>Modell bearbeiten</span>
                                                        </button>

                                                        {m.isActive ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeactivate(m);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-amber-400 hover:bg-amber-950/40 transition-colors"
                                                            >
                                                                <PowerOff size={14} />
                                                                <span>Modell deaktivieren</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReactivate(m);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                                                            >
                                                                <Power size={14} />
                                                                <span>Modell reaktivieren</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(null);
                                                                setDiscontinuingModel(m);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-red-400 hover:bg-red-950/40 transition-colors border-t border-slate-800 pt-2"
                                                        >
                                                            <Archive size={14} />
                                                            <span>Zugehörige Teile ausmustern</span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Clickable Title area */}
                                    <div
                                        onClick={() => onSelectModel(m)}
                                        className="cursor-pointer"
                                    >
                                        <h4 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors flex items-center justify-between">
                                            <span>{m.modelName}</span>
                                            <ChevronRight size={15} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </h4>

                                        {m.releaseYear && (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-3">
                                                <Calendar size={11} />
                                                <span>Jahr: {m.releaseYear}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 flex items-center gap-1">
                                            <Layers size={13} />
                                            <span>Artikel</span>
                                        </span>
                                        <span className="text-white font-semibold">{m.partCount} Artikel</span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">Verfügbar</span>
                                        <span className={m.totalAvailable > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                            {m.totalAvailable} Stk.
                                        </span>
                                    </div>

                                    <div className="pt-1 flex items-center justify-between">
                                        {statusBadge}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <AddModelModal
                isOpen={isAddModelOpen}
                initialBrand={brand}
                onClose={() => setIsAddModelOpen(false)}
                onSuccess={onRefresh}
            />

            <EditModelModal
                isOpen={Boolean(editingModel)}
                model={editingModel}
                onClose={() => setEditingModel(null)}
                onSuccess={onRefresh}
            />

            <DiscontinueModelPartsModal
                isOpen={Boolean(discontinuingModel)}
                model={discontinuingModel}
                onClose={() => setDiscontinuingModel(null)}
                onSuccess={onRefresh}
            />
        </div>
    );
};

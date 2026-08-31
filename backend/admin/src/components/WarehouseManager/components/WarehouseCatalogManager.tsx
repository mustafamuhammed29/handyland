/**
 * backend/admin/src/components/WarehouseManager/components/WarehouseCatalogManager.tsx
 * Guided German Catalog Browsing Controller: MARKEN → MODELLE → ERSATZTEILE
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, ListFilter, RefreshCw, LayoutGrid, X } from 'lucide-react';
import { api } from '../../../utils/api';
import { CatalogBrandView } from './CatalogBrandView';
import { CatalogModelView } from './CatalogModelView';
import { CatalogPartsView } from './CatalogPartsView';
import { CatalogSearchView } from './CatalogSearchView';
import { WarehousePartsTable } from './WarehousePartsTable';
import { AddPartModal } from './AddPartModal';
import {
    groupPartsByBrand,
    groupPartsByModel
} from '../utils/catalogHelpers';
import type { WarehousePart, WarehouseLocation, PaginationMeta } from '../types';

interface WarehouseCatalogManagerProps {
    parts: WarehousePart[];
    locations: WarehouseLocation[];
    pagination: PaginationMeta;
    loading: boolean;
    error: string | null;
    search: string;
    onSearchChange: (value: string) => void;
    brand: string;
    onBrandChange: (value: string) => void;
    deviceFamily: string;
    onDeviceFamilyChange: (value: string) => void;
    partType: string;
    onPartTypeChange: (value: string) => void;
    quality: string;
    onQualityChange: (value: string) => void;
    status: 'active' | 'discontinued' | '';
    onStatusChange: (value: 'active' | 'discontinued' | '') => void;
    locationId: string;
    onLocationIdChange: (value: string) => void;
    lowStock: boolean;
    onLowStockChange: (value: boolean) => void;
    page: number;
    onPageChange: (page: number) => void;
    limit: number;
    onLimitChange: (limit: number) => void;
    onRetry: () => void;
    onRefresh: () => void;
}

export type CatalogViewMode = 'brands' | 'models' | 'parts' | 'all' | 'search';

export const WarehouseCatalogManager: React.FC<WarehouseCatalogManagerProps> = ({
    parts,
    locations,
    pagination,
    loading,
    error,
    search,
    onSearchChange,
    brand,
    onBrandChange,
    deviceFamily,
    onDeviceFamilyChange,
    partType,
    onPartTypeChange,
    quality,
    onQualityChange,
    status,
    onStatusChange,
    locationId,
    onLocationIdChange,
    lowStock,
    onLowStockChange,
    page,
    onPageChange,
    limit,
    onLimitChange,
    onRetry,
    onRefresh
}) => {
    // Navigation State
    const [viewMode, setViewMode] = useState<CatalogViewMode>('brands');
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [globalSearch, setGlobalSearch] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Full catalog state for guided navigation
    const [allCatalogParts, setAllCatalogParts] = useState<WarehousePart[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);

    // Fetch all active parts for hierarchical grouping
    const fetchFullCatalog = useCallback(async () => {
        setCatalogLoading(true);
        setCatalogError(null);
        try {
            const res = await api.get('/api/warehouse/parts', {
                params: { page: 1, limit: 100 }
            });
            if (res.data?.success && Array.isArray(res.data?.data)) {
                setAllCatalogParts(res.data.data);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Katalog konnte nicht geladen werden';
            setCatalogError(msg);
        } finally {
            setCatalogLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFullCatalog();
    }, [fetchFullCatalog]);

    // Derived Brand & Model Groups
    const brandSummaries = useMemo(() => {
        return groupPartsByBrand(allCatalogParts);
    }, [allCatalogParts]);

    const modelSummaries = useMemo(() => {
        if (!selectedBrand) return [];
        return groupPartsByModel(allCatalogParts, selectedBrand);
    }, [allCatalogParts, selectedBrand]);

    // Model specific parts
    const currentModelParts = useMemo(() => {
        if (!selectedBrand || !selectedModel) return [];
        const modelLower = selectedModel.trim().toLowerCase();
        return allCatalogParts.filter(p => {
            const hasCompat = Array.isArray(p.compatibleDevices) && p.compatibleDevices.length > 0;
            if (hasCompat) {
                return p.compatibleDevices.some(d => d.trim().toLowerCase() === modelLower);
            }
            return p.deviceFamily ? p.deviceFamily.trim().toLowerCase() === modelLower : false;
        });
    }, [allCatalogParts, selectedBrand, selectedModel]);

    // Search trigger
    useEffect(() => {
        if (globalSearch.trim().length >= 2) {
            setViewMode('search');
        } else if (viewMode === 'search') {
            if (selectedBrand && selectedModel) setViewMode('parts');
            else if (selectedBrand) setViewMode('models');
            else setViewMode('brands');
        }
    }, [globalSearch, selectedBrand, selectedModel, viewMode]);

    // Navigation Handlers
    const handleSelectBrand = (b: string) => {
        setSelectedBrand(b);
        setSelectedModel(null);
        setViewMode('models');
    };

    const handleSelectModel = (m: string) => {
        setSelectedModel(m);
        setViewMode('parts');
    };

    const handleBackToBrands = () => {
        setSelectedBrand(null);
        setSelectedModel(null);
        setViewMode('brands');
    };

    const handleBackToModels = () => {
        setSelectedModel(null);
        setViewMode('models');
    };

    const handleClearSearch = () => {
        setGlobalSearch('');
        if (selectedBrand && selectedModel) setViewMode('parts');
        else if (selectedBrand) setViewMode('models');
        else setViewMode('brands');
    };

    const handleRefreshAll = () => {
        fetchFullCatalog();
        onRefresh();
    };

    return (
        <div className="space-y-6">
            {/* Catalog Toolbar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <span>Ersatzteilkatalog</span>
                            <span className="text-xs font-normal text-slate-400">
                                ({allCatalogParts.length} Artikel gesamt)
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Teile nach Marke und Modell finden und Lagerbestände prüfen.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Switch View Button */}
                        {viewMode === 'all' ? (
                            <button
                                type="button"
                                onClick={() => setViewMode('brands')}
                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-xl transition-colors border border-blue-500/30"
                            >
                                <LayoutGrid size={14} />
                                <span>Geführte Katalogansicht</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setViewMode('all')}
                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors border border-slate-700/60"
                            >
                                <ListFilter size={14} />
                                <span>Alle Teile anzeigen</span>
                            </button>
                        )}

                        {/* Add Part Button */}
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                            <Plus size={16} />
                            <span>Ersatzteil anlegen</span>
                        </button>
                    </div>
                </div>

                {/* Global Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        placeholder="SKU, Teilenummer oder Bezeichnung suchen …"
                        className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner"
                    />
                    {globalSearch && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {catalogError && (
                <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 text-center">
                    <p className="text-red-400 text-xs font-semibold mb-2">
                        Der Katalog konnte nicht geladen werden. Bitte erneut versuchen.
                    </p>
                    <button
                        type="button"
                        onClick={handleRefreshAll}
                        className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                        <RefreshCw size={13} />
                        <span>Erneut versuchen</span>
                    </button>
                </div>
            )}

            {/* View Switching */}
            {viewMode === 'search' && (
                <CatalogSearchView
                    searchTerm={globalSearch}
                    parts={allCatalogParts}
                    onSelectModel={(b, m) => {
                        setSelectedBrand(b);
                        setSelectedModel(m);
                        setGlobalSearch('');
                        setViewMode('parts');
                    }}
                    onClearSearch={handleClearSearch}
                />
            )}

            {viewMode === 'brands' && (
                <CatalogBrandView
                    brands={brandSummaries}
                    onSelectBrand={handleSelectBrand}
                    loading={catalogLoading}
                />
            )}

            {viewMode === 'models' && selectedBrand && (
                <CatalogModelView
                    brand={selectedBrand}
                    models={modelSummaries}
                    onSelectModel={handleSelectModel}
                    onBackToBrands={handleBackToBrands}
                />
            )}

            {viewMode === 'parts' && selectedBrand && selectedModel && (
                <CatalogPartsView
                    brand={selectedBrand}
                    modelName={selectedModel}
                    parts={currentModelParts}
                    locations={locations}
                    onBackToModels={handleBackToModels}
                    onRefresh={handleRefreshAll}
                />
            )}

            {viewMode === 'all' && (
                <WarehousePartsTable
                    parts={parts}
                    locations={locations}
                    pagination={pagination}
                    loading={loading}
                    error={error}
                    search={search}
                    onSearchChange={onSearchChange}
                    brand={brand}
                    onBrandChange={onBrandChange}
                    deviceFamily={deviceFamily}
                    onDeviceFamilyChange={onDeviceFamilyChange}
                    partType={partType}
                    onPartTypeChange={onPartTypeChange}
                    quality={quality}
                    onQualityChange={onQualityChange}
                    status={status}
                    onStatusChange={onStatusChange}
                    locationId={locationId}
                    onLocationIdChange={onLocationIdChange}
                    lowStock={lowStock}
                    onLowStockChange={onLowStockChange}
                    page={page}
                    onPageChange={onPageChange}
                    limit={limit}
                    onLimitChange={onLimitChange}
                    onRetry={onRetry}
                    onRefresh={handleRefreshAll}
                />
            )}

            {/* Add Part Dialog */}
            <AddPartModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    handleRefreshAll();
                }}
                initialBrand={selectedBrand || undefined}
                initialDeviceFamily={selectedModel || undefined}
                initialCompatibleDevice={selectedModel || undefined}
            />
        </div>
    );
};

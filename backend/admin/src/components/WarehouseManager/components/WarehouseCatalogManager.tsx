/**
 * backend/admin/src/components/WarehouseManager/components/WarehouseCatalogManager.tsx
 * German Warehouse Catalog Manager with relation-based Device Model navigation (Phase 3A).
 * Decouples model parts viewing from stale compatibleDevices text arrays.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Package,
    Layers,
    Search,
    RefreshCw,
    Plus,
    AlertCircle,
    Info
} from 'lucide-react';
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
import type { WarehousePart, WarehouseLocation, PaginationMeta, DeviceModel } from '../types';

interface WarehouseCatalogManagerProps {
    parts: WarehousePart[];
    locations: WarehouseLocation[];
    pagination: PaginationMeta;
    loading: boolean;
    error: string | null;
    search: string;
    onSearchChange: (val: string) => void;
    brand: string;
    onBrandChange: (val: string) => void;
    deviceFamily: string;
    onDeviceFamilyChange: (val: string) => void;
    partType: string;
    onPartTypeChange: (val: string) => void;
    quality: string;
    onQualityChange: (val: string) => void;
    status: '' | 'active' | 'discontinued';
    onStatusChange: (val: '' | 'active' | 'discontinued') => void;
    locationId: string;
    onLocationIdChange: (val: string) => void;
    lowStock: boolean;
    onLowStockChange: (val: boolean) => void;
    page: number;
    onPageChange: (page: number) => void;
    limit: number;
    onLimitChange: (limit: number) => void;
    onRetry: () => void;
    onRefresh: () => void;
    onNavigateToMovements?: (partId?: string) => void;
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
    onRefresh,
    onNavigateToMovements
}) => {
    // Navigation State
    const [viewMode, setViewMode] = useState<CatalogViewMode>('brands');
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);
    const [globalSearch, setGlobalSearch] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Full catalog state for guided navigation
    const [allCatalogParts, setAllCatalogParts] = useState<WarehousePart[]>([]);
    const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [modelsUnavailableNotice, setModelsUnavailableNotice] = useState<string | null>(null);

    // Relational model parts state
    const [modelParts, setModelParts] = useState<WarehousePart[]>([]);
    const [modelPartsLoading, setModelPartsLoading] = useState(false);

    // Selected model context for AddPartModal
    const [modalContext, setModalContext] = useState<{
        brand: string;
        modelName: string;
        deviceFamily: string;
        modelId?: string;
    } | null>(null);

    // Fetch all active parts and device models
    const fetchFullCatalog = useCallback(async () => {
        setCatalogLoading(true);
        setCatalogError(null);
        setModelsUnavailableNotice(null);
        try {
            const [partsRes, modelsRes] = await Promise.allSettled([
                api.get('/api/warehouse/parts', { params: { page: 1, limit: 100 } }),
                api.get('/api/warehouse/models', { params: { limit: 200 } })
            ]);

            if (partsRes.status === 'fulfilled' && partsRes.value.data?.success && Array.isArray(partsRes.value.data?.data)) {
                setAllCatalogParts(partsRes.value.data.data);
            }
            if (modelsRes.status === 'fulfilled' && modelsRes.value.data?.success && Array.isArray(modelsRes.value.data?.data)) {
                setDeviceModels(modelsRes.value.data.data);
            } else {
                // Pre-migration or schema unavailable
                setModelsUnavailableNotice('Die Modellverwaltung ist noch nicht verfügbar. Bitte wenden Sie sich an die Administration.');
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

    // Combined Models list for selectedBrand
    const selectedBrandModels = useMemo<DeviceModel[]>(() => {
        if (!selectedBrand) return [];
        const brandLower = selectedBrand.trim().toLowerCase();

        // 1. Models from API
        const apiModels = deviceModels.filter(
            (m) => (m.brand || '').trim().toLowerCase() === brandLower
        );

        const knownModelNames = new Set(apiModels.map((m) => m.modelName.trim().toLowerCase()));

        // 2. Fallback derived models from parts if not already in API list
        const derived = groupPartsByModel(allCatalogParts, selectedBrand);
        const missingDerived: DeviceModel[] = derived
            .filter((d) => !knownModelNames.has(d.modelName.trim().toLowerCase()))
            .map((d) => ({
                id: `derived-${d.modelName}`,
                brand: selectedBrand,
                modelName: d.modelName,
                deviceFamily: d.deviceFamily,
                normalizedKey: `${brandLower}:${d.modelName.trim().toLowerCase()}`,
                sortWeight: 0,
                isActive: true,
                partCount: d.partCount,
                totalAvailable: d.totalAvailable,
                totalOnHand: d.totalOnHand,
                lowStockCount: d.stockStatus === 'low' ? 1 : 0,
                outOfStockCount: d.stockStatus === 'out_of_stock' ? 1 : 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

        return [...apiModels, ...missingDerived];
    }, [deviceModels, allCatalogParts, selectedBrand]);

    // Fetch parts for a specific selected model using relational endpoint
    const fetchPartsForModel = useCallback(async (model: DeviceModel) => {
        if (model.id && !model.id.startsWith('derived-')) {
            setModelPartsLoading(true);
            try {
                const res = await api.get(`/api/warehouse/models/${model.id}/parts`);
                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setModelParts(res.data.data);
                    return;
                }
            } catch (err) {
                console.warn('Relational model parts lookup failed, using catalog fallback:', err);
            } finally {
                setModelPartsLoading(false);
            }
        }

        // Fallback for pre-migration derived models or network failure
        const modelLower = model.modelName.trim().toLowerCase();
        const fallback = allCatalogParts.filter((p) => {
            const hasCompat = Array.isArray(p.compatibleDevices) && p.compatibleDevices.length > 0;
            if (hasCompat) {
                return p.compatibleDevices.some((d) => d.trim().toLowerCase() === modelLower);
            }
            return p.deviceFamily ? p.deviceFamily.trim().toLowerCase() === modelLower : false;
        });
        setModelParts(fallback);
    }, [allCatalogParts]);

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
        setModelParts([]);
        setViewMode('models');
    };

    const handleSelectModel = (m: DeviceModel) => {
        setSelectedModel(m);
        setViewMode('parts');
        fetchPartsForModel(m);
    };

    const handleSelectModelFromSearch = (brandName: string, modelName: string) => {
        setSelectedBrand(brandName);
        setGlobalSearch('');

        const foundModel = deviceModels.find(
            (m) =>
                (m.brand || '').trim().toLowerCase() === brandName.trim().toLowerCase() &&
                m.modelName.trim().toLowerCase() === modelName.trim().toLowerCase()
        );

        const targetModel: DeviceModel = foundModel || {
            id: `derived-${modelName}`,
            brand: brandName,
            modelName: modelName,
            deviceFamily: modelName,
            normalizedKey: `${brandName.toLowerCase()}:${modelName.toLowerCase()}`,
            sortWeight: 0,
            isActive: true,
            partCount: 0,
            totalAvailable: 0,
            totalOnHand: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        handleSelectModel(targetModel);
    };

    const handleBackToBrands = () => {
        setSelectedBrand(null);
        setSelectedModel(null);
        setModelParts([]);
        setViewMode('brands');
    };

    const handleBackToModels = () => {
        setSelectedModel(null);
        setModelParts([]);
        setViewMode('models');
    };

    const handleClearSearch = () => {
        setGlobalSearch('');
        if (selectedBrand && selectedModel) setViewMode('parts');
        else if (selectedBrand) setViewMode('models');
        else setViewMode('brands');
    };

    const handleRefreshAll = useCallback(async () => {
        await fetchFullCatalog();
        if (selectedModel) {
            await fetchPartsForModel(selectedModel);
        }
        onRefresh();
    }, [fetchFullCatalog, fetchPartsForModel, selectedModel, onRefresh]);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Top Toolbar */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Left: Breadcrumbs & Mode Switching */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-sm">
                    <button
                        type="button"
                        onClick={() => {
                            if (viewMode === 'all') setViewMode('brands');
                            else handleBackToBrands();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                            viewMode === 'brands' || (viewMode !== 'all' && !selectedBrand)
                                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                        <Package size={16} />
                        <span>Katalog</span>
                    </button>

                    {selectedBrand && viewMode !== 'all' && (
                        <>
                            <span className="text-slate-600">/</span>
                            <button
                                type="button"
                                onClick={handleBackToModels}
                                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                                    viewMode === 'models'
                                        ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                {selectedBrand}
                            </button>
                        </>
                    )}

                    {selectedModel && viewMode === 'parts' && (
                        <>
                            <span className="text-slate-600">/</span>
                            <span className="px-3 py-1.5 rounded-xl font-medium bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]">
                                {selectedModel.modelName}
                            </span>
                        </>
                    )}

                    <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

                    <button
                        type="button"
                        onClick={() => setViewMode('all')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                            viewMode === 'all'
                                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                        <Layers size={16} />
                        <span className="whitespace-nowrap">Gesamtliste ({allCatalogParts.length})</span>
                    </button>
                </div>

                {/* Right: Global Search & Actions */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:w-72">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            placeholder="Katalog durchsuchen (SKU, Name, Modell)..."
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleRefreshAll}
                        disabled={catalogLoading}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40"
                        title="Katalog aktualisieren"
                    >
                        <RefreshCw size={16} className={catalogLoading ? 'animate-spin text-blue-400' : ''} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setModalContext(
                                selectedModel
                                    ? {
                                          brand: selectedModel.brand,
                                          modelName: selectedModel.modelName,
                                          deviceFamily: selectedModel.deviceFamily,
                                          modelId: selectedModel.id
                                      }
                                    : selectedBrand
                                    ? { brand: selectedBrand, modelName: '', deviceFamily: '' }
                                    : null
                            );
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] shrink-0"
                    >
                        <Plus size={15} />
                        <span className="hidden sm:inline">Neues Ersatzteil</span>
                    </button>
                </div>
            </div>

            {/* Models Unavailable Warning (Pre-migration Notice) */}
            {modelsUnavailableNotice && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl flex items-center gap-2.5 text-amber-200 text-xs">
                    <Info size={16} className="text-amber-400 shrink-0" />
                    <span>{modelsUnavailableNotice}</span>
                </div>
            )}

            {/* Error Message */}
            {catalogError && (
                <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-2xl flex items-center justify-between text-red-200 text-xs">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-400 shrink-0" />
                        <span>{catalogError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefreshAll}
                        className="underline hover:text-white"
                    >
                        Erneut versuchen
                    </button>
                </div>
            )}

            {/* Dynamic Content Views */}
            {viewMode === 'search' && (
                <CatalogSearchView
                    searchTerm={globalSearch}
                    parts={allCatalogParts}
                    onSelectModel={handleSelectModelFromSearch}
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
                    models={selectedBrandModels}
                    onSelectModel={handleSelectModel}
                    onBackToBrands={handleBackToBrands}
                    onRefresh={handleRefreshAll}
                    onOpenAddPartForModel={(b, m, f, id) => {
                        setModalContext({ brand: b, modelName: m, deviceFamily: f, modelId: id });
                        setIsAddModalOpen(true);
                    }}
                />
            )}

            {viewMode === 'parts' && selectedBrand && selectedModel && (
                modelPartsLoading ? (
                    <div className="py-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4" />
                        <p className="text-slate-400 text-sm">Ersatzteile für {selectedModel.modelName} werden geladen …</p>
                    </div>
                ) : (
                    <CatalogPartsView
                        brand={selectedBrand}
                        modelName={selectedModel.modelName}
                        parts={modelParts}
                        locations={locations}
                        onBackToModels={handleBackToModels}
                        onRefresh={handleRefreshAll}
                        onNavigateToMovements={onNavigateToMovements}
                    />
                )
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
                    onNavigateToMovements={onNavigateToMovements}
                />
            )}

            {/* Add Part Dialog */}
            <AddPartModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setModalContext(null);
                }}
                onSuccess={handleRefreshAll}
                initialBrand={modalContext?.brand || selectedBrand || undefined}
                initialDeviceFamily={modalContext?.deviceFamily || selectedModel?.deviceFamily || undefined}
                initialCompatibleDevice={modalContext?.modelName || selectedModel?.modelName || undefined}
                deviceModelId={modalContext?.modelId || selectedModel?.id}
                existingParts={allCatalogParts}
                locations={locations}
            />
        </div>
    );
};

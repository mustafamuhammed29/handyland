/**
 * backend/admin/src/pages/WarehouseManager.tsx
 * Admin-only page for internal repair-parts warehouse management (Phase 2A & 2B).
 */
import { useState } from 'react';
import { Plus, Boxes, RefreshCw } from 'lucide-react';
import { useWarehouseData } from '../components/WarehouseManager/hooks/useWarehouseData';
import { WarehouseStatCards } from '../components/WarehouseManager/components/WarehouseStatCards';
import { WarehouseTabs } from '../components/WarehouseManager/components/WarehouseTabs';
import { WarehouseCatalogManager } from '../components/WarehouseManager/components/WarehouseCatalogManager';
import { WarehouseMovementsTable } from '../components/WarehouseManager/components/WarehouseMovementsTable';
import { WarehouseLocationsList } from '../components/WarehouseManager/components/WarehouseLocationsList';
import { CreateMovementModal } from '../components/WarehouseManager/components/CreateMovementModal';

export default function WarehouseManager() {
    const {
        activeTab,
        setActiveTab,
        stats,
        statsLoading,
        statsError,
        fetchStats,
        locations,
        locationsLoading,
        locationsError,
        locationsSearch,
        setLocationsSearch,
        locationsZone,
        setLocationsZone,
        fetchLocations,
        parts,
        partsPagination,
        partsLoading,
        partsError,
        partsSearch,
        setPartsSearch,
        partsBrand,
        setPartsBrand,
        partsDeviceFamily,
        setPartsDeviceFamily,
        partsType,
        setPartsType,
        partsQuality,
        setPartsQuality,
        partsStatus,
        setPartsStatus,
        partsLocationId,
        setPartsLocationId,
        partsLowStock,
        setPartsLowStock,
        partsPage,
        setPartsPage,
        partsLimit,
        setPartsLimit,
        fetchParts,
        movements,
        movementsPagination,
        movementsLoading,
        movementsError,
        movementsSearch,
        setMovementsSearch,
        movementType,
        setMovementType,
        sourceLocationId,
        setSourceLocationId,
        destinationLocationId,
        setDestinationLocationId,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        movementsPage,
        setMovementsPage,
        movementsLimit,
        setMovementsLimit,
        fetchMovements,
        refreshAll
    } = useWarehouseData();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="p-4 sm:p-6 md:p-8 pb-20 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
                            <Boxes size={22} />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                Lager für Reparaturteile
                            </h2>
                            <p className="text-xs text-blue-400/90 font-mono">
                                Repair Parts Warehouse & Physical Ledger
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        Verwaltung physischer Ersatzteilbestände, geführter Modellkatalog und unveränderliches Transaktionsjournal
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={refreshAll}
                        title="Daten aktualisieren"
                        className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw size={15} />
                        <span className="hidden sm:inline">Aktualisieren</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
                    >
                        <Plus size={18} />
                        <span>Lagerbewegung erfassen</span>
                    </button>
                </div>
            </div>

            {/* Top Stat Cards (KPIs from GET /api/warehouse/stats) */}
            <WarehouseStatCards
                stats={stats}
                loading={statsLoading}
                error={statsError}
                onRetry={fetchStats}
            />

            {/* Navigation Tabs */}
            <WarehouseTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                partsCount={stats?.activePartCount}
                locationsCount={stats?.activeLocationCount}
            />

            {/* Tab Views */}
            {activeTab === 'parts' && (
                <WarehouseCatalogManager
                    parts={parts}
                    locations={locations}
                    pagination={partsPagination}
                    loading={partsLoading}
                    error={partsError}
                    search={partsSearch}
                    onSearchChange={setPartsSearch}
                    brand={partsBrand}
                    onBrandChange={setPartsBrand}
                    deviceFamily={partsDeviceFamily}
                    onDeviceFamilyChange={setPartsDeviceFamily}
                    partType={partsType}
                    onPartTypeChange={setPartsType}
                    quality={partsQuality}
                    onQualityChange={setPartsQuality}
                    status={partsStatus}
                    onStatusChange={setPartsStatus}
                    locationId={partsLocationId}
                    onLocationIdChange={setPartsLocationId}
                    lowStock={partsLowStock}
                    onLowStockChange={setPartsLowStock}
                    page={partsPage}
                    onPageChange={setPartsPage}
                    limit={partsLimit}
                    onLimitChange={setPartsLimit}
                    onRetry={fetchParts}
                    onRefresh={refreshAll}
                />
            )}

            {activeTab === 'movements' && (
                <WarehouseMovementsTable
                    movements={movements}
                    locations={locations}
                    pagination={movementsPagination}
                    loading={movementsLoading}
                    error={movementsError}
                    search={movementsSearch}
                    onSearchChange={setMovementsSearch}
                    movementType={movementType}
                    onMovementTypeChange={setMovementType}
                    sourceLocationId={sourceLocationId}
                    onSourceLocationIdChange={setSourceLocationId}
                    destinationLocationId={destinationLocationId}
                    onDestinationLocationIdChange={setDestinationLocationId}
                    fromDate={fromDate}
                    onFromDateChange={setFromDate}
                    toDate={toDate}
                    onToDateChange={setToDate}
                    page={movementsPage}
                    onPageChange={setMovementsPage}
                    limit={movementsLimit}
                    onLimitChange={setMovementsLimit}
                    onRetry={fetchMovements}
                />
            )}

            {activeTab === 'locations' && (
                <WarehouseLocationsList
                    locations={locations}
                    loading={locationsLoading}
                    error={locationsError}
                    search={locationsSearch}
                    onSearchChange={setLocationsSearch}
                    zone={locationsZone}
                    onZoneChange={setLocationsZone}
                    onRetry={fetchLocations}
                    onRefresh={refreshAll}
                />
            )}

            {/* Create Movement Dialog */}
            <CreateMovementModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                locations={locations}
                onSuccess={refreshAll}
            />
        </div>
    );
}

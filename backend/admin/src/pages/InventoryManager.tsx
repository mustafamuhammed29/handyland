import React from 'react';
import { useInventoryData } from '../components/InventoryManager/hooks/useInventoryData';
import { useInventoryActions } from '../components/InventoryManager/hooks/useInventoryActions';
import { StatCards } from '../components/InventoryManager/components/StatCards';
import { StockTabs } from '../components/InventoryManager/components/StockTabs';
import { InventoryTable } from '../components/InventoryManager/components/InventoryTable';
import { SalesTable } from '../components/InventoryManager/components/SalesTable';
import { HistoryTable } from '../components/InventoryManager/components/HistoryTable';
import { QuickEditModal } from '../components/InventoryManager/components/QuickEditModal';
import { AddRepairPartModal } from '../components/InventoryManager/components/AddRepairPartModal';
import { useBarcodeScanner } from '../components/InventoryManager/hooks/useBarcodeScanner';

export default function InventoryManager() {
    const {
        stats,
        sales,
        history,
        loading,
        itemsLoading,
        totalItemsCount,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm,
        typeFilter, setTypeFilter,
        stockFilter, setStockFilter,
        sortConfig, handleSort,
        itemsPage, setItemsPage,
        salesPage, setSalesPage,
        historyPage, setHistoryPage,
        itemsPerPage,
        itemsPageData,
        salesPageData,
        historyPageData,
        fetchInventoryData
    } = useInventoryData();

    const {
        isEditModalOpen, setIsEditModalOpen,
        editingItem, handleEditClick, handleUpdateItem, handleInlineUpdate,
        isAddPartModalOpen, setIsAddPartModalOpen, handleAddPartSave
    } = useInventoryActions(fetchInventoryData);

    useBarcodeScanner((barcode) => {
        setSearchTerm(barcode);
        setItemsPage(1);
    });

    const [editForm, setEditForm] = React.useState({ price: 0, costPrice: 0, stock: 0, reason: 'Manual Correction', notes: '' });

    React.useEffect(() => {
        if (editingItem) {
            setEditForm({
                price: editingItem.price || 0,
                costPrice: editingItem.costPrice || 0,
                stock: editingItem.stock || 0,
                reason: 'Manual Correction',
                notes: ''
            });
        }
    }, [editingItem]);

    const onUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleUpdateItem(editForm);
    };

    return (
        <div className="p-8 pb-20">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Inventory & Sales</h2>
                    <p className="text-slate-400">Manage your entire stock and view sales history</p>
                </div>
                {activeTab === 'items' && (
                    <button
                        onClick={() => setIsAddPartModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2 shrink-0 md:ml-auto"
                    >
                        + Add Repair Part
                    </button>
                )}
            </div>

            <StatCards stats={stats} />

            <StockTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'items' && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-slate-900/40 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg">
                    <div className="relative w-full md:max-w-md">
                        <input
                            type="text"
                            placeholder="Scan Barcode or Search Inventory..."
                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setItemsPage(1); }}
                        />
                        <div className="absolute left-3.5 top-3.5 text-blue-400/70">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" /></svg>
                        </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-center">
                        <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/50 shrink-0 shadow-inner">
                            {[
                                { id: 'All', label: 'All' },
                                { id: 'Product', label: 'Devices' },
                                { id: 'Accessory', label: 'Accessories' },
                                { id: 'RepairPart', label: 'Parts' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => { setTypeFilter(filter.id as any); setItemsPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${typeFilter === filter.id ? 'bg-slate-700 text-white shadow-slate-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <select
                            title="Filter by Stock Status"
                            aria-label="Filter by Stock Status"
                            className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-bold appearance-none outline-none focus:border-blue-500 min-w-[140px] shadow-inner transition-all cursor-pointer"
                            value={stockFilter}
                            onChange={(e: any) => { setStockFilter(e.target.value); setItemsPage(1); }}
                        >
                            <option value="All">All Stock Levels</option>
                            <option value="Low">Low Stock Alerts</option>
                            <option value="Out">Out of Stock</option>
                        </select>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-20 text-center text-slate-400 backdrop-blur-md animate-pulse">
                    Loading data...
                </div>
            ) : (
                <>
                    {activeTab === 'items' && (
                        <div className="relative">
                            {itemsLoading && (
                                <div className="absolute inset-0 z-10 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                    <div className="text-blue-400 font-medium animate-pulse">Loading inventory...</div>
                                </div>
                            )}
                            <InventoryTable
                                itemsPageData={itemsPageData}
                                processedItemsCount={totalItemsCount}
                                itemsPage={itemsPage}
                                setItemsPage={setItemsPage}
                                itemsPerPage={itemsPerPage}
                                sortConfig={sortConfig}
                                handleSort={handleSort}
                                handleEditClick={handleEditClick}
                                handleInlineUpdate={handleInlineUpdate}
                                setSearchTerm={setSearchTerm}
                                setTypeFilter={setTypeFilter}
                                setStockFilter={setStockFilter}
                            />
                        </div>
                    )}

                    {activeTab === 'sales' && (
                        <SalesTable
                            salesPageData={salesPageData}
                            totalSales={sales.length}
                            salesPage={salesPage}
                            setSalesPage={setSalesPage}
                            itemsPerPage={itemsPerPage}
                        />
                    )}

                    {activeTab === 'history' && (
                        <HistoryTable
                            historyPageData={historyPageData}
                            totalHistory={history.length}
                            historyPage={historyPage}
                            setHistoryPage={setHistoryPage}
                            itemsPerPage={itemsPerPage}
                        />
                    )}
                </>
            )}

            <QuickEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                editingItem={editingItem}
                editForm={editForm}
                setEditForm={setEditForm}
                handleUpdateItem={onUpdateItem}
            />

            <AddRepairPartModal
                isOpen={isAddPartModalOpen}
                onClose={() => setIsAddPartModalOpen(false)}
                handleAddPartSave={handleAddPartSave}
            />
        </div>
    );
}

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

export default function InventoryManager() {
    const {
        stats,
        sales,
        history,
        loading,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm,
        typeFilter, setTypeFilter,
        stockFilter, setStockFilter,
        sortConfig, handleSort,
        itemsPage, setItemsPage,
        salesPage, setSalesPage,
        historyPage, setHistoryPage,
        itemsPerPage,
        processedItems,
        itemsPageData,
        salesPageData,
        historyPageData,
        fetchInventoryData
    } = useInventoryData();

    const {
        isEditModalOpen, setIsEditModalOpen,
        editingItem, handleEditClick, handleUpdateItem,
        isAddPartModalOpen, setIsAddPartModalOpen, handleAddPartSave
    } = useInventoryActions(fetchInventoryData);

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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <StockTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {activeTab === 'items' && (
                    <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
                        <div className="relative max-w-xs w-full shrink-0">
                            <input
                                type="text"
                                placeholder="Scan Barcode or Search..."
                                className="w-full bg-slate-900/40 border border-slate-700/50 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur-md transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setItemsPage(1); }}
                            />
                            <div className="absolute left-3 top-3.5 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" /></svg>
                            </div>
                        </div>

                        <div className="flex bg-slate-900/60 p-1.5 rounded-xl backdrop-blur-md border border-slate-700/50 shrink-0 overflow-x-auto hide-scrollbar">
                            {[
                                { id: 'All', label: 'All' },
                                { id: 'Product', label: 'Devices' },
                                { id: 'Accessory', label: 'Accessories' },
                                { id: 'RepairPart', label: 'Parts' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => { setTypeFilter(filter.id as any); setItemsPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${typeFilter === filter.id ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <select
                            title="Filter by Stock Status"
                            aria-label="Filter by Stock Status"
                            className="bg-slate-900/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-blue-500 min-w-[130px] backdrop-blur-md transition-all shadow-inner"
                            value={stockFilter}
                            onChange={(e: any) => { setStockFilter(e.target.value); setItemsPage(1); }}
                        >
                            <option value="All">All Stock</option>
                            <option value="Low">Low Stock</option>
                            <option value="Out">Out of Stock</option>
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-20 text-center text-slate-400 backdrop-blur-md animate-pulse">
                    Loading data...
                </div>
            ) : (
                <>
                    {activeTab === 'items' && (
                        <InventoryTable
                            itemsPageData={itemsPageData}
                            processedItemsCount={processedItems.length}
                            itemsPage={itemsPage}
                            setItemsPage={setItemsPage}
                            itemsPerPage={itemsPerPage}
                            sortConfig={sortConfig}
                            handleSort={handleSort}
                            handleEditClick={handleEditClick}
                            setSearchTerm={setSearchTerm}
                            setTypeFilter={setTypeFilter}
                            setStockFilter={setStockFilter}
                        />
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

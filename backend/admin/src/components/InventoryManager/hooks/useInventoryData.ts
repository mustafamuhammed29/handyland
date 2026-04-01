import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../utils/api';

export function useInventoryData() {
    const [stats, setStats] = useState({
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        criticalStockCount: 0,
        outOfStockCount: 0,
        totalItemsSold: 0,
        totalRevenue: 0
    });

    const [items, setItems] = useState<any[]>([]);
    const [totalItemsCount, setTotalItemsCount] = useState(0);
    const [sales, setSales] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'items' | 'sales' | 'history'>('items');
    const [searchTerm, setSearchTerm] = useState('');

    const [typeFilter, setTypeFilter] = useState<'All' | 'Product' | 'Accessory' | 'RepairPart'>('All');
    const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Out'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [itemsPage, setItemsPage] = useState(1);
    const [salesPage, setSalesPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 15;

    // Use debounced search text for API calls
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchInventoryData = async () => {
        setLoading(true);
        try {
            const [statsRes, salesRes, historyRes] = await Promise.all([
                api.get('/api/inventory/stats'),
                api.get('/api/inventory/sales?limit=100'),
                api.get('/api/inventory/history?limit=100')
            ]);

            if (statsRes.data?.success) setStats(statsRes.data.data);
            if (salesRes.data?.success) setSales(salesRes.data.data);
            if (historyRes.data?.success) setHistory(historyRes.data.data);

        } catch (error) {
            console.error("Failed to load inventory stats", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        setItemsLoading(true);
        try {
            const res = await api.get('/api/inventory/items', {
                params: {
                    page: itemsPage,
                    limit: itemsPerPage,
                    search: debouncedSearch,
                    type: typeFilter,
                    stock: stockFilter
                }
            });
            if (res.data?.success) {
                setItems(res.data.data);
                setTotalItemsCount(res.data.totalItems || 0);
            }
        } catch (error) {
            console.error("Failed to load items", error);
        } finally {
            setItemsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [itemsPage, debouncedSearch, typeFilter, stockFilter, sortConfig]);

    const processedItems = useMemo(() => {
        let result = [...items];

        // Server handles search and filtering by type/stock. 
        // We only handle local sorting here on the current page if needed, 
        // though full backend sorting is recommended for complete sets.

        if (sortConfig !== null) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return result;
    }, [items, sortConfig]);

    // Items are already paginated by the server
    const itemsPageData = processedItems;

    const salesPageData = useMemo(() => {
        const startIndex = (salesPage - 1) * itemsPerPage;
        return sales.slice(startIndex, startIndex + itemsPerPage);
    }, [sales, salesPage]);

    const historyPageData = useMemo(() => {
        const startIndex = (historyPage - 1) * itemsPerPage;
        return history.slice(startIndex, startIndex + itemsPerPage);
    }, [history, historyPage]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return {
        stats,
        items,
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
        processedItems,
        itemsPageData,
        salesPageData,
        historyPageData,
        fetchInventoryData,
        fetchItems
    };
}

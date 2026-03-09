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
    const [sales, setSales] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'items' | 'sales' | 'history'>('items');
    const [searchTerm, setSearchTerm] = useState('');

    const [typeFilter, setTypeFilter] = useState<'All' | 'Product' | 'Accessory' | 'RepairPart'>('All');
    const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Out'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [itemsPage, setItemsPage] = useState(1);
    const [salesPage, setSalesPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 15;

    const fetchInventoryData = async () => {
        setLoading(true);
        try {
            const [statsRes, itemsRes, salesRes, historyRes] = await Promise.all([
                api.get('/api/inventory/stats'),
                api.get('/api/inventory/items'),
                api.get('/api/inventory/sales?limit=100'),
                api.get('/api/inventory/history?limit=100')
            ]);

            if (statsRes.data?.success) setStats(statsRes.data.data);
            if (itemsRes.data?.success) setItems(itemsRes.data.data);
            if (salesRes.data?.success) setSales(salesRes.data.data);
            if (historyRes.data?.success) setHistory(historyRes.data.data);

        } catch (error) {
            console.error("Failed to load inventory data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();
    }, []);

    const processedItems = useMemo(() => {
        let result = items;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(item =>
                (item.name && item.name.toLowerCase().includes(searchLower)) ||
                (item.barcode && item.barcode.toLowerCase() === searchLower) ||
                (item.barcode && item.barcode.toLowerCase().includes(searchLower)) ||
                (item.category && item.category.toLowerCase().includes(searchLower))
            );
        }

        if (typeFilter !== 'All') {
            result = result.filter(item => item.itemType === typeFilter);
        }

        if (stockFilter === 'Low') {
            result = result.filter(item => item.stock > 0 && item.stock <= (item.minStock || 5));
        } else if (stockFilter === 'Out') {
            result = result.filter(item => item.stock === 0);
        }

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
    }, [items, searchTerm, typeFilter, stockFilter, sortConfig]);

    const itemsPageData = useMemo(() => {
        const startIndex = (itemsPage - 1) * itemsPerPage;
        return processedItems.slice(startIndex, startIndex + itemsPerPage);
    }, [processedItems, itemsPage]);

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
    };
}

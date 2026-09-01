/**
 * backend/admin/src/components/WarehouseManager/hooks/useWarehouseData.ts
 * Custom hook managing API communication and filter states for the WarehouseManager.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../utils/api';
import useDebounce from '../../../hooks/useDebounce';
import type {
    WarehouseStats,
    WarehousePart,
    WarehouseLocation,
    WarehouseMovement,
    PaginationMeta,
    WarehouseTab
} from '../types';

export function useWarehouseData() {
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const [activeTab, setActiveTab] = useState<WarehouseTab>('parts');

    // ==========================================
    // 1. Stats State
    // ==========================================
    const [stats, setStats] = useState<WarehouseStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const res = await api.get('/api/warehouse/stats');
            if (isMounted.current) {
                if (res.data?.success && res.data?.data) {
                    setStats(res.data.data);
                } else {
                    setStatsError('فشل تحميل الإحصائيات');
                }
            }
        } catch (err: any) {
            if (isMounted.current) {
                const msg = err.response?.data?.message || 'حدث خطأ أثناء جلب إحصائيات المستودع';
                setStatsError(msg);
            }
        } finally {
            if (isMounted.current) {
                setStatsLoading(false);
            }
        }
    }, []);

    // ==========================================
    // 2. Locations State (also used as dropdown options)
    // ==========================================
    const [locations, setLocations] = useState<WarehouseLocation[]>([]);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [locationsError, setLocationsError] = useState<string | null>(null);
    const [locationsSearch, setLocationsSearch] = useState('');
    const [locationsZone, setLocationsZone] = useState('');
    const debouncedLocationsSearch = useDebounce(locationsSearch, 350);

    const fetchLocations = useCallback(async () => {
        setLocationsLoading(true);
        setLocationsError(null);
        try {
            const params: Record<string, string> = { active: 'true' };
            if (debouncedLocationsSearch.trim()) {
                params.search = debouncedLocationsSearch.trim().slice(0, 100);
            }
            if (locationsZone.trim()) {
                params.zone = locationsZone.trim().slice(0, 80);
            }

            const res = await api.get('/api/warehouse/locations', { params });
            if (isMounted.current) {
                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setLocations(res.data.data);
                } else {
                    setLocationsError('فشل تحميل مواقع المستودع');
                }
            }
        } catch (err: any) {
            if (isMounted.current) {
                const msg = err.response?.data?.message || 'حدث خطأ أثناء جلب مواقع التخزين';
                setLocationsError(msg);
            }
        } finally {
            if (isMounted.current) {
                setLocationsLoading(false);
            }
        }
    }, [debouncedLocationsSearch, locationsZone]);

    // ==========================================
    // 3. Parts State & Filters
    // ==========================================
    const [parts, setParts] = useState<WarehousePart[]>([]);
    const [partsPagination, setPartsPagination] = useState<PaginationMeta>({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0
    });
    const [partsLoading, setPartsLoading] = useState(false);
    const [partsError, setPartsError] = useState<string | null>(null);

    const [partsSearch, setPartsSearch] = useState('');
    const [partsBrand, setPartsBrand] = useState('');
    const [partsDeviceFamily, setPartsDeviceFamily] = useState('');
    const [partsType, setPartsType] = useState('');
    const [partsQuality, setPartsQuality] = useState('');
    const [partsStatus, setPartsStatus] = useState<'active' | 'discontinued' | ''>('');
    const [partsLocationId, setPartsLocationId] = useState('');
    const [partsLowStock, setPartsLowStock] = useState<boolean>(false);
    const [partsPage, setPartsPage] = useState(1);
    const [partsLimit, setPartsLimit] = useState(25);

    const debouncedPartsSearch = useDebounce(partsSearch, 350);

    const fetchParts = useCallback(async () => {
        setPartsLoading(true);
        setPartsError(null);
        try {
            const params: Record<string, any> = {
                page: partsPage,
                limit: partsLimit
            };

            if (debouncedPartsSearch.trim()) params.search = debouncedPartsSearch.trim().slice(0, 100);
            if (partsBrand.trim()) params.brand = partsBrand.trim().slice(0, 80);
            if (partsDeviceFamily.trim()) params.deviceFamily = partsDeviceFamily.trim().slice(0, 80);
            if (partsType.trim()) params.partType = partsType.trim().slice(0, 80);
            if (partsQuality.trim()) params.quality = partsQuality.trim().slice(0, 80);
            if (partsStatus) params.status = partsStatus;
            if (partsLocationId) params.locationId = partsLocationId;
            if (partsLowStock) params.lowStock = 'true';

            const res = await api.get('/api/warehouse/parts', { params });
            if (isMounted.current) {
                if (res.data?.success) {
                    setParts(res.data.data || []);
                    if (res.data.pagination) {
                        setPartsPagination(res.data.pagination);
                    }
                } else {
                    setPartsError('فشل تحميل قائمة قطع الصيانة');
                }
            }
        } catch (err: any) {
            if (isMounted.current) {
                const msg = err.response?.data?.message || 'حدث خطأ أثناء جلب قطع الصيانة';
                setPartsError(msg);
            }
        } finally {
            if (isMounted.current) {
                setPartsLoading(false);
            }
        }
    }, [
        partsPage,
        partsLimit,
        debouncedPartsSearch,
        partsBrand,
        partsDeviceFamily,
        partsType,
        partsQuality,
        partsStatus,
        partsLocationId,
        partsLowStock
    ]);

    // ==========================================
    // 4. Movements State & Filters
    // ==========================================
    const [movements, setMovements] = useState<WarehouseMovement[]>([]);
    const [movementsPagination, setMovementsPagination] = useState<PaginationMeta>({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0
    });
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [movementsError, setMovementsError] = useState<string | null>(null);

    const [movementsSearch, setMovementsSearch] = useState('');
    const [movementType, setMovementType] = useState<string>('');
    const [sourceLocationId, setSourceLocationId] = useState<string>('');
    const [destinationLocationId, setDestinationLocationId] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [movementsPage, setMovementsPage] = useState(1);
    const [movementsLimit, setMovementsLimit] = useState(25);

    const debouncedMovementsSearch = useDebounce(movementsSearch, 350);

    const fetchMovements = useCallback(async () => {
        // Validate date range on client side before issuing request
        if (fromDate && toDate) {
            const f = new Date(fromDate);
            const t = new Date(toDate);
            if (f > t) {
                setMovementsError('تاريخ البداية يجب ألا يتجاوز تاريخ النهاية');
                return;
            }
            const diffDays = (t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 366) {
                setMovementsError('النطاق الزمني الأقصى للبحث هو سنة واحدة (366 يوماً)');
                return;
            }
        }

        setMovementsLoading(true);
        setMovementsError(null);
        try {
            const params: Record<string, any> = {
                page: movementsPage,
                limit: movementsLimit
            };

            if (debouncedMovementsSearch.trim()) params.search = debouncedMovementsSearch.trim().slice(0, 100);
            if (movementType) params.movementType = movementType;
            if (sourceLocationId) params.sourceLocationId = sourceLocationId;
            if (destinationLocationId) params.destinationLocationId = destinationLocationId;
            if (fromDate) params.from = new Date(fromDate).toISOString();
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                params.to = endOfDay.toISOString();
            }

            const res = await api.get('/api/warehouse/movements', { params });
            if (isMounted.current) {
                if (res.data?.success) {
                    setMovements(res.data.data || []);
                    if (res.data.pagination) {
                        setMovementsPagination(res.data.pagination);
                    }
                } else {
                    setMovementsError('فشل تحميل سجل الحركات');
                }
            }
        } catch (err: any) {
            if (isMounted.current) {
                const msg = err.response?.data?.message || 'حدث خطأ أثناء جلب سجل حركات المخزون';
                setMovementsError(msg);
            }
        } finally {
            if (isMounted.current) {
                setMovementsLoading(false);
            }
        }
    }, [
        movementsPage,
        movementsLimit,
        debouncedMovementsSearch,
        movementType,
        sourceLocationId,
        destinationLocationId,
        fromDate,
        toDate
    ]);

    // Initial load: stats and locations (always needed for filters and modals)
    useEffect(() => {
        fetchStats();
        fetchLocations();
    }, [fetchStats, fetchLocations]);

    // Load active tab data
    useEffect(() => {
        if (activeTab === 'parts') {
            fetchParts();
        } else if (activeTab === 'movements') {
            fetchMovements();
        } else if (activeTab === 'locations') {
            fetchLocations();
        }
    }, [activeTab, fetchParts, fetchMovements, fetchLocations]);

    // Comprehensive refresh after a successful movement or manual update
    const refreshAll = useCallback(() => {
        fetchStats();
        fetchParts();
        fetchMovements();
        fetchLocations();
    }, [fetchStats, fetchParts, fetchMovements, fetchLocations]);

    return {
        // Tab
        activeTab,
        setActiveTab,

        // Stats
        stats,
        statsLoading,
        statsError,
        fetchStats,

        // Locations
        locations,
        locationsLoading,
        locationsError,
        locationsSearch,
        setLocationsSearch,
        locationsZone,
        setLocationsZone,
        fetchLocations,

        // Parts
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

        // Movements
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

        // Global refresh
        refreshAll
    };
}

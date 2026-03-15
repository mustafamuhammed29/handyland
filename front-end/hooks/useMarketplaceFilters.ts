import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * FIXED M-5: Extracted filter state from Marketplace.tsx to reduce God Component complexity.
 * This hook manages search filters, URL sync, debounce, pagination, and view mode.
 */

export interface MarketplaceFilters {
    searchTerm: string;
    debouncedSearchTerm: string;
    filterBrand: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
    selectedRam: string;
    selectedStorage: string;
    selectedCondition: string;
    viewMode: 'grid' | 'list';
    showFilters: boolean;
    currentPage: number;
    itemsPerPage: number;
}

export interface MarketplaceFilterActions {
    setSearchTerm: (v: string) => void;
    setFilterBrand: (v: string) => void;
    setMinPrice: (v: string) => void;
    setMaxPrice: (v: string) => void;
    setSort: (v: string) => void;
    setSelectedRam: (v: string) => void;
    setSelectedStorage: (v: string) => void;
    setSelectedCondition: (v: string) => void;
    setViewMode: (v: 'grid' | 'list') => void;
    setShowFilters: (v: boolean) => void;
    setCurrentPage: (v: number | ((prev: number) => number)) => void;
    clearAllFilters: () => void;
}

export const useMarketplaceFilters = (): MarketplaceFilters & MarketplaceFilterActions => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize from URL params
    const initialSearch = searchParams.get('search') || '';
    const initialBrand = searchParams.get('brand') || 'All';
    const initialMinPrice = searchParams.get('minPrice') || '';
    const initialMaxPrice = searchParams.get('maxPrice') || '';
    const initialCondition = searchParams.get('condition') || '';
    const initialRam = searchParams.get('ram') || '';
    const initialStorage = searchParams.get('storage') || '';
    const initialSort = searchParams.get('sort') || 'newest';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
    const [filterBrand, setFilterBrand] = useState(initialBrand);
    const [minPrice, setMinPrice] = useState(initialMinPrice);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
    const [sort, setSort] = useState(initialSort);
    const [selectedRam, setSelectedRam] = useState(initialRam);
    const [selectedStorage, setSelectedStorage] = useState(initialStorage);
    const [selectedCondition, setSelectedCondition] = useState(initialCondition);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Debounce search and sync filters to URL
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);

            if (searchTerm) searchParams.set('search', searchTerm); else searchParams.delete('search');
            if (filterBrand !== 'All') searchParams.set('brand', filterBrand); else searchParams.delete('brand');
            if (minPrice) searchParams.set('minPrice', minPrice); else searchParams.delete('minPrice');
            if (maxPrice) searchParams.set('maxPrice', maxPrice); else searchParams.delete('maxPrice');
            if (selectedCondition) searchParams.set('condition', selectedCondition); else searchParams.delete('condition');
            if (selectedRam) searchParams.set('ram', selectedRam); else searchParams.delete('ram');
            if (selectedStorage) searchParams.set('storage', selectedStorage); else searchParams.delete('storage');
            if (sort !== 'newest') searchParams.set('sort', sort); else searchParams.delete('sort');

            setSearchParams(searchParams, { replace: true });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filterBrand, minPrice, maxPrice, selectedCondition, selectedRam, selectedStorage, sort]);

    // Sync URL changes back to state (e.g. back/forward navigation)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== searchTerm) {
            setSearchTerm(urlSearch);
            setDebouncedSearchTerm(urlSearch);
        }
        const urlBrand = searchParams.get('brand');
        if (urlBrand && urlBrand !== filterBrand) setFilterBrand(urlBrand);
    }, [searchParams]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterBrand('All');
        setMinPrice('');
        setMaxPrice('');
        setSort('newest');
        setSelectedRam('');
        setSelectedStorage('');
        setSelectedCondition('');
    };

    return {
        searchTerm, debouncedSearchTerm, filterBrand, minPrice, maxPrice,
        sort, selectedRam, selectedStorage, selectedCondition,
        viewMode, showFilters, currentPage, itemsPerPage,
        setSearchTerm, setFilterBrand, setMinPrice, setMaxPrice,
        setSort, setSelectedRam, setSelectedStorage, setSelectedCondition,
        setViewMode, setShowFilters, setCurrentPage, clearAllFilters,
    };
};

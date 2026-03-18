import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { PhoneListing } from '../types';

export const useMarketplace = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // --- State from URL ---
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || 'All');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [selectedRam, setSelectedRam] = useState(searchParams.get('ram') || '');
    const [selectedStorage, setSelectedStorage] = useState(searchParams.get('storage') || '');
    const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '');
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // --- Sync State with URL ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (filterBrand !== 'All') params.brand = filterBrand;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (selectedCondition) params.condition = selectedCondition;
            if (selectedRam) params.ram = selectedRam;
            if (selectedStorage) params.storage = selectedStorage;
            if (sort !== 'newest') params.sort = sort;
            if (currentPage > 1) params.page = currentPage.toString();

            setSearchParams(params, { replace: true });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filterBrand, minPrice, maxPrice, selectedCondition, selectedRam, selectedStorage, sort, currentPage, setSearchParams]);

    // --- Data Fetching (Products) ---
    const { data, isLoading, isError } = useQuery({
        queryKey: ['products', currentPage, debouncedSearchTerm, filterBrand, sort, minPrice, maxPrice, selectedRam, selectedStorage, selectedCondition],
        queryFn: () => productService.getAllProducts({
            page: currentPage,
            limit: 12,
            search: debouncedSearchTerm,
            brand: filterBrand,
            sort,
            minPrice,
            maxPrice,
            ram: selectedRam,
            storage: selectedStorage,
            condition: selectedCondition
        }),
        placeholderData: (previousData) => previousData,
    });

    // --- Wishlist Management Removed to useWishlist ---

    return {
        // State
        searchTerm, setSearchTerm,
        filterBrand, setFilterBrand,
        minPrice, setMinPrice,
        maxPrice, setMaxPrice,
        sort, setSort,
        selectedRam, setSelectedRam,
        selectedStorage, setSelectedStorage,
        selectedCondition, setSelectedCondition,
        currentPage, setCurrentPage,
        viewMode, setViewMode,
        
        // Data
        products: data?.products || [],
        totalPages: data?.totalPages || 1,
        isLoading,
        isError
    };
};

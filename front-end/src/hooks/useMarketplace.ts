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

    // --- Wishlist Management ---
    const { data: wishlistData } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const res = await api.get<any>('/api/wishlist') as any;
            const items = res.data?.items || res.data?.products || res.products || res.items || [];
            return items.map((p: any) => p.customId || p.product || p.id || p._id) as string[];
        },
        retry: 1,
    });

    const wishlistMutation = useMutation({
        mutationFn: async ({ id, isWishlisted }: { id: string; isWishlisted: boolean }) => {
            const method = isWishlisted ? 'delete' : 'post';
            const endpoint = isWishlisted ? `/api/wishlist/${id}` : '/api/wishlist';
            return api({
                method,
                url: endpoint,
                data: isWishlisted ? undefined : { productId: id }
            });
        },
        onMutate: async ({ id, isWishlisted }) => {
            await queryClient.cancelQueries({ queryKey: ['wishlist'] });
            const previousWishlist = queryClient.getQueryData<string[]>(['wishlist']);
            
            queryClient.setQueryData(['wishlist'], (old: string[] | undefined) => {
                if (!old) return isWishlisted ? [] : [id];
                return isWishlisted ? old.filter(item => item !== id) : [...old, id];
            });

            return { previousWishlist };
        },
        onError: (err, variables, context) => {
            if (context?.previousWishlist) {
                queryClient.setQueryData(['wishlist'], context.previousWishlist);
            }
            addToast('Action failed. Please try again.', 'error');
        },
        onSuccess: (data, variables) => {
            addToast(variables.isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });

    const toggleWishlist = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const isWishlisted = (wishlistData || []).includes(id);
        wishlistMutation.mutate({ id, isWishlisted });
    }, [wishlistData, wishlistMutation]);

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
        isError,
        wishlist: wishlistData || [],
        
        // Actions
        toggleWishlist,
        loadingWishlistId: wishlistMutation.isPending ? wishlistMutation.variables?.id : null
    };
};

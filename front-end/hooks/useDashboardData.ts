import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { Order, RepairTicket, SavedValuation, Address, WalletTransaction, User as UserType } from '../types';

// Query keys
export const dashboardKeys = {
    all: ['dashboard'] as const,
    user: () => [...dashboardKeys.all, 'user'] as const,
    orders: () => [...dashboardKeys.all, 'orders'] as const,
    repairs: () => [...dashboardKeys.all, 'repairs'] as const,
    valuations: () => [...dashboardKeys.all, 'valuations'] as const,
    promotions: () => [...dashboardKeys.all, 'promotions'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    wallet: () => [...dashboardKeys.all, 'wallet'] as const,
    addresses: () => [...dashboardKeys.all, 'addresses'] as const,
    wishlist: () => [...dashboardKeys.all, 'wishlist'] as const,
    notifications: () => [...dashboardKeys.all, 'notifications'] as const,
};

// Individual query hooks
export function useUserData() {
    return useQuery({
        queryKey: dashboardKeys.user(),
        queryFn: async () => {
            const res = await authService.getMe();
            return res.user;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });
}

export function useOrders() {
    return useQuery({
        queryKey: dashboardKeys.orders(),
        queryFn: async () => {
            const res = await orderService.getMyOrders();
            return res.orders || [];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
    });
}

export function useRepairs() {
    return useQuery({
        queryKey: dashboardKeys.repairs(),
        queryFn: async () => {
            const res = await api.get<any>('/api/repairs/my-repairs');
            return res.data?.repairs || res.repairs || [];
        },
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

export function useValuations() {
    return useQuery({
        queryKey: dashboardKeys.valuations(),
        queryFn: async () => {
            const res = await api.get<any>('/api/valuation/my-valuations');
            // api interceptor returns response.data directly, so res may be the array itself
            const list: any[] = Array.isArray(res) ? res : (res?.data?.valuations || res?.valuations || res?.data || []);
            return list.map((v: any) => ({
                id: v._id,
                device: v.device || v.deviceName || 'Unknown Device',
                specs: v.specs || v.storage || '-',
                condition: v.condition || '-',
                date: v.createdAt ? new Date(v.createdAt).toLocaleDateString('de-DE') : '-',
                estimatedValue: v.estimatedValue ?? 0,
                quoteReference: v.quoteReference
            }));
        },
        staleTime: 30 * 1000, // 30 seconds so it stays fresh
        retry: 2,
    });
}


export function usePromotions() {
    return useQuery({
        queryKey: dashboardKeys.promotions(),
        queryFn: async () => {
            const res = await api.get<any>('/api/promotions/active');
            return res.data?.promotions || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });
}

export function useUserStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            const res = await api.get<any>('/api/stats/user');
            return res.data || null;
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useWalletTransactions() {
    return useQuery({
        queryKey: dashboardKeys.wallet(),
        queryFn: async () => {
            const res = await api.get<any>('/api/transactions');
            const transactions = res.data?.transactions || res.transactions || [];
            // Calculate balance from transactions
            const balance = transactions.reduce((sum: number, t: any) => {
                if (t.type === 'credit' || t.type === 'deposit' || t.type === 'refund') {
                    return sum + (t.amount || 0);
                }
                return sum - (t.amount || 0);
            }, 0);
            return { balance, transactions };
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        retry: 2,
    });
}

export function useAddresses() {
    return useQuery({
        queryKey: dashboardKeys.addresses(),
        queryFn: async () => {
            const res = await authService.getAddresses();
            return res.addresses || [];
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

export function useWishlist() {
    return useQuery({
        queryKey: dashboardKeys.wishlist(),
        queryFn: async () => {
            const res = await api.get<any>('/api/wishlist');
            return res.data?.items || [];
        },
        staleTime: 3 * 60 * 1000,
        retry: 2,
    });
}

export function useNotifications() {
    return useQuery({
        queryKey: dashboardKeys.notifications(),
        queryFn: async () => {
            const res = await api.get<any>('/api/notifications');
            return res.data?.notifications || [];
        },
        staleTime: 30 * 1000, // 30 seconds
        retry: 2,
        refetchInterval: 30 * 1000, // Poll every 30 seconds (will be replaced with WebSocket later)
    });
}

// Main hook that combines all queries
export function useDashboardData() {
    const userQuery = useUserData();
    const ordersQuery = useOrders();
    const repairsQuery = useRepairs();
    const valuationsQuery = useValuations();
    const promotionsQuery = usePromotions();
    const statsQuery = useUserStats();
    const walletQuery = useWalletTransactions();
    const addressesQuery = useAddresses();
    const wishlistQuery = useWishlist();
    const notificationsQuery = useNotifications();

    return {
        user: {
            data: userQuery.data,
            isLoading: userQuery.isLoading,
            error: userQuery.error,
            refetch: userQuery.refetch,
        },
        orders: {
            data: ordersQuery.data || [],
            isLoading: ordersQuery.isLoading,
            error: ordersQuery.error,
            refetch: ordersQuery.refetch,
        },
        repairs: {
            data: repairsQuery.data || [],
            isLoading: repairsQuery.isLoading,
            error: repairsQuery.error,
            refetch: repairsQuery.refetch,
        },
        valuations: {
            data: valuationsQuery.data || [],
            isLoading: valuationsQuery.isLoading,
            error: valuationsQuery.error,
            refetch: valuationsQuery.refetch,
        },
        promotions: {
            data: promotionsQuery.data || [],
            isLoading: promotionsQuery.isLoading,
            error: promotionsQuery.error,
            refetch: promotionsQuery.refetch,
        },
        stats: {
            data: statsQuery.data,
            isLoading: statsQuery.isLoading,
            error: statsQuery.error,
            refetch: statsQuery.refetch,
        },
        wallet: {
            data: walletQuery.data || [],
            isLoading: walletQuery.isLoading,
            error: walletQuery.error,
            refetch: walletQuery.refetch,
        },
        addresses: {
            data: addressesQuery.data || [],
            isLoading: addressesQuery.isLoading,
            error: addressesQuery.error,
            refetch: addressesQuery.refetch,
        },
        wishlist: {
            data: wishlistQuery.data || [],
            isLoading: wishlistQuery.isLoading,
            error: wishlistQuery.error,
            refetch: wishlistQuery.refetch,
        },
        notifications: {
            data: notificationsQuery.data || [],
            isLoading: notificationsQuery.isLoading,
            error: notificationsQuery.error,
            refetch: notificationsQuery.refetch,
        },
        // Overall loading state
        isLoading: userQuery.isLoading || ordersQuery.isLoading || repairsQuery.isLoading,
        // Check if any critical query has failed
        hasError: userQuery.isError || ordersQuery.isError || repairsQuery.isError,
    };
}

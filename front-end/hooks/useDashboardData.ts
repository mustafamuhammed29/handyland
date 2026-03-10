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

export function useOrders(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.orders(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await orderService.getMyOrders();
            return res.orders || [];
        },
        staleTime: 30 * 1000, // 30 seconds — refetches quickly after returning from checkout
        refetchOnWindowFocus: true, // Refresh when user returns to the tab
        retry: 2,
    });
}

export function useRepairs(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.repairs(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await api.get<any>('/api/repairs/my-repairs') as any;
            return res.data?.repairs || res.repairs || [];
        },
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

export function useValuations(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.valuations(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await api.get<any>('/api/valuation/my-valuations') as any;
            // api interceptor returns response.data directly, so res may be the array itself
            const list: any[] = Array.isArray(res) ? res : (res?.data?.valuations || res?.valuations || res?.data || []);
            return list.map((v: any) => ({
                id: v._id,
                device: v.device || v.deviceName || 'Unknown Device',
                specs: v.specs || v.storage || '-',
                condition: v.condition || '-',
                date: v.createdAt ? new Date(v.createdAt).toLocaleDateString('de-DE') : '-',
                estimatedValue: v.estimatedValue ?? 0,
                quoteReference: v.quoteReference,
                status: v.status || 'active',
                expiresAt: v.expiresAt || v.expiry || null
            }));
        },
        staleTime: 30 * 1000, // 30 seconds so it stays fresh
        retry: 2,
    });
}


export function usePromotions(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.promotions(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await api.get<any>('/api/promotions/active');
            return res.data?.promotions || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });
}

export function useUserStats(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await api.get<any>('/api/stats/user');
            return res.data || null;
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useWalletTransactions(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.wallet(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await api.get<any>('/api/transactions') as any;
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

export function useAddresses(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.addresses(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await authService.getAddresses();
            return res.addresses || [];
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

export function useWishlist(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dashboardKeys.wishlist(),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await api.get<any>('/api/wishlist') as any;
            // Interceptor may strip the .data wrapper, so check both res and res.data
            const items = res.data?.products || res.products || res.data?.items || res.items || [];
            return items.map((item: any) => ({
                id: item.customId || item.product || item._id, // The actual product string ID
                _id: item._id,                      // The wishlist item ID
                model: item.name || 'Unknown',      // Map snapshot name to model
                images: item.image ? [item.image] : [], // Map snapshot image to images array
                price: item.price || 0,             // Map snapshot price
                brand: item.productType || 'Product', // Accessory or Phone
                storage: '-',                       // Not in snapshot
                stock: 1                            // Assume in stock for snapshot payload
            }));
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
export function useDashboardData(activeTab: string = 'overview') {
    const isOverview = activeTab === 'overview';
    const userQuery = useUserData();
    const ordersQuery = useOrders({ enabled: isOverview || activeTab === 'orders' });
    const repairsQuery = useRepairs({ enabled: isOverview || activeTab === 'repairs' });
    const valuationsQuery = useValuations({ enabled: isOverview || activeTab === 'valuations' });
    const promotionsQuery = usePromotions({ enabled: isOverview });
    const statsQuery = useUserStats({ enabled: isOverview });
    const walletQuery = useWalletTransactions({ enabled: isOverview || activeTab === 'wallet' });
    const addressesQuery = useAddresses({ enabled: activeTab === 'settings' });
    const wishlistQuery = useWishlist({ enabled: isOverview || activeTab === 'wishlist' });
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

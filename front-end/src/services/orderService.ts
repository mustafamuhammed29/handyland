import { api } from '../utils/api';
import { Order } from '../types';

const devLog = (...args: any[]) => {
    if (import.meta.env.DEV) {
        console.error(...args);
    }
};

export const orderService = {
    createOrder: async (orderData: any): Promise<{ success: boolean; order: Order }> => {
        try {
            const response = await api.post('/api/orders', orderData);
            return response as any;
        } catch (error) {
            devLog('Order Service Create Error:', error);
            throw error;
        }
    },

    fetchShippingMethods: async (): Promise<any[]> => {
        try {
            const response = await api.get('/api/shipping-methods');
            return response as any;
        } catch (error) {
            devLog('Order Service Fetch Shipping Methods Error:', error);
            // Return empty array instead of throwing to prevent crash if endpoint is missing momentarily
            return [];
        }
    },

    getMyOrders: async (params?: { page?: number; limit?: number; status?: string }): Promise<{ success: boolean; orders: Order[]; count: number }> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.status) queryParams.append('status', params.status);

            const response = await api.get(`/api/orders?${queryParams.toString()}`);
            return response as any;
        } catch (error) {
            devLog('Order Service Get My Orders Error:', error);
            throw error;
        }
    },

    getOrder: async (id: string): Promise<{ success: boolean; order: Order }> => {
        try {
            const response = await api.get(`/api/orders/${id}`);
            return response as any;
        } catch (error) {
            devLog('Order Service Get Order By ID Error:', error);
            throw error;
        }
    },

    cancelOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.put(`/api/orders/${id}/cancel`, {});
            return response as any;
        } catch (error) {
            devLog('Order Service Cancel Order Error:', error);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: string, trackingNumber?: string): Promise<{ success: boolean; order: Order }> => {
        try {
            const response = await api.put(`/api/orders/admin/${id}/status`, { status, trackingNumber });
            return response as any;
        } catch (error) {
            devLog('Order Service Update Status Error:', error);
            throw error;
        }
    },

    downloadInvoice: async (id: string): Promise<void> => {
        try {
            window.open(`/api/orders/${id}/invoice`, '_blank');
        } catch (error) {
            devLog('Order Service Download Invoice Error:', error);
            throw error;
        }
    },

    applyCoupon: async (code: string, cartTotal: number): Promise<any> => {
        try {
            const response = await api.post('/api/orders/apply-coupon', { code, cartTotal });
            return response as any;
        } catch (error) {
            // Allow 400 errors to propagate naturally as they contain the message
            throw error;
        }
    },

    createCheckoutSession: async (data: any): Promise<{ success: boolean; url: string }> => {
        try {
            const response = await api.post('/api/payment/create-checkout-session', data);
            return response as any;
        } catch (error) {
            devLog('Order Service Create Checkout Session Error:', error);
            throw error;
        }
    }
};

import { api } from '../utils/api';
import { Order } from '../types';

export const orderService = {
    createOrder: async (orderData: any): Promise<{ success: boolean; order: Order }> => {
        try {
            return await api.post('/api/orders', orderData);
        } catch (error) {
            console.error('Order Service Create Error:', error);
            throw error;
        }
    },

    getMyOrders: async (params?: { page?: number; limit?: number; status?: string }): Promise<{ success: boolean; orders: Order[]; count: number }> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.status) queryParams.append('status', params.status);

            return await api.get(`/api/orders?${queryParams.toString()}`);
        } catch (error) {
            console.error('Order Service Get My Orders Error:', error);
            throw error;
        }
    },

    getOrder: async (id: string): Promise<{ success: boolean; order: Order }> => {
        try {
            return await api.get(`/api/orders/${id}`);
        } catch (error) {
            console.error('Order Service Get Order By ID Error:', error);
            throw error;
        }
    },

    cancelOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            return await api.put(`/api/orders/${id}/cancel`, {});
        } catch (error) {
            console.error('Order Service Cancel Order Error:', error);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: string, trackingNumber?: string): Promise<{ success: boolean; order: Order }> => {
        try {
            return await api.put(`/api/orders/admin/${id}/status`, { status, trackingNumber });
        } catch (error) {
            console.error('Order Service Update Status Error:', error);
            throw error;
        }
    },

    downloadInvoice: async (id: string): Promise<void> => {
        try {
            // Check if we need a blob response or just trigger download
            // Since api.get returns JSON by default in our wrapper, we might need a custom request for blob
            // But let's assume the backend returns HTML or PDF stream.
            // If it returns HTML string (as seen in controller), we might just open it in new window
            // implementing a direct fetch here to handle blob/html specifically if needed, 
            // OR use the api wrapper if it supports it.
            // efficient way for HTML invoice:
            const response = await api.get(`/api/orders/${id}/invoice`);
            const blob = new Blob([response as any], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Order Service Download Invoice Error:', error);
            throw error;
        }
    },

    applyCoupon: async (code: string, cartTotal: number): Promise<any> => {
        try {
            return await api.post('/api/orders/apply-coupon', { code, cartTotal });
        } catch (error) {
            // Allow 400 errors to propagate naturally as they contain the message
            throw error;
        }
    },

    createCheckoutSession: async (data: any): Promise<{ success: boolean; url: string }> => {
        try {
            return await api.post('/api/payment/create-checkout-session', data);
        } catch (error) {
            console.error('Order Service Create Checkout Session Error:', error);
            throw error;
        }
    }
};

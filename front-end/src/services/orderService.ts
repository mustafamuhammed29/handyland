import { api } from '../utils/api';
import { Order } from '../types';

interface ApiError {
    response?: {
        status?: number;
        data?: {
            message?: string;
            [key: string]: unknown;
        };
    };
    message?: string;
}

const devLog = (...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.error(...args);
    }
};

export interface CreateOrderPayload {
    items: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
        productType?: string;
    }[];
    shippingAddress: {
        fullName: string;
        street: string;
        city: string;
        zipCode: string;
        country: string;
        phone?: string;
    };
    paymentMethod: string;
    shippingMethod?: string;
    notes?: string;
    couponCode?: string;
}

export interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    estimatedDays: string;
    description?: string;
}

export interface CouponValidationResult {
    success: boolean;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    finalTotal: number;
    message?: string;
}

export interface CheckoutSessionPayload {
    orderId: string;
    successUrl: string;
    cancelUrl: string;
    paymentMethod?: string;
}

export const orderService = {
    createOrder: async (orderData: CreateOrderPayload): Promise<{ success: boolean; order: Order }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<{ success: boolean; order: Order }>('/api/orders', orderData);
            return response.data;
        } catch (error: unknown) {
            devLog('Order Service Create Error:', error);
            throw error;
        }
    },

    fetchShippingMethods: async (): Promise<ShippingMethod[]> => {
        try {
            const response = await api.get<{ shippingMethods?: ShippingMethod[]; data?: ShippingMethod[] }>('/api/shipping-methods');
            return response.data?.shippingMethods || response.data?.data || (response.data as unknown as ShippingMethod[]) || [];
        } catch (error: unknown) {
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

            const response = await api.get<{ success: boolean; orders: Order[]; count: number }>(`/api/orders?${queryParams.toString()}`);
            return response.data;
        } catch (error: unknown) {
            devLog('Order Service Get My Orders Error:', error);
            throw error;
        }
    },

    getOrder: async (id: string): Promise<{ success: boolean; order: Order }> => {
        try {
            const response = await api.get<{ success: boolean; order: Order }>(`/api/orders/${id}`);
            return response.data;
        } catch (error: unknown) {
            devLog('Order Service Get Order By ID Error:', error);
            throw error;
        }
    },

    cancelOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put<{ success: boolean; message: string }>(`/api/orders/${id}/cancel`, {});
            return response.data;
        } catch (error: unknown) {
            devLog('Order Service Cancel Order Error:', error);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: string, trackingNumber?: string): Promise<{ success: boolean; order: Order }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put<{ success: boolean; order: Order }>(`/api/orders/admin/${id}/status`, { status, trackingNumber });
            return response.data;
        } catch (error: unknown) {
            devLog('Order Service Update Status Error:', error);
            throw error;
        }
    },

    downloadInvoice: async (id: string): Promise<void> => {
        try {
            const html = await api.get<never, string>(`/api/orders/${id}/invoice`, { responseType: 'text' });
            const blob = new Blob([html as unknown as BlobPart], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error: unknown) {
            devLog('Order Service Download Invoice Error:', error);
            throw error;
        }
    },

    applyCoupon: async (code: string, cartTotal: number): Promise<CouponValidationResult> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<{ data?: CouponValidationResult } & CouponValidationResult>('/api/coupons/validate', { code, cartTotal });
            return response.data?.data || response.data;
        } catch (error: unknown) {
            // Allow 400 errors to propagate naturally as they contain the message
            throw error;
        }
    },

    createCheckoutSession: async (data: CheckoutSessionPayload): Promise<{ success: boolean; url: string }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<{ success: boolean; url: string }>('/api/payments/create-checkout-session', data);
            return response.data;
        } catch (error: unknown) {
            devLog('Order Service Create Checkout Session Error:', error);
            throw error;
        }
    }
};

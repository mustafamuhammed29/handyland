import { api } from '../utils/api';
import { PhoneListing } from '../types';

export const productService = {
    getAllProducts: async (filters?: Record<string, any>): Promise<{ success: boolean; products: PhoneListing[]; count: number; totalPages: number }> => {
        try {
            const queryParams = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '' && value !== null) {
                        queryParams.append(key, value.toString());
                    }
                });
            }
            const response = await api.get(`/api/products?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Product Service Get All Error:', error);
            throw error;
        }
    },

    getProductById: async (id: string): Promise<{ success: boolean; product: PhoneListing }> => {
        try {
            const response = await api.get(`/api/products/${id}`);
            return response.data;
        } catch (error) {
            console.error('Product Service Get By ID Error:', error);
            throw error;
        }
    },

    searchProducts: async (query: string): Promise<{ success: boolean; products: PhoneListing[] }> => {
        try {
            const response = await api.get(`/api/products?search=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            console.error('Product Service Search Error:', error);
            throw error;
        }
    },

    getProductsByCategory: async (category: string): Promise<{ success: boolean; products: PhoneListing[] }> => {
        try {
            const response = await api.get(`/api/products?category=${category}`);
            return response.data;
        } catch (error) {
            console.error('Product Service Get By Category Error:', error);
            throw error;
        }
    },

    getFeaturedProducts: async (): Promise<{ success: boolean; products: PhoneListing[] }> => {
        try {
            // Assuming featured means random or specific logic, defaulting to first 5
            const response = await api.get('/api/products?featured=true&limit=5');
            return response.data;
        } catch (error) {
            console.error('Product Service Get Featured Error:', error);
            throw error;
        }
    },

    validateStock: async (items: { id: string | number; quantity: number; name: string }[]): Promise<any> => {
        try {
            const response = await api.post('/api/products/validate-stock', { items });
            return response.data;
        } catch (error) {
            console.error('Product Service Validate Stock Error:', error);
            throw error;
        }
    },

    getRelatedProducts: async (id: string): Promise<PhoneListing[]> => {
        try {
            const response = await api.get(`/api/products/${id}/related`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Product Service Get Related Error:', error);
            // Return empty array instead of throwing to avoid breaking the UI for related products
            return [];
        }
    },

    getProductReviews: async (id: string): Promise<any[]> => {
        try {
            const response = await api.get(`/api/products/${id}/reviews`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Product Service Get Reviews Error:', error);
            return [];
        }
    },

    getProductQuestions: async (id: string): Promise<any[]> => {
        try {
            const response = await api.get(`/api/products/${id}/questions`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Product Service Get Questions Error:', error);
            return [];
        }
    }
};

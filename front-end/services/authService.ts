import { api } from '../utils/api';
import { User } from '../types';

interface LoginResponse {
    success: boolean;
    token: string;
    // FIXED: refreshToken is sent as HttpOnly Cookie by backend, not in response body
    refreshToken?: never;
    user: User & { deviceInfo?: any };
}
interface RegisterResponse {
    success: boolean;
    token: string;
    user: User;
}


export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            return response as any;
        } catch (error: any) {
            console.error('Auth Service Login Error:', error);
            throw error.response?.data || { message: error.message || 'Login failed' };
        }
    },

    register: async (userData: any): Promise<RegisterResponse> => {
        try {
            const response = await api.post('/api/auth/register', userData);
            return response as any;
        } catch (error: any) {
            console.error('Auth Service Register Error:', error.response?.data || error);
            throw error.response?.data || { message: error.message || 'Registration failed' };
        }
    },

    logout: async (): Promise<void> => {
        try {
            const response = await api.post('/api/auth/logout', {});
            return response as any;
        } catch (error: any) {
            console.error('Auth Service Logout Error:', error);
            throw error.response?.data || { message: error.message || 'Logout failed' };
        }
    },

    verifyEmail: async (token: string): Promise<any> => {
        try {
            const response = await api.get(`/api/auth/verify-email/${token}`);
            return response as any;
        } catch (error: any) {
            console.error('Auth Service Verify Email Error:', error);
            throw error.response?.data || { message: error.message || 'Verification failed' };
        }
    },

    resendVerification: async (email: string): Promise<any> => {
        try {
            const response = await api.post('/api/auth/resend-verification', { email });
            return response as any;
        } catch (error: any) {
            console.error('Auth Service Resend Verification Error:', error);
            throw error.response?.data || { message: error.message || 'Resend verification failed' };
        }
    },

    forgotPassword: async (email: string): Promise<any> => {
        try {
            const response = await api.post('/api/auth/forgot-password', { email });
            return response as any;
        } catch (error) {
            console.error('Auth Service Forgot Password Error:', error);
            throw error;
        }
    },

    resetPassword: async (token: string, password: string): Promise<any> => {
        try {
            const response = await api.post(`/api/auth/reset-password/${token}`, { password });
            return response as any;
        } catch (error) {
            console.error('Auth Service Reset Password Error:', error);
            throw error;
        }
    },

    getMe: async (): Promise<{ success: boolean; user: User }> => {
        try {
            const response = await api.get('/api/auth/me');
            return response as any;
        } catch (error) {
            console.error('Auth Service Get Me Error:', error);
            throw error;
        }
    },

    updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
        try {
            const response = await api.put('/api/auth/updateprofile', data);
            return response as any;
        } catch (error) {
            console.error('Auth Service Update Profile Error:', error);
            throw error;
        }
    },

    updatePassword: async (passwords: { oldPassword: string, newPassword: string }): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.put('/api/auth/changepassword', { currentPassword: passwords.oldPassword, newPassword: passwords.newPassword });
            return response as any;
        } catch (error) {
            console.error('Auth Service Update Password Error:', error);
            throw error;
        }
    },

    addAddress: async (address: any): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            const response = await api.post('/api/addresses', address);
            return response as any;
        } catch (error) {
            console.error('Auth Service Add Address Error:', error);
            throw error;
        }
    },

    getAddresses: async (): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            const response = await api.get('/api/addresses');
            return response as any;
        } catch (error) {
            console.error('Auth Service Get Addresses Error:', error);
            throw error;
        }
    },

    updateAddress: async (id: string, address: any): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            const response = await api.put(`/api/addresses/${id}`, address);
            return response as any;
        } catch (error) {
            console.error('Auth Service Update Address Error:', error);
            throw error;
        }
    },

    deleteAddress: async (id: string): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            const response = await api.delete(`/api/addresses/${id}`);
            return response as any;
        } catch (error) {
            console.error('Auth Service Delete Address Error:', error);
            throw error;
        }
    },

    refreshToken: async (): Promise<{ token: string }> => {
        try {
            const response = await api.get('/api/auth/refresh');
            return response as any;
        } catch (error) {
            console.error('Auth Service Refresh Token Error:', error);
            throw error;
        }
    }
};

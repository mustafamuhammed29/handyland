import { api } from '../utils/api';
import { User } from '../types';

interface LoginResponse {
    success: boolean;
    token: string;
    refreshToken: string; // If applicable
    user: User;
}

interface RegisterResponse {
    success: boolean;
    token: string;
    user: User;
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            return await api.post('/api/auth/login', { email, password });
        } catch (error) {
            console.error('Auth Service Login Error:', error);
            throw error;
        }
    },

    register: async (userData: any): Promise<RegisterResponse> => {
        try {
            return await api.post('/api/auth/register', userData);
        } catch (error) {
            console.error('Auth Service Register Error:', error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {
            return await api.post('/api/auth/logout', {});
        } catch (error) {
            console.error('Auth Service Logout Error:', error);
            throw error;
        }
    },

    verifyEmail: async (token: string): Promise<any> => {
        try {
            return await api.get(`/api/auth/verifyemail/${token}`);
        } catch (error) {
            console.error('Auth Service Verify Email Error:', error);
            throw error;
        }
    },

    resendVerification: async (email: string): Promise<any> => {
        try {
            return await api.post('/api/auth/resend-verification', { email });
        } catch (error) {
            console.error('Auth Service Resend Verification Error:', error);
            throw error;
        }
    },

    forgotPassword: async (email: string): Promise<any> => {
        try {
            return await api.post('/api/auth/forgotpassword', { email });
        } catch (error) {
            console.error('Auth Service Forgot Password Error:', error);
            throw error;
        }
    },

    resetPassword: async (token: string, password: string): Promise<any> => {
        try {
            return await api.put(`/api/auth/resetpassword/${token}`, { password });
        } catch (error) {
            console.error('Auth Service Reset Password Error:', error);
            throw error;
        }
    },

    getMe: async (): Promise<{ success: boolean; user: User }> => {
        try {
            return await api.get('/api/auth/me');
        } catch (error) {
            console.error('Auth Service Get Me Error:', error);
            throw error;
        }
    },

    updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
        try {
            return await api.put('/api/auth/profile', data);
        } catch (error) {
            console.error('Auth Service Update Profile Error:', error);
            throw error;
        }
    },

    updatePassword: async (passwords: { oldPassword: string, newPassword: string }): Promise<{ success: boolean; message: string }> => {
        try {
            return await api.put('/api/auth/password', passwords);
        } catch (error) {
            console.error('Auth Service Update Password Error:', error);
            throw error;
        }
    },

    addAddress: async (address: any): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            return await api.post('/api/addresses', address);
        } catch (error) {
            console.error('Auth Service Add Address Error:', error);
            throw error;
        }
    },

    getAddresses: async (): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            return await api.get('/api/addresses');
        } catch (error) {
            console.error('Auth Service Get Addresses Error:', error);
            throw error;
        }
    },

    updateAddress: async (id: string, address: any): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            return await api.put(`/api/addresses/${id}`, address);
        } catch (error) {
            console.error('Auth Service Update Address Error:', error);
            throw error;
        }
    },

    deleteAddress: async (id: string): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            return await api.delete(`/api/addresses/${id}`);
        } catch (error) {
            console.error('Auth Service Delete Address Error:', error);
            throw error;
        }
    }
};

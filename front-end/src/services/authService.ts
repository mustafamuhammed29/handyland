import { api } from '../utils/api';
import { User } from '../types';

// Only log auth errors in development — avoids leaking stack traces / API details in production
const devLog = (message: string, error: any) => {
    if (!import.meta.env.DEV) return;
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
        console.warn(`${message} (${status}):`, error?.response?.data?.message || error.message);
    } else {
        console.error(message, error);
    }
};

export interface LoginResponse {
    success: boolean;
    user?: User & { deviceInfo?: any };
    twoFactorRequired?: boolean;
    challengeId?: string;
    appType?: string;
}
interface RegisterResponse {
    success: boolean;
    user: User;
}


export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post('/api/auth/login', { email, password });
            return response as any;
        } catch (error: any) {
            devLog('Auth Service Login Result', error);
            throw error.response?.data || { message: error.message || 'Login failed' };
        }
    },

    verify2FALogin: async (challengeId: string, otp: string, appType = 'frontend'): Promise<LoginResponse> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post('/api/auth/2fa/verify-login', { challengeId, otp, appType });
            return response as any;
        } catch (error: any) {
            devLog('Auth Service 2FA Verification Error:', error.response?.data || error);
            throw error.response?.data || { message: error.message || '2FA Verification failed' };
        }
    },

    cancel2FALogin: async (challengeId: string): Promise<void> => {
        try {
            await api.get('/api/auth/csrf');
            await api.post('/api/auth/2fa/cancel-login', { challengeId });
        } catch (error: any) {
            devLog('Auth Service 2FA Cancellation Error:', error.response?.data || error);
        }
    },

    register: async (userData: any): Promise<RegisterResponse> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post('/api/auth/register', userData);
            return response as any;
        } catch (error: any) {
            devLog('Auth Service Register Error:', error.response?.data || error);
            throw error.response?.data || { message: error.message || 'Registration failed' };
        }
    },

    logout: async (): Promise<void> => {
        try {
            const response = await api.post('/api/auth/logout', {});
            return response as any;
        } catch (error: any) {
            devLog('Auth Service Logout Error:', error);
            throw error.response?.data || { message: error.message || 'Logout failed' };
        }
    },

    verifyEmail: async (token: string): Promise<any> => {
        try {
            const response = await api.get(`/api/auth/verify-email/${token}`);
            return response as any;
        } catch (error: any) {
            devLog('Auth Service Verify Email Error:', error);
            throw error.response?.data || { message: error.message || 'Verification failed' };
        }
    },

    resendVerification: async (email: string): Promise<any> => {
        try {
            const response = await api.post('/api/auth/resend-verification', { email });
            return response as any;
        } catch (error: any) {
            devLog('Auth Service Resend Verification Error:', error);
            throw error.response?.data || { message: error.message || 'Resend verification failed' };
        }
    },

    forgotPassword: async (email: string): Promise<any> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post('/api/auth/forgot-password', { email });
            return response as any;
        } catch (error: any) {
            devLog('Auth Service Forgot Password Error:', error);
            throw error.response?.data || { message: error.message || 'Forgot password request failed' };
        }
    },

    resetPassword: async (token: string, password: string, type?: string, uid?: string): Promise<any> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put('/api/auth/reset-password', { token, password, type, uid });
            return response as any;
        } catch (error) {
            devLog('Auth Service Reset Password Error:', error);
            throw error;
        }
    },

    getMe: async (headers?: Record<string, string>): Promise<{ success: boolean; user: User }> => {
        try {
            const response = await api.get('/api/auth/me', { headers });
            return response as any;
        } catch (error) {
            devLog('Auth Service Get Me Error:', error);
            throw error;
        }
    },

    updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put('/api/auth/updateprofile', data);
            return response as any;
        } catch (error) {
            devLog('Auth Service Update Profile Error:', error);
            throw error;
        }
    },

    updatePassword: async (passwords: { oldPassword: string, newPassword: string }): Promise<{ success: boolean; message: string }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put('/api/auth/changepassword', { currentPassword: passwords.oldPassword, newPassword: passwords.newPassword });
            return response as any;
        } catch (error) {
            devLog('Auth Service Update Password Error:', error);
            throw error;
        }
    },

    addAddress: async (address: any): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post('/api/addresses', address);
            return response as any;
        } catch (error) {
            devLog('Auth Service Add Address Error:', error);
            throw error;
        }
    },

    getAddresses: async (): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            const response = await api.get('/api/addresses');
            return response as any;
        } catch (error) {
            devLog('Auth Service Get Addresses Error:', error);
            throw error;
        }
    },

    updateAddress: async (id: string, address: any): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put(`/api/addresses/${id}`, address);
            return response as any;
        } catch (error) {
            devLog('Auth Service Update Address Error:', error);
            throw error;
        }
    },

    deleteAddress: async (id: string): Promise<{ success: boolean; addresses: any[] }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.delete(`/api/addresses/${id}`);
            return response as any;
        } catch (error) {
            devLog('Auth Service Delete Address Error:', error);
            throw error;
        }
    },

    refreshToken: async (): Promise<{ success: boolean }> => {
        try {
            const response = await api.post('/api/auth/refresh');
            return response as any;
        } catch (error) {
            devLog('Auth Service Refresh Token Error:', error);
            throw error;
        }
    }
};

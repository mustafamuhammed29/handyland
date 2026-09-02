import { api } from '../utils/api';
import { User } from '../types';

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

// Only log auth errors in development — avoids leaking stack traces / API details in production
const devLog = (message: string, error: unknown) => {
    if (!import.meta.env.DEV) return;
    const apiError = error as ApiError;
    const status = apiError?.response?.status;
    if (status === 401 || status === 403) {
        console.warn(`${message} (${status}):`, apiError?.response?.data?.message || apiError.message);
    } else {
        console.error(message, error);
    }
};

export interface LoginResponse {
    success: boolean;
    user?: User & { deviceInfo?: Record<string, unknown> };
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
            const response = await api.post<LoginResponse>('/api/auth/login', { email, password });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Login Result', error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || 'Login failed' };
        }
    },

    verify2FALogin: async (challengeId: string, otp: string, appType = 'frontend'): Promise<LoginResponse> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<LoginResponse>('/api/auth/2fa/verify-login', { challengeId, otp, appType });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service 2FA Verification Error:', (error as ApiError).response?.data || error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || '2FA Verification failed' };
        }
    },

    cancel2FALogin: async (challengeId: string): Promise<void> => {
        try {
            await api.get('/api/auth/csrf');
            await api.post('/api/auth/2fa/cancel-login', { challengeId });
        } catch (error: unknown) {
            devLog('Auth Service 2FA Cancellation Error:', (error as ApiError).response?.data || error);
        }
    },

    register: async (userData: Partial<User>): Promise<RegisterResponse> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<RegisterResponse>('/api/auth/register', userData);
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Register Error:', (error as ApiError).response?.data || error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || 'Registration failed' };
        }
    },

    logout: async (): Promise<void> => {
        try {
            const response = await api.post<void>('/api/auth/logout', {});
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Logout Error:', error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || 'Logout failed' };
        }
    },

    verifyEmail: async (token: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.get<{ success: boolean; message?: string }>(`/api/auth/verify-email/${token}`);
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Verify Email Error:', error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || 'Verification failed' };
        }
    },

    resendVerification: async (email: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.post<{ success: boolean; message?: string }>('/api/auth/resend-verification', { email });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Resend Verification Error:', error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || 'Resend verification failed' };
        }
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<{ success: boolean; message?: string }>('/api/auth/forgot-password', { email });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Forgot Password Error:', error);
            const apiErr = error as ApiError;
            throw apiErr.response?.data || { message: apiErr.message || 'Forgot password request failed' };
        }
    },

    resetPassword: async (token: string, password: string, type?: string, uid?: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put<{ success: boolean; message?: string }>('/api/auth/reset-password', { token, password, type, uid });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Reset Password Error:', error);
            throw error;
        }
    },

    getMe: async (headers?: Record<string, string>): Promise<{ success: boolean; user: User }> => {
        try {
            const response = await api.get<{ success: boolean; user: User }>('/api/auth/me', { headers });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Get Me Error:', error);
            throw error;
        }
    },

    updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put<{ success: boolean; user: User }>('/api/auth/updateprofile', data);
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Update Profile Error:', error);
            throw error;
        }
    },

    updatePassword: async (passwords: { oldPassword: string, newPassword: string }): Promise<{ success: boolean; message: string }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put<{ success: boolean; message: string }>('/api/auth/changepassword', { currentPassword: passwords.oldPassword, newPassword: passwords.newPassword });
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Update Password Error:', error);
            throw error;
        }
    },

    addAddress: async (address: Record<string, unknown>): Promise<{ success: boolean; addresses: Record<string, unknown>[] }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.post<{ success: boolean; addresses: Record<string, unknown>[] }>('/api/addresses', address);
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Add Address Error:', error);
            throw error;
        }
    },

    getAddresses: async (): Promise<{ success: boolean; addresses: Record<string, unknown>[] }> => {
        try {
            const response = await api.get<{ success: boolean; addresses: Record<string, unknown>[] }>('/api/addresses');
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Get Addresses Error:', error);
            throw error;
        }
    },

    updateAddress: async (id: string, address: Record<string, unknown>): Promise<{ success: boolean; addresses: Record<string, unknown>[] }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.put<{ success: boolean; addresses: Record<string, unknown>[] }>(`/api/addresses/${id}`, address);
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Update Address Error:', error);
            throw error;
        }
    },

    deleteAddress: async (id: string): Promise<{ success: boolean; addresses: Record<string, unknown>[] }> => {
        try {
            await api.get('/api/auth/csrf');
            const response = await api.delete<{ success: boolean; addresses: Record<string, unknown>[] }>(`/api/addresses/${id}`);
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Delete Address Error:', error);
            throw error;
        }
    },

    refreshToken: async (): Promise<{ success: boolean }> => {
        try {
            const response = await api.post<{ success: boolean }>('/api/auth/refresh');
            return response.data;
        } catch (error: unknown) {
            devLog('Auth Service Refresh Token Error:', error);
            throw error;
        }
    }
};

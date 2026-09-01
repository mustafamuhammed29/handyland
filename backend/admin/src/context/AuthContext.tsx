import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface TwoFactorChallenge {
    challengeId: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ twoFactorRequired?: boolean; challengeId?: string } | void>;
    verify2FA: (otp: string) => Promise<void>;
    cancel2FA: () => Promise<void>;
    twoFactorChallenge: TwoFactorChallenge | null;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('adminUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('adminUser');
    });
    const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        // Listen for 401 Unauthorized events from api.ts
        const handleUnauthorized = () => {
            logout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = async (email: string, password: string): Promise<{ twoFactorRequired?: boolean; challengeId?: string } | void> => {
        try {
            setLoading(true);
            await api.get('/api/auth/csrf'); // maintain CSRF protection
            const response = await api.post('/api/auth/admin/login', { 
                email, 
                password 
            });
            
            // Read response data
            const data = response.data;
            
            if (data.twoFactorRequired && data.challengeId) {
                setTwoFactorChallenge({ challengeId: data.challengeId });
                return { twoFactorRequired: true, challengeId: data.challengeId };
            }
            
            if (data.success && data.user) {
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                setUser(data.user);
                setIsAuthenticated(true);
                setTwoFactorChallenge(null);
                return;
            }

            throw new Error('Invalid response from server');
        } catch (error: any) {
            // Ensure error message is shown to user
            const message = error?.response?.data?.message
                || error?.message
                || 'Login failed. Please try again.';
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const verify2FA = async (otp: string): Promise<void> => {
        if (!twoFactorChallenge?.challengeId) {
            throw new Error('No active 2FA challenge');
        }
        try {
            setLoading(true);
            await api.get('/api/auth/csrf');
            const response = await api.post('/api/auth/2fa/verify-login', {
                challengeId: twoFactorChallenge.challengeId,
                otp,
                appType: 'admin'
            });
            const data = response.data;
            if (data.success && data.user) {
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                setUser(data.user);
                setIsAuthenticated(true);
                setTwoFactorChallenge(null);
            } else {
                throw new Error(data.message || 'Verification failed');
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || '2FA verification failed';
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const cancel2FA = async (): Promise<void> => {
        if (twoFactorChallenge?.challengeId) {
            try {
                await api.post('/api/auth/2fa/cancel-login', { challengeId: twoFactorChallenge.challengeId });
            } catch (e) {
                // Ignore cancellation network errors
            }
        }
        setTwoFactorChallenge(null);
    };

    const logout = async () => {
        // Clear state SYNCHRONOUSLY to prevent redirect loops
        setUser(null);
        setIsAuthenticated(false);
        setTwoFactorChallenge(null);
        localStorage.removeItem('adminUser');

        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                verify2FA,
                cancel2FA,
                twoFactorChallenge,
                isAuthenticated,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

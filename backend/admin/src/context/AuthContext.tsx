import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
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

    const login = async (email: string, password: string): Promise<void> => {
        try {
            setLoading(true);
            await api.get('/api/auth/csrf'); // maintain CSRF protection
            const response = await api.post('/api/auth/admin/login', { 
                email, 
                password 
            });
            
            // Read admin directly from response
            const adminData = response.data?.admin || (response as any).admin;
            
            if (!adminData) {
                throw new Error('Invalid response from server');
            }
            
            setUser(adminData);
            setIsAuthenticated(true);
            localStorage.setItem('adminUser', JSON.stringify(adminData));
            // Store token for Socket.io auth (cross-origin — cookie not accessible)
            const token = response.data?.token || (response as any).token;
            if (token) sessionStorage.setItem('adminSocketToken', token);
            
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

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('adminUser');
            sessionStorage.removeItem('adminSocketToken');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
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

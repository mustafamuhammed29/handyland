import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    loginWithToken: (token: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    //  Refresh Token Function
    const refreshAccessToken = async (): Promise<boolean> => {
        try {
            const data = await authService.refreshToken();
            if (data?.token) {
                // FIXED: [Security root - removed localStorage.setItem('accessToken', ...)]
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };


    // Guard against React StrictMode double-invocation
    useEffect(() => {
        let ignore = false; // cleanup flag to cancel stale invocations

        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');

            if (!storedUser) {
                if (!ignore) setLoading(false);
                return;
            }

            try {
                const parsedUser = JSON.parse(storedUser);
                // Optimistically set user so ProtectedRoute doesn't flash to login
                if (!ignore) setUser(parsedUser);

                // Verify session with backend
                try {
                    const { user } = await authService.getMe();
                    if (!ignore) {
                        setUser(user);
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                } catch {
                    // Try refresh before giving up
                    const refreshed = await refreshAccessToken();
                    if (!ignore) {
                        if (refreshed) {
                            try {
                                const { user } = await authService.getMe();
                                setUser(user);
                                localStorage.setItem('user', JSON.stringify(user));
                            } catch {
                                setUser(null);
                                localStorage.removeItem('user');
                            }
                        } else {
                            setUser(null);
                            localStorage.removeItem('user');
                        }
                    }
                }
            } catch (parseError) {
                if (!ignore) {
                    setUser(null);
                    localStorage.removeItem('user');
                }
            }

            if (!ignore) setLoading(false);
        };

        initAuth();
        return () => { ignore = true; }; // cleanup: cancel stale invocation
    }, []);


    const loginWithToken = async (token: string) => {
        // FIXED: [Removed localStorage.setItem for accessToken]
        const { user: userData } = await authService.getMe();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const login = async (email: string, password: string) => {

        try {
            const data = await authService.login(email, password);

            if (data.success && data.user) {

                // FIXED: [Removed localStorage.setItem for accessToken and refreshToken to prevent XSS vulnerability]

                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);

                // Check if user was redirected from valuation flow
                const pendingQuote = sessionStorage.getItem('pendingValuationQuote');
                if (pendingQuote) {
                    try {
                        const { quoteData } = JSON.parse(pendingQuote);
                        if (quoteData?.quoteReference) {
                            // Don't clear here; SellDevice will clear after loading
                            navigate(`/sell/${quoteData.quoteReference}`, { replace: true });
                            return;
                        }
                    } catch {
                        sessionStorage.removeItem('pendingValuationQuote');
                    }
                }
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // FIXED: [Removed localStorage.removeItem for tokens as they are cleared server-side via cookies]

        authService.logout().catch(err => {
        });

        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, loginWithToken, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

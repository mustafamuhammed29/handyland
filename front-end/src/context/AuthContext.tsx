import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';
import i18n from '../i18n';
import { api } from '../utils/api';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string, redirectTo?: string) => Promise<void>;
    loginWithToken: (token: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSafeUserForStorage = (user: User) => ({
    id: user.id || (user as any)._id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    isLoggedIn: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = sessionStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Sync preferred language
    useEffect(() => {
        if (user && user.preferredLanguage && i18n.language !== user.preferredLanguage) {
            i18n.changeLanguage(user.preferredLanguage).then(() => {
                localStorage.setItem('handyland_lang', user.preferredLanguage!);
                document.documentElement.dir = (user.preferredLanguage === 'ar' || user.preferredLanguage === 'fa') ? 'rtl' : 'ltr';
                document.documentElement.lang = user.preferredLanguage!;
            });
        }
    }, [user?.preferredLanguage]);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        try {
            await authService.refreshToken();
            return true;
        } catch (error) {
            return false;
        }
    }, []);


    // Guard against React StrictMode double-invocation
    useEffect(() => {
        let ignore = false; // cleanup flag to cancel stale invocations

        const initAuth = async () => {
            const storedUser = sessionStorage.getItem('user');

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
                sessionStorage.setItem('user', JSON.stringify(getSafeUserForStorage(user)));
                    }
                } catch {
                    // Try refresh before giving up
                    const refreshed = await refreshAccessToken();
                    if (!ignore) {
                        if (refreshed) {
                            try {
                                const { user } = await authService.getMe();
                                setUser(user);
                        sessionStorage.setItem('user', JSON.stringify(getSafeUserForStorage(user)));
                            } catch {
                                setUser(null);
                                sessionStorage.removeItem('user');
                            }
                        } else {
                            setUser(null);
                            sessionStorage.removeItem('user');
                        }
                    }
                }
            } catch (parseError) {
                if (!ignore) {
                    setUser(null);
                    sessionStorage.removeItem('user');
                }
            }

            if (!ignore) setLoading(false);
        };

        initAuth();
        return () => { ignore = true; }; // cleanup: cancel stale invocation
    }, []);


    // FIXED: Added error handling to loginWithToken (FIX 11)
    const loginWithToken = useCallback(async (token: string) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const { user: userData } = await authService.getMe();
            sessionStorage.setItem('user', JSON.stringify(getSafeUserForStorage(userData)));
            setUser(userData);
        } catch (error) {
            setUser(null);
            sessionStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            throw new Error('Social login failed. Please try again.');
        }
    }, []);

    const login = useCallback(async (email: string, password: string, redirectTo?: string) => {

        try {
            const data = await authService.login(email, password);

            if (data.success && data.user) {

                // FIXED: [Removed localStorage.setItem for accessToken and refreshToken to prevent XSS vulnerability]

                sessionStorage.setItem('user', JSON.stringify(getSafeUserForStorage(data.user)));
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
                if (redirectTo) {
                    navigate(redirectTo, { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            throw error;
        }
    }, [navigate]);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('user');
        // FIXED: [Removed localStorage.removeItem for tokens as they are cleared server-side via cookies]

        authService.logout().catch(err => {
        });

        navigate('/login');
    }, [navigate]);

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

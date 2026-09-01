import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';
import { useLang } from './LanguageContext';
import { api } from '../utils/api';

export interface TwoFactorChallenge {
    challengeId: string;
    redirectTo?: string;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string, redirectTo?: string) => Promise<{ twoFactorRequired?: boolean; challengeId?: string } | void>;
    loginWithToken: (token: string) => Promise<void>;
    verify2FA: (otp: string) => Promise<void>;
    cancel2FA: () => Promise<void>;
    twoFactorChallenge: TwoFactorChallenge | null;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    isVerified: boolean; // true only after backend confirmation via getMe()
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSafeUserForStorage = (user: User) => ({
    id: user.id || (user as any)._id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    addresses: user.addresses || [],
    isLoggedIn: true,
});

const migrateLegacySession = () => {
    try {
        const legacy = sessionStorage.getItem('user');
        if (legacy && !localStorage.getItem('user')) {
            localStorage.setItem('user', legacy);
            sessionStorage.removeItem('user');
        }
    } catch (e) {
        console.error("Session migration failed", e);
    }
};

migrateLegacySession();

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
    // isVerified: only becomes true after the backend confirms the session via getMe().
    // Until then, user data from sessionStorage must NOT be trusted for role-based rendering.
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);
    const navigate = useNavigate();

    const { setLang } = useLang();

    // Sync preferred language from DB -> App State when user logs in or is fetched
    useEffect(() => {
        if (user && user.preferredLanguage) {
            setLang(user.preferredLanguage as any);
        }
    }, [user?.preferredLanguage, setLang]);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        try {
            await authService.refreshToken();
            return true;
        } catch (error) {
            return false;
        }
    }, []);


    useEffect(() => {
        let ignore = false;

        const initAuth = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    if (!ignore) {
                        setUser(parsedUser);
                    }

                    try {
                        const { user } = await authService.getMe();
                        if (!ignore) {
                            setUser(user);
                            setIsVerified(true);
                            localStorage.setItem('user', JSON.stringify(getSafeUserForStorage(user)));
                        }
                    } catch (error: any) {
                        if (ignore) return;
                        const isExpired = error?.response?.status === 401;
                        if (isExpired) {
                            const refreshed = await refreshAccessToken();
                            if (refreshed) {
                                try {
                                    const { user } = await authService.getMe();
                                    setUser(user);
                                    setIsVerified(true);
                                    localStorage.setItem('user', JSON.stringify(getSafeUserForStorage(user)));
                                } catch {
                                    setUser(null);
                                    setIsVerified(false);
                                    localStorage.removeItem('user');
                                }
                            } else {
                                setUser(null);
                                setIsVerified(false);
                                localStorage.removeItem('user');
                            }
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
        return () => { ignore = true; };
    }, [refreshAccessToken]);


    const loginWithToken = useCallback(async (token: string) => {
        try {
            const { user: userData } = await authService.getMe({
                'Authorization': `Bearer ${token}`
            });
            localStorage.setItem('user', JSON.stringify(getSafeUserForStorage(userData)));
            setUser(userData);
            setIsVerified(true);
        } catch (error) {
            setUser(null);
            setIsVerified(false);
            localStorage.removeItem('user');
            throw new Error('Social login failed. Please try again.');
        }
    }, []);

    const completeLogin = useCallback((userData: User, redirectTo?: string) => {
        localStorage.setItem('user', JSON.stringify(getSafeUserForStorage(userData)));
        setUser(userData);
        setIsVerified(true);
        setTwoFactorChallenge(null);

        const pendingQuote = sessionStorage.getItem('pendingValuationQuote');
        if (pendingQuote) {
            try {
                const { quoteData } = JSON.parse(pendingQuote);
                if (quoteData?.quoteReference) {
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
    }, [navigate]);

    const login = useCallback(async (email: string, password: string, redirectTo?: string) => {
        try {
            const data = await authService.login(email, password);

            if (data.twoFactorRequired && data.challengeId) {
                setTwoFactorChallenge({
                    challengeId: data.challengeId,
                    redirectTo
                });
                return { twoFactorRequired: true, challengeId: data.challengeId };
            }

            if (data.success && data.user) {
                completeLogin(data.user, redirectTo);
                return;
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            throw error;
        }
    }, [completeLogin]);

    const verify2FA = useCallback(async (otp: string) => {
        if (!twoFactorChallenge?.challengeId) {
            throw new Error('No active 2FA challenge');
        }
        try {
            const data = await authService.verify2FALogin(twoFactorChallenge.challengeId, otp, 'frontend');
            if (data.success && data.user) {
                completeLogin(data.user, twoFactorChallenge.redirectTo);
            } else {
                throw new Error('2FA verification failed');
            }
        } catch (error) {
            throw error;
        }
    }, [twoFactorChallenge, completeLogin]);

    const cancel2FA = useCallback(async () => {
        if (twoFactorChallenge?.challengeId) {
            await authService.cancel2FALogin(twoFactorChallenge.challengeId);
        }
        setTwoFactorChallenge(null);
    }, [twoFactorChallenge]);

    const logout = useCallback(() => {
        // Call the API in the background (fire-and-forget is fine, but we can wait or handle it)
        authService.logout().catch(() => {});
        
        // Clear state and navigate cleanly
        localStorage.removeItem('user');
        setIsVerified(false);
        setUser(null);
        
        // Let the ProtectedRoute navigate, or if on a public page, go to /login
        const protectedPaths = ['/dashboard', '/checkout', '/orders'];
        const isProtected = protectedPaths.some(path => window.location.pathname.startsWith(path));
        if (!isProtected) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <AuthContext.Provider value={{ user, setUser, login, loginWithToken, logout, isAuthenticated: !!user, loading, isVerified }}>
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

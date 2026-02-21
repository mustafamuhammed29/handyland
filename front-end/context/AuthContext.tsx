import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    //  Refresh Token Function
    const refreshAccessToken = async (): Promise<boolean> => {
        try {
            const data = await authService.refreshToken();
            if (data?.token) {
                localStorage.setItem('accessToken', data.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ [AuthContext] Token refresh failed:', error);
            return false;
        }
    };


    // Guard against React StrictMode double-invocation
    useEffect(() => {
        let ignore = false; // cleanup flag to cancel stale invocations

        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('accessToken');

            if (!storedUser && !storedToken) {
                if (!ignore) setLoading(false);
                return;
            }

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    // ✅ Optimistically set user so ProtectedRoute doesn't flash to login
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
                                    localStorage.removeItem('accessToken');
                                    localStorage.removeItem('refreshToken');
                                }
                            } else {
                                setUser(null);
                                localStorage.removeItem('user');
                                localStorage.removeItem('accessToken');
                                localStorage.removeItem('refreshToken');
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('❌ [AuthContext] Failed to parse stored user:', parseError);
                    if (!ignore) {
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                }
            }

            if (!ignore) setLoading(false);
        };

        initAuth();
        return () => { ignore = true; }; // cleanup: cancel stale invocation
    }, []);


    const login = async (email: string, password: string) => {
        console.log('🔑 [AuthContext] Login attempt:', email);

        try {
            const data = await authService.login(email, password);

            if (data.success && data.user) {
                console.log('✅ [AuthContext] Login successful:', data.user.email);
                console.log('💾 [AuthContext] Saving user to localStorage');

                // Hybrid Auth: Store tokens in localStorage as fallback
                if (data.token) localStorage.setItem('accessToken', data.token);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);

                console.log('🔄 [AuthContext] Navigating to dashboard...');
                navigate('/dashboard', { replace: true });
            } else {
                console.error('❌ [AuthContext] Login failed: No user data');
                throw new Error('Login failed');
            }
        } catch (error) {
            console.error('❌ [AuthContext] Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('🚪 [AuthContext] Logging out...');
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        authService.logout().catch(err => {
            console.error('❌ [AuthContext] Logout API error:', err);
        });

        navigate('/login');
        console.log('✅ [AuthContext] Logout complete');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user, loading }}>
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

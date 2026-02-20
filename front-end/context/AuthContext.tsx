import React, { createContext, useContext, useState, useEffect } from 'react';
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


    // ✅ FIXED: Silent cleanup to prevent infinite loops
    useEffect(() => {
        const initAuth = async () => {
            console.log('🔐 [AuthContext] Initializing authentication...');

            const storedUser = localStorage.getItem('user');
            console.log('👤 [AuthContext] Stored user:', storedUser ? 'Found' : 'Not found');

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('📝 [AuthContext] Parsed user:', parsedUser.email);

                    // Verify session with backend
                    try {
                        console.log('🔄 [AuthContext] Verifying session with backend...');
                        const { user } = await authService.getMe();
                        console.log('✅ [AuthContext] Session valid:', user.email);
                        setUser(user);
                        localStorage.setItem('user', JSON.stringify(user));
                    } catch (error) {
                        console.error('❌ [AuthContext] Session verification failed:', error);

                        // ✅ CRITICAL FIX: Silent cleanup WITHOUT calling logout()
                        setUser(null);
                        localStorage.removeItem('user');
                        // ⚠️ DO NOT call logout() here - it causes redirect loop
                    }
                } catch (error) {
                    console.error('❌ [AuthContext] Failed to parse stored user:', error);

                    // ✅ Silent cleanup
                    setUser(null);
                    localStorage.removeItem('user');
                }
            }

            setLoading(false);
            console.log('🏁 [AuthContext] Initialization complete');
        };

        initAuth();
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

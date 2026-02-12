import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    //  Refresh Token Function
    const refreshAccessToken = async () => {
        try {
            // Must include credentials to send cookies
            const response = await fetch('/api/auth/refresh', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Important
            });

            if (response.ok) {
                // New access token is now in httpOnly cookie
                console.log("Token refreshed successfully");
                return true;
            } else {
                // If refresh fails (e.g. 403), logout user
                if (response.status === 403 || response.status === 401) {
                    console.log("Refresh token expired or invalid");
                    logout();
                }
            }
        } catch (error) {
            console.error("Failed to refresh token", error);
        }
        return false;
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
            }
        }

        // Setup Interval for Token Refresh (every 4 minutes to be safe before 15m expiry)
        const intervalId = setInterval(() => {
            // If user is logged in, refresh token periodically
            const user = localStorage.getItem('user');
            if (user) {
                refreshAccessToken();
            }
        }, 4 * 60 * 1000); // 4 minutes

        return () => clearInterval(intervalId);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed');
        }
        // Token is now in httpOnly cookie, no need to store it
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // Call backend logout to clear httpOnly cookies
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(err => console.error(err));
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user }}>
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

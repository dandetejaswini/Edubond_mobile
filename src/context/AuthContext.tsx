import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authApi } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Normalize user data: backend may return `id` instead of `_id`
    const normalizeUser = (userData: any): User => ({
        ...userData,
        _id: userData._id || userData.id,
    });

    const checkAuth = async () => {
        try {
            const savedToken = await storage.getToken();
            const savedUser = await storage.getUser();

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(normalizeUser(savedUser));
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response: any = await authApi.login({ email, password });

            if (response.token && response.user) {
                const { token: authToken, user: rawUser } = response;
                const userData = normalizeUser(rawUser);

                // Save to storage
                await storage.setToken(authToken);
                await storage.setUser(userData);

                // Update state
                setToken(authToken);
                setUser(userData);
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (data: any) => {
        try {
            const response: any = await authApi.register(data);

            if (response.token && response.user) {
                const { token: authToken, user: rawUser } = response;
                const userData = normalizeUser(rawUser);

                // Save to storage
                await storage.setToken(authToken);
                await storage.setUser(userData);

                // Update state
                setToken(authToken);
                setUser(userData);
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Clear storage
            await storage.clearAll();

            // Clear state
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        try {
            const updatedUser = user ? { ...user, ...updates } : null;
            if (updatedUser) {
                await storage.setUser(updatedUser);
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Update user error:', error);
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

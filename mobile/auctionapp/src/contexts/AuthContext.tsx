import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import ErrorHandler, { ErrorType } from '../utils/errorHandler';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from storage on mount
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Optionally verify token is still valid
        await refreshUser();
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem('token', newToken),
        AsyncStorage.setItem('user', JSON.stringify(userData)),
      ]);

      setToken(newToken);
      setUser(userData);
    } catch (error) {
      await ErrorHandler.handleError(error, true);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear storage
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
      ]);

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      // Update storage
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get('/api/users/me');
      const userData = response.data?.data || response.data;
      
      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      // If token is invalid, logout
      if (ErrorHandler.parseError(error).type === ErrorType.AUTHENTICATION) {
        await logout();
      }
    }
  }, [token, logout]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


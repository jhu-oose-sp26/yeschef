import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, signup as apiSignup, resendConfirmation as apiResend } from '@/lib/api/auth';
import type { AuthResponse, AuthUser } from '@/lib/api/auth';
import { tokenStore } from './tokenStore';

const TOKEN_KEY = 'yeschef_access_token';
const USER_KEY = 'yeschef_user';

// expo-secure-store is not available on web — fall back to localStorage
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for 401 responses from any API call and clear the session
  useEffect(() => {
    function handleUnauthorized() {
      tokenStore.set(null);
      setToken(null);
      setUser(null);
      storage.deleteItem(TOKEN_KEY).catch(() => {});
      storage.deleteItem(USER_KEY).catch(() => {});
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Restore persisted session on app start
  useEffect(() => {
    async function restore() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          tokenStore.set(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch {
        // ignore errors — user will land on login
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const persistAuth = useCallback(async (res: AuthResponse) => {
    tokenStore.set(res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    await Promise.all([
      storage.setItem(TOKEN_KEY, res.accessToken),
      storage.setItem(USER_KEY, JSON.stringify(res.user)),
    ]);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      await persistAuth(res);
    },
    [persistAuth],
  );

  const signup = useCallback(
    async (email: string, password: string, username: string): Promise<void> => {
      // Signup always requires email confirmation — no session is returned
      await apiSignup(email, password, username);
    },
    [],
  );

  const resendConfirmation = useCallback(
    async (email: string): Promise<void> => {
      await apiResend(email);
    },
    [],
  );

  const logout = useCallback(async () => {
    tokenStore.set(null);
    setToken(null);
    setUser(null);
    await Promise.all([
      storage.deleteItem(TOKEN_KEY),
      storage.deleteItem(USER_KEY),
    ]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, resendConfirmation, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSession, setSession, encodeSessionToken } from '../services/dataStore';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'officer' | 'admin';
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      const sessionToken = encodeSessionToken(session);
      setToken(sessionToken);
      setUser({
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      });
      api.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; role: string; user: User }>('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    setSession({
      userId: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    setSession(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

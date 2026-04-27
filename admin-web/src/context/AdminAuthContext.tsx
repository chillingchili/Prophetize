import React, { useState, useEffect, createContext, useContext } from 'react';
import { apiPost, registerClearAuth } from '../lib/http';

type AdminUser = { id: string; email: string; username: string; avatar_url?: string; balance?: number; created_at?: string };

type AdminAuthContextType = {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuth: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    registerClearAuth(clearAuth);
    const stored = localStorage.getItem('admin_access_token');
    const storedUser = localStorage.getItem('admin_user');
    if (stored) setToken(stored);
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiPost<{ user: AdminUser; session: { access_token: string; refresh_token: string } }>('/auth/login', { email, password });
    localStorage.setItem('admin_access_token', res.session.access_token);
    localStorage.setItem('admin_refresh_token', res.session.refresh_token);
    localStorage.setItem('admin_user', JSON.stringify(res.user));
    setToken(res.session.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  const clearAuth = logout;

  return (
    <AdminAuthContext.Provider value={{ user, token, isLoading, isAuthed: !!token, login, logout, clearAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

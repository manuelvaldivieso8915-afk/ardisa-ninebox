import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ardisa_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('ardisa_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ardisa_theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('ardisa_token');
    if (token) {
      authAPI.me()
        .then((u) => setUser(u))
        .catch(() => { localStorage.removeItem('ardisa_token'); localStorage.removeItem('ardisa_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: u } = await authAPI.login(credentials);
    localStorage.setItem('ardisa_token', token);
    localStorage.setItem('ardisa_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ardisa_token');
    localStorage.removeItem('ardisa_user');
    setUser(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, theme, toggleTheme, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

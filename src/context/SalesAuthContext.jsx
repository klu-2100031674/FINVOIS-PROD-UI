import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { salesLogin, getSalesMe } from '../services/salesService';

const SALES_TOKEN_KEY = 'sales_token';

const SalesAuthContext = createContext(null);

export const SalesAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(SALES_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    getSalesMe()
      .then((res) => setUser(res.data.user || res.data))
      .catch(() => localStorage.removeItem(SALES_TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await salesLogin(email, password);
    const { token, user: userData } = res.data;
    localStorage.setItem(SALES_TOKEN_KEY, token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SALES_TOKEN_KEY);
    setUser(null);
  }, []);

  const isManager = user?.role === 'manager';
  const isExecutive = user?.role === 'executive';

  return (
    <SalesAuthContext.Provider value={{ user, loading, login, logout, isManager, isExecutive }}>
      {children}
    </SalesAuthContext.Provider>
  );
};

export const useSalesAuth = () => {
  const ctx = useContext(SalesAuthContext);
  if (!ctx) throw new Error('useSalesAuth must be used within SalesAuthProvider');
  return ctx;
};

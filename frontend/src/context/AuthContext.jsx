import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Check login status on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Set base headers for validation pings
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await apiClient.get('/users/me');
          setUser(res.data);
        } catch (err) {
          console.error('Initial auth validation failed:', err);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const accessToken = res.data.access_token;
      
      localStorage.setItem('token', accessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setToken(accessToken);
      
      // Fetch user profile
      const userRes = await apiClient.get('/users/me');
      setUser(userRes.data);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Authentication failed';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (email, password) => {
    try {
      await apiClient.post('/auth/register', { email, password });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

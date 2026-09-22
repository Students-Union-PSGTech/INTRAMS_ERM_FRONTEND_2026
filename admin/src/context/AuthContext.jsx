import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear any persistent legacy localStorage tokens to ensure session resets on browser close
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    const storedUser = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');

    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({ ...parsed, role: role || parsed.role || 'admin' });
      } catch (e) {
        sessionStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await adminAPI.login({ username, password });
      const data = res.data;
      if (data.token) {
        const userData = data.user || data.admin || { username, role: data.role || 'admin' };
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('refreshToken', data.refreshToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('role', userData.role || 'admin');
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Server error',
      };
    }
  };

  const logout = async () => {
    try {
      await adminAPI.logout();
    } catch (_) {
      // Clear local credentials even if the API is unavailable.
    }
    sessionStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      await adminAPI.forgotPassword(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const resetPassword = async (payload) => {
    try {
      await adminAPI.resetPassword(payload);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    const token = localStorage.getItem('userToken');
    const restore = async () => {
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          await userAPI.getProfile();
        } catch (_) {
          localStorage.removeItem('userData');
          localStorage.removeItem('userToken');
          localStorage.removeItem('userRefreshToken');
          setUser(null);
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await userAPI.login({ username, password });
      const data = response.data;
      if (data.token) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRefreshToken', data.refreshToken);
        localStorage.setItem('userData', JSON.stringify(data.user || { username }));
        setUser(data.user || { username });
        return { success: true };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Server connection error',
      };
    }
  };

  const logout = async () => {
    try {
      await userAPI.logout();
    } catch (_) {
      // Clearing local credentials is still required if the network is unavailable.
    }
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRefreshToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

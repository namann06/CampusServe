import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cs_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cs_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('cs_token', token);
    } else {
      localStorage.removeItem('cs_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cs_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;
      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Authentication failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post('/auth/register', userData);
      const { token: jwtToken, user: newUser } = response.data;
      setToken(jwtToken);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const msg = err.response?.data?.message || (err.response?.data?.data && Object.values(err.response.data.data).join(', ')) || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleType) => {
    let email = 'resident@test.com';
    if (roleType === 'provider') email = 'provider@test.com';
    else if (roleType === 'admin') email = 'admin@test.com';
    else if (roleType === 'peer') email = 'peer@test.com';

    return await login(email, 'password123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        setError,
        login,
        register,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

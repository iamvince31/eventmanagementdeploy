import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, userFromOtp = null, tokenFromOtp = null) => {
    // If called from OTP verification, use provided user and token
    if (userFromOtp && tokenFromOtp) {
      localStorage.setItem('token', tokenFromOtp);
      localStorage.setItem('user', JSON.stringify(userFromOtp));
      setUser(userFromOtp);
      return { user: userFromOtp, token: tokenFromOtp };
    }

    // Normal login flow
    const response = await api.post('/login', { email, password });
    
    // Check if email verification is required
    if (response.data.requires_verification) {
      return response.data;
    }
    
    // Check if 2FA is required
    if (response.data.requires_otp) {
      // Return the response data for handling in the component
      return response.data;
    }
    
    // Normal login success
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return response.data;
  };

  const register = async (username, email, password, department) => {
    const response = await api.post('/register', { username, email, password, department });
    // Don't automatically log the user in - just return the response
    // User will need to login manually
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  };

  const resetPassword = async (email, token, password, passwordConfirmation) => {
    const response = await api.post('/reset-password', {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, forgotPassword, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

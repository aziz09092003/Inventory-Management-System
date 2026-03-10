import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, voiceAuthAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const token = localStorage.getItem('ims_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('ims_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // credentials: { username, password } — username field contains email
    const res = await authAPI.login(credentials);
    // Fetch user list to get current user info by email
    const usersRes = await authAPI.getUsers();
    const currentUser = usersRes.data.find(
      (u) => u.email?.toLowerCase() === credentials.username?.toLowerCase() ||
             u.username?.toLowerCase() === credentials.username?.toLowerCase()
    );
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    authAPI.logout();
  };

  const register = async (payload) => {
    // payload: { username, email, password }
    const res = await authAPI.register(payload);
    return res;
  };

  const registerVoice = async (voiceData) => {
    if (!user) {
      return { success: false, message: 'User must be logged in to register voice' };
    }
    try {
      await voiceAuthAPI.saveVoiceSamples({
        email: user.email,
        samples: voiceData.samples,
      });
      const updatedUser = { ...user, voiceRegistered: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, message: 'Voice registered successfully' };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Voice registration failed' };
    }
  };

  const loginWithVoice = async (voiceData) => {
    // voiceData: { email, audio_base64 }
    try {
      const res = await voiceAuthAPI.loginWithVoice({
        email: voiceData.email,
        audio_base64: voiceData.audio_base64,
      });
      // Fetch user info after voice login
      const usersRes = await authAPI.getUsers();
      const currentUser = usersRes.data.find(
        (u) => u.email === voiceData.email
      );
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      return { success: true, message: 'Voice login successful' };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Voice not recognized' };
    }
  };

  const hasVoiceRegistered = () => {
    if (!user) return false;
    return !!user.voiceRegistered;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      registerVoice, 
      loginWithVoice, 
      hasVoiceRegistered,
      loading 
    }}>
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

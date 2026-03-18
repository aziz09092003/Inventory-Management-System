import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, voiceAuthAPI } from '../services/api';
import { beginGuestSession, endGuestSession, getGuestUser, isGuestModeEnabled } from '../services/guestDemo';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuestModeEnabled()) {
      setUser(getGuestUser());
      setLoading(false);
      return;
    }

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
    } else {
      // Default experience: enter guest mode if no authenticated session exists.
      const guest = beginGuestSession();
      setUser(guest);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    endGuestSession();
    // credentials: { username, password } — username field contains email
    const res = await authAPI.login(credentials);

    // Do not block UI on profile lookup; login should complete as soon as token is issued.
    const optimisticUser = {
      user_id: null,
      username: (credentials.username || '').split('@')[0] || 'User',
      email: credentials.username || '',
      isGuest: false,
    };
    setUser(optimisticUser);
    localStorage.setItem('user', JSON.stringify(optimisticUser));

    try {
      const meRes = await Promise.race([
        authAPI.getMe(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)),
      ]);
      const currentUser = meRes?.data;
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch {
      // Keep optimistic user session if profile endpoint is slow/unavailable.
    }

    return res;
  };

  const logout = () => {
    endGuestSession();
    authAPI.logout();
    const guest = beginGuestSession();
    setUser(guest);
  };

  const loginAsGuest = () => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('user');
    const guest = beginGuestSession();
    setUser(guest);
    return { data: { guest: true } };
  };

  const register = async (payload) => {
    endGuestSession();
    // payload: { username, email, password }
    const res = await authAPI.register(payload);
    return res;
  };

  const updateProfile = async (payload) => {
    if (!user) {
      return { success: false, message: 'No active user session' };
    }

    if (!user?.isGuest && !user?.user_id) {
      return { success: false, message: 'User profile is still loading. Please try again in a moment.' };
    }

    try {
      const res = await authAPI.updateProfile(user.user_id, payload);
      const mergedUser = {
        ...user,
        ...(res?.data || {}),
        username: res?.data?.username || payload?.username || user.username,
        email: res?.data?.email || payload?.email || user.email,
      };

      setUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));

      return { success: true, data: mergedUser };
    } catch (error) {
      return { success: false, message: error?.response?.data?.detail || 'Failed to update profile' };
    }
  };

  const registerVoice = async (voiceData) => {
    if (!user) {
      return { success: false, message: 'User must be logged in to register voice' };
    }
    if (user?.isGuest) {
      return { success: false, message: 'Voice registration is not available in guest mode' };
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
    endGuestSession();
    // voiceData: { email, audio_base64 }
    try {
      const res = await voiceAuthAPI.loginWithVoice({
        email: voiceData.email,
        audio_base64: voiceData.audio_base64,
      });

      const optimisticUser = {
        user_id: null,
        username: (voiceData.email || '').split('@')[0] || 'User',
        email: voiceData.email || '',
        isGuest: false,
      };
      setUser(optimisticUser);
      localStorage.setItem('user', JSON.stringify(optimisticUser));

      try {
        const meRes = await Promise.race([
          authAPI.getMe(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)),
        ]);
        const currentUser = meRes?.data;
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch {
        // Keep optimistic user session if profile endpoint is slow/unavailable.
      }

      return { success: true, message: 'Voice login successful' };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Voice not recognized' };
    }
  };

  const hasVoiceRegistered = () => {
    if (!user) return false;
    if (user?.isGuest) return false;
    return !!user.voiceRegistered;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loginAsGuest,
      register, 
      updateProfile,
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

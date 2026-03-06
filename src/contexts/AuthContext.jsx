import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const register = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const registerVoice = (voiceData) => {
    if (!user) {
      return { success: false, message: 'User must be logged in to register voice' };
    }

    // Get all voice registrations
    const voiceRegistrations = JSON.parse(localStorage.getItem('voice_registrations') || '{}');
    
    // Save voice data for current user
    voiceRegistrations[user.username] = {
      voiceData: voiceData,
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem('voice_registrations', JSON.stringify(voiceRegistrations));

    // Update user object
    const updatedUser = { ...user, voiceRegistered: true };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return { success: true, message: 'Voice registered successfully' };
  };

  const loginWithVoice = (voiceData) => {
    // Get all voice registrations
    const voiceRegistrations = JSON.parse(localStorage.getItem('voice_registrations') || '{}');
    
    // Simple voice matching (in real app, use ML/AI for voice recognition)
    // For demo, we'll match based on timing pattern
    for (const [username, registration] of Object.entries(voiceRegistrations)) {
      // Simulate voice matching (in production, use actual voice comparison)
      const timeDiff = Math.abs(voiceData.timestamp - registration.voiceData.timestamp);
      if (timeDiff < 10000) { // Within 10 seconds range (demo matching)
        // Get user details
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const userData = users.find(u => u.username === username);
        
        if (userData) {
          login({ username: userData.username, email: userData.email, voiceRegistered: true });
          return { success: true, message: 'Voice login successful' };
        }
      }
    }

    return { success: false, message: 'Voice not recognized. Please register your voice first.' };
  };

  const hasVoiceRegistered = () => {
    if (!user) return false;
    const voiceRegistrations = JSON.parse(localStorage.getItem('voice_registrations') || '{}');
    return !!voiceRegistrations[user.username];
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

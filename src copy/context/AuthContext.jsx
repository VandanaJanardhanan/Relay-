import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  registerUser,
  signInUser,
  signOutUser,
  observeAuthState,
  signInWithGoogle,
  resetUserPassword,
} from '../services/authService';
import { isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInUser(email, password);
  };

  const signup = (email, password, displayName) => {
    return registerUser(email, password, displayName);
  };

  const loginWithGoogleProvider = () => {
    return signInWithGoogle();
  };

  const logout = () => {
    return signOutUser();
  };

  const resetPassword = (email) => {
    return resetUserPassword(email);
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured,
    login,
    signup,
    loginWithGoogle: loginWithGoogleProvider,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

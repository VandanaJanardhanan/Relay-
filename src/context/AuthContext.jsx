import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  registerUserAccount,
  signInUser,
  signOutUser,
  observeAuthState,
  signInWithGoogle,
  resetUserPassword,
  getUserRole,
} from '../services/authService';
import { isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authentication state & trusted role
  useEffect(() => {
    const unsubscribe = observeAuthState((user, role) => {
      setCurrentUser(user);
      setUserRole(role);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshRole = useCallback(async () => {
    if (currentUser) {
      const freshRole = await getUserRole(currentUser, true);
      setUserRole(freshRole);
      return freshRole;
    }
    return null;
  }, [currentUser]);

  const login = async (email, password) => {
    const result = await signInUser(email, password);
    setCurrentUser(result.user);
    setUserRole(result.role);
    return result;
  };

  const register = async ({ email, password, displayName, accountType, invitationCode }) => {
    const result = await registerUserAccount({
      email,
      password,
      displayName,
      accountType,
      invitationCode,
    });
    setCurrentUser(result.user);
    setUserRole(result.role);
    return result;
  };

  const loginWithGoogleProvider = async () => {
    const result = await signInWithGoogle();
    setCurrentUser(result.user);
    setUserRole(result.role);
    return result;
  };

  const logout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserRole(null);
  };

  const resetPassword = (email) => {
    return resetUserPassword(email);
  };

  const value = {
    currentUser,
    userRole,
    isOrganizer: userRole === 'organizer',
    isVolunteer: userRole === 'volunteer',
    loading,
    isFirebaseConfigured,
    login,
    register,
    loginWithGoogle: loginWithGoogleProvider,
    logout,
    resetPassword,
    refreshRole,
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

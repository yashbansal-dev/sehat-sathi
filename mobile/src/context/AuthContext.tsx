import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleEmail?: string, googleName?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  baseUrl: string;
  setBaseUrl: (url: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkServerHealth: () => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrlState] = useState(mobileApi.getBaseUrl());

  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      setLoading(true);
      await mobileApi.init();
      setBaseUrlState(mobileApi.getBaseUrl());

      const savedToken = await AsyncStorage.getItem('sehat_token');
      const savedUserStr = await AsyncStorage.getItem('sehat_user');

      if (savedToken && savedUserStr) {
        setToken(savedToken);
        setUser(JSON.parse(savedUserStr));
        mobileApi.setToken(savedToken);

        // Fetch fresh me in background
        try {
          const freshUser = await mobileApi.getMe();
          setUser(freshUser);
          await AsyncStorage.setItem('sehat_user', JSON.stringify(freshUser));
        } catch {
          // Token might be valid or offline
        }
      }
    } catch (e) {
      console.warn('Error reading stored session:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Try Firebase Authentication first
      try {
        const { signInWithEmailAndPassword, auth } = await import('../services/firebase');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const res = await mobileApi.firebaseLogin(
          fbUser.uid,
          fbUser.email || email,
          fbUser.displayName || email.split('@')[0],
          'patient'
        );
        setToken(res.access_token);
        setUser(res.user);
        return;
      } catch (fbErr: any) {
        // Fallback to direct local backend login if Firebase user not registered or offline
        console.log('Firebase auth notice, trying backend login:', fbErr.message);
      }

      // 2. Direct Backend Login
      const res = await mobileApi.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const res = await mobileApi.demoLogin();
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      // 1. Try Firebase Authentication registration
      try {
        const { createUserWithEmailAndPassword, updateProfile, auth, firebaseDb } = await import('../services/firebase');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        await updateProfile(fbUser, { displayName: fullName });
        await firebaseDb.saveUserProfile(fbUser.uid, {
          email,
          fullName,
          role: 'patient'
        });

        const res = await mobileApi.firebaseLogin(fbUser.uid, email, fullName, 'patient');
        setToken(res.access_token);
        setUser(res.user);
        return;
      } catch (fbErr: any) {
        console.log('Firebase register notice, trying backend register:', fbErr.message);
      }

      // 2. Direct Backend Registration
      const res = await mobileApi.register(email, password, fullName, 'patient');
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleEmail?: string, googleName?: string) => {
    setLoading(true);
    try {
      let fbUid: string;
      let finalEmail: string;
      let finalName: string;

      if (Platform.OS === 'web') {
        try {
          const { signInWithPopup, auth, googleProvider } = await import('../services/firebase');
          const res = await signInWithPopup(auth, googleProvider);
          const u = res.user;
          fbUid = u.uid;
          finalEmail = u.email || 'google.user@example.com';
          finalName = u.displayName || 'Google User';
        } catch (webErr: any) {
          if (webErr.code === 'auth/popup-closed-by-user') return;
          throw webErr;
        }
      } else {
        // Native mobile flow
        finalEmail = (googleEmail && googleEmail.trim()) || 'patient.google@sehatsathi.ai';
        finalName = (googleName && googleName.trim()) || 'Verified Google Patient';
        fbUid = `google_${finalEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      }

      // Save user profile to Cloud Firestore
      try {
        const { firebaseDb } = await import('../services/firebase');
        await firebaseDb.saveUserProfile(fbUid, {
          email: finalEmail,
          fullName: finalName,
          role: 'patient',
          authProvider: 'google'
        });
      } catch (fsErr) {
        console.warn('Firestore profile sync notice:', fsErr);
      }

      // Bridge to FastAPI backend session
      const res = await mobileApi.firebaseLogin(fbUid, finalEmail, finalName, 'patient');
      setToken(res.access_token);
      setUser(res.user);
    } catch (err: any) {
      throw new Error(err.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const checkServerHealth = async (): Promise<{ ok: boolean; message: string }> => {
    const res = await mobileApi.checkHealth();
    setBaseUrlState(mobileApi.getBaseUrl());
    return res;
  };

  const logout = async () => {
    try {
      const { firebaseSignOut, auth } = await import('../services/firebase');
      await firebaseSignOut(auth).catch(() => {});
    } catch {}
    await mobileApi.logout();
    setToken(null);
    setUser(null);
  };

  const setBaseUrl = async (url: string) => {
    await mobileApi.setBaseUrl(url);
    setBaseUrlState(mobileApi.getBaseUrl());
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const fresh = await mobileApi.getMe();
        setUser(fresh);
        await AsyncStorage.setItem('sehat_user', JSON.stringify(fresh));
      } catch (e) {
        console.warn('Failed to refresh user:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithGoogle,
      demoLogin,
      register,
      logout,
      baseUrl,
      setBaseUrl,
      refreshUser,
      checkServerHealth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

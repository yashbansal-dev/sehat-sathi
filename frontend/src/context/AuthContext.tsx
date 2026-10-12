import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { 
  auth, 
  googleProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  firebaseSignOut,
  updateProfile
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: string) => Promise<void>;
  loginWithGoogle: (role?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  demoDoctorLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('sehat_token');
    const savedUser = localStorage.getItem('sehat_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('sehat_user');
      }
    }
    setLoading(false);
  }, []);

  // Firebase Email/Password Sign In with Backend Session Bridge
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // 2. Synchronize session with Sehat Sathi backend
      const data = await api.firebaseLogin(
        fbUser.uid,
        fbUser.email || email,
        fbUser.displayName || undefined
      );

      localStorage.setItem('sehat_token', data.access_token);
      localStorage.setItem('sehat_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (firebaseErr: any) {
      // Format friendly error messages
      let msg = firebaseErr.message || 'Authentication failed.';
      if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password. Please try again.';
      } else if (firebaseErr.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please sign up first.';
      } else if (firebaseErr.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Firebase Email/Password Registration with Backend Bridge
  const register = async (email: string, password: string, fullName: string, role: string = 'patient') => {
    setLoading(true);
    try {
      // 1. Create User in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // 2. Set Display Name in Firebase
      await updateProfile(fbUser, { displayName: fullName });

      // 3. Register user and patient profile in backend database
      const data = await api.firebaseLogin(
        fbUser.uid,
        email,
        fullName,
        role
      );

      localStorage.setItem('sehat_token', data.access_token);
      localStorage.setItem('sehat_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (firebaseErr: any) {
      let msg = firebaseErr.message || 'Registration failed.';
      if (firebaseErr.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (firebaseErr.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Firebase Google Popup Sign-In
  const loginWithGoogle = async (role: string = 'patient') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const data = await api.firebaseLogin(
        fbUser.uid,
        fbUser.email || '',
        fbUser.displayName || undefined,
        role
      );

      localStorage.setItem('sehat_token', data.access_token);
      localStorage.setItem('sehat_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        throw new Error(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const data = await api.demoLogin();
      localStorage.setItem('sehat_token', data.access_token);
      localStorage.setItem('sehat_user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const demoDoctorLogin = async () => {
    setLoading(true);
    try {
      const data = await api.demoDoctorLogin();
      localStorage.setItem('sehat_token', data.access_token);
      localStorage.setItem('sehat_user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    firebaseSignOut(auth).catch(() => {});
    localStorage.removeItem('sehat_token');
    localStorage.removeItem('sehat_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      loginWithGoogle,
      demoLogin, 
      demoDoctorLogin, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

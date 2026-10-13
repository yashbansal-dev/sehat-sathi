import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  onValue
} from 'firebase/database';

// Project Firebase Configuration (Supports Environment Variables or Direct Config)
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyBy2yqgPlB16M-9QIW6xus-rDYWQAmcNmk",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "sehat-sathi-88156.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "sehat-sathi-88156",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "sehat-sathi-88156.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "983257312820",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:983257312820:web:09ddfd14207ab9a0316461",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-N45V5XLYWG"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore (Primary Database)
export const db = getFirestore(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Helper Services for Cloud Firestore Database Operations
export const firebaseDb = {
  /**
   * Save or update a patient user profile in Firestore
   */
  async saveUserProfile(userId: string, data: Record<string, any>) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...data,
        updated_at: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore saveUserProfile fallback:', err);
      return false;
    }
  },

  /**
   * Get a patient user profile from Firestore
   */
  async getUserProfile(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return null;
    } catch (err) {
      console.warn('Firestore getUserProfile fallback:', err);
      return null;
    }
  },

  /**
   * Sync today's pill tracking checklist in Firestore
   */
  async savePillTracking(userId: string, dateKey: string, pillsState: Record<string, boolean>) {
    try {
      const pillRef = doc(db, `users/${userId}/pill_schedules`, dateKey);
      await setDoc(pillRef, {
        pills: pillsState,
        updated_at: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore savePillTracking fallback:', err);
      return false;
    }
  },

  /**
   * Fetch today's pill tracking checklist from Firestore
   */
  async getPillTracking(userId: string, dateKey: string): Promise<Record<string, boolean> | null> {
    try {
      const pillRef = doc(db, `users/${userId}/pill_schedules`, dateKey);
      const snapshot = await getDoc(pillRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data?.pills || null;
      }
      return null;
    } catch (err) {
      console.warn('Firestore getPillTracking fallback:', err);
      return null;
    }
  },

  /**
   * Save patient health vital record
   */
  async recordVital(userId: string, vitalType: string, value: string | number, unit: string) {
    try {
      const vitalsCol = collection(db, `users/${userId}/vitals`);
      const res = await addDoc(vitalsCol, {
        vital_type: vitalType,
        value,
        unit,
        recorded_at: serverTimestamp()
      });
      return res.id;
    } catch (err) {
      console.warn('Firestore recordVital fallback:', err);
      return null;
    }
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  type FirebaseUser,
  // Firestore exports
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  // Realtime DB exports
  ref,
  set,
  get,
  child,
  onValue
};


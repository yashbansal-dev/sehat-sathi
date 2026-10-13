import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Project Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBy2yqgPlB16M-9QIW6xus-rDYWQAmcNmk",
  authDomain: "sehat-sathi-88156.firebaseapp.com",
  projectId: "sehat-sathi-88156",
  storageBucket: "sehat-sathi-88156.firebasestorage.app",
  messagingSenderId: "983257312820",
  appId: "1:983257312820:web:09ddfd14207ab9a0316461",
  measurementId: "G-N45V5XLYWG"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Helper Services for Cloud Firestore Database Operations
export const firebaseDb = {
  async saveUserProfile(userId: string, data: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch {
      return false;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  firebaseSignOut,
  signInWithPopup
};

export type { FirebaseUser };

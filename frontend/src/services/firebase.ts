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

// User-provided Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBy2yqgPlB16M-9QIW6xus-rDYWQAmcNmk",
  authDomain: "sehat-sathi-88156.firebaseapp.com",
  projectId: "sehat-sathi-88156",
  storageBucket: "sehat-sathi-88156.firebasestorage.app",
  messagingSenderId: "983257312820",
  appId: "1:983257312820:web:09ddfd14207ab9a0316461",
  measurementId: "G-N45V5XLYWG"
};

// Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  type FirebaseUser
};

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ----------------------------------------------------
// GOVILINK FIREBASE CONFIGURATION
// Project ID: govilink-d27ae
// ----------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBHCk0YRDlpLpj6xMQORUal-B6DsMU7YvA",
  authDomain: "govilink-d27ae.firebaseapp.com",
  projectId: "govilink-d27ae",
  storageBucket: "govilink-d27ae.firebasestorage.app",
  messagingSenderId: "637703769116",
  appId: "1:637703769116:web:154dcb11817bfa6d3aa3d9",
  measurementId: "G-7NTBHN1DSW"
};

// Initialize Firebase App singleton safely for React Native
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Long-Polling enabled (bypasses proxy/firewall WebSockets blocks)
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// Lazy auth getter to prevent top-level bundle evaluation component registration errors
let _auth = null;
export const getFirebaseAuth = () => {
  if (!_auth) {
    try {
      _auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      _auth = getAuth(app);
    }
  }
  return _auth;
};

export default app;

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// 1. App initialization (Singleton check)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Firestore initialization
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (_e) {
  db = getFirestore(app);
}

// 3. Auth initialization (Safe across Web and Native platforms)
let auth;
if (Platform.OS === 'web' || typeof getReactNativePersistence !== 'function') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (_e) {
    auth = getAuth(app);
  }
}

// 4. Storage initialization
const storage = getStorage(app);

export { app, db, auth, storage };
export default app;

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services for React Native
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;

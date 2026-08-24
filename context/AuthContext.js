import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getUserProfile, logoutUser } from '../services/firebaseDatabase';

// -------------------------------------------------------
// AUTH CONTEXT
// Provides: { firebaseUser, profile, loading, logout }
// -------------------------------------------------------

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = not yet determined
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires immediately with the persisted user (or null)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        // Fetch the Firestore profile
        const result = await getUserProfile(user.uid);
        if (result.success) {
          setProfile(result.profile);
        } else {
          // Profile missing — create a minimal safe profile so the app doesn't crash
          setProfile({
            uid: user.uid,
            email: user.email,
            fullName: '',
            phoneNumber: '',
            role: 'buyer',
          });
        }
      } else {
        setFirebaseUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutUser();
    // onAuthStateChanged will fire and reset firebaseUser / profile to null
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;

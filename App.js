import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from './components/SplashScreen';
import LanguageSelectionScreen from './components/LanguageSelectionScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import FarmerHomeScreen from './components/FarmerHomeScreen';
import BuyerHomeScreen from './components/BuyerHomeScreen';
import DriverHomeScreen from './components/DriverHomeScreen';
import AdminHomeScreen from './components/AdminHomeScreen';
import {
  subscribeToProduceListings,
  subscribeToOrders,
  logoutUser,
  getUserProfile,
} from './services/firebaseDatabase';
import { AuthProvider } from './context/AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Keep the native splash screen visible while JS resources are initializing
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reload or environment fallback */
});

// Helper: map Firestore role string & email to internal dashboard role
const mapRoleToDashboard = (role, email) => {
  if (email && email.toLowerCase() === 'govilink@admin.lk') {
    return 'admin';
  }
  switch (role) {
    case 'farmer': return 'farmer';
    case 'buyer': return 'buyer';
    case 'cooperative_admin': return 'admin';
    case 'admin': return 'admin';
    case 'driver': return 'driver';
    default: return 'buyer';
  }
};

function AppInner() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  // 'checking' while onAuthStateChanged runs, then 'language'|'login'|'register'|'authenticated'
  const [authScreen, setAuthScreen] = useState('checking');
  const [userProfile, setUserProfile] = useState(null);
  const [lang, setLang] = useState('en'); // 'en' | 'si' | 'ta'
  const [currentRole, setCurrentRole] = useState('buyer'); // 'buyer' | 'farmer' | 'admin' | 'driver'
  const [produceListings, setProduceListings] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  useEffect(() => {
    async function hideNativeSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Native splash already hidden or unavailable
      }
    }
    hideNativeSplash();

    // Subscribe to Firestore real-time produce collection
    const unsubscribeProduce = subscribeToProduceListings((items) => {
      if (items && items.length > 0) {
        setProduceListings(items);
      }
    });

    // Subscribe to Firestore real-time orders collection
    const unsubscribeOrders = subscribeToOrders((orders) => {
      if (orders) {
        setOrdersList(orders);
      }
    });

    // --------------------------------------------------------
    // AUTH STATE LISTENER — restores session on app restart
    // --------------------------------------------------------
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch their Firestore profile
        const result = await getUserProfile(firebaseUser.uid);
        if (result.success) {
          const profile = result.profile;
          setUserProfile(profile);
          setCurrentRole(mapRoleToDashboard(profile.role, profile.email));
          setAuthScreen('authenticated');
        } else {
          // Auth OK but no Firestore doc — fallback safe profile
          const fallbackProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || 'GoviLink User',
            role: 'buyer',
          };
          setUserProfile(fallbackProfile);
          setCurrentRole(mapRoleToDashboard(fallbackProfile.role, fallbackProfile.email));
          setAuthScreen('authenticated');
        }
      } else {
        // Not signed in
        setUserProfile(null);
        setAuthScreen('language');
      }
    });

    return () => {
      unsubscribeProduce();
      unsubscribeOrders();
      unsubscribeAuth();
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUserProfile(null);
    setCurrentRole('buyer');
    setAuthScreen('language');
  };

  if (isSplashVisible) {
    return <SplashScreenComponent onFinish={() => setIsSplashVisible(false)} />;
  }

  // While onAuthStateChanged is determining auth state, show a loading screen
  if (authScreen === 'checking') {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={styles.loadingText}>Loading GoviLink...</Text>
      </SafeAreaView>
    );
  }

  if (authScreen === 'language') {
    return (
      <LanguageSelectionScreen
        onSelectLanguage={(selectedLang) => {
          setLang(selectedLang);
          setAuthScreen('login');
        }}
      />
    );
  }

  if (authScreen === 'login') {
    return (
      <LoginScreen
        lang={lang}
        onBackToLang={() => setAuthScreen('language')}
        onNavigateToRegister={() => setAuthScreen('register')}
        onLoginSuccess={(profile) => {
          setUserProfile(profile);
          setCurrentRole(mapRoleToDashboard(profile?.role, profile?.email));
          setAuthScreen('authenticated');
        }}
      />
    );
  }

  if (authScreen === 'register') {
    return (
      <RegisterScreen
        lang={lang}
        onBack={() => setAuthScreen('login')}
        onNavigateToLogin={() => setAuthScreen('login')}
        onRegisterComplete={() => {
          setAuthScreen('login');
        }}
      />
    );
  }

  // Real produce list from Firestore
  const activeProduce = produceListings;

  // ----------------------------------------------------
  // ROLE-BASED HOMEPAGE ROUTING
  // ----------------------------------------------------
  if (currentRole === 'farmer') {
    return (
      <FarmerHomeScreen
        userProfile={userProfile}
        lang={lang}
        produceListings={activeProduce}
        ordersList={ordersList}
        onChangeLanguage={setLang}
        onLogout={handleLogout}
      />
    );
  }

  if (currentRole === 'driver') {
    return (
      <DriverHomeScreen
        userProfile={userProfile}
        lang={lang}
        ordersList={ordersList}
        onChangeLanguage={setLang}
        onLogout={handleLogout}
      />
    );
  }

  if (currentRole === 'admin') {
    return (
      <AdminHomeScreen
        userProfile={userProfile}
        lang={lang}
        produceListings={activeProduce}
        ordersList={ordersList}
        onChangeLanguage={setLang}
        onLogout={handleLogout}
      />
    );
  }

  // Default: Buyer Homepage
  return (
    <BuyerHomeScreen
      userProfile={userProfile}
      lang={lang}
      produceListings={activeProduce}
      ordersList={ordersList}
      onChangeLanguage={setLang}
      onLogout={handleLogout}
    />
  );
}

// -------------------------------------------------------
// ROOT EXPORT — wraps AppInner with AuthProvider & SafeAreaProvider
// -------------------------------------------------------
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B2545',
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#B0BEC5',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
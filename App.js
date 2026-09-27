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
  subscribeToAllVehicles,
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
  if (role === 'cooperative_admin' || role === 'admin') {
    return 'admin';
  }
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
  const [vehiclesList, setVehiclesList] = useState([]);

  useEffect(() => {
    async function hideNativeSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Native splash already hidden or unavailable
      }
    }
    hideNativeSplash();

    // Track Firestore subscriptions — all require authentication.
    // They are started only after onAuthStateChanged confirms a signed-in user
    // to avoid "Missing or insufficient permissions" errors.
    let unsubscribeProduce = null;
    let unsubscribeOrders = null;
    let unsubscribeVehicles = null;

    const startFirestoreSubscriptions = () => {
      if (!unsubscribeProduce) {
        unsubscribeProduce = subscribeToProduceListings((items) => {
          if (items) {
            setProduceListings(items);
          }
        });
      }
      if (!unsubscribeOrders) {
        unsubscribeOrders = subscribeToOrders((orders) => {
          if (orders) {
            setOrdersList(orders);
          }
        });
      }
      if (!unsubscribeVehicles) {
        unsubscribeVehicles = subscribeToAllVehicles((vehicles) => {
          if (vehicles) {
            setVehiclesList(vehicles);
          }
        });
      }
    };

    const stopFirestoreSubscriptions = () => {
      if (unsubscribeProduce) {
        unsubscribeProduce();
        unsubscribeProduce = null;
      }
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
      }
      if (unsubscribeVehicles) {
        unsubscribeVehicles();
        unsubscribeVehicles = null;
      }
    };

    // --------------------------------------------------------
    // AUTH STATE LISTENER — restores session on app restart
    // Firestore subscriptions only start AFTER auth is confirmed
    // to avoid "Missing or insufficient permissions" errors.
    // --------------------------------------------------------
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — start all Firestore subscriptions now
        startFirestoreSubscriptions();

        // Fetch their Firestore profile
        const result = await getUserProfile(firebaseUser.uid);
        if (result.success) {
          const profile = result.profile;
          setUserProfile(profile);
          setCurrentRole(mapRoleToDashboard(profile.role, profile.email));
          setAuthScreen('authenticated');
        } else {
          // Auth OK but no Firestore doc — use fallback safe profile
          const fallbackProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || 'GoviLink User',
            role: firebaseUser.email?.toLowerCase() === 'govilink@admin.lk' ? 'cooperative_admin' : 'buyer',
          };
          setUserProfile(fallbackProfile);
          setCurrentRole(mapRoleToDashboard(fallbackProfile.role, fallbackProfile.email));
          setAuthScreen('authenticated');
        }
      } else {
        // Not signed in — stop all Firestore subscriptions to prevent permission errors
        stopFirestoreSubscriptions();
        setProduceListings([]);
        setOrdersList([]);
        setVehiclesList([]);
        setUserProfile(null);
        setAuthScreen('language');
      }
    });

    return () => {
      stopFirestoreSubscriptions();
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

  const handleProfileUpdated = (updatedProfileData) => {
    setUserProfile((prev) => ({
      ...prev,
      ...updatedProfileData,
    }));
  };

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
        onProfileUpdated={handleProfileUpdated}
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
        onProfileUpdated={handleProfileUpdated}
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
        vehiclesList={vehiclesList}
        onChangeLanguage={setLang}
        onLogout={handleLogout}
        onProfileUpdated={handleProfileUpdated}
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
      onProfileUpdated={handleProfileUpdated}
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
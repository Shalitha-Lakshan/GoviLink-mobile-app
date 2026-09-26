import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage, changeAppLanguage } from './services/i18n';
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
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  // 'checking' while onAuthStateChanged runs, then 'language'|'login'|'register'|'authenticated'
  const [authScreen, setAuthScreen] = useState('checking');
  const [userProfile, setUserProfile] = useState(null);
  const [lang, setLang] = useState('en'); // 'en' | 'si' | 'ta'
  const [currentRole, setCurrentRole] = useState('buyer'); // 'buyer' | 'farmer' | 'admin' | 'driver'
  const [produceListings, setProduceListings] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);

  // Load saved language on mount
  useEffect(() => {
    async function initLanguage() {
      const savedLang = await loadSavedLanguage();
      setLang(savedLang);
    }
    initLanguage();
  }, []);

  const handleLanguageChange = async (newLang) => {
    await changeAppLanguage(newLang);
    setLang(newLang);
  };

  // Called by the custom SplashScreen once it has laid out and is visible.
  const handleCustomSplashLayout = useCallback(async () => {
    if (!nativeSplashHidden) {
      setNativeSplashHidden(true);
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Native splash already hidden or unavailable
      }
    }
  }, [nativeSplashHidden]);

  // Hide native splash on mount so custom animated splash screen displays on mobile Expo Go app
  useEffect(() => {
    async function hideNativeSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch (_e) {
        /* Already hidden or web mode */
      }
    }
    hideNativeSplash();
  }, []);

  useEffect(() => {
    let unsubscribeProduce = null;
    let unsubscribeOrders = null;
    let unsubscribeVehicles = null;

    const startFirestoreSubscriptions = () => {
      if (!unsubscribeProduce) {
        unsubscribeProduce = subscribeToProduceListings((items) => {
          if (items && items.length > 0) {
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
    // --------------------------------------------------------
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        startFirestoreSubscriptions();

        const result = await getUserProfile(firebaseUser.uid);
        if (result.success) {
          const profile = result.profile;
          setUserProfile(profile);
          setCurrentRole(mapRoleToDashboard(profile.role, profile.email));
          setAuthScreen('authenticated');
        } else {
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
    return (
      <SplashScreenComponent
        onFinish={() => setIsSplashVisible(false)}
        onLayout={handleCustomSplashLayout}
      />
    );
  }

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
        onSelectLanguage={async (selectedLang) => {
          await handleLanguageChange(selectedLang);
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

  const activeProduce = produceListings;

  const handleProfileUpdated = (updatedProfileData) => {
    setUserProfile((prev) => ({
      ...prev,
      ...updatedProfileData,
    }));
  };

  // ROLE-BASED HOMEPAGE ROUTING
  if (currentRole === 'farmer') {
    return (
      <FarmerHomeScreen
        userProfile={userProfile}
        lang={lang}
        produceListings={activeProduce}
        ordersList={ordersList}
        onChangeLanguage={handleLanguageChange}
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
        onChangeLanguage={handleLanguageChange}
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
        onChangeLanguage={handleLanguageChange}
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
      onChangeLanguage={handleLanguageChange}
      onLogout={handleLogout}
      onProfileUpdated={handleProfileUpdated}
    />
  );
}

// -------------------------------------------------------
// ROOT EXPORT — wraps AppInner with I18nextProvider & AuthProvider
// -------------------------------------------------------
export default function App() {
  return (
    <View style={styles.rootBackground}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider style={styles.rootBackground}>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </SafeAreaProvider>
      </I18nextProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  rootBackground: {
    flex: 1,
    backgroundColor: '#0B2545',
  },
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
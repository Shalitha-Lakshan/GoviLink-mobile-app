import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from './components/SplashScreen';
import LanguageSelectionScreen from './components/LanguageSelectionScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import {
  subscribeToProduceListings,
  placeOrderInFirestore,
  subscribeToOrders,
  addProduceListing,
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

// ----------------------------------------------------
// GOVILINK DESIGN SYSTEM & BRAND COLOR PALETTE
// ----------------------------------------------------
const COLORS = {
  navy: '#0B2545',          // "Govi" Primary Navy
  emerald: '#1E824C',       // "Link" Primary Emerald Green
  emeraldLight: '#E8F5E9',  // Light Green Soft Surface
  accentLeaf: '#2ECC71',     // Vibrant Leaf Accent
  background: '#F4F7F6',     // Clean Neutral Background
  cardBg: '#FFFFFF',         // Crisp White Cards
  textPrimary: '#0A2540',    // Main Typography
  textSecondary: '#627D98',  // Secondary Subtitles
  border: '#E2E8F0',         // Soft Dividers
  warning: '#F39C12',        // Pending Badges
  danger: '#E74C3C',         // Alert Badges
};

// ----------------------------------------------------
// LOCALIZATION DICTIONARIES (EN / SI / TA)
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    title: 'GoviLink',
    tagline: 'Smart Agricultural Marketplace & Logistics',
    searchPlaceholder: 'Search fresh produce, location, or farmer...',
    roles: {
      buyer: 'Buyer 🛒',
      farmer: 'Farmer 🧑‍🌾',
      driver: 'Driver 🚛',
    },
    categories: ['All', 'Vegetables', 'Fruits', 'Rice & Grains', 'Spices'],
    currency: 'Rs.',
    perUnit: 'per',
    farmerView: {
      statsTitle: 'Farmer Dashboard Overview',
      activeListings: 'Active Listings',
      totalSales: 'Total Earnings',
      pendingOrders: 'Pending Orders',
      addProduceBtn: '+ Add New Produce Listing',
      myListings: 'My Produce Listings',
    },
    buyerView: {
      featuredTitle: 'Fresh Harvest Marketplace',
      orderBtn: 'Place Order',
      farmerLabel: 'Farmer:',
      locationLabel: 'Location:',
      inStock: 'In Stock',
    },
    driverView: {
      deliveryTitle: 'Assigned Delivery Routes',
      pickup: 'Pickup Location',
      dropoff: 'Delivery Location',
      updateStatusBtn: 'Update Delivery Status',
    },
    orderModal: {
      title: 'Order Produce',
      qtyLabel: 'Select Quantity',
      confirmBtn: 'Confirm & Place Order',
      closeBtn: 'Cancel',
    },
  },
  si: {
    title: 'ගොවිලිංක්',
    tagline: 'ස්මාර්ට් කෘෂිකාර්මික වෙළඳපොළ සහ ප්‍රවාහන සේවය',
    searchPlaceholder: 'එළවළු, පලතුරු, ස්ථානය හෝ ගොවියා සොයන්න...',
    roles: {
      buyer: 'ගණුදෙනුකරු 🛒',
      farmer: 'ගොවියා 🧑‍🌾',
      driver: 'රියදුරු 🚛',
    },
    categories: ['සියල්ල', 'එළවළු', 'පලතුරු', 'ධාන්‍ය', 'කුළුබඩු'],
    currency: 'රු.',
    perUnit: 'එකක්',
    farmerView: {
      statsTitle: 'ගොවි උපකරණ පුවරුව',
      activeListings: 'සක්‍රිය නිෂ්පාදන',
      totalSales: 'මුළු ආදායම',
      pendingOrders: 'ලැබුණු ඇණවුම්',
      addProduceBtn: '+ අලුත් අස්වැන්නක් එක් කරන්න',
      myListings: 'මගේ අස්වැන්න ලැයිස්තුව',
    },
    buyerView: {
      featuredTitle: 'නැවුම් කෘෂි අස්වැන්න වෙළඳපොළ',
      orderBtn: 'ඇණවුම් කරන්න',
      farmerLabel: 'ගොවියා:',
      locationLabel: 'ස්ථානය:',
      inStock: 'තොග ඇත',
    },
    driverView: {
      deliveryTitle: 'පවරන ලද බෙදාහැරීම් මඟ',
      pickup: 'ලබාගන්නා ස්ථානය',
      dropoff: 'භාරදෙන ස්ථානය',
      updateStatusBtn: 'බෙදාහැරීමේ තත්ත්වය යාවත්කාලීන කරන්න',
    },
    orderModal: {
      title: 'ඇණවුම් තහවුරු කිරීම',
      qtyLabel: 'ප්‍රමාණය තෝරන්න',
      confirmBtn: 'ඇණවුම තහවුරු කරන්න',
      closeBtn: 'අවලංගු කරන්න',
    },
  },
  ta: {
    title: 'கொவி லிங்க்',
    tagline: 'ஸ்மார்ட் விவசாய சந்தை மற்றும் தளவாடங்கள்',
    searchPlaceholder: 'தயாரிப்புகள், இடம் அல்லது விவசாயியைத் தேடுங்கள்...',
    roles: {
      buyer: 'கொள்முதல் செய்பவர் 🛒',
      farmer: 'விவசாயி 🧑‍🌾',
      driver: 'ஓட்டுநர் 🚛',
    },
    categories: ['அனைத்தும்', 'காய்கறிகள்', 'பழங்கள்', 'தானியங்கள்', 'மசாலா'],
    currency: 'ரூ.',
    perUnit: 'ஒன்று',
    farmerView: {
      statsTitle: 'விவசாயி டாஷ்போர்டு',
      activeListings: 'செயலில் உள்ள தயாரிப்புகள்',
      totalSales: 'மொத்த வருமானம்',
      pendingOrders: 'நிலுவையில் உள்ள ஆர்டர்கள்',
      addProduceBtn: '+ புதிய விளைச்சலைச் சேர்க்கவும்',
      myListings: 'என் தயாரிப்புகள்',
    },
    buyerView: {
      featuredTitle: 'புதிய விவசாய சந்தை',
      orderBtn: 'ஆர்டர் செய்யுங்கள்',
      farmerLabel: 'விவசாயி:',
      locationLabel: 'இடம்:',
      inStock: 'இருப்பில் உள்ளது',
    },
    adminView: {
      logisticsTitle: 'கூட்டுறவு போக்குவரத்து மேலாண்மை',
      pendingTransports: 'போக்குவரத்து கோரிக்கைகள்',
      activeFleet: 'செயலில் உள்ள டிரைவர்கள்',
      completedDeliveries: 'இன்று முடிந்தது',
      assignDriverBtn: 'டிரைவரை நியமிக்கவும்',
    },
    driverView: {
      deliveryTitle: 'ஒதுக்கப்பட்ட விநியோக பாதை',
      pickup: 'எடுக்கும் இடம்',
      dropoff: 'சேர்க்கும் இடம்',
      updateStatusBtn: 'நிலையை புதுப்பிக்கவும்',
    },
    orderModal: {
      title: 'ஆர்டர் உறுதிப்படுத்தல்',
      qtyLabel: 'அளவைத் தேர்ந்தெடுக்கவும்',
      confirmBtn: 'ஆர்டரை உறுதிப்படுத்தவும்',
      closeBtn: 'ரத்து செய்',
    },
  },
};



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
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQty, setOrderQty] = useState(5);
  const [produceListings, setProduceListings] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          // Auth OK but no Firestore doc — go to login so user can re-authenticate
          setUserProfile(null);
          setAuthScreen('language');
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

  const t = TRANSLATIONS[lang];

  // Helper for localized produce name
  const getProduceName = (item) => {
    if (!item) return '';
    if (lang === 'si') return item.nameSi || item.nameEn;
    if (lang === 'ta') return item.nameTa || item.nameEn;
    return item.nameEn;
  };

  // Helper for localized unit
  const getProduceUnit = (item) => {
    if (!item) return '';
    if (lang === 'si') return item.unitSi || item.unitEn;
    if (lang === 'ta') return item.unitTa || item.unitEn;
    return item.unitEn;
  };

  const handlePlaceOrder = async () => {
    setShowOrderModal(false);
    if (!selectedItem) return;

    const itemTitle = getProduceName(selectedItem);
    
    // Save order directly into Firestore orders collection
    const orderData = {
      produceId: selectedItem.id,
      produceName: itemTitle,
      qty: orderQty,
      unit: getProduceUnit(selectedItem),
      totalPrice: (selectedItem.price || 0) * orderQty,
      farmerName: selectedItem.farmerName || 'Local Farmer',
      location: selectedItem.location || 'Sri Lanka',
      buyerName: userProfile?.fullName || 'GoviLink Buyer',
      buyerPhone: userProfile?.phone || '',
    };

    const res = await placeOrderInFirestore(orderData);
    if (res.success) {
      Alert.alert(
        'Order Placed in Firestore! 🌾🔥',
        `Successfully saved order for ${orderQty} ${getProduceUnit(selectedItem)} of ${itemTitle} in your Firebase Database.\nFarmer & Driver synced live.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Order Error', `Could not save order: ${res.error}`);
    }
  };


  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setUserProfile(null);
    setCurrentRole('buyer');
    setIsLoggingOut(false);
    setAuthScreen('language');
  };

  if (isSplashVisible) {
    return <SplashScreenComponent onFinish={() => setIsSplashVisible(false)} />;
  }

  // While onAuthStateChanged is determining auth state, show a loading screen
  if (authScreen === 'checking') {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={{ color: '#B0BEC5', marginTop: 12, fontSize: 14 }}>Loading GoviLink...</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* ---------------------------------------------------- */}
      {/* APP HEADER & BRANDING BAR                            */}
      {/* ---------------------------------------------------- */}
      <View style={styles.headerBar}>
        <View style={styles.brandContainer}>
          <Image
            source={require('./assets/splash-icon.png')}
            style={styles.headerLogoBadge}
            resizeMode="contain"
          />
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleNavy}>Govi</Text>
              <Text style={styles.brandTitleGreen}>Link</Text>
            </View>
            <Text style={styles.brandSub}>{t.tagline}</Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={styles.logoutBtn}
          activeOpacity={0.75}
        >
          {isLoggingOut
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.logoutBtnText}>Logout</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ---------------------------------------------------- */}
      {/* ROLE INDICATOR BAR — shows user's assigned role (read-only) */}
      {/* ---------------------------------------------------- */}
      <View style={styles.roleTabsContainer}>
        <View style={styles.roleIndicatorRow}>
          <Text style={styles.roleIndicatorLabel}>Role:</Text>
          <View style={styles.roleIndicatorBadge}>
            <Text style={styles.roleIndicatorText}>
              {currentRole === 'farmer' && '🧑‍🌾 Farmer'}
              {currentRole === 'buyer' && '🛒 Buyer'}
              {currentRole === 'admin' && '🏢 Cooperative Admin'}
              {currentRole === 'driver' && '🚛 Delivery Driver'}
            </Text>
          </View>
          {userProfile?.fullName ? (
            <Text style={styles.roleWelcomeText} numberOfLines={1}>
              Hi, {userProfile.fullName.split(' ')[0]}!
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ==================================================== */}
        {/* BUYER VIEW (MARKETPLACE)                             */}
        {/* ==================================================== */}
        {currentRole === 'buyer' && (
          <View>
            {/* Search Input */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
              {t.categories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(idx)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === idx && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === idx && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionHeader}>{t.buyerView.featuredTitle}</Text>

            {/* Marketplace Produce Cards */}
            {produceListings.filter((item) =>
              getProduceName(item).toLowerCase().includes(searchQuery.toLowerCase())
            ).map((item) => (
              <View key={item.id} style={styles.produceCard}>
                <Image source={{ uri: item.image }} style={styles.produceImage} />
                <View style={styles.produceDetails}>
                  <View style={styles.badgeRow}>
                    <View style={styles.stockBadge}>
                      <Text style={styles.stockBadgeText}>✓ {t.buyerView.inStock}</Text>
                    </View>
                    <Text style={styles.locationText}>📍 {item.location}</Text>
                  </View>

                  <Text style={styles.produceName}>{getProduceName(item)}</Text>
                  <Text style={styles.farmerSubText}>
                    {t.buyerView.farmerLabel} {item.farmerName}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>
                      {t.currency} {item.price.toFixed(2)}
                      <Text style={styles.unitText}> / {getProduceUnit(item)}</Text>
                    </Text>

                    <TouchableOpacity
                      style={styles.orderButton}
                      onPress={() => {
                        setSelectedItem(item);
                        setShowOrderModal(true);
                      }}
                    >
                      <Text style={styles.orderButtonText}>{t.buyerView.orderBtn}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==================================================== */}
        {/* FARMER VIEW                                          */}
        {/* ==================================================== */}
        {currentRole === 'farmer' && (
          <View>
            <Text style={styles.sectionHeader}>{t.farmerView.statsTitle}</Text>

            {/* Stats Dashboard Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.emerald }]}>
                <Text style={styles.statVal}>4</Text>
                <Text style={styles.statLabel}>{t.farmerView.activeListings}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.navy }]}>
                <Text style={styles.statVal}>{t.currency} 84,500</Text>
                <Text style={styles.statLabel}>{t.farmerView.totalSales}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
                <Text style={styles.statVal}>2</Text>
                <Text style={styles.statLabel}>{t.farmerView.pendingOrders}</Text>
              </View>
            </View>

            {/* Add Produce Action Card */}
            <TouchableOpacity
              style={styles.addProduceBanner}
              onPress={() => Alert.alert('Add Listing', 'Opening Produce Registration Form...')}
            >
              <Text style={styles.addProduceText}>{t.farmerView.addProduceBtn}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>{t.farmerView.myListings}</Text>
            {produceListings.map((item) => (
              <View key={item.id} style={styles.farmerListingItem}>
                <Image source={{ uri: item.image }} style={styles.farmerThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.produceName}>{getProduceName(item)}</Text>
                  <Text style={styles.farmerSubText}>
                    Available Stock: {item.stockQty} {getProduceUnit(item)}
                  </Text>
                  <Text style={styles.priceText}>
                    {t.currency} {item.price.toFixed(2)} / {getProduceUnit(item)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ==================================================== */}
        {/* CO-OP ADMIN VIEW                                     */}
        {/* ==================================================== */}
        {currentRole === 'admin' && (
          <View>
            <Text style={styles.sectionHeader}>Cooperative Dashboard 🏢</Text>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
                <Text style={styles.statVal}>5</Text>
                <Text style={styles.statLabel}>Pending Transports</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.emerald }]}>
                <Text style={styles.statVal}>12</Text>
                <Text style={styles.statLabel}>Active Fleet</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.navy }]}>
                <Text style={styles.statVal}>18</Text>
                <Text style={styles.statLabel}>Completed Today</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.adminActionCard}>
              <Text style={styles.adminActionTitle}>🚚 Logistics & Driver Dispatch</Text>
              <Text style={styles.adminActionSub}>
                Assign pending farmer pickup requests to available cooperative lorries and drivers.
              </Text>
              <View style={styles.actionBtnPrimary}>
                <Text style={styles.actionBtnPrimaryText}>Assign Driver</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================== */}
        {/* DRIVER VIEW                                          */}
        {/* ==================================================== */}
        {currentRole === 'driver' && (
          <View>
            <Text style={styles.sectionHeader}>{t.driverView.deliveryTitle}</Text>

            <View style={styles.deliveryCard}>
              <View style={styles.deliveryBadge}>
                <Text style={styles.deliveryBadgeText}>ORDER #GL-8921 • IN TRANSIT</Text>
              </View>
              <Text style={styles.deliveryItemTitle}>Nuwara Eliya Carrots (450 kg)</Text>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>🟢</Text>
                  <View>
                    <Text style={styles.routeLabel}>{t.driverView.pickup}</Text>
                    <Text style={styles.routeValue}>Bandara Farm, Nuwara Eliya</Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>🔴</Text>
                  <View>
                    <Text style={styles.routeLabel}>{t.driverView.dropoff}</Text>
                    <Text style={styles.routeValue}>Cargills Outlet, Colombo 03</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => Alert.alert('Status Updated', 'Delivery marked as: Complete & Delivered!')}
              >
                <Text style={styles.actionBtnPrimaryText}>{t.driverView.updateStatusBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ---------------------------------------------------- */}
      {/* ORDER CONFIRMATION MODAL                             */}
      {/* ---------------------------------------------------- */}
      {selectedItem && (
        <Modal visible={showOrderModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.orderModal.title}</Text>
              <Text style={styles.modalProduceName}>{getProduceName(selectedItem)}</Text>
              <Text style={styles.modalFarmerText}>
                {t.buyerView.farmerLabel} {selectedItem.farmerName} • 📍 {selectedItem.location}
              </Text>

              <View style={styles.qtyContainer}>
                <Text style={styles.qtyLabel}>{t.orderModal.qtyLabel}:</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setOrderQty(Math.max(1, orderQty - 1))}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValText}>
                    {orderQty} {getProduceUnit(selectedItem)}
                  </Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setOrderQty(orderQty + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Price:</Text>
                <Text style={styles.totalVal}>
                  {t.currency} {(selectedItem.price * orderQty).toFixed(2)}
                </Text>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowOrderModal(false)}
                >
                  <Text style={styles.modalBtnCancelText}>{t.orderModal.closeBtn}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handlePlaceOrder}
                >
                  <Text style={styles.modalBtnConfirmText}>{t.orderModal.confirmBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// -------------------------------------------------------
// ROOT EXPORT — wraps AppInner with AuthProvider
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

// ----------------------------------------------------
// STYLESHEET DEFINITIONS
// ----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  headerBar: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
  },
  brandTitleNavy: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandTitleGreen: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accentLeaf,
  },
  brandSub: {
    fontSize: 10,
    color: '#B0BEC5',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Role Indicator Bar
  roleTabsContainer: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  roleIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIndicatorLabel: {
    color: '#90A4AE',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  roleIndicatorBadge: {
    backgroundColor: COLORS.emerald,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  roleWelcomeText: {
    color: '#B0BEC5',
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
  },

  scrollContent: {
    backgroundColor: COLORS.background,
    padding: 16,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Search & Chips
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  chipScrollView: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // Cards
  produceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  produceImage: {
    width: '100%',
    height: 160,
  },
  produceDetails: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockBadge: {
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  produceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  farmerSubText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.emerald,
  },
  unitText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  orderButton: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Farmer Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 3,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addProduceBanner: {
    backgroundColor: COLORS.emerald,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addProduceText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  farmerListingItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  farmerThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  // Admin & Driver
  adminActionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  adminActionSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  deliveryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  deliveryBadgeText: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: 'bold',
  },
  deliveryItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    fontSize: 12,
    marginRight: 10,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  routeValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 5,
    marginVertical: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalProduceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.emerald,
  },
  modalFarmerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyValText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.emerald,
  },
  modalActionRow: {
    flexDirection: 'row',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  modalBtnCancelText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.emerald,
    marginLeft: 8,
  },
  modalBtnConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

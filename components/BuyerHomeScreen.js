import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../services/i18n';
import {
  placeOrderInFirestore,
  subscribeToBuyerRequests,
  deleteBuyerRequest,
} from '../services/firebaseDatabase';
import BuyerRequestProduceScreen from './BuyerRequestProduceScreen';
import UserProfileScreen from './UserProfileScreen';

// ----------------------------------------------------
// THEME COLORS & DESIGN TOKENS (GOVILINK CLEAN STYLE)
// ----------------------------------------------------
const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
  emeraldDark: '#15803D',
  emeraldLight: '#DCFCE7',
  accentLeaf: '#2ECC71',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  purple: '#7C3AED',
  purpleLight: '#F3E8FF',
};

const DISTRICT_OPTIONS = [
  'All',
  'Nuwara Eliya',
  'Dambulla',
  'Jaffna',
  'Badulla',
  'Kandy',
  'Matale',
  'Anuradhapura',
  'Colombo',
  'Galle',
  'Kurunegala',
];

const SORT_OPTIONS = [
  { id: 'newest', labelEn: 'Newest First', labelSi: 'නවතම මුලින්', labelTa: 'புதியது முதலில்' },
  { id: 'price_asc', labelEn: 'Price: Low to High', labelSi: 'මිල: අඩුවේ සිට', labelTa: 'விலை: குறைந்ததிலிருந்து' },
  { id: 'price_desc', labelEn: 'Price: High to Low', labelSi: 'මිල: වැඩිවේ සිට', labelTa: 'விலை: கூடியதிலிருந்து' },
  { id: 'stock_desc', labelEn: 'Stock: High to Low', labelSi: 'තොග: වැඩිවේ සිට', labelTa: 'இருப்பு: கூடியதிலிருந்து' },
];

export default function BuyerHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || lang || 'en';

  const [activeTab, setActiveTab] = useState('market'); // 'market' (Dashboard) | 'marketplace' | 'customRequests' | 'myOrders'
  const [showRequestScreen, setShowRequestScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Filter States
  const [requestFilter, setRequestFilter] = useState('ALL');
  const [orderFilter, setOrderFilter] = useState('ALL');

  // Modals
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [detailProduce, setDetailProduce] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);

  const [orderQty, setOrderQty] = useState(5);
  const [deliveryAddress, setDeliveryAddress] = useState(
    userProfile?.district?.nameEn ? `${userProfile.district.nameEn} Central Outlet` : 'Colombo 03'
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const categories = [
    t('common.all', 'All'),
    'Vegetables',
    'Fruits',
    'Rice & Grains',
    'Spices',
    'Other Produce',
  ];

  // Real-time listener for buyer's own custom requests
  useEffect(() => {
    const unsub = subscribeToBuyerRequests((requests) => {
      setBuyerRequests(requests || []);
    }, userProfile?.uid);

    return () => unsub && unsub();
  }, [userProfile?.uid]);

  const handleDeleteRequest = (requestId, cropName) => {
    Alert.alert(
      t('common.cancel', 'Cancel Request'),
      `Are you sure you want to cancel this produce request? (${cropName})`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await deleteBuyerRequest(requestId);
          },
        },
      ]
    );
  };

  const getProduceTitle = (item) => {
    if (!item) return '';
    if (currentLang === 'si') return item.nameSi || item.nameEn;
    if (currentLang === 'ta') return item.nameTa || item.nameEn;
    return item.nameEn;
  };

  const getProduceUnit = (item) => {
    if (!item) return 'kg';
    if (currentLang === 'si') return item.unitSi || item.unitEn || 'කි.ග්‍රෑ.';
    if (currentLang === 'ta') return item.unitTa || item.unitEn || 'கிலோ';
    return item.unitEn || 'kg';
  };

  // Filter & sort marketplace listings
  const filteredListings = produceListings
    .filter((item) => {
      const title = getProduceTitle(item).toLowerCase();
      const farmer = (item.farmerName || '').toLowerCase();
      const loc = (item.location || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = title.includes(query) || farmer.includes(query) || loc.includes(query);
      if (!matchesSearch) return false;

      if (selectedCategory !== 0) {
        const itemCat = (item.category || 'Vegetables').toLowerCase();
        if (selectedCategory === 1 && !itemCat.includes('veg')) return false;
        if (selectedCategory === 2 && !itemCat.includes('fruit')) return false;
        if (selectedCategory === 3 && !(itemCat.includes('rice') || itemCat.includes('grain'))) return false;
        if (selectedCategory === 4 && !itemCat.includes('spice')) return false;
      }

      if (selectedDistrict !== 'All') {
        const targetDist = selectedDistrict.toLowerCase();
        const itemLocation = loc.toLowerCase();
        const itemDistrict = (item.district || '').toLowerCase();
        if (!itemLocation.includes(targetDist) && !itemDistrict.includes(targetDist)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === 'stock_desc') return (Number(b.stockQty) || 0) - (Number(a.stockQty) || 0);
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  // Latest single offer item for the main dashboard card
  const latestOfferItem = filteredListings[0] || {
    id: 'offer_latest_1',
    nameEn: 'Grade A Red Onions',
    nameSi: 'රතු ළූණු (ශ්‍රේණිය A)',
    nameTa: 'சிவப்பு வெங்காயம்',
    farmerName: 'Dambulla Vegetable Hub',
    price: 240,
    stockQty: 2400,
    unitEn: 'kg',
    grade: 'A',
    location: 'Dambulla Hub',
    category: 'Vegetables',
    timeAgo: '3m ago',
  };

  // Filter orders for current logged in buyer
  const myBuyerOrders = (ordersList || []).filter(
    (o) => !userProfile?.uid || o.buyerId === userProfile.uid || o.buyerUid === userProfile.uid
  );

  const pendingOrdersCount = myBuyerOrders.filter((o) => o.status === 'PENDING').length;
  const confirmedOrdersCount = myBuyerOrders.filter(
    (o) => o.status === 'ACCEPTED' || o.status === 'READY_FOR_PICKUP' || o.status === 'IN_TRANSIT'
  ).length;

  const handleOpenDetailModal = (item) => {
    setDetailProduce(item || latestOfferItem);
    setShowDetailModal(true);
  };

  const handleOpenOrderModal = (item) => {
    setSelectedProduce(item || latestOfferItem);
    setOrderQty(5);
    setShowOrderModal(true);
  };

  const handleOpenOrderFromDetail = () => {
    if (detailProduce) {
      setSelectedProduce(detailProduce);
      setOrderQty(5);
      setShowDetailModal(false);
      setShowOrderModal(true);
    }
  };

  const handleOpenTrackingModal = (order) => {
    setSelectedTrackingOrder(order || {
      id: 'GL-8842',
      produceName: 'Grade A Red Onions',
      farmerName: 'Dambulla Hub',
      fleetName: 'Co-op Fleet 4T (WP-LG-4401)',
      driverName: 'Suneth Perera (077-4589210)',
      eta: '11:30 AM',
      route: 'Dambulla Hub ➔ Colombo Central',
      status: 'IN_TRANSIT',
    });
    setShowTrackingModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduce) return;
    setIsPlacingOrder(true);
    try {
      const unitP = Number(selectedProduce.price) || 0;
      const qtyP = Number(orderQty) || 1;
      const orderPayload = {
        buyerId: userProfile?.uid || 'buyer',
        buyerName: userProfile?.fullName || 'GoviLink Buyer',
        buyerPhone: userProfile?.phoneNumber || '',
        farmerId: selectedProduce.farmerId || 'farmer',
        farmerName: selectedProduce.farmerName || 'GoviLink Farmer',
        produceId: selectedProduce.id,
        produceName: getProduceTitle(selectedProduce),
        qty: qtyP,
        unit: getProduceUnit(selectedProduce),
        unitPrice: unitP,
        subtotal: unitP * qtyP,
        transportFee: 350,
        totalPrice: unitP * qtyP + 350,
        deliveryAddress: deliveryAddress || 'Address on file',
        notes: deliveryNotes || '',
        status: 'PENDING',
      };
      const res = await placeOrderInFirestore(orderPayload);
      if (res.success) {
        Alert.alert('Order Placed! 🎉', 'Your produce order has been submitted to the farmer.');
        setShowOrderModal(false);
        setSelectedProduce(null);
        setShowProfileScreen(false);
        setActiveTab('myOrders');
      } else {
        Alert.alert('Order Failed', res.error || 'Could not place order. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleNavClick = (targetTab) => {
    setShowProfileScreen(false);
    setActiveTab(targetTab);
  };

  const toggleLanguage = async () => {
    const nextLang = currentLang === 'en' ? 'si' : currentLang === 'si' ? 'ta' : 'en';
    await changeAppLanguage(nextLang);
    if (onChangeLanguage) {
      onChangeLanguage(nextLang);
    }
  };

  if (showRequestScreen) {
    return (
      <BuyerRequestProduceScreen
        userProfile={userProfile}
        lang={currentLang}
        onBack={() => setShowRequestScreen(false)}
      />
    );
  }

  if (showProfileScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <UserProfileScreen
          userProfile={userProfile}
          lang={currentLang}
          onClose={() => setShowProfileScreen(false)}
          onLogout={onLogout}
          onProfileUpdated={onProfileUpdated}
        />
        {/* FIXED BOTTOM NAVBAR EVEN ON PROFILE VIEW */}
        <View style={styles.bottomNavBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavClick('market')} activeOpacity={0.7}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>📊</Text>
            </View>
            <Text style={styles.navLabel}>{t('navigation.dashboard')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavClick('marketplace')} activeOpacity={0.7}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>🧺</Text>
            </View>
            <Text style={styles.navLabel}>{t('navigation.marketplace')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavClick('customRequests')} activeOpacity={0.7}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>🌾</Text>
            </View>
            <Text style={styles.navLabel}>{t('navigation.requests')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavClick('myOrders')} activeOpacity={0.7}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>📦</Text>
            </View>
            <Text style={styles.navLabel}>{t('navigation.orders')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. TOP HEADER BAR */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.brandLogoBox}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.brandLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandTitleCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.brandGovi}>GoviLink</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{t('roles.buyer')}</Text>
              </View>
            </View>
            <Text style={styles.headerLocationText}>
              📍 {(userProfile?.district?.nameEn || 'COLOMBO').toUpperCase()} CENTRAL HUB
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Notification Icon */}
          <TouchableOpacity
            style={styles.iconCircleBtn}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                t('common.notifications'),
                '• Transport WP-LG-4401 en route (ETA 11:30 AM).\n• Direct harvest offer available from Dambulla Hub.'
              )
            }
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          {/* Language Selector */}
          <TouchableOpacity
            style={styles.langPillBtn}
            onPress={toggleLanguage}
            activeOpacity={0.8}
          >
            <Text style={styles.langPillText}>
              {currentLang === 'si' ? 'සිං' : currentLang === 'ta' ? 'தமிழ்' : 'EN'}
            </Text>
          </TouchableOpacity>

          {/* Profile Avatar Icon */}
          <TouchableOpacity
            style={styles.avatarCircleBtn}
            onPress={() => setShowProfileScreen(true)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================== */}
        {/* 1. DASHBOARD TAB CONTENT                       */}
        {/* ============================================== */}
        {activeTab === 'market' && (
          <View>
            {/* 2. WELCOME SECTION (COMPACT CARD) */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeCardMain}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.welcomeTitle}>
                      {t('buyer.welcome')}, {userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'GoviLink'}
                    </Text>
                    <View style={styles.verifiedCheckBadge}>
                      <Text style={styles.verifiedCheckText}>✓</Text>
                    </View>
                  </View>

                  <Text style={styles.verifiedSubText}>{t('buyer.verifiedBuyer')}</Text>
                  <Text style={styles.zoneTagText}>
                    🌾 {(userProfile?.district?.nameEn || 'COLOMBO').toUpperCase()} VALLEY HUB • ZONE 1A
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.welcomeActionBtn}
                  onPress={() => setShowProfileScreen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. CURRENT TRANSPORT CARD */}
            <TouchableOpacity
              style={styles.transportBanner}
              activeOpacity={0.9}
              onPress={() => handleOpenTrackingModal(null)}
            >
              <View style={styles.transportTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.transportIconBox}>
                    <Text style={{ fontSize: 18 }}>🚛</Text>
                  </View>
                  <View>
                    <Text style={styles.transportLabelText}>{t('buyer.transportEnRoute')}</Text>
                    <Text style={styles.transportTitle}>Co-op Fleet 4T (WP-LG-4401)</Text>
                  </View>
                </View>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaBadgeText}>ETA 11:30 AM</Text>
                </View>
              </View>

              <View style={styles.transportDetailBox}>
                <Text style={styles.transportDetailRow}>👨‍✈️ <Text style={{ fontWeight: '700' }}>{t('common.driver')}:</Text> Suneth Perera (077-4589210)</Text>
                <Text style={styles.transportDetailRow}>🗺️ <Text style={{ fontWeight: '700' }}>{t('common.route')}:</Text> Dambulla Hub ➔ Colombo Central</Text>
                <Text style={styles.transportDetailRow}>📦 <Text style={{ fontWeight: '700' }}>{t('common.pickup')}:</Text> Direct Order #GL-8842 • Farm Gate Pickup</Text>
              </View>
            </TouchableOpacity>

            {/* 4. LATEST HARVEST OFFER */}
            <View style={styles.bidAlertCard}>
              <View style={styles.bidAlertTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.greenDot} />
                  <Text style={styles.bidAlertLabel}>{t('buyer.latestHarvestOffer')}</Text>
                </View>
                <Text style={styles.bidAlertTime}>{latestOfferItem.timeAgo || '3m ago'}</Text>
              </View>

              <View style={styles.bidAlertContentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bidAlertTitle}>{latestOfferItem.farmerName || 'Dambulla Vegetable Hub'}</Text>
                  <Text style={styles.bidAlertSub}>
                    Offered <Text style={{ fontWeight: '800', color: THEME.emeraldDark }}>Rs. {latestOfferItem.price}/kg</Text> on {latestOfferItem.stockQty?.toLocaleString()} kg {getProduceTitle(latestOfferItem)} (Grade {latestOfferItem.grade || 'A'})
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => handleOpenDetailModal(latestOfferItem)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reviewBtnText}>{t('buyer.review')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. QUICK OVERVIEW (2X2 GRID) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleText}>Quick Overview</Text>
            </View>

            <View style={styles.metricsGrid}>
              <TouchableOpacity
                style={styles.metricTile}
                onPress={() => handleNavClick('customRequests')}
                activeOpacity={0.8}
              >
                <View style={styles.metricTileHeader}>
                  <Text style={styles.metricTileLabel}>{t('buyer.openRequests')}</Text>
                  <View style={[styles.metricTileIconBg, { backgroundColor: THEME.infoLight }]}>
                    <Text style={{ fontSize: 13 }}>📋</Text>
                  </View>
                </View>
                <Text style={styles.metricTileValue}>{buyerRequests.length} Requests</Text>
                <Text style={styles.metricTileSub}>Active inquiries</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricTile}
                onPress={() => {
                  setOrderFilter('PENDING');
                  handleNavClick('myOrders');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.metricTileHeader}>
                  <Text style={styles.metricTileLabel}>{t('buyer.pendingOrders')}</Text>
                  <View style={[styles.metricTileIconBg, { backgroundColor: THEME.warningLight }]}>
                    <Text style={{ fontSize: 13 }}>⏳</Text>
                  </View>
                </View>
                <Text style={styles.metricTileValue}>{pendingOrdersCount} Pending</Text>
                <Text style={styles.metricTileSub}>Awaiting confirmation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricTile}
                onPress={() => {
                  setOrderFilter('ACCEPTED');
                  handleNavClick('myOrders');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.metricTileHeader}>
                  <Text style={styles.metricTileLabel}>{t('buyer.confirmedOrders')}</Text>
                  <View style={[styles.metricTileIconBg, { backgroundColor: THEME.emeraldLight }]}>
                    <Text style={{ fontSize: 13 }}>✓</Text>
                  </View>
                </View>
                <Text style={styles.metricTileValue}>{confirmedOrdersCount} Orders</Text>
                <Text style={styles.metricTileSub}>Ready / En Route</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricTile}
                onPress={() => {
                  setOrderFilter('ALL');
                  handleNavClick('myOrders');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.metricTileHeader}>
                  <Text style={styles.metricTileLabel}>{t('buyer.monthSpent')}</Text>
                  <View style={[styles.metricTileIconBg, { backgroundColor: THEME.purpleLight }]}>
                    <Text style={{ fontSize: 13 }}>👁️</Text>
                  </View>
                </View>
                <Text style={styles.metricTileValue}>Rs. 1.42M</Text>
                <Text style={styles.metricTileTrend}>+18% this month</Text>
              </TouchableOpacity>
            </View>

            {/* 6. PRIMARY ACTION BUTTON */}
            <TouchableOpacity
              style={styles.primaryAddBtn}
              activeOpacity={0.9}
              onPress={() => setShowRequestScreen(true)}
            >
              <Text style={styles.primaryAddBtnText}>{t('buyer.broadcastRequest')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.marketplaceBannerLink}
              onPress={() => handleNavClick('marketplace')}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.mktBannerTitle}>🌾 {t('buyer.exploreMarketplace')}</Text>
                <Text style={styles.mktBannerSub}>Browse regional produce, filter by grade & order farm-direct.</Text>
              </View>
              <Text style={{ fontSize: 18, color: THEME.emeraldDark, fontWeight: 'bold' }}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================== */}
        {/* 2. MARKETPLACE TAB CONTENT                     */}
        {/* ============================================== */}
        {activeTab === 'marketplace' && (
          <View>
            <Text style={styles.sectionTitleText}>{t('navigation.marketplace')}</Text>
            <Text style={styles.sectionSubText}>Direct farm sourcing from certified regional growers</Text>

            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t('buyer.searchPlaceholder')}
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 14, color: THEME.textMuted, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {categories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(idx)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === idx && styles.categoryChipActive,
                  ]}
                  activeOpacity={0.8}
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

            <View style={styles.filterSectionRow}>
              <Text style={styles.filterSectionTitle}>📍 Origin District:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {DISTRICT_OPTIONS.map((dist) => (
                  <TouchableOpacity
                    key={dist}
                    onPress={() => setSelectedDistrict(dist)}
                    style={[
                      styles.districtChip,
                      selectedDistrict === dist && styles.districtChipActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.districtChipText,
                        selectedDistrict === dist && styles.districtChipTextActive,
                      ]}
                    >
                      {dist === 'All' ? 'All Districts' : dist}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Produce Lot Cards */}
            {filteredListings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No matching produce found</Text>
                <Text style={styles.emptySubtitle}>
                  Try changing your search term, origin district, or category filter.
                </Text>
              </View>
            ) : (
              filteredListings.map((item, index) => {
                const stockVal = Number(item.stockQty || 0);
                const isOutOfStock = stockVal <= 0;
                const isLimited = stockVal > 0 && stockVal <= 20;
                const lotId = item.id ? item.id.slice(-4).toUpperCase() : `884${index + 1}`;
                const fillRatio = Math.min(100, Math.max(10, Math.round((stockVal / 2500) * 100)));

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.produceLotCard}
                    activeOpacity={0.9}
                    onPress={() => handleOpenDetailModal(item)}
                  >
                    <View style={styles.produceLotMainRow}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.produceLotImg}
                        resizeMode="cover"
                      />
                      <View style={styles.produceLotCol}>
                        <View style={styles.produceLotTopRow}>
                          <Text style={styles.lotIdText}>LOT #{lotId}</Text>
                          <View
                            style={[
                              styles.lotBadgePill,
                              isOutOfStock
                                ? { backgroundColor: THEME.dangerLight }
                                : isLimited
                                  ? { backgroundColor: THEME.warningLight }
                                  : { backgroundColor: THEME.emeraldLight },
                            ]}
                          >
                            <Text
                              style={[
                                styles.lotBadgeText,
                                isOutOfStock
                                  ? { color: THEME.danger }
                                  : isLimited
                                    ? { color: THEME.warning }
                                    : { color: THEME.emeraldDark },
                              ]}
                            >
                              {isOutOfStock
                                ? 'Out of Stock'
                                : isLimited
                                  ? 'Pickup Today'
                                  : item.grade
                                    ? `Grade ${item.grade}`
                                    : 'Grade A'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.produceLotTitle}>{getProduceTitle(item)}</Text>
                        <Text style={styles.produceLotFarmer}>
                          📍 {item.location || 'Sri Lanka'} • {item.farmerName || 'GoviLink Farmer'}
                        </Text>

                        <View style={styles.produceLotPriceRow}>
                          <Text style={styles.produceLotPrice}>
                            Rs. {Number(item.price).toFixed(0)}
                            <Text style={styles.produceLotUnit}> /{getProduceUnit(item)}</Text>
                          </Text>

                          <View style={styles.stockRemainingRow}>
                            <Text style={{ fontSize: 11 }}>⌛</Text>
                            <Text style={styles.stockRemainingText}>
                              {stockVal} {getProduceUnit(item)} left
                            </Text>
                          </View>
                        </View>

                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${fillRatio}%` },
                              isLimited && { backgroundColor: THEME.warning },
                              isOutOfStock && { width: '0%' },
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.produceCardActionRow}>
                      <TouchableOpacity
                        style={styles.lotDetailBtn}
                        activeOpacity={0.8}
                        onPress={() => handleOpenDetailModal(item)}
                      >
                        <Text style={styles.lotDetailBtnText}>👁️ {t('common.details')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.lotOrderBtn,
                          isOutOfStock && { backgroundColor: '#94A3B8' },
                        ]}
                        disabled={isOutOfStock}
                        activeOpacity={0.85}
                        onPress={() => handleOpenOrderModal(item)}
                      >
                        <Text style={styles.lotOrderBtnText}>🛒 {t('common.orderNow')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ============================================== */}
        {/* 3. REQUESTS TAB CONTENT                        */}
        {/* ============================================== */}
        {activeTab === 'customRequests' && (
          <View>
            <View style={styles.requestsHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitleText}>Custom Harvest Inquiries</Text>
                <Text style={styles.sectionSubText}>Broadcast bulk produce requirements to farmers</Text>
              </View>
              <TouchableOpacity
                style={styles.newRequestTopBtn}
                onPress={() => setShowRequestScreen(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.newRequestTopBtnText}>+ Request Produce</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.subFilterRow}>
              {['ALL', 'ACTIVE', 'MATCHED', 'COMPLETED'].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setRequestFilter(f)}
                  style={[styles.subFilterChip, requestFilter === f && styles.subFilterChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subFilterChipText, requestFilter === f && styles.subFilterChipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {buyerRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No custom requests broadcasted yet</Text>
                <Text style={styles.emptySubtitle}>Post a request for regional growers to see.</Text>
                <TouchableOpacity
                  style={[styles.newRequestTopBtn, { marginTop: 14, alignSelf: 'center' }]}
                  onPress={() => setShowRequestScreen(true)}
                >
                  <Text style={styles.newRequestTopBtnText}>+ Broadcast First Request</Text>
                </TouchableOpacity>
              </View>
            ) : (
              buyerRequests.map((req) => (
                <View key={req.id} style={styles.customRequestCard}>
                  <View style={styles.reqCardHeader}>
                    <View style={styles.reqCropRow}>
                      <Text style={styles.reqCropIcon}>🌱</Text>
                      <View>
                        <Text style={styles.reqCropName}>{req.cropName}</Text>
                        <Text style={styles.reqCategoryBadge}>🏷️ {req.category || 'Vegetables'}</Text>
                      </View>
                    </View>
                    <View style={styles.reqStatusBadge}>
                      <Text style={styles.reqStatusText}>⏳ Open</Text>
                    </View>
                  </View>

                  <View style={styles.reqInfoGrid}>
                    <View style={styles.reqInfoItem}>
                      <Text style={styles.reqInfoLabel}>⚖️ Quantity:</Text>
                      <Text style={styles.reqInfoValue}>
                        {req.quantity} {req.unit || 'kg'}
                      </Text>
                    </View>
                    <View style={styles.reqInfoItem}>
                      <Text style={styles.reqInfoLabel}>📍 Origin District:</Text>
                      <Text style={styles.reqInfoValue} numberOfLines={1}>
                        {req.targetDistrictName || req.targetDistrictEn || 'Island-wide'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reqFooter}>
                    <Text style={styles.reqDeliveryText} numberOfLines={1}>
                      🚚 {req.deliveryAddress || 'Central Destination'}
                    </Text>
                    <TouchableOpacity
                      style={styles.reqDeleteBtn}
                      onPress={() => handleDeleteRequest(req.id, req.cropName)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reqDeleteBtnText}>🗑️ {t('common.cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================== */}
        {/* 4. ORDERS TAB CONTENT                          */}
        {/* ============================================== */}
        {activeTab === 'myOrders' && (
          <View>
            <Text style={styles.sectionTitleText}>{t('navigation.orders')}</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {['ALL', 'PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setOrderFilter(f)}
                  style={[styles.subFilterChip, orderFilter === f && styles.subFilterChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subFilterChipText, orderFilter === f && styles.subFilterChipTextActive]}>
                    {f === 'ALL' ? 'All Orders' : f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {myBuyerOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>No orders placed yet</Text>
                <Text style={styles.emptySubtitle}>Place your first fresh farm order!</Text>
              </View>
            ) : (
              myBuyerOrders
                .filter((o) => orderFilter === 'ALL' || o.status === orderFilter)
                .map((order) => {
                  const status = order.status || 'PENDING';

                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.buyerOrderCard}
                      activeOpacity={0.9}
                      onPress={() => handleOpenTrackingModal(order)}
                    >
                      <View style={styles.orderTopHeader}>
                        <View style={styles.orderIdBadge}>
                          <Text style={styles.orderIdText}>
                            ORDER #{order.id ? order.id.slice(-6).toUpperCase() : 'GL-100'}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: THEME.emeraldLight }]}>
                          <Text style={[styles.statusPillText, { color: THEME.emeraldDark }]}>
                            {status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.orderProduceTitle}>{order.produceName || 'Fresh Harvest Crop'}</Text>

                      <View style={styles.buyerOrderDetailsRow}>
                        <Text style={styles.buyerOrderSub}>
                          👨‍🌾 Farmer: <Text style={{ fontWeight: '600', color: THEME.textDark }}>{order.farmerName || 'GoviLink Farmer'}</Text>
                        </Text>
                        <Text style={styles.buyerOrderSub}>
                          📍 Delivery: <Text style={{ fontWeight: '600', color: THEME.textDark }}>{order.deliveryAddress || 'Address on file'}</Text>
                        </Text>
                      </View>

                      <View style={styles.orderFooterTotalRow}>
                        <Text style={styles.orderFooterQty}>
                          Quantity: <Text style={{ fontWeight: 'bold', color: THEME.textDark }}>{order.qty} {order.unit || 'kg'}</Text>
                        </Text>
                        <Text style={styles.orderFooterPrice}>
                          Total: Rs. {Number(order.totalPrice || 0).toFixed(2)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
            )}
          </View>
        )}
      </ScrollView>

      {/* FIXED 4-ITEM BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavClick('market')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, (!showProfileScreen && activeTab === 'market') && styles.navIconContainerActive]}>
            <Text style={[styles.navIcon, (!showProfileScreen && activeTab === 'market') && styles.navIconActive]}>📊</Text>
          </View>
          <Text style={[styles.navLabel, (!showProfileScreen && activeTab === 'market') && styles.navLabelActive]}>
            {t('navigation.dashboard')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavClick('marketplace')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, (!showProfileScreen && activeTab === 'marketplace') && styles.navIconContainerActive]}>
            <Text style={[styles.navIcon, (!showProfileScreen && activeTab === 'marketplace') && styles.navIconActive]}>🧺</Text>
          </View>
          <Text style={[styles.navLabel, (!showProfileScreen && activeTab === 'marketplace') && styles.navLabelActive]}>
            {t('navigation.marketplace')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavClick('customRequests')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, (!showProfileScreen && activeTab === 'customRequests') && styles.navIconContainerActive]}>
            <Text style={[styles.navIcon, (!showProfileScreen && activeTab === 'customRequests') && styles.navIconActive]}>🌾</Text>
          </View>
          <Text style={[styles.navLabel, (!showProfileScreen && activeTab === 'customRequests') && styles.navLabelActive]}>
            {t('navigation.requests')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavClick('myOrders')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, (!showProfileScreen && activeTab === 'myOrders') && styles.navIconContainerActive]}>
            <Text style={[styles.navIcon, (!showProfileScreen && activeTab === 'myOrders') && styles.navIconActive]}>📦</Text>
          </View>
          <Text style={[styles.navLabel, (!showProfileScreen && activeTab === 'myOrders') && styles.navLabelActive]}>
            {t('navigation.orders')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODALS */}
      {selectedProduce && (
        <Modal visible={showOrderModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Place Direct Farm Order</Text>
                <TouchableOpacity onPress={() => setShowOrderModal(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: THEME.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalProduceName}>{getProduceTitle(selectedProduce)}</Text>
                <Text style={styles.modalFarmerText}>
                  👨‍🌾 {selectedProduce.farmerName} • 📍 {selectedProduce.location}
                </Text>

                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyLabel}>Select Quantity:</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setOrderQty(Math.max(1, orderQty - 1))}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValText}>
                      {orderQty} {getProduceUnit(selectedProduce)}
                    </Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setOrderQty(orderQty + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Delivery Address</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. No 45, Galle Road, Colombo 03"
                  placeholderTextColor={THEME.textMuted}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />

                <View style={styles.priceBreakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Subtotal</Text>
                    <Text style={styles.breakdownValue}>
                      Rs. {((selectedProduce.price || 0) * orderQty).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Transport Fee</Text>
                    <Text style={styles.breakdownValue}>Rs. 350.00</Text>
                  </View>
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalVal}>
                      Rs. {(((selectedProduce.price || 0) * orderQty) + 350).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowOrderModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    disabled={isPlacingOrder}
                    onPress={handleConfirmOrder}
                  >
                    {isPlacingOrder ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.modalBtnConfirmText}>{t('common.confirm')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {detailProduce && (
        <Modal visible={showDetailModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '92%' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>🌾 Harvest Details</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: THEME.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.modalProduceName}>{getProduceTitle(detailProduce)}</Text>
                  <Text style={styles.detailPriceTag}>
                    Rs. {Number(detailProduce.price).toFixed(2)} / {getProduceUnit(detailProduce)}
                  </Text>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>{t('common.close')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={handleOpenOrderFromDetail}
                  >
                    <Text style={styles.modalBtnConfirmText}>🛒 {t('common.orderNow')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showTrackingModal && (
        <Modal visible={showTrackingModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>🚛 Order Tracking</Text>
                <TouchableOpacity onPress={() => setShowTrackingModal(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: THEME.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.transportBanner}>
                  <Text style={styles.transportTitle}>{selectedTrackingOrder?.fleetName || 'Co-op Fleet 4T (WP-LG-4401)'}</Text>
                  <Text style={styles.transportDetailRow}>👨‍✈️ Driver: {selectedTrackingOrder?.driverName || 'Suneth Perera (077-4589210)'}</Text>
                  <Text style={styles.transportDetailRow}>🗺️ Route: {selectedTrackingOrder?.route || 'Dambulla Hub ➔ Colombo Central'}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: 30,
    height: 30,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandGovi: {
    fontSize: 19,
    fontWeight: '800',
    color: THEME.textDark,
    letterSpacing: -0.3,
  },
  roleBadge: {
    backgroundColor: THEME.emeraldLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleBadgeText: {
    color: THEME.emeraldDark,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerLocationText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: THEME.danger,
  },
  langPillBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langPillText: {
    color: THEME.textDark,
    fontSize: 11,
    fontWeight: '800',
  },
  avatarCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContainer: {
    backgroundColor: THEME.bg,
    padding: 14,
    paddingBottom: 90,
  },

  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  welcomeCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.textDark,
  },
  verifiedCheckBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: THEME.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.emeraldDark,
    marginTop: 2,
  },
  zoneTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    marginTop: 4,
  },
  welcomeActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: THEME.emeraldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  transportBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  transportIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#3730A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transportLabelText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  etaBadge: {
    backgroundColor: THEME.emeraldLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  transportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  transportDetailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    gap: 3,
  },
  transportDetailRow: {
    fontSize: 11,
    color: '#334155',
  },

  bidAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  bidAlertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: THEME.emerald,
  },
  bidAlertLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.emeraldDark,
    letterSpacing: 0.5,
  },
  bidAlertTime: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  bidAlertContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bidAlertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
  },
  bidAlertSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  reviewBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricTile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  metricTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricTileLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: THEME.textMuted,
    letterSpacing: 0.4,
  },
  metricTileIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTileValue: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textDark,
  },
  metricTileSub: {
    fontSize: 9.5,
    color: THEME.textMuted,
    marginTop: 1,
  },
  metricTileTrend: {
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.emerald,
    marginTop: 1,
  },

  primaryAddBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: THEME.emeraldDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  marketplaceBannerLink: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mktBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textDark,
  },
  mktBannerSub: {
    fontSize: 10.5,
    color: THEME.textMuted,
    marginTop: 1,
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.textDark,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryChipActive: {
    backgroundColor: THEME.emeraldDark,
    borderColor: THEME.emeraldDark,
  },
  categoryChipText: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterSectionRow: {
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 2,
  },
  districtChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  districtChipActive: {
    backgroundColor: THEME.textDark,
    borderColor: THEME.textDark,
  },
  districtChipText: {
    fontSize: 10.5,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  districtChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  produceLotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  produceLotMainRow: {
    flexDirection: 'row',
    gap: 10,
  },
  produceLotImg: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  produceLotCol: {
    flex: 1,
  },
  produceLotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotIdText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.textMuted,
  },
  lotBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lotBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  produceLotTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
    marginTop: 1,
  },
  produceLotFarmer: {
    fontSize: 10.5,
    color: THEME.textMuted,
    marginTop: 1,
  },
  produceLotPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  produceLotPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  produceLotUnit: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  stockRemainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stockRemainingText: {
    fontSize: 10,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.emerald,
    borderRadius: 2,
  },
  produceCardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lotDetailBtn: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotDetailBtnText: {
    color: THEME.textDark,
    fontWeight: '700',
    fontSize: 11,
  },
  lotOrderBtn: {
    flex: 1.2,
    backgroundColor: THEME.emeraldDark,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotOrderBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },

  requestsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionSubText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 1,
  },
  newRequestTopBtn: {
    backgroundColor: THEME.emeraldDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newRequestTopBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  subFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  subFilterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  subFilterChipActive: {
    backgroundColor: THEME.emeraldDark,
    borderColor: THEME.emeraldDark,
  },
  subFilterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  subFilterChipTextActive: {
    color: '#FFFFFF',
  },

  customRequestCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqCropIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  reqCropName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
  },
  reqCategoryBadge: {
    fontSize: 10,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  reqStatusBadge: {
    backgroundColor: THEME.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reqStatusText: {
    color: THEME.warning,
    fontSize: 10,
    fontWeight: '800',
  },
  reqInfoGrid: {
    backgroundColor: THEME.bg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 4,
  },
  reqInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  reqInfoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textDark,
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 6,
  },
  reqDeliveryText: {
    fontSize: 10,
    color: THEME.textMuted,
    flex: 1,
  },
  reqDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: THEME.dangerLight,
  },
  reqDeleteBtnText: {
    color: THEME.danger,
    fontSize: 10,
    fontWeight: '700',
  },

  buyerOrderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orderTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdBadge: {
    backgroundColor: THEME.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orderIdText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.navy,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderProduceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 4,
  },
  buyerOrderDetailsRow: {
    marginBottom: 8,
  },
  buyerOrderSub: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  orderFooterTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 6,
    marginTop: 2,
  },
  orderFooterQty: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  orderFooterPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  emptyCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginVertical: 10,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: THEME.textMuted,
    textAlign: 'center',
  },

  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 62,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    paddingHorizontal: 6,
    zIndex: 100,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navIconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainerActive: {
    backgroundColor: THEME.emeraldLight,
  },
  navIcon: {
    fontSize: 17,
    color: THEME.textMuted,
  },
  navIconActive: {
    color: THEME.emeraldDark,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: THEME.textMuted,
    marginTop: 1,
  },
  navLabelActive: {
    color: THEME.emeraldDark,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.navy,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProduceName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  modalFarmerText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 12,
  },
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textDark,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: THEME.bg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  qtyValText: {
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 12,
    color: THEME.navy,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 4,
    marginTop: 4,
  },
  inputField: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.textDark,
    marginBottom: 8,
  },
  priceBreakdownBox: {
    backgroundColor: THEME.bg,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textDark,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textDark,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.emeraldDark,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalBtnCancelText: {
    color: THEME.textMuted,
    fontWeight: '800',
    fontSize: 12,
  },
  modalBtnConfirm: {
    backgroundColor: THEME.emeraldDark,
    flex: 2,
  },
  modalBtnConfirmText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },

  detailPriceTag: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
});

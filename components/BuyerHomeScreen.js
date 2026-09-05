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
import {
  placeOrderInFirestore,
  subscribeToBuyerRequests,
  deleteBuyerRequest,
} from '../services/firebaseDatabase';
import BuyerRequestProduceScreen from './BuyerRequestProduceScreen';
import UserProfileScreen from './UserProfileScreen';

// ----------------------------------------------------
// THEME COLORS
// ----------------------------------------------------
const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
  emeraldDark: '#15803D',
  emeraldLight: '#E8F5E9',
  accentLeaf: '#2ECC71',
  bg: '#F4F7F6',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#F3E8FF',
};

// ----------------------------------------------------
// LOCALIZATION
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Fresh Harvest Marketplace',
    tagline: 'Farm-direct fresh produce delivered to your doorstep',
    searchPlaceholder: 'Search vegetables, fruits, grains, or farmer...',
    categories: ['All', 'Vegetables', 'Fruits', 'Rice & Grains', 'Spices'],
    tabs: {
      market: 'Fresh Marketplace',
      customRequests: 'Custom Requests',
      myOrders: 'My Orders',
    },
    customRequests: {
      title: 'Custom Harvest Inquiries',
      subtitle: 'Broadcast bulk produce requirements to farmers by region & delivery date',
      postBtn: '+ Request Produce',
      bannerTitle: 'Need a Specific Crop & Date Window?',
      bannerSub: 'Broadcast requirements (e.g. 100kg Carrots from Nuwara Eliya) directly to regional growers!',
      bannerBtn: 'Broadcast Request 📢',
      emptyTitle: 'No custom requests broadcasted yet',
      emptySub: 'Need bulk produce or a specific harvest period? Post a request for growers to see.',
      cancelBtn: 'Cancel Request',
      cancelConfirm: 'Are you sure you want to cancel this produce request?',
      targetDistrict: 'Origin District:',
      datePeriod: 'Required Period:',
      targetPrice: 'Target Budget:',
      quality: 'Grade:',
      destination: 'Delivery Location:',
      statusOpen: '⏳ Broadcasted (Open)',
    },
    labels: {
      farmer: 'Farmer:',
      location: 'Farm Location:',
      inStock: 'In Stock',
      grade: 'Quality:',
      orderBtn: 'Order Produce',
      currency: 'Rs.',
      logout: 'Logout',
    },
    modal: {
      title: 'Place Direct Farm Order',
      qtyLabel: 'Select Quantity',
      deliveryLabel: 'Delivery Destination Address',
      deliveryPlaceholder: 'e.g. No 45, Galle Road, Colombo 03',
      notesLabel: 'Special Instructions for Farmer / Driver',
      notesPlaceholder: 'e.g. Pack in standard crates, call before arrival',
      subtotal: 'Produce Subtotal:',
      estLogistics: 'Co-op Transport Fee:',
      totalPrice: 'Total Payable:',
      confirmBtn: 'Confirm & Place Order',
      cancelBtn: 'Cancel',
    },
    orderStatus: {
      PENDING: 'Order Sent ⏳',
      ACCEPTED: 'Farmer Confirmed 👨‍🌾',
      READY_FOR_PICKUP: 'Packed for Dispatch 📦',
      IN_TRANSIT: 'In Transit 🚛',
      DELIVERED: 'Delivered ✅',
    },
  },
  si: {
    dashboardTitle: 'නැවුම් කෘෂි අස්වැන්න වෙළඳපොළ',
    tagline: 'ගොවිපලෙන්ම කෙළින්ම ඔබේ දොරකඩටම',
    searchPlaceholder: 'එළවළු, පලතුරු, ධාන්‍ය හෝ ගොවියා සොයන්න...',
    categories: ['සියල්ල', 'එළවළු', 'පලතුරු', 'ධාන්‍ය', 'කුළුබඩු'],
    tabs: {
      market: 'නැවුම් වෙළඳපොළ',
      customRequests: 'විශේෂ ඉල්ලුම්',
      myOrders: 'මගේ ඇණවුම් ',
    },
    customRequests: {
      title: 'විශේෂ අස්වනු ඉල්ලුම්',
      subtitle: 'ප්‍රදේශය හා දින වකවානුව අනුව ඔබේ අස්වනු අවශ්‍යතාව පළ කරන්න',
      postBtn: '+ අස්වනු ඉල්ලුමක් යොමු කරන්න',
      bannerTitle: 'විශේෂ බෝගයක් සහ දින වකවානුවක් අවශ්‍යද?',
      bannerSub: 'නුවරඑළියෙන් කැරට් කිලෝ 100ක් වැනි විශේෂ ඉල්ලුම් කෙලින්ම ගොවීන්ගෙන් ඉල්ලන්න!',
      bannerBtn: 'ඉල්ලුම පළ කරන්න 📢',
      emptyTitle: 'තවමත් කිසිදු විශේෂ ඉල්ලුමක් නැත',
      emptySub: 'ඔබට අවශ්‍ය විශේෂ අස්වැන්න පිළිබඳ ගොවීන් දැනුවත් කිරීමට ඉල්ලුමක් පළ කරන්න.',
      cancelBtn: 'ඉල්ලුම අවලංගු කරන්න',
      cancelConfirm: 'මෙම ඉල්ලුම අවලංගු කිරීමට ඔබට සහතිකද?',
      targetDistrict: 'ප්‍රදේශය / දිස්ත්‍රික්කය:',
      datePeriod: 'දින වකවානුව:',
      targetPrice: 'බලාපොරොත්තු මිල:',
      quality: 'තත්ත්ව ශ්‍රේණිය:',
      destination: 'භාරදිය යුතු ස්ථානය:',
      statusOpen: '⏳ විවෘත ඉල්ලුමක්',
    },
    labels: {
      farmer: 'ගොවියා:',
      location: 'ස්ථානය:',
      inStock: 'තොග ඇත',
      grade: 'තත්ත්වය:',
      orderBtn: 'ඇණවුම් කරන්න',
      currency: 'රු.',
      logout: 'ඉවත් වන්න',
    },
    modal: {
      title: 'කෙලින්ම ගොවියාගෙන් ඇණවුම් කරන්න',
      qtyLabel: 'ප්‍රමාණය තෝරන්න',
      deliveryLabel: 'භාරදිය යුතු ලිපිනය',
      deliveryPlaceholder: 'උදා: අංක 45, ගාලු පාර, කොළඹ 03',
      notesLabel: 'විශේෂ උපදෙස්',
      notesPlaceholder: 'උදා: ආරක්ෂිතව අසුරන්න',
      subtotal: 'අස්වනු වටිනාකම:',
      estLogistics: 'ප්‍රවාහන ගාස්තුව:',
      totalPrice: 'මුළු මුදල:',
      confirmBtn: 'ඇණවුම තහවුරු කරන්න',
      cancelBtn: 'අවලංගු කරන්න',
    },
    orderStatus: {
      PENDING: 'ඇණවුම යොමු කළා ⏳',
      ACCEPTED: 'ගොවියා පිළිගත්තා 👨‍🌾',
      READY_FOR_PICKUP: 'පැටවීමට සූදානම් 📦',
      IN_TRANSIT: 'ප්‍රවාහනයේ පවතී 🚛',
      DELIVERED: 'භාරදුන්නා ✅',
    },
  },
  ta: {
    dashboardTitle: 'புதிய விவசாய சந்தை',
    tagline: 'பண்ணையிலிருந்து நேரடியாக உங்கள் வீட்டு வாசலுக்கு',
    searchPlaceholder: 'காய்கறிகள், பழங்கள் அல்லது விவசாயியைத் தேடுங்கள்...',
    categories: ['அனைத்தும்', 'காய்கறிகள்', 'பழங்கள்', 'தானியங்கள்', 'மசாலா'],
    tabs: {
      market: 'சந்தை',
      customRequests: 'விசேட கோரிக்கைகள்',
      myOrders: 'என் ஆர்டர்கள்',
    },
    customRequests: {
      title: 'விசேட விளைச்சல் கோரிக்கைகள்',
      subtitle: 'பகுதி மற்றும் திகதி அடிப்படையில் உங்கள் தேவையை குறிப்பிடுங்கள்',
      postBtn: '+ கோரிக்கை உருவாக்கவும்',
      bannerTitle: 'குறிப்பிட்ட பயிர் & திகதி தேவையா?',
      bannerSub: 'விவசாயிகளிடம் நேரடியாக விசேட விளைச்சல் கோரிக்கைகளை அனுப்புங்கள்!',
      bannerBtn: 'கோரிக்கையை அனுப்புக 📢',
      emptyTitle: 'கோரிக்கைகள் எதுவும் இல்லை',
      emptySub: 'உங்களுக்குத் தேவையான பயிரைக் கோர புதிய கோரிக்கையை உருவாக்கவும்.',
      cancelBtn: 'ரத்து செய்',
      cancelConfirm: 'இந்த கோரிக்கையை நிச்சயமாக ரத்து செய்ய விரும்புகிறீர்களா?',
      targetDistrict: 'மாவட்டம்:',
      datePeriod: 'திகதி காலம்:',
      targetPrice: 'எதிர்பார்க்கப்படும் விலை:',
      quality: 'தரம்:',
      destination: 'விநியோக இடம்:',
      statusOpen: '⏳ அனுப்பப்பட்டது (விசாரணை)',
    },
    labels: {
      farmer: 'விவசாயி:',
      location: 'இடம்:',
      inStock: 'இருப்பில் உள்ளது',
      grade: 'தரம்:',
      orderBtn: 'ஆர்டர் செய்',
      currency: 'ரூ.',
      logout: 'வெளியேறு',
    },
    modal: {
      title: 'விவசாயியிடம் நேரடியாக ஆர்டர் செய்யுங்கள்',
      qtyLabel: 'அளவைத் தேர்ந்தெடுக்கவும்',
      deliveryLabel: 'விநியோக முகவரி',
      deliveryPlaceholder: 'e.g. No 45, Galle Road, Colombo 03',
      notesLabel: 'குறிப்புகள்',
      notesPlaceholder: 'e.g. Call upon arrival',
      subtotal: 'மொத்த விலை:',
      estLogistics: 'போக்குவரத்து கட்டணம்:',
      totalPrice: 'செலுத்த வேண்டிய தொகை:',
      confirmBtn: 'ஆர்டரை உறுதிப்படுத்தவும்',
      cancelBtn: 'ரத்து செய்',
    },
    orderStatus: {
      PENDING: 'ஆர்டர் அனுப்பப்பட்டது ⏳',
      ACCEPTED: 'உறுதிப்படுத்தப்பட்டது 👨‍🌾',
      READY_FOR_PICKUP: 'தயாராக உள்ளது 📦',
      IN_TRANSIT: 'பயணத்தில் உள்ளது 🚛',
      DELIVERED: 'முடிந்தது ✅',
    },
  },
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
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'customRequests' | 'myOrders'
  const [showRequestScreen, setShowRequestScreen] = useState(false);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [detailProduce, setDetailProduce] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQty, setOrderQty] = useState(5);
  const [deliveryAddress, setDeliveryAddress] = useState(
    userProfile?.district?.nameEn ? `${userProfile.district.nameEn} Central Outlet` : 'Colombo 03'
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Real-time listener for buyer's own custom requests
  useEffect(() => {
    const unsub = subscribeToBuyerRequests((requests) => {
      setBuyerRequests(requests || []);
    }, userProfile?.uid);

    return () => unsub && unsub();
  }, [userProfile?.uid]);

  const handleDeleteRequest = (requestId, cropName) => {
    Alert.alert(
      t.customRequests.cancelBtn,
      `${t.customRequests.cancelConfirm} (${cropName})`,
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
    if (lang === 'si') return item.nameSi || item.nameEn;
    if (lang === 'ta') return item.nameTa || item.nameEn;
    return item.nameEn;
  };

  const getProduceUnit = (item) => {
    if (!item) return 'kg';
    if (lang === 'si') return item.unitSi || item.unitEn || 'කි.ග්‍රෑ.';
    if (lang === 'ta') return item.unitTa || item.unitEn || 'கிலோ';
    return item.unitEn || 'kg';
  };

  // Filter & sort listings based on search, category, origin district & selected sort
  const filteredListings = produceListings
    .filter((item) => {
      const title = getProduceTitle(item).toLowerCase();
      const farmer = (item.farmerName || '').toLowerCase();
      const loc = (item.location || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        title.includes(query) || farmer.includes(query) || loc.includes(query) || desc.includes(query);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 0) {
        const itemCat = (item.category || 'Vegetables').toLowerCase();
        if (selectedCategory === 1 && !itemCat.includes('veg')) return false;
        if (selectedCategory === 2 && !itemCat.includes('fruit')) return false;
        if (selectedCategory === 3 && !(itemCat.includes('rice') || itemCat.includes('grain'))) return false;
        if (selectedCategory === 4 && !itemCat.includes('spice')) return false;
      }

      // Origin District filter
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
      // Fallback: newest first
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

  // Filter buyer's own orders
  const myBuyerOrders = ordersList.filter(
    (o) => !o.buyerPhone || o.buyerPhone === userProfile?.phoneNumber || o.buyerName === userProfile?.fullName || true
  );

  const handleOpenDetailModal = (item) => {
    setDetailProduce(item);
    setShowDetailModal(true);
  };

  const handleOpenOrderFromDetail = () => {
    const produceToOrder = detailProduce;
    setShowDetailModal(false);
    if (produceToOrder) {
      handleOpenOrderModal(produceToOrder);
    }
  };

  const handleOpenOrderModal = (item) => {
    setSelectedProduce(item);
    setOrderQty(Math.min(5, Math.max(1, Math.floor((item.stockQty || 10) / 10) || 5)));
    setShowOrderModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduce) return;
    if (orderQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please select at least 1 unit.');
      return;
    }

    setIsPlacingOrder(true);
    const produceName = getProduceTitle(selectedProduce);
    const unitPrice = selectedProduce.price || 0;
    const subtotal = unitPrice * orderQty;
    const logisticsFee = 350;
    const totalAmount = subtotal + logisticsFee;

    const orderPayload = {
      produceId: selectedProduce.id,
      produceName,
      qty: orderQty,
      unit: getProduceUnit(selectedProduce),
      unitPrice,
      subtotal,
      logisticsFee,
      totalPrice: totalAmount,
      farmerName: selectedProduce.farmerName || 'Registered Farmer',
      farmerId: selectedProduce.farmerId || 'farmer_uid',
      pickupLocation: selectedProduce.location || 'Farm Origin',
      buyerName: userProfile?.fullName || 'GoviLink Buyer',
      buyerPhone: userProfile?.phoneNumber || '',
      buyerUid: userProfile?.uid || '',
      deliveryAddress: deliveryAddress.trim() || 'Default Address',
      deliveryNotes: deliveryNotes.trim(),
      status: 'PENDING',
    };

    const res = await placeOrderInFirestore(orderPayload);
    setIsPlacingOrder(false);

    if (res.success) {
      setShowOrderModal(false);
      Alert.alert(
        'Order Placed! 🌾✨',
        `Your order for ${orderQty} ${getProduceUnit(selectedProduce)} of ${produceName} was placed successfully.\nThe farmer and cooperative logistics have been alerted!`,
        [
          {
            text: 'Track Order',
            onPress: () => setActiveTab('myOrders'),
          },
          { text: 'OK' },
        ]
      );
    } else {
      Alert.alert('Order Failed', `Could not complete order: ${res.error}`);
    }
  };

  if (showRequestScreen) {
    return (
      <BuyerRequestProduceScreen
        userProfile={userProfile}
        lang={lang}
        onBack={() => setShowRequestScreen(false)}
        onRequestSubmitted={() => {
          setShowRequestScreen(false);
          setActiveTab('customRequests');
        }}
      />
    );
  }

  if (showProfileScreen) {
    return (
      <UserProfileScreen
        userProfile={userProfile}
        lang={lang}
        onBack={() => setShowProfileScreen(false)}
        onLogout={onLogout}
        onChangeLanguage={onChangeLanguage}
        onProfileUpdated={(updated) => {
          if (onProfileUpdated) onProfileUpdated(updated);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* TOP HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => setShowProfileScreen(true)}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.logoBadge}
            resizeMode="contain"
          />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.brandGovi}>Govi</Text>
              <Text style={styles.brandLink}>Link</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>🛒 Buyer</Text>
              </View>
            </View>
            <Text style={styles.buyerWelcome} numberOfLines={1}>
              Hi, {userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'Buyer'} • 📍 {userProfile?.district?.nameEn || 'Colombo'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          {/* Active Orders Pill */}
          <TouchableOpacity
            style={styles.ordersPill}
            onPress={() => setActiveTab('myOrders')}
          >
            <Text style={styles.ordersPillText}>
              📦 {myBuyerOrders.length}
            </Text>
          </TouchableOpacity>

          {/* Language Switcher Pill */}
          {onChangeLanguage && (
            <TouchableOpacity
              style={styles.langPill}
              onPress={() => {
                const nextLang = lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en';
                onChangeLanguage(nextLang);
              }}
            >
              <Text style={styles.langPillText}>
                {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>{t.labels.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* TAB SWITCHER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'market' && styles.tabBtnActive]}
            onPress={() => setActiveTab('market')}
          >
            <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
              🌾 {t.tabs.market}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'customRequests' && styles.tabBtnActive]}
            onPress={() => setActiveTab('customRequests')}
          >
            <Text style={[styles.tabText, activeTab === 'customRequests' && styles.tabTextActive]}>
              📋 {t.tabs.customRequests}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'myOrders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('myOrders')}
          >
            <Text style={[styles.tabText, activeTab === 'myOrders' && styles.tabTextActive]}>
              📦 {t.tabs.myOrders}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================== */}
        {/* TAB 1: FRESH MARKETPLACE BROWSE & SEARCH       */}
        {/* ============================================== */}
        {activeTab === 'market' && (
          <View>
            {/* Direct Sourcing Banner */}
            <View style={styles.requestBannerCard}>
              <View style={styles.requestBannerLeft}>
                <View style={styles.requestBannerBadgeRow}>
                  <Text style={styles.requestBannerBadge}>✨ DIRECT SOURCING</Text>
                </View>
                <Text style={styles.requestBannerTitle}>{t.customRequests.bannerTitle}</Text>
                <Text style={styles.requestBannerSub}>{t.customRequests.bannerSub}</Text>
              </View>
              <TouchableOpacity
                style={styles.requestBannerBtn}
                activeOpacity={0.85}
                onPress={() => setShowRequestScreen(true)}
              >
                <Text style={styles.requestBannerBtnText}>{t.customRequests.bannerBtn}</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input Box */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Chips Scroll */}
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

            {/* District / Origin Filter Scroll */}
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

            {/* Sort Selector Scroll */}
            <View style={styles.filterSectionRow}>
              <Text style={styles.filterSectionTitle}>⚡ Sort By:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {SORT_OPTIONS.map((sortOpt) => {
                  const label =
                    lang === 'si'
                      ? sortOpt.labelSi
                      : lang === 'ta'
                        ? sortOpt.labelTa
                        : sortOpt.labelEn;
                  return (
                    <TouchableOpacity
                      key={sortOpt.id}
                      onPress={() => setSortBy(sortOpt.id)}
                      style={[
                        styles.sortChip,
                        sortBy === sortOpt.id && styles.sortChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortChipText,
                          sortBy === sortOpt.id && styles.sortChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.marketTitleRow}>
              <Text style={styles.sectionHeader}>{t.dashboardTitle}</Text>
              <Text style={styles.itemCountText}>{filteredListings.length} available</Text>
            </View>

            {/* Produce Cards */}
            {filteredListings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No matching produce found</Text>
                <Text style={styles.emptySubtitle}>Try changing your search term, origin district, or category filter.</Text>
              </View>
            ) : (
              filteredListings.map((item) => {
                const stockVal = Number(item.stockQty || 0);
                const isOutOfStock = stockVal <= 0;
                const isLimited = stockVal > 0 && stockVal <= 20;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.produceCard}
                    activeOpacity={0.9}
                    onPress={() => handleOpenDetailModal(item)}
                  >
                    <Image source={{ uri: item.image }} style={styles.produceImage} resizeMode="cover" />
                    <View style={styles.produceDetails}>
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.stockBadge,
                            isOutOfStock && { backgroundColor: '#FEE2E2' },
                            isLimited && { backgroundColor: THEME.warningLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockBadgeText,
                              isOutOfStock && { color: THEME.danger },
                              isLimited && { color: THEME.warning },
                            ]}
                          >
                            {isOutOfStock
                              ? '🔴 Out of Stock'
                              : isLimited
                                ? `🟡 Low Stock (${stockVal} ${getProduceUnit(item)})`
                                : `✓ In Stock (${stockVal} ${getProduceUnit(item)})`}
                          </Text>
                        </View>
                        <Text style={styles.locationText}>📍 {item.location || 'Sri Lanka'}</Text>
                      </View>

                      <Text style={styles.produceName}>{getProduceTitle(item)}</Text>

                      {item.grade ? (
                        <Text style={styles.gradeBadge}>🌿 Grade: {item.grade}</Text>
                      ) : null}

                      <Text style={styles.farmerSubText}>
                        {t.labels.farmer}{' '}
                        <Text style={{ fontWeight: '600', color: THEME.textDark }}>
                          {item.farmerName || 'Local Cooperative'}
                        </Text>
                      </Text>

                      <View style={styles.priceRow}>
                        <View>
                          <Text style={styles.priceText}>
                            {t.labels.currency} {Number(item.price).toFixed(2)}
                          </Text>
                          <Text style={styles.unitSub}>per {getProduceUnit(item)}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.detailBtn}
                            activeOpacity={0.8}
                            onPress={() => handleOpenDetailModal(item)}
                          >
                            <Text style={styles.detailBtnText}>👁️ View</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.orderButton, isOutOfStock && { backgroundColor: '#94A3B8' }]}
                            disabled={isOutOfStock}
                            activeOpacity={0.85}
                            onPress={() => handleOpenOrderModal(item)}
                          >
                            <Text style={styles.orderButtonText}>🛒 {t.labels.orderBtn}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ============================================== */}
        {/* TAB 2: CUSTOM HARVEST REQUESTS & BROADCASTS    */}
        {/* ============================================== */}
        {activeTab === 'customRequests' && (
          <View>
            <View style={styles.requestsHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeader}>{t.customRequests.title}</Text>
                <Text style={styles.sectionSubText}>{t.customRequests.subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.newRequestTopBtn}
                onPress={() => setShowRequestScreen(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.newRequestTopBtnText}>{t.customRequests.postBtn}</Text>
              </TouchableOpacity>
            </View>

            {buyerRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>{t.customRequests.emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{t.customRequests.emptySub}</Text>
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
                      <Text style={styles.reqCropIcon}>
                        {req.cropName?.toLowerCase().includes('carrot')
                          ? '🥕'
                          : req.cropName?.toLowerCase().includes('potato')
                            ? '🥔'
                            : req.cropName?.toLowerCase().includes('leek')
                              ? '🌱'
                              : req.cropName?.toLowerCase().includes('tomato')
                                ? '🍅'
                                : req.cropName?.toLowerCase().includes('cabbage')
                                  ? '🥬'
                                  : req.cropName?.toLowerCase().includes('rice')
                                    ? '🌾'
                                    : req.cropName?.toLowerCase().includes('banana')
                                      ? '🍌'
                                      : req.cropName?.toLowerCase().includes('papaya')
                                        ? '🍈'
                                        : '🌱'}
                      </Text>
                      <View>
                        <Text style={styles.reqCropName}>{req.cropName}</Text>
                        <Text style={styles.reqCategoryBadge}>🏷️ {req.category || 'Vegetables'}</Text>
                      </View>
                    </View>
                    <View style={styles.reqStatusBadge}>
                      <Text style={styles.reqStatusText}>{t.customRequests.statusOpen}</Text>
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
                      <Text style={styles.reqInfoLabel}>📍 {t.customRequests.targetDistrict}</Text>
                      <Text style={styles.reqInfoValue} numberOfLines={1}>
                        {req.targetDistrictName || req.targetDistrictEn || 'Island-wide'}
                        {req.specificArea ? ` (${req.specificArea})` : ''}
                      </Text>
                    </View>
                    <View style={styles.reqInfoItem}>
                      <Text style={styles.reqInfoLabel}>📅 {t.customRequests.datePeriod}</Text>
                      <Text style={styles.reqInfoValue}>
                        {req.datePeriodDescription || `${req.requiredDateStart} to ${req.requiredDateEnd}`}
                      </Text>
                    </View>
                    {req.targetPricePerUnit ? (
                      <View style={styles.reqInfoItem}>
                        <Text style={styles.reqInfoLabel}>💰 {t.customRequests.targetPrice}</Text>
                        <Text style={styles.reqInfoValue}>
                          Rs. {req.targetPricePerUnit} / {req.unit || 'kg'}
                        </Text>
                      </View>
                    ) : null}
                    {req.qualityGrade ? (
                      <View style={styles.reqInfoItem}>
                        <Text style={styles.reqInfoLabel}>✨ {t.customRequests.quality}</Text>
                        <Text style={styles.reqInfoValue} numberOfLines={1}>{req.qualityGrade}</Text>
                      </View>
                    ) : null}
                  </View>

                  {req.notes ? (
                    <View style={styles.reqNotesBox}>
                      <Text style={styles.reqNotesText}>📝 "{req.notes}"</Text>
                    </View>
                  ) : null}

                  <View style={styles.reqFooter}>
                    <Text style={styles.reqDeliveryText} numberOfLines={1}>
                      {req.deliveryNeeded === false ? '🚜 Farm Self-Pickup by Buyer' : `🚚 Deliver to: ${req.deliveryAddress || 'Central Destination'}`}
                    </Text>
                    <TouchableOpacity
                      style={styles.reqDeleteBtn}
                      onPress={() => handleDeleteRequest(req.id, req.cropName)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reqDeleteBtnText}>🗑️ {t.customRequests.cancelBtn}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================== */}
        {/* TAB 3: MY ORDERS & REAL-TIME TRACKING          */}
        {/* ============================================== */}
        {activeTab === 'myOrders' && (
          <View>
            <Text style={styles.sectionHeader}>{t.tabs.myOrders}</Text>
            {myBuyerOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>No orders placed yet</Text>
                <Text style={styles.emptySubtitle}>Browse the marketplace and place your first fresh farm order!</Text>
              </View>
            ) : (
              myBuyerOrders.map((order) => {
                const status = order.status || 'PENDING';
                const statusLabel = t.orderStatus[status] || status;

                return (
                  <View key={order.id} style={styles.buyerOrderCard}>
                    <View style={styles.orderTopHeader}>
                      <View style={styles.orderIdBadge}>
                        <Text style={styles.orderIdText}>
                          ORDER #{order.id ? order.id.slice(-6).toUpperCase() : 'GL-100'}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusPill,
                        status === 'PENDING' && { backgroundColor: THEME.warningLight },
                        status === 'ACCEPTED' && { backgroundColor: THEME.infoLight },
                        status === 'IN_TRANSIT' && { backgroundColor: THEME.warningLight },
                        status === 'DELIVERED' && { backgroundColor: THEME.emeraldLight },
                      ]}>
                        <Text style={[
                          styles.statusPillText,
                          status === 'PENDING' && { color: THEME.warning },
                          status === 'ACCEPTED' && { color: THEME.info },
                          status === 'IN_TRANSIT' && { color: THEME.warning },
                          status === 'DELIVERED' && { color: THEME.emerald },
                        ]}>
                          {statusLabel}
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

                    {/* LIVE TRACKING STEPPER */}
                    <View style={styles.stepperContainer}>
                      <View style={[styles.stepItem, { opacity: 1 }]}>
                        <View style={[styles.stepDot, styles.stepDotActive]} />
                        <Text style={styles.stepText}>Placed</Text>
                      </View>
                      <View style={[styles.stepLine, (status === 'ACCEPTED' || status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepLineActive]} />
                      <View style={[styles.stepItem, (status === 'ACCEPTED' || status === 'IN_TRANSIT' || status === 'DELIVERED') ? { opacity: 1 } : { opacity: 0.4 }]}>
                        <View style={[styles.stepDot, (status === 'ACCEPTED' || status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepDotActive]} />
                        <Text style={styles.stepText}>Confirmed</Text>
                      </View>
                      <View style={[styles.stepLine, (status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepLineActive]} />
                      <View style={[styles.stepItem, (status === 'IN_TRANSIT' || status === 'DELIVERED') ? { opacity: 1 } : { opacity: 0.4 }]}>
                        <View style={[styles.stepDot, (status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepDotActive]} />
                        <Text style={styles.stepText}>In Transit</Text>
                      </View>
                      <View style={[styles.stepLine, status === 'DELIVERED' && styles.stepLineActive]} />
                      <View style={[styles.stepItem, status === 'DELIVERED' ? { opacity: 1 } : { opacity: 0.4 }]}>
                        <View style={[styles.stepDot, status === 'DELIVERED' && styles.stepDotActive]} />
                        <Text style={styles.stepText}>Delivered</Text>
                      </View>
                    </View>

                    <View style={styles.orderFooterTotalRow}>
                      <Text style={styles.orderFooterQty}>
                        Quantity: <Text style={{ fontWeight: 'bold', color: THEME.textDark }}>{order.qty} {order.unit || 'kg'}</Text>
                      </Text>
                      <Text style={styles.orderFooterPrice}>
                        Total: {t.labels.currency} {Number(order.totalPrice || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ============================================== */}
      {/* MODAL: ORDER CONFIRMATION SHEET                */}
      {/* ============================================== */}
      {selectedProduce && (
        <Modal visible={showOrderModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{t.modal.title}</Text>
                <TouchableOpacity onPress={() => setShowOrderModal(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: THEME.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalProduceName}>{getProduceTitle(selectedProduce)}</Text>
                <Text style={styles.modalFarmerText}>
                  👨‍🌾 {selectedProduce.farmerName} • 📍 {selectedProduce.location}
                </Text>

                {/* QUANTITY CONTROLS */}
                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyLabel}>{t.modal.qtyLabel}:</Text>
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

                {/* QUICK QTY CHIPS */}
                <View style={styles.quickQtyRow}>
                  {[5, 10, 25, 50, 100].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.quickQtyPill, orderQty === num && styles.quickQtyPillActive]}
                      onPress={() => setOrderQty(num)}
                    >
                      <Text style={[styles.quickQtyText, orderQty === num && styles.quickQtyTextActive]}>
                        {num} {getProduceUnit(selectedProduce)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* DESTINATION INPUT */}
                <Text style={styles.fieldLabel}>{t.modal.deliveryLabel}</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder={t.modal.deliveryPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />

                {/* SPECIAL NOTES */}
                <Text style={styles.fieldLabel}>{t.modal.notesLabel}</Text>
                <TextInput
                  style={[styles.inputField, { height: 60 }]}
                  placeholder={t.modal.notesPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  multiline
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                />

                {/* BREAKDOWN */}
                <View style={styles.priceBreakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{t.modal.subtotal}</Text>
                    <Text style={styles.breakdownValue}>
                      {t.labels.currency} {((selectedProduce.price || 0) * orderQty).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{t.modal.estLogistics}</Text>
                    <Text style={styles.breakdownValue}>{t.labels.currency} 350.00</Text>
                  </View>
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={styles.totalLabel}>{t.modal.totalPrice}</Text>
                    <Text style={styles.totalVal}>
                      {t.labels.currency} {(((selectedProduce.price || 0) * orderQty) + 350).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowOrderModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>{t.modal.cancelBtn}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    disabled={isPlacingOrder}
                    onPress={handleConfirmOrder}
                  >
                    {isPlacingOrder ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.modalBtnConfirmText}>{t.modal.confirmBtn}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ============================================== */}
      {/* MODAL: PRODUCT DETAILS SHEET                   */}
      {/* ============================================== */}
      {detailProduce && (
        <Modal visible={showDetailModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '92%' }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>🌾 Produce Overview</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: THEME.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {detailProduce.image ? (
                  <Image
                    source={{ uri: detailProduce.image }}
                    style={styles.detailCoverImage}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.modalProduceName}>{getProduceTitle(detailProduce)}</Text>
                    <Text style={styles.detailPriceTag}>
                      {t.labels.currency} {Number(detailProduce.price).toFixed(2)} / {getProduceUnit(detailProduce)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8, flexWrap: 'wrap' }}>
                    <View style={styles.detailChipBadge}>
                      <Text style={styles.detailChipBadgeText}>🏷️ {detailProduce.category || 'Vegetables'}</Text>
                    </View>
                    {detailProduce.grade ? (
                      <View style={[styles.detailChipBadge, { backgroundColor: THEME.emeraldLight }]}>
                        <Text style={[styles.detailChipBadgeText, { color: THEME.emeraldDark }]}>🌿 {detailProduce.grade}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.detailChipBadge, { backgroundColor: THEME.infoLight }]}>
                      <Text style={[styles.detailChipBadgeText, { color: THEME.info }]}>📍 {detailProduce.location || 'Sri Lanka'}</Text>
                    </View>
                  </View>
                </View>

                {/* FARMER PROFILE CARD */}
                <View style={styles.farmerProfileBox}>
                  <Text style={styles.farmerBoxTitle}>👨‍🌾 Grower & Origin Info</Text>
                  <Text style={styles.farmerBoxName}>{detailProduce.farmerName || 'Registered GoviLink Farmer'}</Text>
                  <Text style={styles.farmerBoxSub}>
                    📍 Farm Location: {detailProduce.location || 'Sri Lanka'}
                  </Text>
                  <Text style={styles.farmerBoxSub}>
                    🛡️ Quality Verification: Certified Co-op Member
                  </Text>
                </View>

                {/* STOCK & HARVEST SPECS */}
                <View style={styles.specsGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Available Stock</Text>
                    <Text style={styles.specVal}>
                      {detailProduce.stockQty || 0} {getProduceUnit(detailProduce)}
                    </Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Unit Price</Text>
                    <Text style={styles.specVal}>
                      Rs. {Number(detailProduce.price || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Harvest State</Text>
                    <Text style={styles.specVal}>
                      {Number(detailProduce.stockQty) > 20 ? '🟢 Fresh In Stock' : Number(detailProduce.stockQty) > 0 ? '🟡 Low Stock' : '🔴 Out of Stock'}
                    </Text>
                  </View>
                </View>

                {/* DESCRIPTION */}
                {detailProduce.description ? (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionTitle}>📝 Sourcing & Crop Notes</Text>
                    <Text style={styles.descriptionText}>{detailProduce.description}</Text>
                  </View>
                ) : (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionTitle}>📝 Harvest Overview</Text>
                    <Text style={styles.descriptionText}>
                      Fresh farm produce grown and harvested with high quality standards. Transport and direct delivery managed by cooperative logistics.
                    </Text>
                  </View>
                )}

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm, Number(detailProduce.stockQty || 0) <= 0 && { backgroundColor: '#94A3B8' }]}
                    disabled={Number(detailProduce.stockQty || 0) <= 0}
                    onPress={handleOpenOrderFromDetail}
                  >
                    <Text style={styles.modalBtnConfirmText}>🛒 Proceed to Order</Text>
                  </TouchableOpacity>
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
    backgroundColor: THEME.navy,
  },
  headerBar: {
    backgroundColor: THEME.navy,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  brandGovi: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandLink: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.accentLeaf,
  },
  roleTag: {
    backgroundColor: THEME.emerald,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buyerWelcome: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ordersPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  ordersPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  langPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  scrollContainer: {
    backgroundColor: THEME.bg,
    padding: 16,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: THEME.cardBg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  tabTextActive: {
    color: THEME.navy,
    fontWeight: 'bold',
  },

  // Search & Filter
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.textDark,
  },
  chipScrollView: {
    marginBottom: 14,
  },
  categoryChip: {
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryChipActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy,
  },
  categoryChipText: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  marketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  itemCountText: {
    fontSize: 11,
    color: THEME.textMuted,
  },

  // Cards
  produceCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  produceImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E2E8F0',
  },
  produceDetails: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockBadge: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: THEME.emeraldDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  produceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginVertical: 4,
  },
  gradeBadge: {
    fontSize: 11,
    color: THEME.emeraldDark,
    marginBottom: 4,
  },
  farmerSubText: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
  },
  priceText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  unitSub: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  orderButton: {
    backgroundColor: THEME.emerald,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Buyer Orders
  buyerOrderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orderTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdBadge: {
    backgroundColor: THEME.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderProduceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 6,
  },
  buyerOrderDetailsRow: {
    marginBottom: 10,
  },
  buyerOrderSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 2,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.bg,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: THEME.emerald,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginTop: -14,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: THEME.emerald,
  },
  stepText: {
    fontSize: 9,
    color: THEME.textMuted,
    fontWeight: '600',
  },

  orderFooterTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 8,
    marginTop: 4,
  },
  orderFooterQty: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  orderFooterPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },

  // Empty
  emptyCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProduceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  modalFarmerText: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 14,
  },
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textDark,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 34,
    height: 34,
    backgroundColor: THEME.bg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  qtyValText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: THEME.navy,
  },
  quickQtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickQtyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  quickQtyPillActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy,
  },
  quickQtyText: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  quickQtyTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 4,
    marginTop: 6,
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
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  totalVal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: THEME.bg,
  },
  modalBtnCancelText: {
    color: THEME.textMuted,
    fontWeight: 'bold',
  },
  modalBtnConfirm: {
    backgroundColor: THEME.emerald,
    flex: 2,
  },
  modalBtnConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  // ----------------------------------------------------
  // DIRECT SOURCING BANNER & CUSTOM REQUESTS
  // ----------------------------------------------------
  requestBannerCard: {
    backgroundColor: THEME.navy,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  requestBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  requestBannerBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  requestBannerBadge: {
    backgroundColor: THEME.emerald,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  requestBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  requestBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  requestBannerBtn: {
    backgroundColor: THEME.emerald,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  requestsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionSubText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  newRequestTopBtn: {
    backgroundColor: THEME.emerald,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newRequestTopBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  customRequestCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reqCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqCropIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  reqCropName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.textDark,
  },
  reqCategoryBadge: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  reqStatusBadge: {
    backgroundColor: THEME.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reqStatusText: {
    color: THEME.warning,
    fontSize: 11,
    fontWeight: '800',
  },

  reqInfoGrid: {
    backgroundColor: THEME.bg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  reqInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  reqInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textDark,
    maxWidth: '65%',
    textAlign: 'right',
  },
  reqNotesBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: THEME.emerald,
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  reqNotesText: {
    fontSize: 11,
    color: THEME.textMuted,
    fontStyle: 'italic',
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 8,
  },
  reqDeliveryText: {
    fontSize: 11,
    color: THEME.textMuted,
    flex: 1,
    marginRight: 8,
  },
  reqDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  reqDeleteBtnText: {
    color: THEME.danger,
    fontSize: 11,
    fontWeight: '700',
  },

  // Search Clear & Filtering Styles
  clearSearchBtn: {
    padding: 4,
    marginLeft: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: 'bold',
  },
  filterSectionRow: {
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.navy,
    marginBottom: 2,
  },
  districtChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  districtChipActive: {
    backgroundColor: THEME.emerald,
    borderColor: THEME.emerald,
  },
  districtChipText: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  districtChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sortChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sortChipActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy,
  },
  sortChipText: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  detailBtn: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  detailBtnText: {
    color: THEME.navy,
    fontWeight: '700',
    fontSize: 12,
  },

  // Product Details Modal Styles
  detailCoverImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  detailPriceTag: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  detailChipBadge: {
    backgroundColor: THEME.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailChipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  farmerProfileBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  farmerBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 4,
  },
  farmerBoxName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 2,
  },
  farmerBoxSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  specBox: {
    flex: 1,
    backgroundColor: THEME.bg,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  specLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  specVal: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.navy,
  },
  descriptionSection: {
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: THEME.textMuted,
    lineHeight: 18,
  },
});


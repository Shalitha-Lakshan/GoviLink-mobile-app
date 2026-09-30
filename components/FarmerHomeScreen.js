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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../services/i18n';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  addProduceListing,
  deleteProduceListing,
  updateOrderStatus,
  subscribeToBuyerRequests,
  acceptBuyerCustomRequest,
} from '../services/firebaseDatabase';
import AddProduceScreen from './AddProduceScreen';
import UserProfileScreen from './UserProfileScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';

// ----------------------------------------------------
// THEME COLORS & DESIGN TOKENS
// ----------------------------------------------------
const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
  emeraldDark: '#15803D',
  emeraldLight: '#E8F5E9',
  accentLeaf: '#2ECC71',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#F3E8FF',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
};

// ----------------------------------------------------
// LOCALIZATION DICTIONARY (EN, SI, TA)
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Farmer Dashboard',
    tagline: 'Farm Harvest & Orders Hub',
    verifiedBadge: 'SL-GAP Certified Grower 🧑‍🌾',
    welcomeCard: {
      greeting: 'Ayubowan,',
      farmer: 'Farmer Partner',
      hub: 'Nuwara Eliya Co-op • Region 4',
    },
    mainCta: '+ Add New Produce',
    overview: {
      title: 'Quick Overview',
      activeHarvests: 'Active Harvests',
      incomingRequests: 'Incoming Requests',
      acceptedOrders: 'Accepted Orders',
      totalEarnings: 'Total Earnings',
    },
    activeHarvests: {
      title: 'Active Harvests',
      viewAll: 'View All Harvests ➔',
      emptyTitle: 'You have not added any produce yet',
      emptySub: 'Publish your fresh crop harvest to buyers across Sri Lanka.',
      addBtn: '+ Add New Produce',
    },
    buyerRequests: {
      title: 'Recent Buyer Requests',
      viewAll: 'View All Requests ➔',
      reviewBtn: 'Review Request 🔍',
      acceptBtn: 'Accept Request ✅',
      rejectBtn: 'Reject Request ❌',
      emptyTitle: 'No buyer requests yet',
      emptySub: 'Inquiries from commercial buyers matching your region will appear here.',
    },
    transport: {
      title: 'Transport Status',
      emptyTitle: 'No active transport requests',
      emptySub: 'Transport updates for dispatched crop orders will appear here.',
      viewTransportBtn: 'View Transport 🚚',
    },
    earnings: {
      title: 'Farmer Earnings Summary',
      monthSpent: 'Earnings This Month',
      pending: 'Pending Payments',
      completed: 'Completed Sales',
      viewEarningsBtn: 'View Earnings 💳',
    },
    nav: {
      dashboard: 'Dashboard',
      harvest: 'Harvest',
      requests: 'Requests',
      orders: 'Orders',
      earnings: 'Earnings',
    },
    filterTabs: {
      all: 'All',
      active: 'Active',
      sold: 'Sold',
      completed: 'Completed',
      new: 'New',
      accepted: 'Accepted',
      rejected: 'Rejected',
      pending: 'Pending',
      transport: 'Transport',
    },
    modals: {
      produceDetailsTitle: 'Produce Harvest Details',
      requestDetailsTitle: 'Buyer Request Details',
      orderDetailsTitle: 'Order & Dispatch Details',
      notifTitle: 'Farmer Notifications 🔔',
      acceptConfirmTitle: 'Accept Buyer Request?',
      acceptConfirmMsg: 'Are you sure you want to commit to supplying this harvest order?',
      rejectConfirmTitle: 'Reject Buyer Request?',
      rejectConfirmMsg: 'Are you sure you want to decline this request?',
    },
    statusBadges: {
      available: 'Available',
      lowStock: 'Low Stock',
      soldOut: 'Sold Out',
      open: 'Open Inquiry',
      accepted: 'Accepted',
      rejected: 'Rejected',
      inTransit: 'In Transit',
      delivered: 'Delivered',
    },
  },
  si: {
    dashboardTitle: 'ගොවි පුවරුව',
    tagline: 'අස්වනු සහ ඇණවුම් කළමනාකරණය',
    verifiedBadge: 'SL-GAP සහතිකලත් ගොවියා 🧑‍🌾',
    welcomeCard: {
      greeting: 'ආයුබෝවන්,',
      farmer: 'ගොවි සහකරු',
      hub: 'නුවරඑළිය සමූපකාරය • කලාපය 4',
    },
    mainCta: '+ අලුත් අස්වැන්නක් එක් කරන්න',
    overview: {
      title: 'ඉක්මන් සමාලෝචනය',
      activeHarvests: 'සක්‍රිය අස්වැන්න',
      incomingRequests: 'ලැබුණු ඉල්ලුම්',
      acceptedOrders: 'භාරගත් ඇණවුම්',
      totalEarnings: 'මුළු ආදායම',
    },
    activeHarvests: {
      title: 'සක්‍රිය අස්වනු',
      viewAll: 'සියලුම අස්වනු බලන්න ➔',
      emptyTitle: 'ඔබ තවමත් අස්වැන්නක් ඇතුළත් කර නැත',
      emptySub: 'ඔබේ නැවුම් කෘෂි අස්වැන්න වෙළඳපොළට එක් කරන්න.',
      addBtn: '+ අලුත් අස්වැන්නක් එක් කරන්න',
    },
    buyerRequests: {
      title: 'ලැබුණු ගැනුම්කරුවන්ගේ ඉල්ලුම්',
      viewAll: 'සියලුම ඉල්ලුම් බලන්න ➔',
      reviewBtn: 'විමර්ශනය කරන්න 🔍',
      acceptBtn: 'ඉල්ලුම භාරගන්න ✅',
      rejectBtn: 'ප්‍රතික්ෂේප කරන්න ❌',
      emptyTitle: 'ගැනුම්කරුවන්ගේ ඉල්ලුම් තවමත් නැත',
      emptySub: 'ඔබේ ප්‍රදේශයට අදාළ නව ඉල්ලුම් මෙහි දිස්වනු ඇත.',
    },
    transport: {
      title: 'ප්‍රවාහන තත්ත්වය',
      emptyTitle: 'සක්‍රිය ප්‍රවාහන ඇණවුම් නැත',
      emptySub: 'ප්‍රවාහනය වන අස්වනු පිළිබඳ විස්තර මෙහි දිස්වේ.',
      viewTransportBtn: 'ප්‍රවාහනය බලන්න 🚚',
    },
    earnings: {
      title: 'ගොවි ආදායම් සාරාංශය',
      monthSpent: 'මේ මාසයේ ආදායම',
      pending: 'ලැබීමට ඇති මුදල්',
      completed: 'සම්පූර්ණ වූ අලෙවි',
      viewEarningsBtn: 'ආදායම් බලන්න 💳',
    },
    nav: {
      dashboard: 'මුල් පිටුව',
      harvest: 'අස්වැන්න',
      requests: 'ඉල්ලීම්',
      orders: 'ඇණවුම්',
      earnings: 'ආදායම්',
    },
    filterTabs: {
      all: 'සියල්ල',
      active: 'සක්‍රිය',
      sold: 'අලෙවි වූ',
      completed: 'නිමකළ',
      new: 'නව',
      accepted: 'භාරගත්',
      rejected: 'ප්‍රතික්ෂේපිත',
      pending: 'බලාපොරොත්තු වන',
      transport: 'ප්‍රවාහන',
    },
    modals: {
      produceDetailsTitle: 'අස්වනු විස්තර',
      requestDetailsTitle: 'ගැනුම්කරුගේ ඉල්ලුම් විස්තර',
      orderDetailsTitle: 'ඇණවුම් විස්තර',
      notifTitle: 'දැනුම්දීම් 🔔',
      acceptConfirmTitle: 'ඉල්ලුම භාරගන්නවාද?',
      acceptConfirmMsg: 'මෙම අස්වනු ඇණවුම සැපයීමට ඔබ එකඟද?',
      rejectConfirmTitle: 'ඉල්ලුම ප්‍රතික්ෂේප කරනවාද?',
      rejectConfirmMsg: 'මෙම ඉල්ලුම අවලංගු කිරීමට ඔබට විශ්වාසද?',
    },
    statusBadges: {
      available: 'ලබාගත හැක',
      lowStock: 'අඩු තොග',
      soldOut: 'අලෙවි වී ඇත',
      open: 'විවෘත ඉල්ලුමක්',
      accepted: 'භාරගත්තා',
      rejected: 'ප්‍රතික්ෂේපිත',
      inTransit: 'මග අතරතුර',
      delivered: 'භාරදුන්නා',
    },
  },
  ta: {
    dashboardTitle: 'விவசாயி டாஷ்போர்டு',
    tagline: 'விளைச்சல் & ஆர்டர் மேலாண்மை',
    verifiedBadge: 'SL-GAP சான்றளிக்கப்பட்ட விவசாயி 🧑‍🌾',
    welcomeCard: {
      greeting: 'வணக்கம்,',
      farmer: 'விவசாயி கூட்டாளர்',
      hub: 'நுவரெலியா கூட்டுறவு • மண்டலம் 4',
    },
    mainCta: '+ புதிய விளைச்சலைச் சேர்க்கவும்',
    overview: {
      title: 'விரைவுப் பார்வை',
      activeHarvests: 'செயலில் உள்ளவை',
      incomingRequests: 'வந்த கோரிக்கைகள்',
      acceptedOrders: 'ஏற்றுக்கொண்டவை',
      totalEarnings: 'மொத்த வருவாய்',
    },
    activeHarvests: {
      title: 'செயலில் உள்ள விளைச்சல்கள்',
      viewAll: 'அனைத்தையும் காண்க ➔',
      emptyTitle: 'விளைச்சல்கள் இன்னும் சேர்க்கப்படவில்லை',
      emptySub: 'உங்கள் புதிய பயிர் விளைச்சலை சந்தையில் சேர்க்கவும்.',
      addBtn: '+ புதிய விளைச்சலைச் சேர்க்கவும்',
    },
    buyerRequests: {
      title: 'வாங்குபவர்களின் கோரிக்கைகள்',
      viewAll: 'அனைத்து கோரிக்கைகள் ➔',
      reviewBtn: 'பரிசீலிக்க 🔍',
      acceptBtn: 'ஏற்றுக்கொள் ✅',
      rejectBtn: 'நிராகரி ❌',
      emptyTitle: 'கோரிக்கைகள் எதுவும் இல்லை',
      emptySub: 'வாங்குபவர்களின் புதிய கோரிக்கைகள் இங்கே தோன்றும்.',
    },
    transport: {
      title: 'போக்குவரத்து நிலை',
      emptyTitle: 'செயலில் உள்ள போக்குவரத்து இல்லை',
      emptySub: 'போக்குவரத்து தகவல்கள் இங்கே தோன்றும்.',
      viewTransportBtn: 'போக்குவரத்தைக் காண்க 🚚',
    },
    earnings: {
      title: 'வருவாய் சுருக்கம்',
      monthSpent: 'இந்த மாத வருவாய்',
      pending: 'நிலுவை தொகைகள்',
      completed: 'முடிந்த விற்பனை',
      viewEarningsBtn: 'வருவாயைக் காண்க 💳',
    },
    nav: {
      dashboard: 'முகப்பு',
      harvest: 'விளைச்சல்',
      requests: 'கோரிக்கைகள்',
      orders: 'ஆர்டர்கள்',
      earnings: 'வருவாய்',
    },
    filterTabs: {
      all: 'அனைத்தும்',
      active: 'செயலில்',
      sold: 'விற்கப்பட்டவை',
      completed: 'முடிந்தவை',
      new: 'புதியவை',
      accepted: 'ஏற்றவை',
      rejected: 'நிராகரித்தவை',
      pending: 'நிலுவையில்',
      transport: 'போக்குவரத்து',
    },
    modals: {
      produceDetailsTitle: 'விளைச்சல் விவரங்கள்',
      requestDetailsTitle: 'கோரிக்கை விவரங்கள்',
      orderDetailsTitle: 'ஆர்டர் விவரங்கள்',
      notifTitle: 'அறிவிப்புகள் 🔔',
      acceptConfirmTitle: 'கோரிக்கையை ஏற்கவா?',
      acceptConfirmMsg: 'இந்த ஆர்டரை வழங்க ஒப்புக்கொள்கிறீர்களா?',
      rejectConfirmTitle: 'கோரிக்கையை நிராகரிக்கவா?',
      rejectConfirmMsg: 'இந்த கோரிக்கையை நிராகரிக்க விரும்புகிறீர்களா?',
    },
    statusBadges: {
      available: 'கிடைக்கும்',
      lowStock: 'குறைந்த இருப்பு',
      soldOut: 'விற்கப்பட்டது',
      open: 'திறந்த கோரிக்கை',
      accepted: 'ஏற்றுக்கொள்ளப்பட்டது',
      rejected: 'நிராகரிக்கப்பட்டது',
      inTransit: 'பயணத்தில்',
      delivered: 'முடிந்தது',
    },
  },
};

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '0';
  const num = Number(val);
  return isNaN(num) ? '0' : num.toLocaleString();
};

export default function FarmerHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const { t: tHook, i18n } = useTranslation();
  const currentLang = i18n.language || lang || 'en';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Navigation & Screen States
  const [activeBottomTab, setActiveBottomTab] = useState('dashboard'); // 'dashboard' | 'harvest' | 'requests' | 'orders' | 'earnings'
  const [harvestFilter, setHarvestFilter] = useState('all'); // 'all' | 'active' | 'sold' | 'completed'
  const [requestsFilter, setRequestsFilter] = useState('all'); // 'all' | 'new' | 'accepted' | 'rejected'
  const [ordersFilter, setOrdersFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'transport' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-screens & Modals
  const [showAddProduceScreen, setShowAddProduceScreen] = useState(false);
  const [editingProduceItem, setEditingProduceItem] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [selectedProduceForDetails, setSelectedProduceForDetails] = useState(null);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Firestore & Real-time State
  const [customRequests, setCustomRequests] = useState([]);
  const [providingRequestId, setProvidingRequestId] = useState(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Mock Notifications for Farmer
  const mockFarmerNotifications = [
    {
      id: 'fn1',
      title: 'New Buyer Request 🌾',
      sub: 'Colombo Buyer requested 250 kg of Nuwara Eliya Leeks.',
      time: '15 mins ago',
    },
    {
      id: 'fn2',
      title: 'Transport Driver Assigned 🚚',
      sub: 'Driver Kamal Perera (WP-LG-4401) assigned for pickup.',
      time: '1 hour ago',
    },
    {
      id: 'fn3',
      title: 'Payment Credited 💳',
      sub: 'Rs. 48,000 credited for Order #ORD-8790.',
      time: 'Yesterday',
    },
  ];

  // Subscribe to real-time buyer custom requests broadcasted across regions
  useEffect(() => {
    const unsub = subscribeToBuyerRequests((requests) => {
      setCustomRequests(requests || []);
    });
    return () => unsub && unsub();
  }, []);

  // Filter produce for logged in farmer
  // Real produce listings for current logged in farmer
  const myProduce = produceListings.filter(
    (item) => item.farmerId === userProfile?.uid
  );

  const activeHarvestListings = myProduce;

  // Real buyer requests for farmer
  const displayRequests = customRequests.filter(
    (r) => !r.farmerId || r.farmerId === userProfile?.uid
  );
  const openRequests = displayRequests.filter((r) => r.status === 'OPEN' || r.status === 'PENDING' || !r.status);

  // Real orders for current logged in farmer
  const myAcceptedOrders = ordersList.filter(
    (o) => o.farmerId === userProfile?.uid
  );

  const displayOrders = myAcceptedOrders;

  // Active Transport Order for Transport Status Card
  const activeTransportOrder = displayOrders.find(
    (o) => o.transportStatus === 'IN_TRANSIT' || o.transportStatus === 'READY_FOR_PICKUP' || o.status === 'ACCEPTED'
  ) || null;

  // Real Earnings Calculations strictly from database
  const completedSalesList = displayOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
  const totalEarningsVal = completedSalesList.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const monthEarningsVal = totalEarningsVal;
  const pendingPaymentsVal = displayOrders
    .filter((o) => o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  // Toggle Language Handler
  const handleToggleLanguage = async () => {
    const nextLang = currentLang === 'en' ? 'si' : currentLang === 'si' ? 'ta' : 'en';
    await changeAppLanguage(nextLang);
    if (onChangeLanguage) {
      onChangeLanguage(nextLang);
    }
  };

  // Accept Buyer Request Flow
  const handleAcceptRequest = (request) => {
    const cropTitle = request.cropName || 'Harvest Batch';
    Alert.alert(
      t.modals.acceptConfirmTitle,
      `${t.modals.acceptConfirmMsg}\n\n📦 ${request.quantity} ${request.unit || 'kg'} of ${cropTitle}\n💰 Offered Price: Rs. ${request.offeredPrice || 200}/kg\n👤 Buyer: ${request.buyerName || 'Commercial Buyer'}\n📍 Destination: ${request.deliveryAddress || 'Central Hub'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t.buyerRequests.acceptBtn,
          onPress: async () => {
            setProvidingRequestId(request.id);
            const res = await acceptBuyerCustomRequest(request, userProfile);
            setProvidingRequestId(null);
            setSelectedRequestForDetails(null);
            Alert.alert('Request Accepted! 🎉', 'You have committed to supplying this harvest. Order & transport dispatch created.');
            setActiveBottomTab('orders');
          },
        },
      ]
    );
  };

  // Reject Buyer Request Flow
  const handleRejectRequest = (request) => {
    Alert.alert(
      t.modals.rejectConfirmTitle,
      t.modals.rejectConfirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t.buyerRequests.rejectBtn,
          style: 'destructive',
          onPress: () => {
            setSelectedRequestForDetails(null);
            Alert.alert('Request Rejected', 'The buyer request was declined.');
          },
        },
      ]
    );
  };

  // Delete Produce Confirmation
  const handleDeleteProduce = (item) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to remove "${item.nameEn || item.nameSi}" from your active harvest listings?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item.id) {
              await deleteProduceListing(item.id);
            }
            setSelectedProduceForDetails(null);
            Alert.alert('Listing Removed 🗑️', 'Produce was removed from GoviLink marketplace.');
          },
        },
      ]
    );
  };

  // Render Status Badge Component
  const renderStatusBadge = (statusStr) => {
    const st = (statusStr || 'AVAILABLE').toUpperCase();
    let label = t.statusBadges.available;
    let bg = THEME.emeraldLight;
    let color = THEME.emeraldDark;

    if (st === 'LOW_STOCK') {
      label = t.statusBadges.lowStock;
      bg = THEME.warningLight;
      color = THEME.warning;
    } else if (st === 'SOLD_OUT') {
      label = t.statusBadges.soldOut;
      bg = THEME.dangerLight;
      color = THEME.danger;
    } else if (st === 'OPEN') {
      label = t.statusBadges.open;
      bg = THEME.infoLight;
      color = THEME.info;
    } else if (st === 'ACCEPTED') {
      label = t.statusBadges.accepted;
      bg = THEME.purpleLight;
      color = THEME.purple;
    } else if (st === 'IN_TRANSIT') {
      label = t.statusBadges.inTransit;
      bg = THEME.cyanLight;
      color = THEME.cyan;
    } else if (st === 'DELIVERED') {
      label = t.statusBadges.delivered;
      bg = THEME.emeraldLight;
      color = THEME.emeraldDark;
    }

    return (
      <View style={[styles.statusBadgePill, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  // Sub-Screen Switching
  if (showAddProduceScreen) {
    return (
      <AddProduceScreen
        userProfile={userProfile}
        lang={currentLang}
        initialProduce={editingProduceItem}
        onBack={() => {
          setShowAddProduceScreen(false);
          setEditingProduceItem(null);
        }}
        onProduceAdded={() => {
          setShowAddProduceScreen(false);
          setEditingProduceItem(null);
          setActiveBottomTab('harvest');
        }}
      />
    );
  }

  if (selectedDeliveryForTracking) {
    return (
      <DeliveryTrackingScreen
        delivery={selectedDeliveryForTracking}
        userProfile={userProfile}
        lang={currentLang}
        onBack={() => setSelectedDeliveryForTracking(null)}
        onLogout={onLogout}
      />
    );
  }

  if (showProfileScreen) {
    return (
      <UserProfileScreen
        userProfile={userProfile}
        lang={currentLang}
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================== */}
      {/* 1. TOP HEADER (COMPACT & UNIFIED BRANDING)            */}
      {/* ==================================================== */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.profileAvatarWrapper}
          onPress={() => setShowProfileScreen(true)}
          activeOpacity={0.8}
        >
          <Image
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : require('../assets/splash-icon.png')
            }
            style={styles.profileAvatar}
          />
        </TouchableOpacity>

        <View style={styles.brandTitleRow}>
          <Text style={styles.brandTitleNavy}>Govi</Text>
          <Text style={styles.brandTitleGreen}>Link</Text>
          <View style={styles.farmerRoleBadge}>
            <Text style={styles.farmerRoleBadgeText}>FARMER</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Language Selector Pill */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={handleToggleLanguage}
            activeOpacity={0.8}
          >
            <Text style={styles.langPillText}>
              {currentLang === 'en' ? 'EN' : currentLang === 'si' ? 'සිං' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>

          {/* Notifications Icon */}
          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.7}
            onPress={() => setShowNotifModal(true)}
          >
            <Ionicons name="notifications-outline" size={20} color={THEME.navy} />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================== */}
      {/* DASHBOARD TAB CONTENT                                */}
      {/* ==================================================== */}
      {activeBottomTab === 'dashboard' && (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. FARMER WELCOME CARD */}
          <View style={styles.welcomeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeGreetingText}>{t.welcomeCard.greeting}</Text>
              <Text style={styles.welcomeFarmerNameText}>
                {userProfile?.fullName || t.welcomeCard.farmer}
              </Text>
              <Text style={styles.welcomeHubText}>
                📍 {userProfile?.district?.nameEn || t.welcomeCard.hub}
              </Text>
            </View>

            <View style={styles.verifiedBadgePill}>
              <Text style={styles.verifiedBadgePillText}>{t.verifiedBadge}</Text>
            </View>
          </View>

          {/* 3. MAIN ACTION CTA */}
          <TouchableOpacity
            style={styles.mainAddProduceCtaBtn}
            onPress={() => {
              setEditingProduceItem(null);
              setShowAddProduceScreen(true);
            }}
            activeOpacity={0.88}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.mainAddProduceCtaBtnText}>{t.mainCta}</Text>
          </TouchableOpacity>

          {/* 4. QUICK OVERVIEW CARDS (2x2 GRID) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitleText}>{t.overview.title}</Text>
            <View style={styles.overviewGrid}>
              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.emerald }]}
                onPress={() => setActiveBottomTab('harvest')}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewValText}>{activeHarvestListings.length}</Text>
                <Text style={styles.overviewLabelText}>{t.overview.activeHarvests}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.info }]}
                onPress={() => setActiveBottomTab('requests')}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewValText}>{openRequests.length}</Text>
                <Text style={styles.overviewLabelText}>{t.overview.incomingRequests}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.purple }]}
                onPress={() => setActiveBottomTab('orders')}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewValText}>{displayOrders.length}</Text>
                <Text style={styles.overviewLabelText}>{t.overview.acceptedOrders}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.warning }]}
                onPress={() => setActiveBottomTab('earnings')}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewValText}>Rs. {formatCurrency(totalEarningsVal)}</Text>
                <Text style={styles.overviewLabelText}>{t.overview.totalEarnings}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. ACTIVE HARVESTS (MAX 2 RECENT CARDS) */}
          <View style={styles.cardBox}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitleText}>{t.activeHarvests.title}</Text>
              <TouchableOpacity onPress={() => setActiveBottomTab('harvest')} activeOpacity={0.7}>
                <Text style={styles.linkBtnText}>{t.activeHarvests.viewAll}</Text>
              </TouchableOpacity>
            </View>

            {activeHarvestListings.length === 0 ? (
              <View style={styles.emptySubBox}>
                <Ionicons name="leaf-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptySubTitle}>{t.activeHarvests.emptyTitle}</Text>
                <Text style={styles.emptySubSub}>{t.activeHarvests.emptySub}</Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => {
                    setEditingProduceItem(null);
                    setShowAddProduceScreen(true);
                  }}
                >
                  <Text style={styles.emptyAddBtnText}>{t.activeHarvests.addBtn}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              activeHarvestListings.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.harvestSummaryCard}>
                  <Image source={{ uri: item.image }} style={styles.harvestThumbImg} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.harvestHeaderRow}>
                      <Text style={styles.harvestCropTitle} numberOfLines={1}>
                        {item.nameEn || item.nameSi}
                      </Text>
                      {renderStatusBadge(item.status)}
                    </View>

                    <Text style={styles.harvestQtyText}>
                      Stock: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.stockQty} {item.unitEn || 'kg'}</Text>
                    </Text>
                    <Text style={styles.harvestPriceText}>
                      Rs. {item.price} / {item.unitEn || 'kg'} • 📍 {item.location}
                    </Text>

                    <View style={styles.harvestActionsRow}>
                      <TouchableOpacity
                        style={styles.harvestActionBtnView}
                        onPress={() => setSelectedProduceForDetails(item)}
                      >
                        <Text style={styles.harvestActionBtnViewText}>View</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.harvestActionBtnEdit}
                        onPress={() => {
                          setEditingProduceItem(item);
                          setShowAddProduceScreen(true);
                        }}
                      >
                        <Text style={styles.harvestActionBtnEditText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 6. RECENT BUYER REQUESTS (MAX 2 RECENT CARDS) */}
          <View style={styles.cardBox}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitleText}>{t.buyerRequests.title}</Text>
              <TouchableOpacity onPress={() => setActiveBottomTab('requests')} activeOpacity={0.7}>
                <Text style={styles.linkBtnText}>{t.buyerRequests.viewAll}</Text>
              </TouchableOpacity>
            </View>

            {openRequests.length === 0 ? (
              <View style={styles.emptySubBox}>
                <Ionicons name="chatbubbles-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptySubTitle}>{t.buyerRequests.emptyTitle}</Text>
                <Text style={styles.emptySubSub}>{t.buyerRequests.emptySub}</Text>
              </View>
            ) : (
              openRequests.slice(0, 2).map((req) => (
                <View key={req.id} style={styles.requestSummaryCard}>
                  <View style={styles.requestCardHeader}>
                    <Text style={styles.requestCropTitle}>{req.cropName || 'Crop Harvest'}</Text>
                    {renderStatusBadge(req.status || 'OPEN')}
                  </View>

                  <Text style={styles.requestDetailText}>
                    📦 Qty: <Text style={{ fontWeight: '800' }}>{req.quantity} {req.unit || 'kg'}</Text> • Offered: <Text style={{ fontWeight: '800', color: THEME.emeraldDark }}>Rs. {req.offeredPrice || 200}/kg</Text>
                  </Text>
                  <Text style={styles.requestDetailText}>👤 Buyer: {req.buyerName || 'Commercial Buyer'}</Text>
                  <Text style={styles.requestDetailText}>📍 Deliver to: {req.deliveryAddress || req.targetDistrictEn}</Text>

                  <TouchableOpacity
                    style={styles.reviewRequestCtaBtn}
                    onPress={() => setSelectedRequestForDetails(req)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="search-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.reviewRequestCtaBtnText}>{t.buyerRequests.reviewBtn}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* 7. TRANSPORT STATUS CARD */}
          <View style={styles.cardBox}>
            <Text style={styles.cardTitleText}>{t.transport.title}</Text>
            {activeTransportOrder ? (
              <View style={styles.transportActiveCard}>
                <View style={styles.transportCardHeader}>
                  <Text style={styles.transportOrderNo}>{activeTransportOrder.orderNo}</Text>
                  {renderStatusBadge(activeTransportOrder.transportStatus || 'IN_TRANSIT')}
                </View>

                <Text style={styles.transportDriverText}>
                  🚚 Driver: <Text style={{ fontWeight: '800' }}>{activeTransportOrder.driverName || 'Kamal Perera'}</Text> ({activeTransportOrder.driverVehicle || 'WP-LG-4401'})
                </Text>
                <Text style={styles.transportRouteText}>
                  📍 {activeTransportOrder.pickupLocation || 'Farm'} ➔ {activeTransportOrder.deliveryAddress}
                </Text>

                <TouchableOpacity
                  style={styles.viewTransportBtn}
                  onPress={() => setSelectedDeliveryForTracking(activeTransportOrder)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.viewTransportBtnText}>{t.transport.viewTransportBtn}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptySubBox}>
                <Ionicons name="bus-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptySubTitle}>{t.transport.emptyTitle}</Text>
                <Text style={styles.emptySubSub}>{t.transport.emptySub}</Text>
              </View>
            )}
          </View>

          {/* 8. FARMER EARNINGS SUMMARY */}
          <View style={styles.cardBox}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitleText}>{t.earnings.title}</Text>
              <TouchableOpacity onPress={() => setActiveBottomTab('earnings')} activeOpacity={0.7}>
                <Text style={styles.linkBtnText}>{t.earnings.viewEarningsBtn}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.earningsSummaryRow}>
              <View style={styles.earningsCol}>
                <Text style={styles.earningsColLabel}>{t.earnings.monthSpent}</Text>
                <Text style={styles.earningsColVal}>Rs. {formatCurrency(monthEarningsVal)}</Text>
              </View>

              <View style={styles.earningsCol}>
                <Text style={styles.earningsColLabel}>{t.earnings.pending}</Text>
                <Text style={[styles.earningsColVal, { color: THEME.warning }]}>
                  Rs. {formatCurrency(pendingPaymentsVal)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ==================================================== */}
      {/* HARVEST / PRODUCE TAB VIEW                           */}
      {/* ==================================================== */}
      {activeBottomTab === 'harvest' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.screenTabTitle}>My Harvest Listings</Text>
              <TouchableOpacity
                style={styles.headerAddBtnSmall}
                onPress={() => {
                  setEditingProduceItem(null);
                  setShowAddProduceScreen(true);
                }}
              >
                <Text style={styles.headerAddBtnSmallText}>+ Add Produce</Text>
              </TouchableOpacity>
            </View>

            {/* FILTER TABS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {[
                { id: 'all', label: t.filterTabs.all },
                { id: 'active', label: t.filterTabs.active },
                { id: 'sold', label: t.filterTabs.sold },
                { id: 'completed', label: t.filterTabs.completed },
              ].map((ft) => (
                <TouchableOpacity
                  key={ft.id}
                  style={[
                    styles.filterTabPill,
                    harvestFilter === ft.id && styles.filterTabPillActive,
                  ]}
                  onPress={() => setHarvestFilter(ft.id)}
                >
                  <Text
                    style={[
                      styles.filterTabPillText,
                      harvestFilter === ft.id && styles.filterTabPillTextActive,
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {activeHarvestListings.map((item) => (
              <View key={item.id} style={styles.harvestFullCard}>
                <Image source={{ uri: item.image }} style={styles.harvestFullCardImg} />
                <View style={styles.harvestFullCardContent}>
                  <View style={styles.harvestHeaderRow}>
                    <Text style={styles.harvestCropTitle}>{item.nameEn || item.nameSi}</Text>
                    {renderStatusBadge(item.status)}
                  </View>

                  <Text style={styles.harvestCategoryText}>Category: {item.category || 'Vegetables'}</Text>
                  <Text style={styles.harvestPriceLarge}>Rs. {item.price} / {item.unitEn || 'kg'}</Text>
                  <Text style={styles.harvestStockText}>Available Stock: {item.stockQty} {item.unitEn || 'kg'}</Text>
                  <Text style={styles.harvestLocationText}>📍 {item.location} • {item.grade}</Text>

                  <View style={styles.harvestFullCardActions}>
                    <TouchableOpacity
                      style={styles.btnSecondary}
                      onPress={() => setSelectedProduceForDetails(item)}
                    >
                      <Text style={styles.btnSecondaryText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnSecondary}
                      onPress={() => {
                        setEditingProduceItem(item);
                        setShowAddProduceScreen(true);
                      }}
                    >
                      <Text style={styles.btnSecondaryText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnDangerSmall}
                      onPress={() => handleDeleteProduce(item)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ==================================================== */}
      {/* REQUESTS TAB VIEW                                    */}
      {/* ==================================================== */}
      {activeBottomTab === 'requests' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            <Text style={styles.screenTabTitle}>Incoming Buyer Requests</Text>
            <Text style={styles.screenTabSub}>Review and commit to supplying buyer requests.</Text>

            {/* FILTER TABS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {[
                { id: 'all', label: t.filterTabs.all },
                { id: 'new', label: t.filterTabs.new },
                { id: 'accepted', label: t.filterTabs.accepted },
                { id: 'rejected', label: t.filterTabs.rejected },
              ].map((ft) => (
                <TouchableOpacity
                  key={ft.id}
                  style={[
                    styles.filterTabPill,
                    requestsFilter === ft.id && styles.filterTabPillActive,
                  ]}
                  onPress={() => setRequestsFilter(ft.id)}
                >
                  <Text
                    style={[
                      styles.filterTabPillText,
                      requestsFilter === ft.id && styles.filterTabPillTextActive,
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {displayRequests.map((req) => (
              <View key={req.id} style={styles.requestFullCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCropTitle}>{req.cropName || 'Harvest'}</Text>
                  {renderStatusBadge(req.status || 'OPEN')}
                </View>

                <Text style={styles.requestDetailText}>
                  Quantity Needed: <Text style={{ fontWeight: '800' }}>{req.quantity} {req.unit || 'kg'}</Text>
                </Text>
                <Text style={styles.requestDetailText}>
                  Offered Price: <Text style={{ fontWeight: '800', color: THEME.emeraldDark }}>Rs. {req.offeredPrice || 200}/kg</Text>
                </Text>
                <Text style={styles.requestDetailText}>Buyer: {req.buyerName || 'Commercial Buyer'}</Text>
                <Text style={styles.requestDetailText}>Delivery: {req.deliveryAddress || 'Central Outlet'}</Text>

                <TouchableOpacity
                  style={styles.reviewRequestCtaBtn}
                  onPress={() => setSelectedRequestForDetails(req)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="search-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.reviewRequestCtaBtnText}>{t.buyerRequests.reviewBtn}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ==================================================== */}
      {/* ORDERS TAB VIEW                                      */}
      {/* ==================================================== */}
      {activeBottomTab === 'orders' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            <Text style={styles.screenTabTitle}>Accepted Farmer Orders</Text>
            <Text style={styles.screenTabSub}>Track committed harvest orders and dispatch status.</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {displayOrders.map((item) => (
              <View key={item.id} style={styles.orderFullCard}>
                <View style={styles.orderHeaderRow}>
                  <Text style={styles.orderNoText}>{item.orderNo}</Text>
                  {renderStatusBadge(item.status)}
                </View>

                <Text style={styles.orderProduceTitle}>{item.produceName} ({item.qty} {item.unit || 'kg'})</Text>
                <Text style={styles.orderBuyerText}>Buyer: {item.buyerName || 'Buyer'}</Text>
                <Text style={styles.orderTotalPrice}>Total Order Value: Rs. {formatCurrency(item.totalPrice || (Number(item.price || 0) * Number(item.qty || 1)))}</Text>

                <View style={styles.orderActionsRow}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => setSelectedOrderForDetails(item)}
                  >
                    <Text style={styles.btnSecondaryText}>View Order Details</Text>
                  </TouchableOpacity>

                  {item.transportStatus && (
                    <TouchableOpacity
                      style={styles.btnPrimarySmall}
                      onPress={() => setSelectedDeliveryForTracking(item)}
                    >
                      <Text style={styles.btnPrimarySmallText}>Track Transport</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ==================================================== */}
      {/* EARNINGS TAB VIEW                                    */}
      {/* ==================================================== */}
      {activeBottomTab === 'earnings' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            <Text style={styles.screenTabTitle}>Farmer Earnings & Wallet</Text>
            <Text style={styles.screenTabSub}>Financial ledger for completed harvest dispatches.</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* EARNINGS METRICS CARDS */}
            <View style={styles.earningsMetricsGrid}>
              <View style={[styles.earningCard, { borderLeftColor: THEME.emerald }]}>
                <Text style={styles.earningCardLabel}>Total Revenue</Text>
                <Text style={styles.earningCardVal}>Rs. {formatCurrency(totalEarningsVal)}</Text>
              </View>

              <View style={[styles.earningCard, { borderLeftColor: THEME.warning }]}>
                <Text style={styles.earningCardLabel}>Pending Payouts</Text>
                <Text style={[styles.earningCardVal, { color: THEME.warning }]}>
                  Rs. {formatCurrency(pendingPaymentsVal)}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitleText}>Transaction History</Text>
            {completedSalesList.map((item) => (
              <View key={item.id} style={styles.transactionItemCard}>
                <View style={styles.txHeaderRow}>
                  <Text style={styles.txOrderNo}>{item.orderNo || `#${item.id}`}</Text>
                  <Text style={styles.txAmountText}>+ Rs. {formatCurrency(item.totalPrice || (Number(item.price || 0) * Number(item.qty || 1)))}</Text>
                </View>
                <Text style={styles.txBuyerText}>Buyer: {item.buyerName || 'Buyer'}</Text>
                <Text style={styles.txDateText}>Date: {item.completedAt || 'Today'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ==================================================== */}
      {/* BOTTOM NAVIGATION BAR                               */}
      {/* ==================================================== */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => {
            setShowProfileScreen(false);
            setActiveBottomTab('dashboard');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeBottomTab === 'dashboard' ? 'grid' : 'grid-outline'}
            size={22}
            color={activeBottomTab === 'dashboard' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'dashboard' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.dashboard}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => {
            setShowProfileScreen(false);
            setActiveBottomTab('harvest');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeBottomTab === 'harvest' ? 'leaf' : 'leaf-outline'}
            size={22}
            color={activeBottomTab === 'harvest' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'harvest' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.harvest}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => {
            setShowProfileScreen(false);
            setActiveBottomTab('requests');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeBottomTab === 'requests' ? 'chatbubbles' : 'chatbubbles-outline'}
            size={22}
            color={activeBottomTab === 'requests' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'requests' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.requests}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => {
            setShowProfileScreen(false);
            setActiveBottomTab('orders');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeBottomTab === 'orders' ? 'clipboard' : 'clipboard-outline'}
            size={22}
            color={activeBottomTab === 'orders' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'orders' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.orders}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================== */}
      {/* REQUEST DETAILS MODAL (WITH ACCEPT / REJECT FLOW)    */}
      {/* ==================================================== */}
      <Modal visible={!!selectedRequestForDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalOrderTitle}>{t.modals.requestDetailsTitle}</Text>
              <TouchableOpacity onPress={() => setSelectedRequestForDetails(null)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRequestForDetails && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={styles.modalContactCard}>
                  <Text style={styles.modalContactTitle}>👤 Buyer Information</Text>
                  <Text style={styles.modalContactName}>{selectedRequestForDetails.buyerName || 'Commercial Buyer'}</Text>
                  <Text style={styles.modalContactSub}>📍 {selectedRequestForDetails.deliveryAddress || 'Destination Outlet'}</Text>

                  <TouchableOpacity
                    style={styles.callSmallBtn}
                    onPress={() => {
                      if (selectedRequestForDetails.buyerPhone) {
                        Linking.openURL(`tel:${selectedRequestForDetails.buyerPhone}`);
                      } else {
                        Alert.alert('Buyer Contact', `Phone: ${selectedRequestForDetails.buyerPhone || '0719876543'}`);
                      }
                    }}
                  >
                    <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.callSmallBtnText}>Call Buyer ({selectedRequestForDetails.buyerPhone || 'Contact'})</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSpecsGrid}>
                  <View style={styles.modalSpecCol}>
                    <Text style={styles.modalSpecLabel}>PRODUCE</Text>
                    <Text style={styles.modalSpecVal}>{selectedRequestForDetails.cropName}</Text>
                  </View>
                  <View style={styles.modalSpecCol}>
                    <Text style={styles.modalSpecLabel}>QUANTITY</Text>
                    <Text style={styles.modalSpecVal}>{selectedRequestForDetails.quantity} {selectedRequestForDetails.unit || 'kg'}</Text>
                  </View>
                  <View style={styles.modalSpecCol}>
                    <Text style={styles.modalSpecLabel}>OFFERED PRICE</Text>
                    <Text style={[styles.modalSpecVal, { color: THEME.emeraldDark }]}>Rs. {selectedRequestForDetails.offeredPrice || 200}/kg</Text>
                  </View>
                </View>

                <View style={styles.modalActionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: THEME.danger }]}
                    onPress={() => handleRejectRequest(selectedRequestForDetails)}
                  >
                    <Text style={styles.modalActionBtnText}>{t.buyerRequests.rejectBtn}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: THEME.emeraldDark }]}
                    onPress={() => handleAcceptRequest(selectedRequestForDetails)}
                  >
                    <Text style={styles.modalActionBtnText}>{t.buyerRequests.acceptBtn}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* PRODUCE DETAILS MODAL                                */}
      {/* ==================================================== */}
      <Modal visible={!!selectedProduceForDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalOrderTitle}>{t.modals.produceDetailsTitle}</Text>
              <TouchableOpacity onPress={() => setSelectedProduceForDetails(null)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedProduceForDetails && (
              <ScrollView style={{ maxHeight: 420 }}>
                <Image source={{ uri: selectedProduceForDetails.image }} style={styles.modalProduceImg} />
                <Text style={styles.modalCropTitle}>{selectedProduceForDetails.nameEn || selectedProduceForDetails.nameSi}</Text>
                <Text style={styles.modalPriceText}>Rs. {selectedProduceForDetails.price} per {selectedProduceForDetails.unitEn || 'kg'}</Text>
                <Text style={styles.modalDetailSub}>Stock Available: {selectedProduceForDetails.stockQty} {selectedProduceForDetails.unitEn || 'kg'}</Text>
                <Text style={styles.modalDetailSub}>Location: 📍 {selectedProduceForDetails.location}</Text>
                <Text style={styles.modalDetailSub}>Grade: {selectedProduceForDetails.grade || 'Standard SL-GAP'}</Text>

                <View style={styles.modalActionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: THEME.navy }]}
                    onPress={() => {
                      const item = selectedProduceForDetails;
                      setSelectedProduceForDetails(null);
                      setEditingProduceItem(item);
                      setShowAddProduceScreen(true);
                    }}
                  >
                    <Text style={styles.modalActionBtnText}>Edit Produce</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: THEME.danger }]}
                    onPress={() => handleDeleteProduce(selectedProduceForDetails)}
                  >
                    <Text style={styles.modalActionBtnText}>Delete Listing</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* FARMER NOTIFICATIONS MODAL                          */}
      {/* ==================================================== */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalOrderTitle}>{t.modals.notifTitle}</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {mockFarmerNotifications.map((n) => (
              <View key={n.id} style={styles.notifItemCard}>
                <View style={styles.notifIconCircle}>
                  <Ionicons name="notifications" size={16} color={THEME.emeraldDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitleText}>{n.title}</Text>
                  <Text style={styles.notifSubText}>{n.sub}</Text>
                  <Text style={styles.notifTimeText}>{n.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* HEADER */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileAvatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleNavy: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.navy,
  },
  brandTitleGreen: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.accentLeaf,
    marginRight: 8,
  },
  farmerRoleBadge: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  farmerRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.emeraldDark,
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: THEME.danger,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 90,
  },

  /* WELCOME CARD */
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  welcomeGreetingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  welcomeFarmerNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeHubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedBadgePill: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  /* MAIN CTA BUTTON */
  mainAddProduceCtaBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: THEME.emeraldDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  mainAddProduceCtaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* QUICK OVERVIEW 2x2 GRID */
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  overviewValText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  overviewLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  /* GENERIC CARD BOX */
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  linkBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  /* HARVEST CARDS */
  harvestSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  harvestThumbImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  harvestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  harvestCropTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  harvestQtyText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  harvestPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.emeraldDark,
    marginTop: 2,
  },
  harvestActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  harvestActionBtnView: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  harvestActionBtnViewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  harvestActionBtnEdit: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  harvestActionBtnEditText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  /* BUYER REQUEST CARDS */
  requestSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestCropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  requestDetailText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  reviewRequestCtaBtn: {
    backgroundColor: THEME.navy,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  reviewRequestCtaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* TRANSPORT STATUS CARD */
  transportActiveCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transportOrderNo: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy,
  },
  transportDriverText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  transportRouteText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewTransportBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  viewTransportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* EARNINGS SUMMARY */
  earningsSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  earningsCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earningsColLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  earningsColVal: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.emeraldDark,
    marginTop: 2,
  },

  emptySubBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptySubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  emptySubSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyAddBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* TAB HEADERS & FILTERS */
  screenTabHeaderContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTabTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenTabSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerAddBtnSmall: {
    backgroundColor: THEME.emeraldDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerAddBtnSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterTabPillActive: {
    backgroundColor: THEME.emeraldDark,
  },
  filterTabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabPillTextActive: {
    color: '#FFFFFF',
  },

  /* FULL CARDS FOR TABS */
  harvestFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  harvestFullCardImg: {
    width: '100%',
    height: 140,
  },
  harvestFullCardContent: {
    padding: 14,
  },
  harvestCategoryText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  harvestPriceLarge: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.emeraldDark,
    marginTop: 4,
  },
  harvestStockText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  harvestLocationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  harvestFullCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnDangerSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimarySmall: {
    flex: 1,
    backgroundColor: THEME.emeraldDark,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnPrimarySmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  requestFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  orderFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNoText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy,
  },
  orderProduceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  orderBuyerText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  orderTotalPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.emeraldDark,
    marginTop: 4,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  /* EARNINGS METRICS */
  earningsMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  earningCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  earningCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  earningCardVal: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.emeraldDark,
    marginTop: 4,
  },
  transactionItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txOrderNo: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.navy,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.emeraldDark,
  },
  txBuyerText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  txDateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* BOTTOM NAVIGATION */
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
  },
  navTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    marginTop: 2,
  },
  navTabLabelActive: {
    color: THEME.emeraldDark,
    fontWeight: '800',
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOrderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalContactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalContactTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  modalContactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  modalContactSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  callSmallBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  callSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  modalSpecsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    justifyContent: 'space-between',
  },
  modalSpecCol: {
    flex: 1,
  },
  modalSpecLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  modalSpecVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  modalProduceImg: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 12,
  },
  modalCropTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.emeraldDark,
    marginTop: 2,
  },
  modalDetailSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },

  notifItemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.emeraldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notifTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  notifTimeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 3,
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

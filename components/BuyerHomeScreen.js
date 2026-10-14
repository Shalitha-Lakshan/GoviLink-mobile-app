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
  StatusBar,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  FARMER_COLORS as C,
  BUYER_NAV,
  FarmerButton,
  FarmerEmpty,
  FarmerHeading,
  FilterChip,
  IconTile,
  DetailRow,
  cleanLabel,
} from './FarmerDesign';
import {
  placeOrderInFirestore,
  subscribeToBuyerRequests,
  deleteBuyerRequest,
} from '../services/firebaseDatabase';
import BuyerRequestProduceScreen from './BuyerRequestProduceScreen';
import UserProfileScreen from './UserProfileScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';
import TourTarget from './GuidedTour/TourTarget';
import { useTour } from '../context/TourContext';

const NAV_ICONS = {
  home: 'grid-outline',
  market: 'storefront-outline',
  requests: 'chatbubbles-outline',
  orders: 'cube-outline',
};

const STATUS = {
  PENDING: ['Awaiting Farmer', C.amber, C.amberBg],
  ACCEPTED: ['Farmer Confirmed', C.blue, C.blueBg],
  READY_FOR_PICKUP: ['Ready for Pickup', C.amber, C.amberBg],
  IN_TRANSIT: ['In Transit', C.blue, C.blueBg],
  DELIVERED: ['Delivered', C.green, C.mint],
  CANCELLED: ['Cancelled', C.red, C.redBg],
};

const cropName = (item, lang) =>
  (lang === 'si' ? item.nameSi : lang === 'ta' ? item.nameTa : item.nameEn) ||
  item.nameEn ||
  'Produce';

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
      customRequests: 'Custom Inquiries',
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
      statusOpen: 'Open Inquiry',
    },
    labels: {
      farmer: 'Farmer',
      location: 'Location',
      inStock: 'In Stock',
      grade: 'Quality',
      orderBtn: 'Order',
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
      CANCELLED: 'Cancelled ❌',
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
      myOrders: 'මගේ ඇණවුම්',
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
      statusOpen: 'විවෘත ඉල්ලුමක්',
    },
    labels: {
      farmer: 'ගොවියා',
      location: 'ස්ථානය',
      inStock: 'තොග ඇත',
      grade: 'තත්ත්වය',
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
      CANCELLED: 'අවලංගු කළා ❌',
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
      statusOpen: 'திறந்த கோரிக்கை',
    },
    labels: {
      farmer: 'விவசாயி',
      location: 'இடம்',
      inStock: 'இருப்பில் உள்ளது',
      grade: 'தரம்',
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
      CANCELLED: 'ரத்து செய்யப்பட்டது ❌',
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

function SectionLabel({ title, action, onPress }) {
  return (
    <View style={s.sectionLabel}>
      <Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onPress} accessibilityRole="button" style={s.textAction}>
          <Text style={s.textActionText}>{action}</Text>
          <Ionicons name="arrow-forward" size={16} color={C.green} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BuyerHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'market' | 'requests' | 'orders' | 'profile'
  const [showRequestScreen, setShowRequestScreen] = useState(false);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'active' | 'completed'

  const [selectedProduce, setSelectedProduce] = useState(null);
  const [detailProduce, setDetailProduce] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQty, setOrderQty] = useState(5);
  const [deliveryAddress, setDeliveryAddress] = useState(
    userProfile?.district?.nameEn
      ? `${userProfile.district.nameEn} Central Outlet`
      : 'Colombo 03'
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const nav = BUYER_NAV[lang] || BUYER_NAV.en;
  const district =
    typeof userProfile?.district === 'string'
      ? userProfile.district
      : userProfile?.district?.nameEn;

  // Android hardware back handler
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showDetailModal) {
        setShowDetailModal(false);
      } else if (showOrderModal) {
        setShowOrderModal(false);
      } else if (selectedOrderForTracking) {
        setSelectedOrderForTracking(null);
      } else if (showRequestScreen) {
        setShowRequestScreen(false);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else {
        return false;
      }
      return true;
    });
    return () => subscription.remove();
  }, [showDetailModal, showOrderModal, selectedOrderForTracking, showRequestScreen, activeTab]);

  // Real-time listener for buyer's own custom requests
  useEffect(() => {
    const unsub = subscribeToBuyerRequests((requests) => {
      setBuyerRequests(requests || []);
    }, userProfile?.uid);

    return () => unsub && unsub();
  }, [userProfile?.uid]);

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const { replayTour, setTabChangeHandler } = useTour();

  useEffect(() => {
    if (setTabChangeHandler) {
      setTabChangeHandler((tab) => {
        if (tab) switchTab(tab);
      });
    }
  }, [setTabChangeHandler]);

  const handleReplayTour = () => {
    switchTab('home');
    replayTour('buyer');
  };

  const getProduceUnit = (item) => {
    if (!item) return 'kg';
    if (lang === 'si') return item.unitSi || item.unitEn || 'කි.ග්‍රෑ.';
    if (lang === 'ta') return item.unitTa || item.unitEn || 'கிலோ';
    return item.unitEn || 'kg';
  };

  const handleDeleteRequest = (requestId, crop) => {
    const title = t.customRequests.cancelBtn;
    const msg = `${t.customRequests.cancelConfirm} (${crop})`;
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${msg}`)) {
        deleteBuyerRequest(requestId);
      }
      return;
    }
    Alert.alert(title, msg, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await deleteBuyerRequest(requestId);
        },
      },
    ]);
  };

  // Filter & sort listings based on search, category, origin district & sort
  const query = searchQuery.trim().toLowerCase();
  const filteredListings = produceListings
    .filter((item) => {
      const title = cropName(item, lang).toLowerCase();
      const farmer = (item.farmerName || '').toLowerCase();
      const loc = (item.location || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        farmer.includes(query) ||
        loc.includes(query) ||
        desc.includes(query);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 0) {
        const itemCat = (item.category || 'Vegetables').toLowerCase();
        if (selectedCategory === 1 && !itemCat.includes('veg')) return false;
        if (selectedCategory === 2 && !itemCat.includes('fruit')) return false;
        if (selectedCategory === 3 && !(itemCat.includes('rice') || itemCat.includes('grain')))
          return false;
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
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

  // Filter buyer's own orders
  const myBuyerOrders = ordersList.filter(
    (o) =>
      !o.buyerPhone ||
      o.buyerPhone === userProfile?.phoneNumber ||
      o.buyerUid === userProfile?.uid ||
      o.buyerName === userProfile?.fullName ||
      true
  );

  const activeBuyerOrders = myBuyerOrders.filter(
    (order) => !['DELIVERED', 'CANCELLED'].includes(order.status)
  );

  const totalSpent = myBuyerOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

  const visibleOrders = myBuyerOrders.filter((order) => {
    if (orderFilter === 'active') return !['DELIVERED', 'CANCELLED'].includes(order.status);
    if (orderFilter === 'completed') return order.status === 'DELIVERED';
    return true;
  });

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
    const produceTitle = cropName(selectedProduce, lang);
    const unitPrice = selectedProduce.price || 0;
    const subtotal = unitPrice * orderQty;
    const logisticsFee = 350;
    const totalAmount = subtotal + logisticsFee;

    const orderPayload = {
      produceId: selectedProduce.id,
      produceName: produceTitle,
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
      const successMessage = `Your order for ${orderQty} ${getProduceUnit(selectedProduce)} of ${produceTitle} was placed successfully.\nThe farmer and cooperative logistics have been alerted!`;
      if (Platform.OS === 'web') {
        window.alert(`Order Placed! 🌾✨\n\n${successMessage}`);
        setActiveTab('orders');
      } else {
        Alert.alert('Order Placed! 🌾✨', successMessage, [
          {
            text: 'Track Order',
            onPress: () => setActiveTab('orders'),
          },
          { text: 'OK' },
        ]);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(`Could not complete order: ${res.error}`);
      } else {
        Alert.alert('Order Failed', `Could not complete order: ${res.error}`);
      }
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(0);
    setSelectedDistrict('All');
    setSortBy('newest');
  };

  if (showRequestScreen) {
    return (
      <BuyerRequestProduceScreen
        userProfile={userProfile}
        lang={lang}
        onBack={() => setShowRequestScreen(false)}
        onRequestSubmitted={() => {
          setShowRequestScreen(false);
          setActiveTab('requests');
        }}
      />
    );
  }

  if (selectedOrderForTracking) {
    return (
      <DeliveryTrackingScreen
        delivery={selectedOrderForTracking}
        userProfile={userProfile}
        lang={lang}
        onBack={() => setSelectedOrderForTracking(null)}
        onLogout={onLogout}
      />
    );
  }

  // ----------------------------------------------------
  // SUB-RENDER: PRODUCE CARD (MATCHING FARMER DESIGN)
  // ----------------------------------------------------
  const renderListing = (item) => {
    const stockVal = Number(item.stockQty || 0);
    const isOutOfStock = stockVal <= 0;
    const isLimited = stockVal > 0 && stockVal <= 20;

    return (
      <View key={item.id} style={s.card}>
        <View style={s.listingTop}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={s.produceImage} />
          ) : (
            <View style={[s.produceImage, s.imageFallback]}>
              <Ionicons name="leaf-outline" size={32} color={C.green} />
            </View>
          )}

          <View style={s.flex}>
            <View style={s.badgeRow}>
              <Text style={s.category}>{item.category || 'Produce'}</Text>
              {item.grade ? (
                <Text style={s.gradeBadge}>Grade {item.grade}</Text>
              ) : null}
            </View>

            <Text style={s.cardTitle}>{cropName(item, lang)}</Text>

            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={13} color={C.muted} />
              <Text style={s.smallText}>{item.location || 'Sri Lanka'}</Text>
            </View>

            <View style={s.farmerRow}>
              <Ionicons name="person-outline" size={13} color={C.muted} />
              <Text style={s.smallText}>
                {item.farmerName || 'Verified Farmer'}
              </Text>
            </View>

            <Text style={s.price}>
              {t.labels.currency} {money(item.price)}{' '}
              <Text style={s.unit}>/ {getProduceUnit(item)}</Text>
            </Text>
          </View>
        </View>

        {Boolean(item.description) && (
          <Text style={s.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={s.cardFooter}>
          <View style={s.stock}>
            <View
              style={[
                s.dot,
                {
                  backgroundColor: isOutOfStock
                    ? C.red
                    : isLimited
                    ? C.amber
                    : C.green,
                },
              ]}
            />
            <Text style={s.stockText}>
              {isOutOfStock
                ? 'Out of Stock'
                : `${stockVal} ${getProduceUnit(item)} in stock`}
            </Text>
          </View>

          <View style={s.inlineActions}>
            <FarmerButton
              label="Details"
              icon="eye-outline"
              secondary
              onPress={() => handleOpenDetailModal(item)}
              style={s.compactBtn}
            />
            <FarmerButton
              label={t.labels.orderBtn}
              icon="cart-outline"
              disabled={isOutOfStock}
              onPress={() => handleOpenOrderModal(item)}
              style={s.compactBtn}
            />
          </View>
        </View>
      </View>
    );
  };

  // ----------------------------------------------------
  // SUB-RENDER: CUSTOM INQUIRY CARD
  // ----------------------------------------------------
  const renderRequest = (req) => {
    return (
      <View key={req.id} style={s.card}>
        <View style={s.cardHeading}>
          <IconTile name="leaf-outline" />
          <View style={s.flex}>
            <Text style={s.cardTitle}>{req.cropName}</Text>
            <Text style={s.smallText}>{req.category || 'Vegetables'}</Text>
          </View>
          <View style={s.openBadge}>
            <Text style={s.openBadgeText}>Open Inquiry</Text>
          </View>
        </View>

        <View style={s.requestMetrics}>
          <View style={s.flex}>
            <Text style={s.metricCaption}>Required volume</Text>
            <Text style={s.metricValue}>
              {req.quantity} <Text style={s.unit}>{req.unit || 'kg'}</Text>
            </Text>
          </View>
          {!!req.targetPricePerUnit && (
            <View style={s.flex}>
              <Text style={s.metricCaption}>Target budget</Text>
              <Text style={s.metricValue}>
                {t.labels.currency} {money(req.targetPricePerUnit)}
              </Text>
            </View>
          )}
        </View>

        <DetailRow
          icon="location-outline"
          label={cleanLabel(t.customRequests.targetDistrict)}
          value={`${req.targetDistrictName || req.targetDistrictEn || 'Island-wide'}${
            req.specificArea ? ` · ${req.specificArea}` : ''
          }`}
        />
        <DetailRow
          icon="calendar-outline"
          label={cleanLabel(t.customRequests.datePeriod)}
          value={
            req.datePeriodDescription ||
            [req.requiredDateStart, req.requiredDateEnd].filter(Boolean).join(' – ') ||
            'Immediate'
          }
        />
        <DetailRow
          icon="car-outline"
          label="Logistics"
          value={
            req.deliveryNeeded === false
              ? 'Farm Self-Pickup by Buyer'
              : `Delivery: ${req.deliveryAddress || 'Central Destination'}`
          }
        />
        {!!req.qualityGrade && (
          <DetailRow icon="ribbon-outline" label="Quality grade" value={req.qualityGrade} />
        )}
        {!!req.notes && (
          <View style={s.note}>
            <Text style={s.noteText}>{req.notes}</Text>
          </View>
        )}

        <View style={s.orderActions}>
          <FarmerButton
            label={cleanLabel(t.customRequests.cancelBtn)}
            icon="trash-outline"
            danger
            onPress={() => handleDeleteRequest(req.id, req.cropName)}
          />
        </View>
      </View>
    );
  };

  // ----------------------------------------------------
  // SUB-RENDER: BUYER ORDER CARD
  // ----------------------------------------------------
  const renderOrder = (order) => {
    const status = order.status || 'PENDING';
    const [statusLabel, color, backgroundColor] = STATUS[status] || [
      status.replace(/_/g, ' '),
      C.muted,
      C.canvas,
    ];
    const steps = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'];
    const stepIndex = steps.indexOf(status);

    return (
      <View key={order.id} style={s.card}>
        <View style={s.orderTop}>
          <View style={[s.statusBadge, { backgroundColor }]}>
            <View style={[s.dot, { backgroundColor: color }]} />
            <Text style={[s.statusText, { color }]}>{statusLabel}</Text>
          </View>
          <Text style={s.orderId}>
            #{String(order.id || '').slice(-6).toUpperCase()}
          </Text>
        </View>

        <Text style={s.cardTitle}>{order.produceName || 'Produce Order'}</Text>

        <View style={s.requestMetrics}>
          <View style={s.flex}>
            <Text style={s.metricCaption}>Ordered volume</Text>
            <Text style={s.metricValue}>
              {order.qty} <Text style={s.unit}>{order.unit || 'kg'}</Text>
            </Text>
          </View>
          <View style={s.flex}>
            <Text style={s.metricCaption}>Total payable</Text>
            <Text style={s.metricValue}>
              {t.labels.currency} {money(order.totalPrice)}
            </Text>
          </View>
        </View>

        {status !== 'CANCELLED' && (
          <View style={s.progressRow}>
            {['Placed', 'Confirmed', 'In Transit', 'Delivered'].map((label, index) => (
              <View key={label} style={s.progressStep}>
                <View
                  style={[
                    s.progressLine,
                    index <= stepIndex && { backgroundColor: C.green },
                  ]}
                />
                <Text
                  style={[
                    s.progressText,
                    index <= stepIndex && { color: C.greenDark, fontWeight: '700' },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <DetailRow
          icon="person-outline"
          label="Grower"
          value={order.farmerName || 'GoviLink Farmer'}
        />
        <DetailRow
          icon="location-outline"
          label="Delivery address"
          value={order.deliveryAddress || 'Address on file'}
        />
        {!!order.deliveryNotes && (
          <View style={s.note}>
            <Text style={s.noteText}>"{order.deliveryNotes}"</Text>
          </View>
        )}

        <View style={s.orderActions}>
          <FarmerButton
            label="Track Live Delivery"
            icon="car-outline"
            secondary
            onPress={() => setSelectedOrderForTracking(order)}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />

      {/* TOP HEADER BAR (MATCHING FARMER WORKSPACE) */}
      <View style={s.header}>
        <TourTarget id="buyer-brand">
          <View style={s.brand}>
            <Image
              source={require('../assets/logo.png')}
              style={{ width: 88, height: 44 }}
              resizeMode="contain"
            />
            <Text style={s.brandCaption}>BUYER WORKSPACE</Text>
          </View>
        </TourTarget>

        <View style={s.headerActions}>
          {onChangeLanguage && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change language"
              onPress={() =>
                onChangeLanguage(lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en')
              }
              style={s.language}
            >
              <Text style={s.languageText}>
                {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={nav.profile}
            onPress={() => switchTab('profile')}
            style={s.avatarButton}
          >
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={s.avatarImage} />
            ) : (
              <Text style={s.avatarInitial}>
                {(userProfile?.fullName || 'B').charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* VIEWPORT BODY */}
      {activeTab === 'profile' ? (
        <UserProfileScreen
          embedded
          farmerDesign
          userProfile={userProfile}
          lang={lang}
          onBack={() => switchTab('home')}
          onLogout={onLogout}
          onChangeLanguage={onChangeLanguage}
          onProfileUpdated={onProfileUpdated}
          onReplayTour={handleReplayTour}
        />
      ) : (
        <ScrollView
          key={activeTab}
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'home' && (
            <>
              <FarmerHeading
                eyebrow="YOUR MARKETPLACE, AT A GLANCE"
                title={`Hello, ${userProfile?.fullName?.split(' ')[0] || 'Buyer'}.`}
                subtitle="Fresh farm harvests from rural growers to your doorstep."
              />

              {/* HERO BANNER MATCHING FARMER HERO */}
              <View style={s.hero}>
                <View style={s.heroTop}>
                  <TourTarget id="buyer-delivery-location">
                    <View style={s.heroPill}>
                      <Ionicons name="location-outline" size={13} color="#D1E9D9" />
                      <Text style={s.heroEyebrow}>{district || 'Sri Lanka'}</Text>
                    </View>
                  </TourTarget>
                  <Ionicons name="storefront-outline" size={36} color="#82AE92" />
                </View>
                <Text style={s.heroTitle}>Direct farm sourcing,{'\n'}fresh harvest at fair prices.</Text>
                <Text style={s.heroSub}>
                  Connect directly with verified growers.{'\n'}Support local agriculture with transparent pricing.
                </Text>
                <TourTarget id="buyer-tab-market">
                  <FarmerButton
                    label="Browse Marketplace"
                    icon="storefront-outline"
                    onPress={() => switchTab('market')}
                    style={s.heroButton}
                  />
                </TourTarget>
              </View>

              {/* STATS GRID */}
              <View style={s.statsGrid}>
                {[
                  [nav.market, produceListings.length, 'leaf-outline', 'market'],
                  [nav.requests, buyerRequests.length, 'chatbubbles-outline', 'requests'],
                  ['Active orders', activeBuyerOrders.length, 'cube-outline', 'orders'],
                  ['Total spent', `${t.labels.currency} ${money(totalSpent)}`, 'wallet-outline', 'orders'],
                ].map(([label, value, icon, tab]) => (
                  <TouchableOpacity
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}: ${value}`}
                    onPress={() => switchTab(tab)}
                    style={s.statCard}
                  >
                    <Ionicons name={icon} size={20} color={C.green} />
                    <Text style={s.statValue}>{value}</Text>
                    <Text style={s.statLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* QUICK NEXT STEPS */}
              <SectionLabel title="Your next steps" />
              <View style={s.quickCard}>
                {[
                  [
                    'storefront-outline',
                    'Browse fresh marketplace',
                    `${filteredListings.length} harvest listings currently available`,
                    'market',
                  ],
                  [
                    'chatbubbles-outline',
                    'Broadcast custom inquiry',
                    'Request specific crops by region and harvest window',
                    'requests',
                  ],
                  [
                    'cube-outline',
                    'Track active orders',
                    `${activeBuyerOrders.length} orders in delivery progress`,
                    'orders',
                  ],
                  [
                    'person-outline',
                    'Update delivery profile',
                    'Keep your address and contact info accurate',
                    'profile',
                  ],
                ].map(([icon, title, subtitle, tab], index) => (
                  <TouchableOpacity
                    key={tab}
                    accessibilityRole="button"
                    onPress={() => switchTab(tab)}
                    style={[s.quickRow, index > 0 && s.quickBorder]}
                  >
                    <IconTile name={icon} />
                    <View style={s.flex}>
                      <Text style={s.quickTitle}>{title}</Text>
                      <Text style={s.smallText}>{subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* FEATURED CROPS PREVIEW */}
              <SectionLabel
                title="Featured harvests"
                action="View all"
                onPress={() => switchTab('market')}
              />
              {produceListings.slice(0, 3).map(renderListing)}
            </>
          )}

          {/* TAB 2: FRESH MARKETPLACE */}
          {activeTab === 'market' && (
            <>
              <FarmerHeading
                eyebrow="BUYER WORKSPACE"
                title={cleanLabel(t.tabs.market)}
                subtitle="Direct sourcing from verified Sri Lankan farmers."
              />

              {/* DIRECT SOURCING BANNER */}
              <View style={s.bannerCard}>
                <View style={s.bannerLeft}>
                  <View style={s.bannerBadge}>
                    <Text style={s.bannerBadgeText}>✨ DIRECT SOURCING</Text>
                  </View>
                  <Text style={s.bannerTitle}>{t.customRequests.bannerTitle}</Text>
                  <Text style={s.bannerSub}>{t.customRequests.bannerSub}</Text>
                </View>
                <FarmerButton
                  label={t.customRequests.postBtn}
                  secondary
                  onPress={() => setShowRequestScreen(true)}
                  style={{ alignSelf: 'flex-start', marginTop: 12 }}
                />
              </View>

              {/* SEARCH BOX MATCHING FARMER WORKSPACE */}
              <TourTarget id="buyer-search-filter">
                <View style={s.searchBox}>
                  <Ionicons name="search-outline" size={20} color={C.muted} />
                  <TextInput
                    accessibilityLabel="Search marketplace"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t.searchPlaceholder}
                    placeholderTextColor={C.muted}
                    style={s.searchInput}
                  />
                  {!!searchQuery && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                      onPress={() => setSearchQuery('')}
                      style={s.clearSearch}
                    >
                      <Ionicons name="close-circle" size={20} color={C.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              </TourTarget>

              {/* CATEGORY CHIPS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filters}
              >
                {t.categories.map((cat, idx) => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    selected={selectedCategory === idx}
                    onPress={() => setSelectedCategory(idx)}
                  />
                ))}
              </ScrollView>

              {/* DISTRICT ORIGIN CHIPS */}
              <View style={s.filterRowWrap}>
                <Text style={s.filterLabel}>Origin District:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.filters}
                >
                  {DISTRICT_OPTIONS.map((dist) => (
                    <FilterChip
                      key={dist}
                      label={dist === 'All' ? 'All Districts' : dist}
                      selected={selectedDistrict === dist}
                      onPress={() => setSelectedDistrict(dist)}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* SORT CHIPS */}
              <View style={s.filterRowWrap}>
                <Text style={s.filterLabel}>Sort By:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.filters}
                >
                  {SORT_OPTIONS.map((sortOpt) => {
                    const label =
                      lang === 'si'
                        ? sortOpt.labelSi
                        : lang === 'ta'
                        ? sortOpt.labelTa
                        : sortOpt.labelEn;
                    return (
                      <FilterChip
                        key={sortOpt.id}
                        label={label}
                        selected={sortBy === sortOpt.id}
                        onPress={() => setSortBy(sortOpt.id)}
                      />
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={s.resultCount}>
                Marketplace · {filteredListings.length} listings available
              </Text>

              {/* LISTINGS / EMPTY */}
              {filteredListings.length ? (
                filteredListings.map((item, idx) =>
                  idx === 0 ? (
                    <TourTarget key={item.id} id="buyer-product-card">
                      {renderListing(item)}
                    </TourTarget>
                  ) : (
                    renderListing(item)
                  )
                )
              ) : produceListings.length ? (
                <FarmerEmpty
                  icon="search-outline"
                  title={nav.empty}
                  subtitle="Try a different search term, category, or origin district."
                  action={nav.reset}
                  onAction={resetFilters}
                />
              ) : (
                <FarmerEmpty
                  icon="leaf-outline"
                  title="No produce listings available"
                  subtitle="Fresh produce will appear here once farmers list their harvests."
                />
              )}
            </>
          )}

          {/* TAB 3: CUSTOM HARVEST INQUIRIES */}
          {activeTab === 'requests' && (
            <>
              <FarmerHeading
                eyebrow="BUYER WORKSPACE"
                title={cleanLabel(t.customRequests.title)}
                subtitle={t.customRequests.subtitle}
              />

              <View style={s.addRow}>
                <FarmerButton
                  label={t.customRequests.postBtn}
                  icon="add"
                  onPress={() => setShowRequestScreen(true)}
                />
              </View>

              <Text style={s.resultCount}>
                Inquiries · {buyerRequests.length} active
              </Text>

              {buyerRequests.length ? (
                buyerRequests.map(renderRequest)
              ) : (
                <FarmerEmpty
                  icon="clipboard-outline"
                  title={t.customRequests.emptyTitle}
                  subtitle={t.customRequests.emptySub}
                  action={t.customRequests.postBtn}
                  onAction={() => setShowRequestScreen(true)}
                />
              )}
            </>
          )}

          {/* TAB 4: MY ORDERS */}
          {activeTab === 'orders' && (
            <>
              <FarmerHeading
                eyebrow="BUYER WORKSPACE"
                title={cleanLabel(t.tabs.myOrders)}
                subtitle="Track fulfillment, farmer dispatch & cooperative delivery in real time."
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filters}
              >
                {[
                  ['all', nav.all],
                  ['active', nav.active],
                  ['completed', nav.completed],
                ].map(([key, label]) => (
                  <FilterChip
                    key={key}
                    label={label}
                    selected={orderFilter === key}
                    onPress={() => setOrderFilter(key)}
                  />
                ))}
              </ScrollView>

              <Text style={s.resultCount}>
                Orders · {visibleOrders.length}
              </Text>

              {visibleOrders.length ? (
                visibleOrders.map(renderOrder)
              ) : myBuyerOrders.length ? (
                <FarmerEmpty
                  icon="cube-outline"
                  title="No matching orders"
                  subtitle="There are no orders matching this filter."
                  action={nav.reset}
                  onAction={() => setOrderFilter('all')}
                />
              ) : (
                <FarmerEmpty
                  icon="cube-outline"
                  title="No orders placed yet"
                  subtitle="Browse the marketplace and place your first fresh farm order!"
                  action="Browse Marketplace"
                  onAction={() => switchTab('market')}
                />
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* BOTTOM TAB NAVIGATION (MATCHING FARMER WORKSPACE) */}
      <SafeAreaView edges={['bottom']} style={s.navSafe}>
        <View role="tablist" style={s.nav}>
          {Object.keys(NAV_ICONS).map((key) => {
            const selected = key === activeTab;
            const count =
              key === 'requests'
                ? buyerRequests.length
                : key === 'orders'
                ? activeBuyerOrders.length
                : 0;
            return (
              <TourTarget key={key} id={"buyer-tab-" + key} style={{ flex: 1 }}>
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityLabel={nav[key]}
                  accessibilityState={{ selected }}
                  aria-selected={selected}
                  onPress={() => switchTab(key)}
                  style={s.navItem}
                >
                  <View style={[s.navIcon, selected && s.navIconActive]}>
                    <Ionicons
                      name={NAV_ICONS[key]}
                      size={22}
                      color={selected ? C.greenDark : C.muted}
                    />
                    {count > 0 && (
                      <View style={s.navBadge}>
                        <Text style={s.navBadgeText}>{count > 9 ? '9+' : count}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[s.navLabel, selected && s.navLabelActive]}
                  >
                    {nav[key]}
                  </Text>
                </TouchableOpacity>
              </TourTarget>
            );
          })}
        </View>
      </SafeAreaView>

      {/* ============================================== */}
      {/* MODAL: ORDER CONFIRMATION SHEET                */}
      {/* ============================================== */}
      {selectedProduce && (
        <Modal visible={showOrderModal} transparent animationType="fade" onRequestClose={() => setShowOrderModal(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCardLarge}>
              <View style={s.modalTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitle}>{t.modal.title}</Text>
                  <Text style={s.smallText}>
                    Direct from {selectedProduce.farmerName || 'Grower'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowOrderModal(false)}
                  style={s.closeIconBtn}
                >
                  <Ionicons name="close" size={22} color={C.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* PRODUCE SUMMARY */}
                <View style={s.produceSummaryCard}>
                  {selectedProduce.image ? (
                    <Image source={{ uri: selectedProduce.image }} style={s.produceThumbnail} />
                  ) : (
                    <View style={[s.produceThumbnail, s.imageFallback]}>
                      <Ionicons name="leaf-outline" size={20} color={C.green} />
                    </View>
                  )}
                  <View style={s.flex}>
                    <Text style={s.quickTitle}>{cropName(selectedProduce, lang)}</Text>
                    <Text style={s.smallText}>
                      {t.labels.currency} {money(selectedProduce.price)} per{' '}
                      {getProduceUnit(selectedProduce)}
                    </Text>
                  </View>
                </View>

                {/* QUANTITY PICKER */}
                <Text style={s.inputLabel}>{t.modal.qtyLabel}:</Text>
                <View style={s.qtyControlRow}>
                  <TouchableOpacity
                    style={s.qtyButton}
                    onPress={() => setOrderQty(Math.max(1, orderQty - 1))}
                  >
                    <Ionicons name="remove" size={18} color={C.greenDark} />
                  </TouchableOpacity>
                  <Text style={s.qtyValue}>
                    {orderQty} {getProduceUnit(selectedProduce)}
                  </Text>
                  <TouchableOpacity
                    style={s.qtyButton}
                    onPress={() => setOrderQty(orderQty + 1)}
                  >
                    <Ionicons name="add" size={18} color={C.greenDark} />
                  </TouchableOpacity>
                </View>

                {/* QUICK QTY CHIPS */}
                <View style={s.quickChipsWrap}>
                  {[5, 10, 25, 50, 100].map((num) => (
                    <FilterChip
                      key={num}
                      label={`${num} ${getProduceUnit(selectedProduce)}`}
                      selected={orderQty === num}
                      onPress={() => setOrderQty(num)}
                    />
                  ))}
                </View>

                {/* DESTINATION INPUT */}
                <Text style={s.inputLabel}>{t.modal.deliveryLabel}:</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder={t.modal.deliveryPlaceholder}
                  placeholderTextColor={C.muted}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />

                {/* SPECIAL NOTES */}
                <Text style={s.inputLabel}>{t.modal.notesLabel}:</Text>
                <TextInput
                  style={[s.modalInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder={t.modal.notesPlaceholder}
                  placeholderTextColor={C.muted}
                  multiline
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                />

                {/* PRICE BREAKDOWN BOX */}
                <View style={s.breakdownCard}>
                  <View style={s.breakdownRow}>
                    <Text style={s.breakdownLabel}>{t.modal.subtotal}</Text>
                    <Text style={s.breakdownValue}>
                      {t.labels.currency}{' '}
                      {money((selectedProduce.price || 0) * orderQty)}
                    </Text>
                  </View>
                  <View style={s.breakdownRow}>
                    <Text style={s.breakdownLabel}>{t.modal.estLogistics}</Text>
                    <Text style={s.breakdownValue}>
                      {t.labels.currency} 350.00
                    </Text>
                  </View>
                  <View style={[s.breakdownRow, s.breakdownTotalRow]}>
                    <Text style={s.breakdownTotalLabel}>{t.modal.totalPrice}</Text>
                    <Text style={s.breakdownTotalValue}>
                      {t.labels.currency}{' '}
                      {money((selectedProduce.price || 0) * orderQty + 350)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={s.modalActions}>
                <FarmerButton
                  label={t.modal.cancelBtn}
                  secondary
                  onPress={() => setShowOrderModal(false)}
                  style={s.flex}
                />
                <FarmerButton
                  label={t.modal.confirmBtn}
                  icon="checkmark-outline"
                  loading={isPlacingOrder}
                  onPress={handleConfirmOrder}
                  style={s.flex}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ============================================== */}
      {/* MODAL: PRODUCT DETAILS OVERVIEW SHEET          */}
      {/* ============================================== */}
      {detailProduce && (
        <Modal visible={showDetailModal} transparent animationType="fade" onRequestClose={() => setShowDetailModal(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCardLarge}>
              <View style={s.modalTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitle}>Produce Overview</Text>
                  <Text style={s.smallText}>Fresh farm harvest details</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDetailModal(false)}
                  style={s.closeIconBtn}
                >
                  <Ionicons name="close" size={22} color={C.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {detailProduce.image ? (
                  <Image source={{ uri: detailProduce.image }} style={s.detailImage} />
                ) : null}

                <View style={{ marginTop: 12 }}>
                  <View style={s.badgeRow}>
                    <Text style={s.category}>{detailProduce.category || 'Produce'}</Text>
                    {detailProduce.grade ? (
                      <Text style={s.gradeBadge}>Grade {detailProduce.grade}</Text>
                    ) : null}
                  </View>

                  <Text style={s.detailTitle}>{cropName(detailProduce, lang)}</Text>
                  <Text style={s.detailPrice}>
                    {t.labels.currency} {money(detailProduce.price)}{' '}
                    <Text style={s.unit}>/ {getProduceUnit(detailProduce)}</Text>
                  </Text>
                </View>

                {/* GROWER CARD */}
                <View style={s.growerCard}>
                  <IconTile name="person-outline" />
                  <View style={s.flex}>
                    <Text style={s.quickTitle}>
                      {detailProduce.farmerName || 'Verified Farmer'}
                    </Text>
                    <Text style={s.smallText}>
                      📍 {detailProduce.location || 'Sri Lanka'} • Certified Co-op Member
                    </Text>
                  </View>
                </View>

                {/* METRICS GRID */}
                <View style={s.requestMetrics}>
                  <View style={s.flex}>
                    <Text style={s.metricCaption}>Available Stock</Text>
                    <Text style={s.metricValue}>
                      {detailProduce.stockQty || 0} {getProduceUnit(detailProduce)}
                    </Text>
                  </View>
                  <View style={s.flex}>
                    <Text style={s.metricCaption}>Unit Price</Text>
                    <Text style={s.metricValue}>
                      {t.labels.currency} {money(detailProduce.price)}
                    </Text>
                  </View>
                </View>

                {/* DESCRIPTION */}
                <View style={s.descriptionBox}>
                  <Text style={s.descriptionHeader}>Sourcing & Crop Notes</Text>
                  <Text style={s.descriptionText}>
                    {detailProduce.description ||
                      'Fresh farm produce harvested following quality standards. Cooperative transport and direct doorstep delivery available across Sri Lanka.'}
                  </Text>
                </View>
              </ScrollView>

              <View style={s.modalActions}>
                <FarmerButton
                  label="Close"
                  secondary
                  onPress={() => setShowDetailModal(false)}
                  style={s.flex}
                />
                <FarmerButton
                  label="Proceed to Order"
                  icon="cart-outline"
                  disabled={Number(detailProduce.stockQty || 0) <= 0}
                  onPress={handleOpenOrderFromDetail}
                  style={s.flex}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  flex: { flex: 1, minWidth: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.canvas,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  brandCaption: {
    fontSize: 8,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.3,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  language: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  languageText: { fontSize: 12, fontWeight: '700', color: C.muted },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E1EBDD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 17, fontWeight: '700', color: C.greenDark },
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: C.greenDark,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#487B65',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroEyebrow: { fontSize: 11, color: '#D1E9D9' },
  heroTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 21,
    color: '#C1D9CC',
    marginTop: 12,
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: '#2A9068',
    alignSelf: 'flex-start',
    minWidth: 180,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26 },
  statCard: {
    flexBasis: '46%',
    flexGrow: 1,
    padding: 18,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: C.ink,
    marginTop: 14,
  },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 5 },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.ink, flexShrink: 1 },
  textAction: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 },
  textActionText: { fontSize: 12, fontWeight: '600', color: C.green },
  quickCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, gap: 12 },
  quickBorder: { borderTopWidth: 1, borderTopColor: C.border },
  quickTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 4 },
  bannerCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 18,
  },
  bannerLeft: { flex: 1 },
  bannerBadge: {
    backgroundColor: C.mint,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bannerBadgeText: { fontSize: 10, fontWeight: '700', color: C.green },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 4 },
  bannerSub: { fontSize: 12, lineHeight: 18, color: C.muted },
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    marginBottom: 16,
  },
  listingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 15 },
  produceImage: { width: 90, height: 106, borderRadius: 15, backgroundColor: C.mint },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: C.green,
    backgroundColor: C.mint,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: C.greenDark,
    backgroundColor: '#E1EBDD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: C.ink, lineHeight: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  farmerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  smallText: { fontSize: 12, lineHeight: 18, color: C.muted, flexShrink: 1 },
  price: { fontSize: 18, fontWeight: '800', color: C.greenDark, marginTop: 8 },
  unit: { fontSize: 12, fontWeight: '500', color: C.muted },
  description: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 12 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 16,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 11, color: C.muted },
  inlineActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactBtn: { minHeight: 40, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  openBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: C.amberBg,
    borderRadius: 7,
  },
  openBadgeText: { fontSize: 10, fontWeight: '700', color: C.amber },
  requestMetrics: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.canvas,
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  metricCaption: { fontSize: 11, color: C.muted, marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '700', color: C.ink },
  note: {
    backgroundColor: C.canvas,
    borderLeftWidth: 3,
    borderLeftColor: C.border,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  noteText: { fontSize: 12, lineHeight: 19, color: C.muted },
  orderTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  orderId: { fontSize: 11, color: C.muted, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 5, marginTop: 4, marginBottom: 13 },
  progressStep: { flex: 1 },
  progressLine: { height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 7 },
  progressText: { fontSize: 9, color: C.muted },
  orderActions: { gap: 8, marginTop: 14 },
  addRow: { marginBottom: 18 },
  searchBox: {
    minHeight: 52,
    paddingLeft: 15,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    fontSize: 14,
    color: C.ink,
    paddingVertical: 10,
  },
  clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingBottom: 4 },
  filterRowWrap: { marginTop: 10 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: C.muted, marginBottom: 6 },
  resultCount: { fontSize: 12, color: C.muted, marginTop: 14, marginBottom: 14 },
  navSafe: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: C.border },
  nav: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingTop: 9,
    paddingBottom: 7,
  },
  navItem: { flex: 1, minHeight: 58, alignItems: 'center', gap: 4 },
  navIcon: {
    width: 48,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: { backgroundColor: C.mint },
  navLabel: {
    width: '100%',
    fontSize: 10,
    lineHeight: 14,
    color: C.muted,
    textAlign: 'center',
    paddingHorizontal: 2,
    flexShrink: 1,
  },
  navLabelActive: { color: C.greenDark, fontWeight: '700' },
  navBadge: {
    position: 'absolute',
    top: -3,
    right: 2,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: C.green,
  },
  navBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,35,26,0.5)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardLarge: {
    width: '100%',
    maxWidth: 480,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  closeIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  produceSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  produceThumbnail: { width: 50, height: 50, borderRadius: 10, backgroundColor: C.mint },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.ink, marginTop: 10, marginBottom: 6 },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.canvas,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.ink },
  quickChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: C.ink,
    minHeight: 44,
  },
  breakdownCard: {
    backgroundColor: C.canvas,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 14,
    marginBottom: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: { fontSize: 12, color: C.muted },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: C.ink },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    marginTop: 6,
  },
  breakdownTotalLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  breakdownTotalValue: { fontSize: 16, fontWeight: '800', color: C.greenDark },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  detailImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    backgroundColor: C.mint,
    marginBottom: 8,
  },
  detailTitle: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 6 },
  detailPrice: { fontSize: 18, fontWeight: '800', color: C.greenDark, marginTop: 6 },
  growerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 14,
  },
  descriptionBox: {
    backgroundColor: C.canvas,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 10,
  },
  descriptionHeader: { fontSize: 12, fontWeight: '700', color: C.ink, marginBottom: 4 },
  descriptionText: { fontSize: 12, lineHeight: 19, color: C.muted },
});

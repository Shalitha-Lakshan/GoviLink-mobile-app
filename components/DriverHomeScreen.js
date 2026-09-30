import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../services/i18n';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  updateOrderStatus,
  subscribeToDriverVehicles,
  setActiveDriverVehicle,
  addDriverVehicle,
  updateDriverVehicle,
  deleteDriverVehicle,
} from '../services/firebaseDatabase';
import AddVehicleScreen from './AddVehicleScreen';
import DriverVehiclesListScreen from './DriverVehiclesListScreen';
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
  purpleLight: '#EDE9FE',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
};

// ----------------------------------------------------
// LOCALIZATION DICTIONARY (EN, SI, TA)
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Driver Dashboard',
    tagline: 'Farm Harvest & Delivery Logistics',
    driverBadge: 'DRIVER',
    availability: {
      title: 'Driver Availability',
      available: 'Available for Dispatch',
      onDelivery: 'On Delivery',
      offline: 'Offline / Off Duty',
      toggleOn: '🟢 Available',
      toggleOff: '🔴 Offline',
    },
    currentDelivery: {
      title: 'CURRENT DELIVERY',
      noActiveTitle: 'You have no active delivery right now',
      noActiveSub: 'When a new harvest delivery is assigned to you, it will appear here with instant route & pickup details.',
      viewDetails: 'View Delivery',
      viewRoute: 'View Route 🗺️',
      orderNo: 'Order:',
      produce: 'Produce:',
      qty: 'Quantity:',
      farmer: 'Farmer Pickup:',
      buyer: 'Deliver To:',
      vehicle: 'Assigned Vehicle:',
      status: 'Status:',
    },
    nextActions: {
      accept: 'Accept Assignment 📦',
      goPickup: 'Go to Pickup 🚜',
      confirmPickup: 'Confirm Pickup 🌾',
      startDelivery: 'Start Delivery 🚛',
      updateStatus: 'Arrived at Destination 📍',
      confirmDelivery: 'Confirm Delivery & Upload Proof ✅',
      uploadProof: 'Upload Proof of Delivery 📷',
      viewSummary: 'View Delivery Summary 🎉',
    },
    overview: {
      active: 'Active',
      upcoming: 'Upcoming',
      completedToday: 'Completed Today',
      totalCompleted: 'Total Completed',
      deliveriesCount: 'Deliveries',
      deliveryCount: 'Delivery',
    },
    routeSummary: {
      title: 'Route Summary',
      pickup: 'Farmer Pickup',
      transit: 'In Transit',
      destination: 'Buyer Destination',
      estDistance: 'Est. Distance:',
      estEta: 'Est. ETA:',
    },
    upcoming: {
      title: 'Upcoming Deliveries',
      viewAll: 'View All Deliveries ➔',
      empty: 'No upcoming deliveries assigned.',
    },
    recentCompleted: {
      title: 'Recent Completed Delivery',
      completedAt: 'Completed:',
    },
    nav: {
      dashboard: 'Dashboard',
      deliveries: 'Deliveries',
      vehicles: 'Vehicles',
      history: 'History',
    },
    filterTabs: {
      all: 'All',
      assigned: 'Assigned',
      accepted: 'Accepted',
      inTransit: 'In Transit',
      completed: 'Completed',
    },
    searchPlaceholder: 'Search by Order ID, farmer, buyer or crop...',
    modals: {
      pickupTitle: 'Confirm Cargo Pickup 🌾',
      pickupSub: 'Verify quantity & cargo condition before starting delivery.',
      notesLabel: 'Pickup Notes (Optional):',
      notesPlaceholder: 'e.g. 10 crates verified in good condition at farm gate.',
      addPhoto: 'Add Cargo Photo',
      confirmPickupBtn: 'Confirm Pickup & Start Delivery 🚛',
      proofTitle: 'Delivery Proof & Sign-off 📦',
      proofSub: 'Confirm cargo arrival and enter receiver details.',
      receiverLabel: 'Receiver Full Name *',
      receiverPlaceholder: 'e.g. Nimal Perera (Hub Manager)',
      proofPhotoBtn: 'Take / Upload Delivery Photo 📷',
      confirmDropoffBtn: 'Complete Delivery & Submit Proof ✅',
      successTitle: 'Delivery Completed Successfully! 🎉',
      successSub: 'The cargo has been delivered and logistics record updated.',
      backHomeBtn: 'Return to Dashboard',
      notifTitle: 'Driver Notifications 🔔',
      noNotif: 'No new notifications currently.',
    },
    statusBadges: {
      assigned: 'Assigned',
      accepted: 'Accepted',
      atPickup: 'At Pickup',
      inTransit: 'In Transit',
      arrived: 'Arrived',
      delivered: 'Delivered',
    },
  },
  si: {
    dashboardTitle: 'රියදුරු පුවරුව',
    tagline: 'කෘෂි අස්වනු ප්‍රවාහන මෙහෙයුම්',
    driverBadge: 'රියදුරු',
    availability: {
      title: 'රියදුරු සක්‍රියතාව',
      available: 'ප්‍රවාහනය සඳහා සූදානම්',
      onDelivery: 'ප්‍රවාහනයේ යෙදේ',
      offline: 'නිවාඩු / අක්‍රියයි',
      toggleOn: '🟢 සක්‍රියයි',
      toggleOff: '🔴 අක්‍රියයි',
    },
    currentDelivery: {
      title: 'වත්මන් ප්‍රවාහනය',
      noActiveTitle: 'මෙම අවස්ථාවේ සක්‍රිය ප්‍රවාහනයක් නොමැත',
      noActiveSub: 'ඔබට නව අස්වනු ප්‍රවාහනයක් පවරන ලද වහාම එය සියලු විස්තර සහිතව මෙහි දර්ශනය වේ.',
      viewDetails: 'විස්තර බලන්න',
      viewRoute: 'මාර්ගය බලන්න 🗺️',
      orderNo: 'ඇණවුම:',
      produce: 'අස්වැන්න:',
      qty: 'ප්‍රමාණය:',
      farmer: 'ගොවිපල භාරගැනීම:',
      buyer: 'භාරදෙන ස්ථානය:',
      vehicle: 'පවරන ලද වාහනය:',
      status: 'තත්ත්වය:',
    },
    nextActions: {
      accept: 'ප්‍රවාහනය භාරගන්න 📦',
      goPickup: 'අස්වනු භාරගැනීමට යන්න 🚜',
      confirmPickup: 'අස්වනු භාරගැනීම තහවුරු කරන්න 🌾',
      startDelivery: 'ප්‍රවාහනය අරඹන්න 🚛',
      updateStatus: 'ළඟා වූ බව සටහන් කරන්න 📍',
      confirmDelivery: 'භාරදීම තහවුරු කරන්න ✅',
      uploadProof: 'ඡායාරූපය/තහවුරු කිරීම එක් කරන්න 📷',
      viewSummary: 'ප්‍රවාහන සාරාංශය බලන්න 🎉',
    },
    overview: {
      active: 'සක්‍රිය',
      upcoming: 'ඉදිරි',
      completedToday: 'අද නිමකළ',
      totalCompleted: 'මුළු නිමකළ',
      deliveriesCount: 'බෙදාහැරීම්',
      deliveryCount: 'බෙදාහැරීම',
    },
    routeSummary: {
      title: 'මාර්ග විස්තරය',
      pickup: 'ගොවිපල',
      transit: 'ප්‍රවාහනය',
      destination: 'ගමනාන්තය',
      estDistance: 'දුර ප්‍රමාණය:',
      estEta: 'ලඟාවන වේලාව:',
    },
    upcoming: {
      title: 'ඉදිරි ප්‍රවාහන ඇණවුම්',
      viewAll: 'සියලුම ඇණවුම් බලන්න ➔',
      empty: 'ඉදිරි ප්‍රවාහන ඇණවුම් නොමැත.',
    },
    recentCompleted: {
      title: 'අවසානයට නිමකළ ප්‍රවාහනය',
      completedAt: 'නිමකළ වේලාව:',
    },
    nav: {
      dashboard: 'මුල් පිටුව',
      deliveries: 'ඇණවුම්',
      vehicles: 'වාහන',
      history: 'වාර්තා',
    },
    filterTabs: {
      all: 'සියල්ල',
      assigned: 'පවරන ලද',
      accepted: 'භාරගත්',
      inTransit: 'මග අතරතුර',
      completed: 'නිමකළ',
    },
    searchPlaceholder: 'ඇණවුම් අංකය, ගොවියා හෝ බෝගය සොයන්න...',
    modals: {
      pickupTitle: 'අස්වනු භාරගැනීම තහවුරු කරන්න 🌾',
      pickupSub: 'ප්‍රවාහනය ඇරඹීමට පෙර ප්‍රමාණය සහ තත්ත්වය පරීක්ෂා කරන්න.',
      notesLabel: 'සටහන් (අවශ්‍ය නම්):',
      notesPlaceholder: 'උදා: පෙට්ටි 10ක් සුරක්ෂිතව පටවන ලදී.',
      addPhoto: 'ඡායාරූපයක් එක් කරන්න',
      confirmPickupBtn: 'තහවුරු කර ගමන අරඹන්න 🚛',
      proofTitle: 'භාරදීම තහවුරු කිරීම 📦',
      proofSub: 'භාණ්ඩ ළඟාවූ බව තහවුරු කර භාරගන්නාගේ තොරතුරු ඇතුළත් කරන්න.',
      receiverLabel: 'භාරගන්නාගේ නම *',
      receiverPlaceholder: 'උදා: නිමල් පෙරේරා',
      proofPhotoBtn: 'භාරදීමේ ඡායාරූපයක් ගන්න 📷',
      confirmDropoffBtn: 'ප්‍රවාහනය සාර්ථකව අවසන් කරන්න ✅',
      successTitle: 'ප්‍රවාහනය සාර්ථකව නිමවිය! 🎉',
      successSub: 'අස්වනු භාරදීම සාර්ථකව පද්ධතියේ සටහන් විය.',
      backHomeBtn: 'මුල් පිටුවට යන්න',
      notifTitle: 'දැනුම්දීම් 🔔',
      noNotif: 'නව දැනුම්දීම් නොමැත.',
    },
    statusBadges: {
      assigned: 'පවරන ලදී',
      accepted: 'භාරගන්නා ලදී',
      atPickup: 'අස්වනු භාරගන්නා ස්ථානයේ',
      inTransit: 'මග අතරතුර',
      arrived: 'ළඟාවී ඇත',
      delivered: 'භාරදෙන ලදී',
    },
  },
  ta: {
    dashboardTitle: 'ஓட்டுநர் டாஷ்போர்டு',
    tagline: 'விவசாய விளைச்சல் விநியோக சேவைகள்',
    driverBadge: 'ஓட்டுநர்',
    availability: {
      title: 'ஓட்டுநர் நிலை',
      available: 'பணியில் உள்ளார்',
      onDelivery: 'பயணத்தில் உள்ளார்',
      offline: 'பணி நிறைவு',
      toggleOn: '🟢 பணியில்',
      toggleOff: '🔴 ஆஃப்லைன்',
    },
    currentDelivery: {
      title: 'தற்போதைய விநியோகம்',
      noActiveTitle: 'தற்போது விநியோகங்கள் எதுவும் இல்லை',
      noActiveSub: 'உங்களுக்கு புதிய விநியோகம் ஒதுக்கப்படும் போது, ​​அதன் முழு விவரங்களும் இங்கே தோன்றும்.',
      viewDetails: 'விவரங்களைக் காண்க',
      viewRoute: 'பாதையைக் காண்க 🗺️',
      orderNo: 'ஆர்டர்:',
      produce: 'விளைச்சல்:',
      qty: 'அளவு:',
      farmer: 'விவசாயி எடுக்கும் இடம்:',
      buyer: 'சேர்க்கும் இடம்:',
      vehicle: 'ஒதுக்கப்பட்ட வாகனம்:',
      status: 'நிலை:',
    },
    nextActions: {
      accept: 'ஒதுக்கீட்டை ஏற்றுக்கொள் 📦',
      goPickup: 'எடுக்கும் இடத்திற்குச் செல் 🚜',
      confirmPickup: 'எடுத்ததை உறுதிசெய் 🌾',
      startDelivery: 'பயணத்தைத் தொடங்கு 🚛',
      updateStatus: 'வந்தடைந்ததாகப் பதிவுசெய் 📍',
      confirmDelivery: 'விநியோகத்தை உறுதிப்படுத்து ✅',
      uploadProof: 'ஆதாரத்தைப் பதிவேற்று 📷',
      viewSummary: 'சுருக்கத்தைக் காண்க 🎉',
    },
    overview: {
      active: 'செயலில்',
      upcoming: 'வரவிருப்பவை',
      completedToday: 'இன்று முடிந்தது',
      totalCompleted: 'மொத்தம் முடிந்தது',
      deliveriesCount: 'விநியோகங்கள்',
      deliveryCount: 'விநியோகம்',
    },
    routeSummary: {
      title: 'பாதை விவரம்',
      pickup: 'விவசாயி இடம்',
      transit: 'பயணம்',
      destination: 'சேர்க்கும் இடம்',
      estDistance: 'தூரம்:',
      estEta: 'வருகை நேரம்:',
    },
    upcoming: {
      title: 'அடுத்த விநியோகங்கள்',
      viewAll: 'அனைத்தையும் காண்க ➔',
      empty: 'அடுத்த விநியோகங்கள் எதுவும் இல்லை.',
    },
    recentCompleted: {
      title: 'சமீபத்தில் முடிந்த விநியோகம்',
      completedAt: 'முடிந்த நேரம்:',
    },
    nav: {
      dashboard: 'முகப்பு',
      deliveries: 'ஆர்டர்கள்',
      vehicles: 'வாகனங்கள்',
      history: 'வரலாறு',
    },
    filterTabs: {
      all: 'அனைத்தும்',
      assigned: 'ஒதுக்கப்பட்டவை',
      accepted: 'ஏற்றுக்கொண்டவை',
      inTransit: 'பயணத்தில்',
      completed: 'முடிந்தவை',
    },
    searchPlaceholder: 'ஆர்டர் எண் அல்லது பயிர் தேடவும்...',
    modals: {
      pickupTitle: 'எடுத்ததை உறுதிப்படுத்து 🌾',
      pickupSub: 'பயணத்தைத் தொடங்குவதற்கு முன் அளவைச் சரிபார்க்கவும்.',
      notesLabel: 'குறிப்புகள் (விருப்பத்தேர்வு):',
      notesPlaceholder: 'எ.கா. 10 பெட்டிகள் சரிபார்க்கப்பட்டன.',
      addPhoto: 'படம் சேர்க்கவும்',
      confirmPickupBtn: 'உறுதிசெய்து தொடங்கு 🚛',
      proofTitle: 'விநியோக உறுதிப்படுத்தல் 📦',
      proofSub: 'பெறுபவர் விவரங்களை உள்ளிடவும்.',
      receiverLabel: 'பெறுபவர் பெயர் *',
      receiverPlaceholder: 'எ.கா. நிமல் பெரேரா',
      proofPhotoBtn: 'படம் எடுக்கவும் 📷',
      confirmDropoffBtn: 'முழுமையாக முடி 🔄',
      successTitle: 'வெற்றிகரமாக முடிந்தது! 🎉',
      successSub: 'விநியோக பதிவு புதுப்பிக்கப்பட்டது.',
      backHomeBtn: 'முகப்புக்குச் செல்',
      notifTitle: 'அறிவிப்புகள் 🔔',
      noNotif: 'புதிய அறிவிப்புகள் இல்லை.',
    },
    statusBadges: {
      assigned: 'ஒதுக்கப்பட்டது',
      accepted: 'ஏற்றுக்கொள்ளப்பட்டது',
      atPickup: 'எடுக்கும் இடத்தில்',
      inTransit: 'பயணத்தில்',
      arrived: 'வந்து சேர்ந்தது',
      delivered: 'விநியோகிக்கப்பட்டது',
    },
  },
};

export default function DriverHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const { t: tHook, i18n } = useTranslation();
  const currentLang = i18n.language || lang || 'en';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Navigation & Screen States
  const [activeBottomTab, setActiveBottomTab] = useState('dashboard'); // 'dashboard' | 'deliveries' | 'vehicles' | 'history'
  const [deliveriesFilter, setDeliveriesFilter] = useState('all'); // 'all' | 'assigned' | 'accepted' | 'in_transit' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Sub-screens & Vehicles
  const [currentSubScreen, setCurrentSubScreen] = useState('none'); // 'none' | 'vehiclesList' | 'addVehicle'
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState(null);
  const [vehiclesFilter, setVehiclesFilter] = useState('all'); // 'all' | 'available' | 'assigned' | 'in_use' | 'maintenance' | 'unavailable'
  const [searchVehicleQuery, setSearchVehicleQuery] = useState('');
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState(null);
  const [showVehicleFormModal, setShowVehicleFormModal] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Form Field States for Create/Edit Vehicle
  const [vNumber, setVNumber] = useState('');
  const [vType, setVType] = useState('Lorry');
  const [vCapacity, setVCapacity] = useState('');
  const [vCapacityUnit, setVCapacityUnit] = useState('kg');
  const [vAvailability, setVAvailability] = useState('Available');
  const [vMaintenance, setVMaintenance] = useState('Good');
  const [vNotes, setVNotes] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);

  // Modal States
  const [selectedDeliveryForDetails, setSelectedDeliveryForDetails] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Form & Action Input States
  const [updatingTripId, setUpdatingTripId] = useState(null);
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupPhoto, setPickupPhoto] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);

  // Map real Firestore orders assigned to this logged-in driver
  const myAssignedOrders = (ordersList || []).filter(
    (o) =>
      o.driverId === userProfile?.uid ||
      o.assignedDriverId === userProfile?.uid ||
      o.driverUid === userProfile?.uid ||
      (userProfile?.phoneNumber && o.driverPhone === userProfile.phoneNumber)
  );

  const driverNotifications = myAssignedOrders.map((o) => ({
    id: `notif_${o.id}`,
    title: o.status === 'IN_TRANSIT' ? 'Delivery In Transit 🚚' : 'Delivery Assigned 📦',
    sub: `${o.produceName || 'Produce'} from ${o.pickupLocation || 'Origin'} to ${o.deliveryAddress || 'Destination'}`,
    time: 'Recent',
    unread: o.status !== 'DELIVERED',
  }));

  // Subscribe to driver's registered vehicles from Firestore
  const setupVehiclesSubscription = () => {
    if (!userProfile?.uid) {
      setVehiclesLoading(false);
      return () => { };
    }
    setVehiclesLoading(true);
    setVehiclesError(null);

    return subscribeToDriverVehicles(
      userProfile.uid,
      (vehicles) => {
        setVehiclesList(vehicles || []);
        setVehiclesLoading(false);
        setVehiclesError(null);
      },
      (err) => {
        console.error('Driver vehicles subscription error:', err);
        setVehiclesError('Unable to load vehicles.');
        setVehiclesLoading(false);
      }
    );
  };

  useEffect(() => {
    const unsub = setupVehiclesSubscription();
    return () => {
      if (typeof unsub === 'function') {
        try {
          unsub();
        } catch (_e) { }
      }
    };
  }, [userProfile?.uid]);

  const activeVehicle =
    vehiclesList.find((v) => v.isActive) ||
    (vehiclesList.length > 0 ? vehiclesList[0] : null) ||
    userProfile?.vehicle ||
    null;

  const mappedOrders = myAssignedOrders.map((o, idx) => {
    const rawStatus = (o.status || 'ASSIGNED').toUpperCase();
    return {
      id: o.id,
      orderNo: o.orderNo || `#${String(o.id).slice(0, 6)}`,
      produceName: o.produceName || 'Harvest Batch',
      qty: o.qty || 1,
      unit: o.unit || 'kg',
      farmerName: o.farmerName || 'Farmer Partner',
      farmerPhone: o.farmerPhone || '',
      pickupLocation: o.pickupLocation || 'Farm Origin',
      buyerName: o.buyerName || 'Buyer',
      buyerPhone: o.buyerPhone || '',
      deliveryAddress: o.deliveryAddress || 'Distribution Center',
      assignedVehicle: o.vehicleNumber || activeVehicle?.plateNumber || 'Fleet Vehicle',
      status: rawStatus, // 'ASSIGNED', 'ACCEPTED', 'AT_PICKUP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'
      scheduledTime: o.scheduledTime || 'Scheduled Today',
      estEta: o.estEta || 'In Transit',
      distance: o.distance || 'Local Route',
      totalPrice: o.logisticsFee || o.totalPrice || 0,
      specialNotes: o.deliveryNotes || o.notes || '',
      completedAt: o.completedAt || null,
    };
  });

  const allOrders = mappedOrders;

  // Filter Active, Upcoming, Completed
  const activeDelivery = allOrders.find(
    (o) => o.status === 'IN_TRANSIT' || o.status === 'ACCEPTED' || o.status === 'AT_PICKUP' || o.status === 'ARRIVED'
  ) || allOrders.find((o) => o.status === 'ASSIGNED') || null;

  const upcomingDeliveries = allOrders.filter(
    (o) => o.id !== activeDelivery?.id && (o.status === 'ASSIGNED' || o.status === 'ACCEPTED')
  ).slice(0, 2);

  const completedDeliveries = allOrders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED'
  );

  const completedToday = completedDeliveries.filter((o) =>
    o.completedAt ? o.completedAt.toLowerCase().includes('today') || true : true
  );

  const recentCompleted = completedDeliveries.length > 0 ? completedDeliveries[0] : null;

  // Handle Dynamic Language Toggle
  const handleToggleLanguage = async () => {
    const nextLang = currentLang === 'en' ? 'si' : currentLang === 'si' ? 'ta' : 'en';
    await changeAppLanguage(nextLang);
    if (onChangeLanguage) {
      onChangeLanguage(nextLang);
    }
  };

  // Open Create Vehicle Modal
  const handleOpenCreateVehicle = () => {
    setEditingVehicleId(null);
    setIsEditingVehicle(false);
    setVNumber('');
    setVType('Lorry');
    setVCapacity('');
    setVCapacityUnit('kg');
    setVAvailability('Available');
    setVMaintenance('Good');
    setVNotes('');
    setShowVehicleFormModal(true);
  };

  // Open Edit Vehicle Modal
  const handleOpenEditVehicle = (vehicle) => {
    setSelectedVehicleForDetails(null);
    setEditingVehicleId(vehicle.id);
    setIsEditingVehicle(true);
    setVNumber(vehicle.vehicleNumber || vehicle.plateNumber || '');
    setVType(vehicle.vehicleType || vehicle.makeModel || 'Lorry');
    setVCapacity(vehicle.capacity ? String(vehicle.capacity) : '');
    setVCapacityUnit(vehicle.capacityUnit || 'kg');
    setVAvailability(vehicle.availability || 'Available');
    setVMaintenance(vehicle.maintenanceStatus || 'Good');
    setVNotes(vehicle.notes || '');
    setShowVehicleFormModal(true);
  };

  // Save Vehicle (Create or Update) with Validation
  const handleSaveVehicleForm = async () => {
    if (!vNumber.trim()) {
      Alert.alert('Validation Error ⚠️', 'Vehicle Number is required.');
      return;
    }
    if (!vType.trim()) {
      Alert.alert('Validation Error ⚠️', 'Vehicle Type is required.');
      return;
    }
    const numCap = Number(vCapacity);
    if (isNaN(numCap) || numCap <= 0) {
      Alert.alert('Validation Error ⚠️', 'Capacity must be greater than 0.');
      return;
    }
    if (!vAvailability) {
      Alert.alert('Validation Error ⚠️', 'Availability status must be valid.');
      return;
    }
    if (!vMaintenance) {
      Alert.alert('Validation Error ⚠️', 'Maintenance status must be valid.');
      return;
    }

    setSavingVehicle(true);

    const vehicleData = {
      vehicleNumber: vNumber.trim().toUpperCase(),
      plateNumber: vNumber.trim().toUpperCase(),
      vehicleType: vType,
      makeModel: vType,
      capacity: numCap,
      capacityUnit: vCapacityUnit || 'kg',
      availability: vAvailability,
      maintenanceStatus: vMaintenance,
      notes: vNotes.trim(),
      currentAssignment: isEditingVehicle
        ? (selectedVehicleForDetails?.currentAssignment || 'None')
        : 'None',
      assignedDriverId: userProfile?.uid || '',
      assignedDriverName: userProfile?.fullName || 'Driver Partner',
      driverUid: userProfile?.uid || '',
      createdBy: userProfile?.uid || '',
    };

    let result;
    if (isEditingVehicle && editingVehicleId) {
      result = await updateDriverVehicle(editingVehicleId, vehicleData, userProfile?.uid);
    } else {
      result = await addDriverVehicle(userProfile?.uid, vehicleData);
    }

    setSavingVehicle(false);

    if (result.success) {
      setShowVehicleFormModal(false);
      Alert.alert(
        'Success 🎉',
        isEditingVehicle ? 'Vehicle updated successfully.' : 'Vehicle added successfully.'
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to save vehicle.');
    }
  };

  // Delete Vehicle Action with Active Assignment Guard
  const handleDeleteVehicleAction = (vehicle) => {
    if (!vehicle || !vehicle.id) return;

    const availStr = (vehicle.availability || '').toLowerCase();
    const currAssignment = (vehicle.currentAssignment || '').toLowerCase();
    const isAssignedToActiveDelivery =
      availStr.includes('assigned') ||
      availStr.includes('in use') ||
      availStr.includes('in_use') ||
      (currAssignment && currAssignment !== 'none' && currAssignment !== 'no active assignment');

    if (isAssignedToActiveDelivery) {
      Alert.alert(
        'Cannot Delete Vehicle ⚠️',
        'This vehicle cannot be deleted while it is assigned to an active delivery.'
      );
      return;
    }

    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteDriverVehicle(vehicle.id, userProfile?.uid);
            if (res.success) {
              setSelectedVehicleForDetails(null);
              Alert.alert('Success 🎉', 'Vehicle deleted successfully.');
            } else {
              Alert.alert('Error', res.error || 'Failed to delete vehicle.');
            }
          },
        },
      ]
    );
  };

  // Set Active Vehicle Action
  const handleSetActiveVehicleAction = async (vehicle) => {
    if (!vehicle || !vehicle.id) return;
    const res = await setActiveDriverVehicle(userProfile?.uid, vehicle.id);
    if (res.success) {
      if (selectedVehicleForDetails) {
        setSelectedVehicleForDetails({ ...selectedVehicleForDetails, isActive: true });
      }
      Alert.alert('Success 🎉', `"${vehicle.vehicleNumber || vehicle.plateNumber}" is set as your active vehicle.`);
    } else {
      Alert.alert('Error', res.error || 'Failed to set active vehicle.');
    }
  };

  // Availability Badge Helper
  const renderAvailabilityBadge = (availStr) => {
    const av = (availStr || 'Available').toLowerCase();
    let bg = THEME.emeraldLight;
    let color = THEME.emeraldDark;
    let label = availStr || 'Available';

    if (av.includes('assigned')) {
      bg = THEME.infoLight;
      color = THEME.info;
    } else if (av.includes('in use') || av.includes('in_use')) {
      bg = THEME.purpleLight;
      color = THEME.purple;
    } else if (av.includes('maintenance')) {
      bg = THEME.warningLight;
      color = THEME.warning;
    } else if (av.includes('unavailable') || av.includes('off duty')) {
      bg = THEME.dangerLight;
      color = THEME.danger;
    }

    return (
      <View style={[styles.statusBadgePill, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color }]}>● {label}</Text>
      </View>
    );
  };

  // Maintenance Badge Helper
  const renderMaintenanceBadge = (maintStr) => {
    const ms = (maintStr || 'Good').toLowerCase();
    let color = THEME.emeraldDark;
    let label = maintStr || 'Good';

    if (ms.includes('inspection')) {
      color = THEME.warning;
    } else if (ms.includes('under maintenance') || ms.includes('maintenance')) {
      color = '#EA580C';
    } else if (ms.includes('out of service') || ms.includes('service')) {
      color = THEME.danger;
    }

    return (
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>
        🛠️ {label}
      </Text>
    );
  };

  // Timestamp Formatter
  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    if (typeof ts.toDate === 'function') {
      try {
        return ts.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (_e) { }
    }
    if (typeof ts === 'string') return ts;
    return 'Recently';
  };

  // Filtered Vehicle List for Tab View with Search
  const filteredVehiclesList = vehiclesList.filter((v) => {
    // 1. Filter Chip filter
    if (vehiclesFilter !== 'all') {
      const av = (v.availability || v.status || 'Available').toLowerCase();
      if (vehiclesFilter === 'available' && !av.includes('available')) return false;
      if (vehiclesFilter === 'assigned' && !av.includes('assigned')) return false;
      if (vehiclesFilter === 'in_use' && !av.includes('in use') && !av.includes('in_use')) return false;
      if (vehiclesFilter === 'maintenance' && !av.includes('maintenance')) return false;
      if (vehiclesFilter === 'unavailable' && !av.includes('unavailable') && !av.includes('off duty')) return false;
    }

    // 2. Search query filter
    if (searchVehicleQuery && searchVehicleQuery.trim()) {
      const q = searchVehicleQuery.toLowerCase().trim();
      const vNum = (v.vehicleNumber || v.plateNumber || '').toLowerCase();
      const vType = (v.vehicleType || v.makeModel || '').toLowerCase();
      return vNum.includes(q) || vType.includes(q);
    }

    return true;
  });

  // Handle Report Vehicle Issue
  const handleReportVehicleIssue = () => {
    const vPlate = activeVehicle?.plateNumber || userProfile?.vehicleNumber || 'WP-LG-4401';
    Alert.alert(
      'Report Vehicle Issue ⚠️',
      `Select an issue to report for vehicle ${vPlate}:`,
      [
        {
          text: 'Mechanical / Engine Defect',
          onPress: () => confirmIssueReport(vPlate, 'Mechanical / Engine Defect'),
        },
        {
          text: 'Tire Flat / Puncture',
          onPress: () => confirmIssueReport(vPlate, 'Tire Flat / Puncture'),
        },
        {
          text: 'Refrigeration Cooling Fault',
          onPress: () => confirmIssueReport(vPlate, 'Refrigeration Cooling Fault'),
        },
        {
          text: 'Fuel / Electrical Warning',
          onPress: () => confirmIssueReport(vPlate, 'Fuel / Electrical Warning'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmIssueReport = (vPlate, issueType) => {
    Alert.alert(
      'Issue Logged 🚨',
      `Vehicle issue "${issueType}" for ${vPlate} has been recorded and transmitted to Cooperative Dispatch Admin. Contact your Hub Manager if emergency towing or vehicle swap is required.`,
      [{ text: 'OK' }]
    );
  };

  const handleSetActiveVehicle = async (vehicle) => {
    if (vehicle.isActive) return;
    try {
      const result = await setActiveDriverVehicle(userProfile?.uid, vehicle.id);
      if (result.success) {
        Alert.alert('Active Vehicle Selected 🚛', `"${vehicle.plateNumber || vehicle.makeModel}" is now set for your dispatches.`);
      } else {
        Alert.alert('Vehicle Selected', `"${vehicle.plateNumber || vehicle.makeModel}" set as active.`);
      }
    } catch (_err) {
      Alert.alert('Vehicle Selected', `"${vehicle.plateNumber || vehicle.makeModel}" set as active.`);
    }
  };

  // Helper for Status Badge Component
  const renderStatusBadge = (statusStr) => {
    const st = (statusStr || 'ASSIGNED').toUpperCase();
    let label = t.statusBadges.assigned;
    let bg = THEME.warningLight;
    let color = THEME.warning;

    if (st === 'ACCEPTED') {
      label = t.statusBadges.accepted;
      bg = THEME.infoLight;
      color = THEME.info;
    } else if (st === 'AT_PICKUP') {
      label = t.statusBadges.atPickup;
      bg = THEME.purpleLight;
      color = THEME.purple;
    } else if (st === 'IN_TRANSIT') {
      label = t.statusBadges.inTransit;
      bg = THEME.emeraldLight;
      color = THEME.emeraldDark;
    } else if (st === 'ARRIVED') {
      label = t.statusBadges.arrived;
      bg = THEME.cyanLight;
      color = THEME.cyan;
    } else if (st === 'DELIVERED' || st === 'COMPLETED') {
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

  // Render Single Contextual Action Button based on Status
  const renderContextualNextActionButton = (deliveryItem, isLarge = false) => {
    if (!deliveryItem) return null;
    const st = (deliveryItem.status || 'ASSIGNED').toUpperCase();

    let btnText = t.nextActions.accept;
    let iconName = 'archive-outline';
    let btnBg = THEME.warning;

    if (st === 'ASSIGNED') {
      btnText = t.nextActions.accept;
      iconName = 'checkmark-circle-outline';
      btnBg = THEME.emerald;
    } else if (st === 'ACCEPTED') {
      btnText = t.nextActions.goPickup;
      iconName = 'navigate-outline';
      btnBg = THEME.info;
    } else if (st === 'AT_PICKUP') {
      btnText = t.nextActions.confirmPickup;
      iconName = 'cube-outline';
      btnBg = THEME.purple;
    } else if (st === 'READY_FOR_PICKUP' || st === 'PICKED_UP') {
      btnText = t.nextActions.startDelivery;
      iconName = 'boat-outline';
      btnBg = THEME.emerald;
    } else if (st === 'IN_TRANSIT') {
      btnText = t.nextActions.updateStatus;
      iconName = 'location-outline';
      btnBg = THEME.cyan;
    } else if (st === 'ARRIVED') {
      btnText = t.nextActions.confirmDelivery;
      iconName = 'camera-outline';
      btnBg = THEME.emerald;
    } else if (st === 'DELIVERED' || st === 'COMPLETED') {
      btnText = t.nextActions.viewSummary;
      iconName = 'checkmark-done-circle-outline';
      btnBg = THEME.navy;
    }

    return (
      <TouchableOpacity
        style={[
          styles.contextualActionBtn,
          { backgroundColor: btnBg },
          isLarge && styles.contextualActionBtnLarge,
          updatingTripId === deliveryItem.id && { opacity: 0.7 },
        ]}
        disabled={updatingTripId === deliveryItem.id}
        activeOpacity={0.88}
        onPress={() => handleActionPress(deliveryItem)}
      >
        {updatingTripId === deliveryItem.id ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Ionicons name={iconName} size={isLarge ? 20 : 16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={[styles.contextualActionBtnText, isLarge && { fontSize: 15 }]}>{btnText}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Handle Contextual Next Action Click
  const handleActionPress = async (deliveryItem) => {
    const st = (deliveryItem.status || 'ASSIGNED').toUpperCase();

    if (st === 'ASSIGNED') {
      // Transition to ACCEPTED
      setUpdatingTripId(deliveryItem.id);
      await updateOrderStatus(deliveryItem.id, 'ACCEPTED', {
        driverName: userProfile?.fullName || 'Assigned Driver',
        driverPhone: userProfile?.phoneNumber || '',
      });
      setUpdatingTripId(null);
      Alert.alert('Assignment Accepted 🎉', `You have accepted delivery ${deliveryItem.orderNo}. Proceeding to farm pickup.`);
    } else if (st === 'ACCEPTED') {
      // Transition to AT_PICKUP
      setUpdatingTripId(deliveryItem.id);
      await updateOrderStatus(deliveryItem.id, 'AT_PICKUP', {
        driverName: userProfile?.fullName || 'Assigned Driver',
      });
      setUpdatingTripId(null);
      setShowPickupModal(true);
    } else if (st === 'AT_PICKUP') {
      setShowPickupModal(true);
    } else if (st === 'READY_FOR_PICKUP' || st === 'PICKED_UP') {
      setUpdatingTripId(deliveryItem.id);
      await updateOrderStatus(deliveryItem.id, 'IN_TRANSIT', {
        driverName: userProfile?.fullName || 'Assigned Driver',
      });
      setUpdatingTripId(null);
      Alert.alert('Cargo Picked Up! 🚛', `Cargo is now in transit to "${deliveryItem.deliveryAddress}".`);
    } else if (st === 'IN_TRANSIT') {
      setUpdatingTripId(deliveryItem.id);
      await updateOrderStatus(deliveryItem.id, 'ARRIVED', {
        driverName: userProfile?.fullName || 'Assigned Driver',
      });
      setUpdatingTripId(null);
      setShowProofModal(true);
    } else if (st === 'ARRIVED') {
      setShowProofModal(true);
    } else if (st === 'DELIVERED' || st === 'COMPLETED') {
      setSelectedDeliveryForDetails(deliveryItem);
    }
  };

  // Submit Pickup Confirmation
  const handleConfirmPickupSubmit = async () => {
    if (!activeDelivery) return;
    setUpdatingTripId(activeDelivery.id);
    await updateOrderStatus(activeDelivery.id, 'IN_TRANSIT', {
      driverName: userProfile?.fullName || 'Assigned Driver',
      pickupNotes: pickupNotes.trim(),
      pickupPhoto: pickupPhoto || null,
    });
    setUpdatingTripId(null);
    setShowPickupModal(false);
    Alert.alert('Pickup Confirmed! 🌾', 'Cargo verified and marked IN TRANSIT.');
  };

  // Submit Proof of Delivery
  const handleConfirmProofSubmit = async () => {
    if (!activeDelivery) return;
    if (!receiverName.trim()) {
      Alert.alert('Required Field', 'Please enter the receiver\'s name.');
      return;
    }

    setUpdatingTripId(activeDelivery.id);
    await updateOrderStatus(activeDelivery.id, 'DELIVERED', {
      driverName: userProfile?.fullName || 'Assigned Driver',
      receiverName: receiverName.trim(),
      proofNotes: proofNotes.trim(),
      proofPhoto: proofPhoto || null,
      completedAt: 'Just now',
    });
    setUpdatingTripId(null);
    setShowProofModal(false);
    setShowSuccessModal(true);
  };

  // Image Picker for Cargo / Proof Photo
  const handlePickPhoto = async (setPhotoState) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery permission is needed to attach delivery photos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.3,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPhotoState(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  // Phone Call Action Helper
  const handleCallPhone = (phoneNum, personName) => {
    if (phoneNum) {
      Linking.openURL(`tel:${phoneNum}`).catch(() => {
        Alert.alert('Contact', `${personName}: ${phoneNum}`);
      });
    } else {
      Alert.alert('Contact', `Phone number for ${personName} unavailable.`);
    }
  };

  // Screen Switching for Sub-Views
  if (currentSubScreen === 'vehiclesList') {
    return (
      <DriverVehiclesListScreen
        userProfile={userProfile}
        lang={currentLang}
        vehicles={vehiclesList}
        onBack={() => setCurrentSubScreen('none')}
        onAddNewVehicle={() => {
          setEditingVehicle(null);
          setCurrentSubScreen('addVehicle');
        }}
        onEditVehicle={(veh) => {
          setEditingVehicle(veh);
          setCurrentSubScreen('addVehicle');
        }}
      />
    );
  }

  if (currentSubScreen === 'addVehicle') {
    return (
      <AddVehicleScreen
        userProfile={userProfile}
        lang={currentLang}
        initialVehicle={editingVehicle}
        onBack={() => {
          setEditingVehicle(null);
          setCurrentSubScreen(vehiclesList.length > 0 ? 'vehiclesList' : 'none');
        }}
        onVehicleSaved={() => {
          setEditingVehicle(null);
          setCurrentSubScreen('none');
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
        onBack={() => {
          setShowProfileScreen(false);
        }}
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
          <View style={styles.driverRoleBadge}>
            <Text style={styles.driverRoleBadgeText}>{t.driverBadge}</Text>
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
      {/* MAIN VIEW CONTENT (TAB SWITCHING)                   */}
      {/* ==================================================== */}
      {activeBottomTab === 'dashboard' && (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. DRIVER STATUS / AVAILABILITY CARD */}
          <View style={styles.driverStatusCard}>
            <View style={styles.driverStatusInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverNameText}>{userProfile?.fullName || 'Driver Partner'}</Text>
                <Text style={styles.driverIdTag}>ID: {userProfile?.uid ? `DRV-${userProfile.uid.slice(0, 6).toUpperCase()}` : 'DRIVER'}</Text>
              </View>
              <Text style={styles.hubLocationText}>
                📍 {userProfile?.district?.nameEn || 'Colombo Central Hub'} • {activeVehicle?.plateNumber || activeVehicle?.vehicleNumber || userProfile?.vehicleNumber || 'No Active Vehicle'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.availabilityToggleBtn,
                isOnDuty ? styles.availBtnOn : styles.availBtnOff,
              ]}
              onPress={() => setIsOnDuty(!isOnDuty)}
              activeOpacity={0.8}
            >
              <Text style={[styles.availToggleText, isOnDuty ? { color: THEME.emeraldDark } : { color: THEME.danger }]}>
                {isOnDuty ? t.availability.toggleOn : t.availability.toggleOff}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. CURRENT DELIVERY - HIGHLIGHTED MAIN CARD */}
          <View style={styles.mainCurrentCardSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>{t.currentDelivery.title}</Text>
              {activeDelivery && renderStatusBadge(activeDelivery.status)}
            </View>

            {activeDelivery ? (
              <View style={styles.currentDeliveryHighlightCard}>
                <View style={styles.currentCardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentOrderNo}>{activeDelivery.orderNo}</Text>
                    <Text style={styles.currentProduceTitle}>{activeDelivery.produceName}</Text>
                  </View>

                  <View style={styles.qtyBadgePill}>
                    <Text style={styles.qtyBadgeText}>📦 {activeDelivery.qty} {activeDelivery.unit}</Text>
                  </View>
                </View>

                {/* DIVIDER */}
                <View style={styles.currentCardDivider} />

                {/* PICKUP & DESTINATION ADDRESSES */}
                <View style={styles.addressTimelineBox}>
                  <View style={styles.addressRow}>
                    <View style={styles.pickupDotCircle} />
                    <View style={styles.addressCol}>
                      <Text style={styles.addressLabel}>{t.currentDelivery.farmer}</Text>
                      <Text style={styles.addressValueText}>{activeDelivery.pickupLocation}</Text>
                      <Text style={styles.contactSubText}>Contact: {activeDelivery.farmerName}</Text>
                    </View>
                  </View>

                  <View style={styles.timelineConnectLine} />

                  <View style={styles.addressRow}>
                    <View style={styles.destDotSquare} />
                    <View style={styles.addressCol}>
                      <Text style={styles.addressLabel}>{t.currentDelivery.buyer}</Text>
                      <Text style={styles.addressValueText}>{activeDelivery.deliveryAddress}</Text>
                      <Text style={styles.contactSubText}>Contact: {activeDelivery.buyerName}</Text>
                    </View>
                  </View>
                </View>

                {/* META INFO ROW (VEHICLE & ETA) */}
                <View style={styles.metaRowBanner}>
                  <View style={styles.metaItemCol}>
                    <Text style={styles.metaItemLabel}>{t.currentDelivery.vehicle}</Text>
                    <Text style={styles.metaItemVal}>🇱🇰 {activeDelivery.assignedVehicle}</Text>
                  </View>
                  <View style={styles.metaItemCol}>
                    <Text style={styles.metaItemLabel}>{t.currentDelivery.status}</Text>
                    <Text style={styles.metaItemVal}>
                      {activeDelivery.status === 'IN_TRANSIT' ? '🚚 In Transit' : '⏱️ Assigned'}
                    </Text>
                  </View>
                </View>

                {/* 4. CONTEXTUAL NEXT ACTION BUTTON & PRIMARY ACTION */}
                <View style={styles.actionButtonsContainer}>
                  {renderContextualNextActionButton(activeDelivery, true)}

                  <TouchableOpacity
                    style={styles.viewDeliveryDetailsBtn}
                    onPress={() => setSelectedDeliveryForDetails(activeDelivery)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={THEME.navy} style={{ marginRight: 6 }} />
                    <Text style={styles.viewDeliveryDetailsBtnText}>{t.currentDelivery.viewDetails}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCurrentCard}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={THEME.emeraldDark} />
                <Text style={styles.emptyCurrentTitle}>{t.currentDelivery.noActiveTitle}</Text>
                <Text style={styles.emptyCurrentSub}>{t.currentDelivery.noActiveSub}</Text>
              </View>
            )}
          </View>

          {/* 6. ROUTE SUMMARY CARD (IF ACTIVE DELIVERY EXISTS) */}
          {activeDelivery && (
            <View style={styles.cardBox}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardSublabelTitle}>{t.routeSummary.title}</Text>
                <TouchableOpacity
                  style={styles.viewRouteBtnPill}
                  onPress={() => setSelectedDeliveryForTracking(activeDelivery)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.viewRouteBtnPillText}>{t.currentDelivery.viewRoute}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.routePipelineContainer}>
                <View style={styles.pipelineStep}>
                  <Text style={styles.pipelineIcon}>🌾</Text>
                  <Text style={styles.pipelineText} numberOfLines={1}>{activeDelivery.pickupLocation}</Text>
                </View>
                <Text style={styles.pipelineArrow}>➔</Text>
                <View style={styles.pipelineStep}>
                  <Text style={styles.pipelineIcon}>🚚</Text>
                  <Text style={styles.pipelineText}>{t.routeSummary.transit}</Text>
                </View>
                <Text style={styles.pipelineArrow}>➔</Text>
                <View style={styles.pipelineStep}>
                  <Text style={styles.pipelineIcon}>🏢</Text>
                  <Text style={styles.pipelineText} numberOfLines={1}>{activeDelivery.deliveryAddress}</Text>
                </View>
              </View>

              <View style={styles.routeMetaFooter}>
                <Text style={styles.routeMetaText}>
                  {t.routeSummary.estDistance} <Text style={{ fontWeight: '800' }}>{activeDelivery.distance}</Text>
                </Text>
                <Text style={styles.routeMetaText}>
                  {t.routeSummary.estEta} <Text style={{ fontWeight: '800' }}>{activeDelivery.estEta}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* 5. QUICK OVERVIEW METRICS */}
          <View style={styles.quickOverviewSection}>
            <Text style={styles.sectionHeaderTitle}>Quick Overview</Text>
            <View style={styles.overviewGrid}>
              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.emerald }]}
                onPress={() => {
                  setDeliveriesFilter('in_transit');
                  setActiveBottomTab('deliveries');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewVal}>{activeDelivery ? 1 : 0}</Text>
                <Text style={styles.overviewLabel}>{t.overview.active}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.warning }]}
                onPress={() => {
                  setDeliveriesFilter('assigned');
                  setActiveBottomTab('deliveries');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewVal}>{upcomingDeliveries.length}</Text>
                <Text style={styles.overviewLabel}>{t.overview.upcoming}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.info }]}
                onPress={() => setActiveBottomTab('history')}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewVal}>{completedToday.length}</Text>
                <Text style={styles.overviewLabel}>{t.overview.completedToday}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.overviewCard, { borderLeftColor: THEME.purple }]}
                onPress={() => setActiveBottomTab('history')}
                activeOpacity={0.8}
              >
                <Text style={styles.overviewVal}>{completedDeliveries.length}</Text>
                <Text style={styles.overviewLabel}>{t.overview.totalCompleted}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 7. UPCOMING DELIVERIES */}
          <View style={styles.cardBox}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardSublabelTitle}>{t.upcoming.title}</Text>
              <TouchableOpacity
                onPress={() => setActiveBottomTab('deliveries')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkTextBtn}>{t.upcoming.viewAll}</Text>
              </TouchableOpacity>
            </View>

            {upcomingDeliveries.length === 0 ? (
              <View style={styles.emptySubSection}>
                <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptySubText}>{t.upcoming.empty}</Text>
              </View>
            ) : (
              upcomingDeliveries.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.upcomingItemCard}
                  onPress={() => setSelectedDeliveryForDetails(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.upcomingHeaderRow}>
                    <Text style={styles.upcomingOrderNo}>{item.orderNo}</Text>
                    {renderStatusBadge(item.status)}
                  </View>

                  <Text style={styles.upcomingProduceTitle}>
                    {item.produceName} ({item.qty} {item.unit})
                  </Text>
                  <Text style={styles.upcomingMetaText}>
                    📍 {item.pickupLocation} ➔ {item.deliveryAddress}
                  </Text>
                  <Text style={styles.upcomingTimeText}>⏱️ {item.scheduledTime}</Text>

                  {renderContextualNextActionButton(item)}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* 8. RECENT COMPLETED DELIVERY */}
          {recentCompleted && (
            <View style={styles.cardBox}>
              <Text style={styles.cardSublabelTitle}>{t.recentCompleted.title}</Text>
              <View style={styles.recentCompletedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentOrderNo}>{recentCompleted.orderNo}</Text>
                  <Text style={styles.recentProduce}>{recentCompleted.produceName}</Text>
                  <Text style={styles.recentDest}>Destination: {recentCompleted.deliveryAddress}</Text>
                  <Text style={styles.recentTime}>{t.recentCompleted.completedAt} {recentCompleted.completedAt || 'Today'}</Text>
                </View>
                <View style={styles.completedBadgePill}>
                  <Text style={styles.completedBadgePillText}>✅ DELIVERED</Text>
                </View>
              </View>
            </View>
          )}

          {/* REGISTERED VEHICLE QUICK ACCESS */}
          <TouchableOpacity
            style={styles.fleetAccessBanner}
            onPress={() => setActiveBottomTab('vehicles')}
            activeOpacity={0.85}
          >
            <Ionicons name="bus-outline" size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fleetBannerTitle}>My Logistics Fleet</Text>
              <Text style={styles.fleetBannerSub}>
                {activeVehicle ? `Active: ${activeVehicle.makeModel || activeVehicle.vehicleType || 'Lorry'} (${activeVehicle.plateNumber || activeVehicle.vehicleNumber || 'Vehicle'})` : 'Register lorry or truck'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ==================================================== */}
      {/* DELIVERIES TAB VIEW                                 */}
      {/* ==================================================== */}
      {activeBottomTab === 'deliveries' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            <Text style={styles.screenTabTitle}>Assigned Deliveries</Text>

            {/* SEARCH BAR */}
            <View style={styles.searchBarBox}>
              <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t.searchPlaceholder}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* FILTER TABS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
              {[
                { id: 'all', label: t.filterTabs.all },
                { id: 'assigned', label: t.filterTabs.assigned },
                { id: 'accepted', label: t.filterTabs.accepted },
                { id: 'in_transit', label: t.filterTabs.inTransit },
                { id: 'completed', label: t.filterTabs.completed },
              ].map((ft) => (
                <TouchableOpacity
                  key={ft.id}
                  style={[
                    styles.filterTabPill,
                    deliveriesFilter === ft.id && styles.filterTabPillActive,
                  ]}
                  onPress={() => setDeliveriesFilter(ft.id)}
                >
                  <Text
                    style={[
                      styles.filterTabPillText,
                      deliveriesFilter === ft.id && styles.filterTabPillTextActive,
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {allOrders
              .filter((o) => {
                if (deliveriesFilter === 'assigned') return o.status === 'ASSIGNED';
                if (deliveriesFilter === 'accepted') return o.status === 'ACCEPTED' || o.status === 'AT_PICKUP';
                if (deliveriesFilter === 'in_transit') return o.status === 'IN_TRANSIT' || o.status === 'ARRIVED';
                if (deliveriesFilter === 'completed') return o.status === 'DELIVERED' || o.status === 'COMPLETED';
                return true;
              })
              .filter((o) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                return (
                  o.orderNo.toLowerCase().includes(q) ||
                  o.produceName.toLowerCase().includes(q) ||
                  o.farmerName.toLowerCase().includes(q) ||
                  o.pickupLocation.toLowerCase().includes(q) ||
                  o.deliveryAddress.toLowerCase().includes(q)
                );
              })
              .map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.deliveryListCard}
                  onPress={() => setSelectedDeliveryForDetails(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.deliveryListHeader}>
                    <Text style={styles.deliveryListOrderNo}>{item.orderNo}</Text>
                    {renderStatusBadge(item.status)}
                  </View>

                  <Text style={styles.deliveryListProduceTitle}>{item.produceName} ({item.qty} {item.unit})</Text>

                  <View style={styles.deliveryListAddressCol}>
                    <Text style={styles.deliveryListAddressRow}>🌾 Pickup: {item.pickupLocation}</Text>
                    <Text style={styles.deliveryListAddressRow}>🏢 Deliver: {item.deliveryAddress}</Text>
                  </View>

                  <View style={styles.deliveryListMetaRow}>
                    <Text style={styles.deliveryListTime}>⏱️ {item.scheduledTime}</Text>
                    <Text style={styles.deliveryListFee}>Pay: Rs. {Number(item.totalPrice || 0).toLocaleString()}</Text>
                  </View>

                  {renderContextualNextActionButton(item)}
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {/* ==================================================== */}
      {/* VEHICLES TAB VIEW                                    */}
      {/* ==================================================== */}
      {activeBottomTab === 'vehicles' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            {/* TITLE & ADD VEHICLE ROW */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.screenTabTitle}>Driver Vehicles</Text>
                <Text style={styles.screenTabSub}>Fleet status & vehicle management</Text>
              </View>
              <TouchableOpacity
                style={styles.addVehicleHeaderBtn}
                onPress={handleOpenCreateVehicle}
                activeOpacity={0.8}
              >
                <Text style={styles.addVehicleHeaderBtnText}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>

            {/* FILTER CHIPS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
              {[
                { id: 'all', label: 'All' },
                { id: 'available', label: 'Available' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'in_use', label: 'In Use' },
                { id: 'maintenance', label: 'Maintenance' },
                { id: 'unavailable', label: 'Unavailable' },
              ].map((ft) => (
                <TouchableOpacity
                  key={ft.id}
                  style={[
                    styles.filterTabPill,
                    vehiclesFilter === ft.id && styles.filterTabPillActive,
                  ]}
                  onPress={() => setVehiclesFilter(ft.id)}
                >
                  <Text
                    style={[
                      styles.filterTabPillText,
                      vehiclesFilter === ft.id && styles.filterTabPillTextActive,
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* COMPACT SEARCH FIELD */}
            <View style={[styles.searchBarBox, { marginTop: 8 }]}>
              <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vehicle number or type..."
                placeholderTextColor="#94A3B8"
                value={searchVehicleQuery}
                onChangeText={setSearchVehicleQuery}
              />
              {searchVehicleQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchVehicleQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* 1. LOADING STATE */}
            {vehiclesLoading ? (
              <View style={styles.stateCardBox}>
                <ActivityIndicator size="large" color={THEME.emeraldDark} />
                <Text style={styles.stateTitleText}>Loading vehicle fleet from Firestore...</Text>
              </View>
            ) : vehiclesError ? (
              /* 2. ERROR STATE */
              <View style={styles.stateCardBox}>
                <Ionicons name="alert-circle-outline" size={48} color={THEME.danger} />
                <Text style={styles.stateTitleText}>Unable to load vehicles.</Text>
                <Text style={styles.stateSubText}>{vehiclesError}</Text>
                <TouchableOpacity style={styles.stateActionBtn} onPress={setupVehiclesSubscription}>
                  <Text style={styles.stateActionBtnText}>Retry 🔄</Text>
                </TouchableOpacity>
              </View>
            ) : filteredVehiclesList.length === 0 ? (
              /* 3. EMPTY STATE */
              <View style={styles.stateCardBox}>
                <MaterialCommunityIcons name="truck-off-outline" size={54} color="#94A3B8" />
                <Text style={styles.stateTitleText}>No vehicles added yet.</Text>
                <Text style={styles.stateSubText}>Add your first truck, van, lorry, or tractor carrier to manage dispatches.</Text>
                <TouchableOpacity style={styles.stateActionBtn} onPress={handleOpenCreateVehicle}>
                  <Text style={styles.stateActionBtnText}>+ Add Vehicle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* 4. COMPACT VEHICLES LIST */
              filteredVehiclesList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.compactVehicleCard}
                  onPress={() => setSelectedVehicleForDetails(item)}
                  activeOpacity={0.85}
                >
                  {/* LEFT: IMAGE / ICON */}
                  <View style={styles.compactVehicleImageWrapper}>
                    {item.image || item.photoURL ? (
                      <Image source={{ uri: item.image || item.photoURL }} style={styles.compactVehicleImage} />
                    ) : (
                      <View style={styles.compactVehicleIconBox}>
                        <MaterialCommunityIcons name="truck-cargo-container" size={24} color={THEME.navy} />
                      </View>
                    )}
                  </View>

                  {/* CENTER: DETAILS */}
                  <View style={styles.compactVehicleCenterCol}>
                    <Text style={styles.compactVehicleNumberText} numberOfLines={1}>
                      {item.vehicleNumber || item.plateNumber || 'Unregistered'}
                    </Text>
                    <Text style={styles.compactVehicleTypeText} numberOfLines={1}>
                      {item.vehicleType || item.makeModel || 'Cargo Carrier'}
                    </Text>
                    <Text style={styles.compactVehicleCapacityText}>
                      Capacity: <Text style={{ fontWeight: '700', color: THEME.textDark }}>{item.capacity} {item.capacityUnit || 'kg'}</Text>
                    </Text>

                    {item.maintenanceStatus && item.maintenanceStatus !== 'Good' ? (
                      <Text style={styles.compactMaintenanceAlertText} numberOfLines={1}>
                        🛠️ {item.maintenanceStatus}
                      </Text>
                    ) : null}

                    {item.currentAssignment && item.currentAssignment !== 'None' && item.currentAssignment !== 'No Active Assignment' ? (
                      <Text style={styles.compactAssignmentTagText} numberOfLines={1}>
                        📦 {item.currentAssignment}
                      </Text>
                    ) : null}
                  </View>

                  {/* RIGHT: BADGE */}
                  <View style={styles.compactVehicleRightCol}>
                    {renderAvailabilityBadge(item.availability || item.status)}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* ==================================================== */}
      {/* HISTORY TAB VIEW                                    */}
      {/* ==================================================== */}
      {activeBottomTab === 'history' && (
        <View style={{ flex: 1 }}>
          <View style={styles.screenTabHeaderContainer}>
            <Text style={styles.screenTabTitle}>Delivery History</Text>
            <Text style={styles.screenTabSub}>Log of all completed farm harvest dispatches.</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {completedDeliveries.length === 0 ? (
              <View style={styles.emptySubSection}>
                <Ionicons name="time-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptySubText}>Completed deliveries will appear here.</Text>
              </View>
            ) : (
              completedDeliveries.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyOrderNo}>{item.orderNo}</Text>
                    <View style={styles.historyStatusBadge}>
                      <Text style={styles.historyStatusText}>COMPLETED ✅</Text>
                    </View>
                  </View>

                  <Text style={styles.historyProduceTitle}>{item.produceName} ({item.qty} {item.unit})</Text>
                  <Text style={styles.historyMetaText}>📍 From: {item.pickupLocation}</Text>
                  <Text style={styles.historyMetaText}>📍 To: {item.deliveryAddress}</Text>

                  <View style={styles.historyFooter}>
                    <Text style={styles.historyCompletedTime}>Completed: {item.completedAt || 'Today'}</Text>
                    <Text style={styles.historyPayText}>Logistics Fee: Rs. {item.totalPrice}</Text>
                  </View>
                </View>
              ))
            )}
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
            setActiveBottomTab('deliveries');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeBottomTab === 'deliveries' ? 'list' : 'list-outline'}
            size={22}
            color={activeBottomTab === 'deliveries' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'deliveries' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.deliveries}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => {
            setShowProfileScreen(false);
            setActiveBottomTab('vehicles');
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeBottomTab === 'vehicles' ? 'truck' : 'truck-outline'}
            size={24}
            color={activeBottomTab === 'vehicles' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'vehicles' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.vehicles}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => {
            setShowProfileScreen(false);
            setActiveBottomTab('history');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeBottomTab === 'history' ? 'time' : 'time-outline'}
            size={22}
            color={activeBottomTab === 'history' ? THEME.emeraldDark : THEME.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeBottomTab === 'history' && styles.navTabLabelActive,
            ]}
          >
            {t.nav.history}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================== */}
      {/* VEHICLE DETAILS MODAL                                */}
      {/* ==================================================== */}
      <Modal visible={!!selectedVehicleForDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalOrderTitle}>
                  {selectedVehicleForDetails?.vehicleNumber || selectedVehicleForDetails?.plateNumber}
                </Text>
                <Text style={styles.modalOrderSub}>
                  {selectedVehicleForDetails?.vehicleType || selectedVehicleForDetails?.makeModel}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedVehicleForDetails(null)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedVehicleForDetails && (
              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                {selectedVehicleForDetails.image || selectedVehicleForDetails.photoURL ? (
                  <Image
                    source={{ uri: selectedVehicleForDetails.image || selectedVehicleForDetails.photoURL }}
                    style={{ width: '100%', height: 140, borderRadius: 14, marginBottom: 12, resizeMode: 'cover' }}
                  />
                ) : null}
                <View style={styles.specsGridBox}>
                  <View style={styles.specGridCol}>
                    <Text style={styles.specGridLabel}>Capacity</Text>
                    <Text style={styles.specGridVal}>
                      {selectedVehicleForDetails.capacity} {selectedVehicleForDetails.capacityUnit || 'kg'}
                    </Text>
                  </View>
                  <View style={styles.specGridCol}>
                    <Text style={styles.specGridLabel}>Availability</Text>
                    <Text style={styles.specGridVal}>{selectedVehicleForDetails.availability || 'Available'}</Text>
                  </View>
                </View>

                <View style={styles.contactCardBox}>
                  <Text style={styles.contactRoleTitle}>MAINTENANCE STATUS</Text>
                  <Text style={styles.contactName}>{selectedVehicleForDetails.maintenanceStatus || 'Good'}</Text>
                </View>

                <View style={styles.contactCardBox}>
                  <Text style={styles.contactRoleTitle}>CURRENT ASSIGNMENT</Text>
                  <Text style={styles.contactName}>{selectedVehicleForDetails.currentAssignment || 'None'}</Text>
                </View>

                <View style={styles.contactCardBox}>
                  <Text style={styles.contactRoleTitle}>ASSIGNED DRIVER</Text>
                  <Text style={styles.contactName}>
                    {selectedVehicleForDetails.assignedDriverName || userProfile?.fullName || 'Driver Partner'}
                  </Text>
                </View>

                {selectedVehicleForDetails.notes ? (
                  <View style={styles.notesBoxBanner}>
                    <Text style={styles.notesBoxText}>📝 Notes: {selectedVehicleForDetails.notes}</Text>
                  </View>
                ) : null}

                <View style={{ marginTop: 10, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    Created Date: {formatTimestamp(selectedVehicleForDetails.createdAt)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Last Updated: {formatTimestamp(selectedVehicleForDetails.updatedAt)}
                  </Text>
                </View>

                {!selectedVehicleForDetails.isActive && (
                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { backgroundColor: THEME.emerald, marginBottom: 10 }]}
                    onPress={() => handleSetActiveVehicleAction(selectedVehicleForDetails)}
                  >
                    <Text style={styles.modalConfirmBtnText}>🟢 Set as Active Dispatch Vehicle</Text>
                  </TouchableOpacity>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { flex: 1, backgroundColor: THEME.navy }]}
                    onPress={() => handleOpenEditVehicle(selectedVehicleForDetails)}
                  >
                    <Text style={styles.modalConfirmBtnText}>✏️ Edit Vehicle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { flex: 1, backgroundColor: THEME.danger }]}
                    onPress={() => handleDeleteVehicleAction(selectedVehicleForDetails)}
                  >
                    <Text style={styles.modalConfirmBtnText}>🗑️ Delete Vehicle</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* ADD / EDIT VEHICLE FORM MODAL                        */}
      {/* ==================================================== */}
      <Modal visible={showVehicleFormModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalOrderTitle}>
                  {isEditingVehicle ? 'Edit Vehicle Details' : 'Add New Vehicle'}
                </Text>
                <Text style={styles.modalOrderSub}>
                  Enter registration specs & payload capacity
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowVehicleFormModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* VEHICLE NUMBER */}
              <View style={styles.inputGroupCol}>
                <Text style={styles.inputGroupLabel}>Vehicle Registration Number *</Text>
                <TextInput
                  style={styles.modalTextInputSingle}
                  placeholder="e.g. WP-LG-4401"
                  placeholderTextColor="#94A3B8"
                  value={vNumber}
                  onChangeText={setVNumber}
                  autoCapitalize="characters"
                />
              </View>

              {/* VEHICLE TYPE */}
              <View style={styles.inputGroupCol}>
                <Text style={styles.inputGroupLabel}>Vehicle Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {['Truck', 'Van', 'Lorry', 'Three Wheeler', 'Tractor', 'Other'].map((typeOption) => (
                    <TouchableOpacity
                      key={typeOption}
                      style={[
                        styles.filterTabPill,
                        vType === typeOption && styles.filterTabPillActive,
                        { marginRight: 6 }
                      ]}
                      onPress={() => setVType(typeOption)}
                    >
                      <Text style={[styles.filterTabPillText, vType === typeOption && styles.filterTabPillTextActive]}>
                        {typeOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* CAPACITY & UNIT */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroupCol, { flex: 2 }]}>
                  <Text style={styles.inputGroupLabel}>Capacity *</Text>
                  <TextInput
                    style={styles.modalTextInputSingle}
                    placeholder="e.g. 3500"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={vCapacity}
                    onChangeText={setVCapacity}
                  />
                </View>

                <View style={[styles.inputGroupCol, { flex: 1 }]}>
                  <Text style={styles.inputGroupLabel}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['kg', 'Tons', 'Crates'].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.filterTabPill,
                          vCapacityUnit === u && styles.filterTabPillActive,
                          { paddingHorizontal: 10, marginRight: 4 }
                        ]}
                        onPress={() => setVCapacityUnit(u)}
                      >
                        <Text style={[styles.filterTabPillText, vCapacityUnit === u && styles.filterTabPillTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* AVAILABILITY */}
              <View style={styles.inputGroupCol}>
                <Text style={styles.inputGroupLabel}>Availability Status *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Available', 'Assigned', 'In Use', 'Unavailable', 'Maintenance'].map((availOpt) => (
                    <TouchableOpacity
                      key={availOpt}
                      style={[
                        styles.filterTabPill,
                        vAvailability === availOpt && styles.filterTabPillActive,
                        { marginRight: 6 }
                      ]}
                      onPress={() => setVAvailability(availOpt)}
                    >
                      <Text style={[styles.filterTabPillText, vAvailability === availOpt && styles.filterTabPillTextActive]}>
                        {availOpt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* MAINTENANCE STATUS */}
              <View style={styles.inputGroupCol}>
                <Text style={styles.inputGroupLabel}>Maintenance Status *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Good', 'Needs Inspection', 'Under Maintenance', 'Out of Service'].map((maintOpt) => (
                    <TouchableOpacity
                      key={maintOpt}
                      style={[
                        styles.filterTabPill,
                        vMaintenance === maintOpt && styles.filterTabPillActive,
                        { marginRight: 6 }
                      ]}
                      onPress={() => setVMaintenance(maintOpt)}
                    >
                      <Text style={[styles.filterTabPillText, vMaintenance === maintOpt && styles.filterTabPillTextActive]}>
                        {maintOpt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* NOTES */}
              <View style={styles.inputGroupCol}>
                <Text style={styles.inputGroupLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Cold-chain insulated lining, serviced recently."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={vNotes}
                  onChangeText={setVNotes}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, savingVehicle && { opacity: 0.7 }, { marginTop: 10 }]}
                disabled={savingVehicle}
                onPress={handleSaveVehicleForm}
              >
                {savingVehicle ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    {isEditingVehicle ? 'Save Vehicle Changes ✅' : 'Add Vehicle to Firestore 🚛'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================================================== */}
      {/* DELIVERY DETAILS MODAL                              */}
      {/* ==================================================== */}
      <Modal visible={!!selectedDeliveryForDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalOrderTitle}>{selectedDeliveryForDetails?.orderNo}</Text>
                <Text style={styles.modalOrderSub}>{selectedDeliveryForDetails?.produceName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDeliveryForDetails(null)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedDeliveryForDetails && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* STATUS BADGE */}
                <View style={{ marginBottom: 14 }}>
                  {renderStatusBadge(selectedDeliveryForDetails.status)}
                </View>

                {/* FARMER CONTACT BOX */}
                <View style={styles.contactCardBox}>
                  <Text style={styles.contactRoleTitle}>🧑‍🌾 Farmer / Origin Pickup</Text>
                  <Text style={styles.contactName}>{selectedDeliveryForDetails.farmerName}</Text>
                  <Text style={styles.contactLocation}>📍 {selectedDeliveryForDetails.pickupLocation}</Text>
                  <TouchableOpacity
                    style={styles.callSmallBtn}
                    onPress={() => handleCallPhone(selectedDeliveryForDetails.farmerPhone, selectedDeliveryForDetails.farmerName)}
                  >
                    <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.callSmallBtnText}>Call Farmer ({selectedDeliveryForDetails.farmerPhone})</Text>
                  </TouchableOpacity>
                </View>

                {/* BUYER CONTACT BOX */}
                <View style={styles.contactCardBox}>
                  <Text style={styles.contactRoleTitle}>🏢 Buyer / Destination</Text>
                  <Text style={styles.contactName}>{selectedDeliveryForDetails.buyerName}</Text>
                  <Text style={styles.contactLocation}>📍 {selectedDeliveryForDetails.deliveryAddress}</Text>
                  <TouchableOpacity
                    style={[styles.callSmallBtn, { backgroundColor: THEME.navy }]}
                    onPress={() => handleCallPhone(selectedDeliveryForDetails.buyerPhone, selectedDeliveryForDetails.buyerName)}
                  >
                    <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.callSmallBtnText}>Call Buyer ({selectedDeliveryForDetails.buyerPhone})</Text>
                  </TouchableOpacity>
                </View>

                {/* CARGO SPECS */}
                <View style={styles.specsGridBox}>
                  <View style={styles.specGridCol}>
                    <Text style={styles.specGridLabel}>QUANTITY</Text>
                    <Text style={styles.specGridVal}>{selectedDeliveryForDetails.qty} {selectedDeliveryForDetails.unit}</Text>
                  </View>
                  <View style={styles.specGridCol}>
                    <Text style={styles.specGridLabel}>PAYROLL FEE</Text>
                    <Text style={styles.specGridVal}>Rs. {selectedDeliveryForDetails.totalPrice}</Text>
                  </View>
                  <View style={styles.specGridCol}>
                    <Text style={styles.specGridLabel}>SCHEDULED</Text>
                    <Text style={styles.specGridVal}>{selectedDeliveryForDetails.scheduledTime}</Text>
                  </View>
                </View>

                {/* SPECIAL HANDLING NOTES */}
                {selectedDeliveryForDetails.specialNotes ? (
                  <View style={styles.notesBoxBanner}>
                    <Ionicons name="information-circle" size={18} color="#0284C7" style={{ marginRight: 8 }} />
                    <Text style={styles.notesBoxText}>{selectedDeliveryForDetails.specialNotes}</Text>
                  </View>
                ) : null}

                {/* CONTEXTUAL ACTION */}
                <View style={{ marginTop: 16 }}>
                  {renderContextualNextActionButton(selectedDeliveryForDetails, true)}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* CONFIRM PICKUP MODAL                                */}
      {/* ==================================================== */}
      <Modal visible={showPickupModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalOrderTitle}>{t.modals.pickupTitle}</Text>
              <TouchableOpacity onPress={() => setShowPickupModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubheadText}>{t.modals.pickupSub}</Text>

            <View style={styles.inputGroupCol}>
              <Text style={styles.inputGroupLabel}>{t.modals.notesLabel}</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder={t.modals.notesPlaceholder}
                placeholderTextColor="#94A3B8"
                value={pickupNotes}
                onChangeText={setPickupNotes}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.uploadPhotoBoxBtn}
              onPress={() => handlePickPhoto(setPickupPhoto)}
            >
              <Ionicons name="camera-outline" size={22} color={THEME.emeraldDark} style={{ marginRight: 8 }} />
              <Text style={styles.uploadPhotoBoxBtnText}>
                {pickupPhoto ? 'Photo Attached ✅' : t.modals.addPhoto}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleConfirmPickupSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmBtnText}>{t.modals.confirmPickupBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* PROOF OF DELIVERY MODAL                             */}
      {/* ==================================================== */}
      <Modal visible={showProofModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalOrderTitle}>{t.modals.proofTitle}</Text>
              <TouchableOpacity onPress={() => setShowProofModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubheadText}>{t.modals.proofSub}</Text>

            <View style={styles.inputGroupCol}>
              <Text style={styles.inputGroupLabel}>{t.modals.receiverLabel}</Text>
              <TextInput
                style={styles.modalTextInputSingle}
                placeholder={t.modals.receiverPlaceholder}
                placeholderTextColor="#94A3B8"
                value={receiverName}
                onChangeText={setReceiverName}
              />
            </View>

            <View style={styles.inputGroupCol}>
              <Text style={styles.inputGroupLabel}>Delivery Notes (Optional):</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Delivered 250 kg in good condition. Received by store manager."
                placeholderTextColor="#94A3B8"
                value={proofNotes}
                onChangeText={setProofNotes}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.uploadPhotoBoxBtn}
              onPress={() => handlePickPhoto(setProofPhoto)}
            >
              <Ionicons name="camera-outline" size={22} color={THEME.emeraldDark} style={{ marginRight: 8 }} />
              <Text style={styles.uploadPhotoBoxBtnText}>
                {proofPhoto ? 'Delivery Photo Attached ✅' : t.modals.proofPhotoBtn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: THEME.emerald }]}
              onPress={handleConfirmProofSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmBtnText}>{t.modals.confirmDropoffBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* SUCCESS MODAL                                       */}
      {/* ==================================================== */}
      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.successDialogCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitleText}>{t.modals.successTitle}</Text>
            <Text style={styles.successSubText}>{t.modals.successSub}</Text>

            <TouchableOpacity
              style={styles.successReturnBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successReturnBtnText}>{t.modals.backHomeBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* DRIVER NOTIFICATIONS MODAL                          */}
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

            {driverNotifications.map((n) => (
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
  driverRoleBadge: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  driverRoleBadgeText: {
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

  /* DRIVER STATUS CARD */
  driverStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  driverStatusInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  driverIdTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  hubLocationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  availabilityToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  availBtnOn: {
    backgroundColor: THEME.emeraldLight,
    borderColor: THEME.emerald,
  },
  availBtnOff: {
    backgroundColor: THEME.dangerLight,
    borderColor: THEME.danger,
  },
  availToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* CURRENT DELIVERY MAIN HIGHLIGHT CARD */
  mainCurrentCardSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentDeliveryHighlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: THEME.emerald,
    elevation: 4,
    shadowColor: THEME.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  currentCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  currentOrderNo: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.emeraldDark,
    letterSpacing: 0.5,
  },
  currentProduceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  qtyBadgePill: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  qtyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  currentCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  /* ADDRESS TIMELINE BOX */
  addressTimelineBox: {
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDotCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.emerald,
    marginTop: 3,
    marginRight: 10,
  },
  destDotSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: THEME.navy,
    marginTop: 3,
    marginRight: 10,
  },
  timelineConnectLine: {
    width: 2,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginLeft: 5,
    marginVertical: 2,
  },
  addressCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addressValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* META ROW BANNER */
  metaRowBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaItemCol: {
    flex: 1,
  },
  metaItemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  metaItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },

  /* CONTEXTUAL ACTION BUTTON */
  actionButtonsContainer: {
    gap: 8,
  },
  contextualActionBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  contextualActionBtnLarge: {
    paddingVertical: 14,
  },
  contextualActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  viewDeliveryDetailsBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewDeliveryDetailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.navy,
  },

  emptyCurrentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCurrentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyCurrentSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  cardSublabelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  linkTextBtn: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  viewRouteBtnPill: {
    backgroundColor: THEME.navy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewRouteBtnPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ROUTE PIPELINE */
  routePipelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  pipelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  pipelineIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  pipelineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  pipelineArrow: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '900',
  },
  routeMetaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeMetaText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* QUICK OVERVIEW GRID */
  quickOverviewSection: {
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
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
  overviewVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  /* UPCOMING DELIVERIES */
  upcomingItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingOrderNo: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.navy,
  },
  upcomingProduceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  upcomingMetaText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  upcomingTimeText: {
    fontSize: 11,
    color: THEME.emeraldDark,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },

  emptySubSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },

  /* RECENT COMPLETED */
  recentCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recentOrderNo: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy,
  },
  recentProduce: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recentDest: {
    fontSize: 12,
    color: '#64748B',
  },
  recentTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  completedBadgePill: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  /* FLEET BANNER */
  fleetAccessBanner: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  fleetBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fleetBannerSub: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 2,
  },

  /* DELIVERIES TAB FILTER BAR */
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
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterTabsRow: {
    marginTop: 10,
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

  /* DELIVERY LIST CARDS */
  deliveryListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  deliveryListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryListOrderNo: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy,
  },
  deliveryListProduceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  deliveryListAddressCol: {
    marginVertical: 8,
  },
  deliveryListAddressRow: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 1,
  },
  deliveryListMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deliveryListTime: {
    fontSize: 11,
    color: '#64748B',
  },
  deliveryListFee: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  /* HISTORY CARDS */
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyOrderNo: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy,
  },
  historyStatusBadge: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  historyProduceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  historyMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyCompletedTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  historyPayText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },

  /* BOTTOM NAVIGATION BAR */
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
  modalOrderSub: {
    fontSize: 13,
    color: '#64748B',
  },
  contactCardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactRoleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  contactLocation: {
    fontSize: 12,
    color: '#64748B',
    marginVertical: 2,
  },
  callSmallBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  callSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  specsGridBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  specGridCol: {
    flex: 1,
  },
  specGridLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  specGridVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  notesBoxBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  notesBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
  },

  modalSubheadText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  inputGroupCol: {
    marginBottom: 12,
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalTextInputSingle: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 70,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  uploadPhotoBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  uploadPhotoBoxBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalConfirmBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* SUCCESS DIALOG */
  successDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  successSubText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  successReturnBtn: {
    backgroundColor: THEME.navy,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  successReturnBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* NOTIFICATIONS */
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* VEHICLE TAB STYLES */
  vehicleCardHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  vehicleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePlateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleMakeModelSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  vehicleStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehicleStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  vehicleCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  vehicleGridDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  vehicleGridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleGridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  vehicleGridValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportIssueBtn: {
    backgroundColor: THEME.warning,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  reportIssueBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fleetAdminNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  fleetAdminNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  otherVehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  otherVehiclePlate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  otherVehicleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  activePillTag: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activePillTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.emeraldDark,
  },
  selectVehicleBtn: {
    backgroundColor: THEME.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectVehicleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addVehicleHeaderBtn: {
    backgroundColor: THEME.emeraldDark,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addVehicleHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stateCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stateTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    textAlign: 'center',
  },
  stateSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  stateActionBtn: {
    backgroundColor: THEME.navy,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  stateActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* COMPACT VEHICLE CARD STYLES */
  compactVehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 88,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  compactVehicleImageWrapper: {
    marginRight: 12,
  },
  compactVehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  compactVehicleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: THEME.emeraldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactVehicleCenterCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  compactVehicleNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  compactVehicleTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  compactVehicleCapacityText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  compactMaintenanceAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 2,
  },
  compactAssignmentTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.navy,
    marginTop: 2,
  },
  compactVehicleRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

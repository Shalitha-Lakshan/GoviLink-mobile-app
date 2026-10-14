import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeToDriverVehicles,
  rejectDriverDelivery,
} from '../services/firebaseDatabase';
import { FARMER_COLORS as C, FarmerHeading, FarmerButton, IconTile, cleanLabel } from './FarmerDesign';
import AddVehicleScreen from './AddVehicleScreen';
import DriverVehiclesListScreen from './DriverVehiclesListScreen';
import UserProfileScreen from './UserProfileScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';
import { driverLocationLabel } from './DriverDesign';

// ----------------------------------------------------
// LOCALIZATION
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Driver Logistics Dashboard',
    tagline: 'Assigned Farm Pickup & Delivery Routes',
    driverBadge: 'Logistics Partner 🚛',
    vehicle: {
      title: '🚚 Active Dispatch Vehicle',
      noVehicleTitle: 'No Vehicle Registered Yet',
      noVehicleSub: 'Register your lorry, pickup, or cargo vehicle to claim farm delivery routes.',
      addBtn: '+ Register My Vehicle',
      editBtn: '✏️ Edit',
      viewAllBtn: '📋 View All My Vehicles',
      addNewBtn: '+ Add Vehicle',
      maxCap: 'Payload Cap:',
      coldChain: '❄️ Cold-Chain Ready',
      standardCargo: '📦 Ambient Cargo',
      fleetLabel: 'My Fleet',
    },
    shift: {
      onDuty: '🟢 On Duty (Available)',
      offDuty: '🔴 Off Duty',
    },
    stats: {
      activeTrips: 'Active Trips',
      completedToday: 'Completed Today',
      estEarnings: 'Logistics Pay',
      rating: 'Service Score',
    },
    tabs: {
      assigned: 'Assigned Deliveries',
      available: 'Available Co-op Loads',
    },
    actions: {
      acceptJob: 'Accept Delivery Job 📦',
      startTransit: 'Pickup Cargo & Start Transit 🚛',
      markDelivered: 'Confirm Dropoff & Delivered ✅',
      completed: 'Trip Completed 🎉',
      logout: 'Logout',
    },
    route: {
      pickupLabel: 'Farm Pickup',
      dropoffLabel: 'Delivery Destination',
      cargoLabel: 'Cargo Payload',
      contactFarmer: 'Farmer:',
      contactBuyer: 'Buyer:',
      notesLabel: 'Transport Handling:',
    },
    currency: 'Rs.',
  },
  si: {
    dashboardTitle: 'ප්‍රවාහන මෙහෙයුම් පුවරුව',
    tagline: 'පවරන ලද කෘෂි අස්වනු බෙදාහැරීම් මාර්ග',
    driverBadge: 'ප්‍රවාහන සහකරු 🚛',
    vehicle: {
      title: '🚚 සක්‍රිය ප්‍රවාහන රථය',
      noVehicleTitle: 'තවමත් වාහනයක් ලියාපදිංචි කර නැත',
      noVehicleSub: 'අස්වනු ප්‍රවාහන මෙහෙයුම් ලබාගැනීම සඳහා ඔබගේ ලොරි, පිකප් හෝ ප්‍රවාහන රථය ඇතුළත් කරන්න.',
      addBtn: '+ මගේ වාහනය ලියාපදිංචි කරන්න',
      editBtn: '✏️ සංස්කරණය',
      viewAllBtn: '📋 මගේ සියලුම වාහන බලන්න',
      addNewBtn: '+ වාහනයක් එක් කරන්න',
      maxCap: 'උපරිම බර:',
      coldChain: '❄️ ශීතකරණ පහසුකම් සහිතයි',
      standardCargo: '📦 සාමාන්‍ය ප්‍රවාහන',
      fleetLabel: 'වාහන එකතුව',
    },
    shift: {
      onDuty: '🟢 සේවයේ යෙදී ඇත',
      offDuty: '🔴 නිවාඩු',
    },
    stats: {
      activeTrips: 'සක්‍රිය ගමන්',
      completedToday: 'අද නිමකළ ගමන්',
      estEarnings: 'ප්‍රවාහන ආදායම',
      rating: 'සේවා ඇගයීම',
    },
    tabs: {
      assigned: 'පවරන ලද බෙදාහැරීම්',
      available: 'නව ප්‍රවාහන ඇණවුම්',
    },
    actions: {
      acceptJob: 'ප්‍රවාහනය භාරගන්න 📦',
      startTransit: 'අස්වැන්න පටවා ගමන අරඹන්න 🚛',
      markDelivered: 'භාණ්ඩ භාරදුන් බව තහවුරු කරන්න ✅',
      completed: 'ගමන නිමාවිය 🎉',
      logout: 'ඉවත් වන්න',
    },
    route: {
      pickupLabel: 'අස්වනු ලබාගන්නා ස්ථානය',
      dropoffLabel: 'භාරදෙන ස්ථානය',
      cargoLabel: 'භාණ්ඩ විස්තරය',
      contactFarmer: 'ගොවියා:',
      contactBuyer: 'ගණුදෙනුකරු:',
      notesLabel: 'ප්‍රවාහන උපදෙස්:',
    },
    currency: 'රු.',
  },
  ta: {
    dashboardTitle: 'ஓட்டுநர் டாஷ்போர்டு',
    tagline: 'ஒதுக்கப்பட்ட விநியோக பாதைகள்',
    driverBadge: 'தளவாட கூட்டாளர் 🚛',
    vehicle: {
      title: '🚚 செயலில் உள்ள வாகனம்',
      noVehicleTitle: 'வாகனம் இன்னும் பதிவு செய்யப்படவில்லை',
      noVehicleSub: 'விநியோக பணிகளைப் பெற உங்கள் லாரி அல்லது சரக்கு வாகனத்தை பதிவு செய்யவும்.',
      addBtn: '+ வாகனத்தை பதிவு செய்',
      editBtn: '✏️ மாற்றியமைக்க',
      viewAllBtn: '📋 எனது அனைத்து வாகனங்கள்',
      addNewBtn: '+ வாகனம் சேர்க்க',
      maxCap: 'சுமை திறன்:',
      coldChain: '❄️ குளிரூட்டல் தயார்',
      standardCargo: '📦 வழக்கமான சரக்கு',
      fleetLabel: 'வாகனங்கள்',
    },
    shift: {
      onDuty: '🟢 பணியில் உள்ளார்',
      offDuty: '🔴 பணி நிறைவு',
    },
    stats: {
      activeTrips: 'செயலில் உள்ளவை',
      completedToday: 'முடிந்தது',
      estEarnings: 'வருவாய்',
      rating: 'மதிப்பீடு',
    },
    tabs: {
      assigned: 'ஒதுக்கப்பட்டவை',
      available: 'புதிய சுமைகள்',
    },
    actions: {
      acceptJob: 'சுமையை ஏற்றுக்கொள் 📦',
      startTransit: 'பயணத்தை தொடங்கு 🚛',
      markDelivered: 'முடிந்ததாக உறுதி செய் ✅',
      completed: 'நிறைவு 🎉',
      logout: 'வெளியேறு',
    },
    route: {
      pickupLabel: 'எடுக்கும் இடம்',
      dropoffLabel: 'சேர்க்கும் இடம்',
      cargoLabel: 'சரக்கு விவரம்',
      contactFarmer: 'விவசாயி:',
      contactBuyer: 'வாடிக்கையாளர்:',
      notesLabel: 'கையாளுதல்:',
    },
    currency: 'ரூ.',
  },
};

const DASHBOARD_COPY = {
  en: { greeting: 'Hello', driver: 'Driver', subtitle: 'Your deliveries and vehicles, in one place.', deliveries: 'My deliveries', overview: 'Overview', active: 'Active', completed: 'Completed', newJobs: 'Awaiting acceptance', onRoute: 'On the road', ready: 'Ready for pickup', accepted: 'Accepted', assigned: 'New assignment', transit: 'In transit', preparing: 'Preparing', needsAction: 'Your next step', review: 'Review your new delivery and accept or reject it.', continue: 'Open your route to review details and update delivery progress.', all: 'View all', pickup: 'Pickup', destination: 'Drop-off', details: 'View route & tracking details', reviewDelivery: 'Review delivery', empty: 'No active deliveries', emptySub: 'New assignments will appear here. You can manage your vehicles in My Fleet.', emptyCompleted: 'No completed deliveries yet', emptyCompletedSub: 'Completed trips will appear here after you confirm delivery.', fleetSub: 'Select vehicles for dispatch or add a vehicle.', countLabel: 'Selected for dispatch' },
  si: { greeting: 'ආයුබෝවන්', driver: 'රියදුරු', subtitle: 'ඔබගේ බෙදාහැරීම් සහ වාහන එකම තැනක.', deliveries: 'මගේ බෙදාහැරීම්', overview: 'සාරාංශය', active: 'සක්‍රිය', completed: 'සම්පූර්ණයි', newJobs: 'පිළිගැනීමට බලාපොරොත්තුවෙන්', onRoute: 'මාර්ගයේ', ready: 'අස්වනු ගැනීමට සූදානම්', accepted: 'පිළිගෙන ඇත', assigned: 'නව පැවරුම', transit: 'ප්‍රවාහනයේ', preparing: 'සූදානම් කරමින්', needsAction: 'ඔබගේ ඊළඟ පියවර', review: 'නව බෙදාහැරීම පරීක්ෂා කර පිළිගන්න හෝ ප්‍රතික්ෂේප කරන්න.', continue: 'මාර්ග විස්තර බලන්න සහ බෙදාහැරීම යාවත්කාලීන කරන්න.', all: 'සියල්ල බලන්න', pickup: 'අස්වනු ලබාගැනීම', destination: 'භාරදීම', details: 'මාර්ගය සහ බෙදාහැරීම බලන්න', reviewDelivery: 'බෙදාහැරීම බලන්න', empty: 'සක්‍රිය බෙදාහැරීම් නොමැත', emptySub: 'නව පැවරුම් මෙහි පෙන්වනු ඇත. මගේ වාහන තුළ වාහන කළමනාකරණය කරන්න.', emptyCompleted: 'සම්පූර්ණ බෙදාහැරීම් නොමැත', emptyCompletedSub: 'භාරදීම තහවුරු කළ පසු සම්පූර්ණ ගමන් මෙහි පෙන්වනු ඇත.', fleetSub: 'ප්‍රවාහනය සඳහා වාහන තෝරන්න හෝ එක් කරන්න.', countLabel: 'ප්‍රවාහනයට තෝරා ඇත' },
  ta: { greeting: 'வணக்கம்', driver: 'ஓட்டுநர்', subtitle: 'உங்கள் விநியோகங்களும் வாகனங்களும் ஒரே இடத்தில்.', deliveries: 'எனது விநியோகங்கள்', overview: 'சுருக்கம்', active: 'செயலில்', completed: 'முடிந்தவை', newJobs: 'ஏற்பதற்காகக் காத்திருக்கிறது', onRoute: 'பயணத்தில்', ready: 'எடுக்கத் தயார்', accepted: 'ஏற்கப்பட்டது', assigned: 'புதிய ஒதுக்கீடு', transit: 'பயணத்தில்', preparing: 'தயாராகிறது', needsAction: 'உங்கள் அடுத்த படி', review: 'புதிய விநியோகத்தைப் பார்த்து ஏற்கவும் அல்லது நிராகரிக்கவும்.', continue: 'பாதை விவரங்களைப் பார்த்து விநியோக முன்னேற்றத்தை மாற்றவும்.', all: 'அனைத்தையும் பார்', pickup: 'எடுக்கும் இடம்', destination: 'சேருமிடம்', details: 'பாதை மற்றும் விநியோக விவரங்கள்', reviewDelivery: 'விநியோகத்தைப் பார்', empty: 'செயலில் விநியோகங்கள் இல்லை', emptySub: 'புதிய ஒதுக்கீடுகள் இங்கே தோன்றும். எனது வாகனங்களில் உங்கள் வாகனங்களை நிர்வகிக்கவும்.', emptyCompleted: 'முடிந்த விநியோகங்கள் இல்லை', emptyCompletedSub: 'விநியோகத்தை உறுதிசெய்த பிறகு முடிந்த பயணங்கள் இங்கே தோன்றும்.', fleetSub: 'விநியோகத்திற்கு வாகனங்களைத் தேர்ந்தெடுக்கவும் அல்லது சேர்க்கவும்.', countLabel: 'விநியோகத்திற்கு தேர்ந்தெடுக்கப்பட்டது' },
};

export default function DriverHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const [workspaceTab, setWorkspaceTab] = useState('home');
  const [deliveryFilter, setDeliveryFilter] = useState('active');
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'vehiclesList' | 'addVehicle'
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [selectedTripForTracking, setSelectedTripForTracking] = useState(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const ui = DASHBOARD_COPY[lang] || DASHBOARD_COPY.en;

  // Real-time vehicles subscription
  useEffect(() => {
    if (!userProfile?.uid) return;
    let unsub = () => {};
    try {
      unsub = subscribeToDriverVehicles(userProfile.uid, (vehicles) => {
        if (Array.isArray(vehicles)) {
          setVehiclesList(vehicles);
        }
      });
    } catch (err) {
      console.warn('Driver vehicles sub error:', err);
    }
    return () => {
      if (typeof unsub === 'function') {
        try {
          unsub();
        } catch (_e) {}
      }
    };
  }, [userProfile?.uid]);

  // Real orders from Firestore mapped for Driver logistics view
  const realOrdersForDriver = ordersList.filter((order) =>
    Boolean(userProfile?.uid && order.driverId === userProfile.uid)
  ).map((o) => ({
    ...o,
    id: o.id,
    produceName: `${o.produceName || 'Produce Batch'} (${o.qty || 0} ${o.unit || 'kg'})`,
    qty: o.qty,
    unit: o.unit || 'kg',
    farmerName: o.farmerName || 'GoviLink Farmer',
    farmerPhone: o.farmerPhone || '',
    pickupLocation: driverLocationLabel(o.pickupLocation || o.location, lang, 'Farm Origin'),
    buyerName: o.buyerName || 'GoviLink Buyer',
    buyerPhone: o.buyerPhone || '',
    deliveryAddress: driverLocationLabel(o.deliveryAddress, lang, 'Delivery Destination'),
    totalPrice: o.logisticsFee || 350,
    status: o.status || 'PENDING',
    specialNotes: o.deliveryNotes || 'Standard agricultural transport safety handling.',
  }));

  const allDriverTrips = realOrdersForDriver;

  const activeDeliveries = allDriverTrips.filter((trip) =>
    ['ASSIGNED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'PICKED_UP', 'PENDING_DELIVERY'].includes(trip.status)
  );
  const completedDeliveries = allDriverTrips.filter((trip) => trip.status === 'DELIVERED');
  const newDeliveries = activeDeliveries.filter((trip) => trip.status === 'ASSIGNED');
  const inTransitDeliveries = activeDeliveries.filter((trip) => ['IN_TRANSIT', 'PICKED_UP', 'PENDING_DELIVERY'].includes(trip.status));
  const sortedDeliveries = [...activeDeliveries].sort((a, b) => {
    const priority = (trip) => ['IN_TRANSIT', 'PICKED_UP', 'PENDING_DELIVERY'].includes(trip.status) ? 0 : trip.status === 'ASSIGNED' ? 1 : 2;
    return priority(a) - priority(b);
  });
  const visibleDeliveries = workspaceTab === 'home' ? sortedDeliveries.slice(0, 2)
    : deliveryFilter === 'completed' ? completedDeliveries : sortedDeliveries;
  const selectedVehicleCount = vehiclesList.filter((vehicle) => vehicle.isActive).length;

  // Screen Switching
  if (currentScreen === 'vehiclesList') {
    return (
      <DriverVehiclesListScreen
        userProfile={userProfile}
        lang={lang}
        vehicles={vehiclesList}
        onBack={() => setCurrentScreen('dashboard')}
        onAddNewVehicle={() => {
          setEditingVehicle(null);
          setCurrentScreen('addVehicle');
        }}
        onEditVehicle={(veh) => {
          setEditingVehicle(veh);
          setCurrentScreen('addVehicle');
        }}
      />
    );
  }

  if (currentScreen === 'addVehicle') {
    return (
      <AddVehicleScreen
        userProfile={userProfile}
        lang={lang}
        initialVehicle={editingVehicle}
        onBack={() => {
          setEditingVehicle(null);
          setCurrentScreen('dashboard');
          setWorkspaceTab('fleet');
        }}
        onVehicleSaved={() => {
          setEditingVehicle(null);
          setCurrentScreen('dashboard');
          setWorkspaceTab('fleet');
        }}
      />
    );
  }

  if (selectedTripForTracking) {
    return (
      <DeliveryTrackingScreen
        delivery={selectedTripForTracking}
        userProfile={userProfile}
        lang={lang}
        onBack={() => setSelectedTripForTracking(null)}
        onLogout={onLogout}
        onRejectDelivery={async (orderId) => {
          const result = await rejectDriverDelivery(orderId, userProfile?.uid);
          if (result.success) setSelectedTripForTracking(null);
          return result;
        }}
      />
    );
  }


  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />

      <View style={styles.topHeader}>
        <View style={styles.brandTitleRow}>
          <Image source={require('../assets/logo.png')} style={{ width: 88, height: 44 }} resizeMode="contain" />
          <Text style={styles.brandCaption}>DRIVER WORKSPACE</Text>
        </View>
        <View style={styles.headerRightActions}>
          {onChangeLanguage && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change language" style={styles.langPill}
            onPress={() => onChangeLanguage(lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en')}>
            <Text style={styles.langPillText}>{lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}</Text>
          </TouchableOpacity>}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Profile" style={styles.profileAvatarWrapper} onPress={() => setShowProfileScreen(true)}>
            {userProfile?.photoURL ? <Image source={{ uri: userProfile.photoURL }} style={styles.profileAvatar} />
              : <Text style={styles.avatarInitial}>{(userProfile?.fullName || 'D').charAt(0).toUpperCase()}</Text>}
          </TouchableOpacity>
        </View>
      </View>
      {showProfileScreen ? <UserProfileScreen embedded farmerDesign userProfile={userProfile} lang={lang}
        onBack={() => setShowProfileScreen(false)} onLogout={onLogout} onChangeLanguage={onChangeLanguage} onProfileUpdated={onProfileUpdated} /> : workspaceTab === 'fleet' ? (
        <DriverVehiclesListScreen embedded userProfile={userProfile} lang={lang} vehicles={vehiclesList}
          onBack={() => setWorkspaceTab('home')}
          onAddNewVehicle={() => { setEditingVehicle(null); setCurrentScreen('addVehicle'); }}
          onEditVehicle={(vehicle) => { setEditingVehicle(vehicle); setCurrentScreen('addVehicle'); }} />
      ) : (
      <ScrollView key={workspaceTab} style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <FarmerHeading
          eyebrow={workspaceTab === 'home' ? 'YOUR DELIVERIES, AT A GLANCE' : 'DRIVER WORKSPACE'}
          title={workspaceTab === 'home' ? `${ui.greeting}, ${userProfile?.fullName?.split(' ')[0] || ui.driver}.` : ui.deliveries}
          subtitle={workspaceTab === 'home' ? ui.subtitle : t.tagline}
        />
        {workspaceTab === 'home' ? <>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroPill}>
                <Ionicons name="location-outline" size={13} color="#D1E9D9" />
                <Text style={styles.heroEyebrow}>{driverLocationLabel(userProfile?.district, lang, 'Sri Lanka')}</Text>
              </View>
              <Ionicons name="car-outline" size={36} color="#82AE92" />
            </View>
            <Text style={styles.heroTitle}>Connecting farms,{'\n'}delivering fresh harvests.</Text>
            <Text style={styles.heroSub}>Review your assigned deliveries.{'\n'}Keep every pickup and drop-off on track.</Text>
            <FarmerButton label={ui.deliveries} icon="cube-outline" onPress={() => { setDeliveryFilter('active'); setWorkspaceTab('deliveries'); }} style={styles.heroButton} />
          </View>
          <View style={styles.statsGrid}>
            {[
              [ui.newJobs, newDeliveries.length, 'mail-unread-outline', 'deliveries', 'active'],
              [ui.onRoute, inTransitDeliveries.length, 'navigate-outline', 'deliveries', 'active'],
              [ui.completed, completedDeliveries.length, 'checkmark-circle-outline', 'deliveries', 'completed'],
              [cleanLabel(t.vehicle.fleetLabel), vehiclesList.length, 'car-outline', 'fleet', 'active'],
            ].map(([label, value, icon, tab, filter]) => <TouchableOpacity key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}
              onPress={() => { setDeliveryFilter(filter); setWorkspaceTab(tab); }} style={styles.statCard}>
              <Ionicons name={icon} size={20} color={C.green} />
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>)}
          </View>
          <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your next steps</Text></View>
          <View style={styles.quickCard}>
            {[
              ['cube-outline', ui.reviewDelivery, ui.review, 'deliveries'],
              ['car-outline', cleanLabel(t.vehicle.fleetLabel), `${ui.countLabel}: ${selectedVehicleCount}`, 'fleet'],
              ['person-outline', 'Update your profile', 'Keep your photo and contact information up to date', 'profile'],
            ].map(([icon, title, subtitle, tab], index) => <TouchableOpacity key={tab} accessibilityRole="button" accessibilityLabel={title}
              onPress={() => { if (tab === 'profile') setShowProfileScreen(true); else { setDeliveryFilter('active'); setWorkspaceTab(tab); } }}
              style={[styles.quickRow, index > 0 && styles.quickBorder]}>
              <IconTile name={icon} />
              <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.quickTitle}>{title}</Text><Text style={styles.smallText}>{subtitle}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>)}
          </View>
        </> : <View style={styles.filterRow}>
          {['active', 'completed'].map((key) => <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{ selected: deliveryFilter === key }}
            onPress={() => setDeliveryFilter(key)} style={[styles.filterChip, deliveryFilter === key && styles.filterChipSelected]}>
            <Text style={[styles.filterText, deliveryFilter === key && { color: C.white }]}>{ui[key]} ({key === 'active' ? activeDeliveries.length : completedDeliveries.length})</Text>
          </TouchableOpacity>)}
        </View>}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{workspaceTab === 'deliveries' && deliveryFilter === 'completed' ? ui.completed : ui.deliveries}</Text>
          {workspaceTab === 'home' && activeDeliveries.length > 0 && <TouchableOpacity accessibilityRole="button" style={styles.viewAllAction} onPress={() => { setDeliveryFilter('active'); setWorkspaceTab('deliveries'); }}>
            <Text style={styles.sectionMeta}>{ui.all} ({activeDeliveries.length})</Text><Ionicons name="chevron-forward" size={16} color={C.green} />
          </TouchableOpacity>}
        </View>
        {visibleDeliveries.length === 0 ? <View style={styles.emptyCard}>
          <IconTile name="cube-outline" />
          <Text style={styles.emptyTitle}>{workspaceTab === 'deliveries' && deliveryFilter === 'completed' ? ui.emptyCompleted : ui.empty}</Text>
          <Text style={styles.emptySubtitle}>{workspaceTab === 'deliveries' && deliveryFilter === 'completed' ? ui.emptyCompletedSub : ui.emptySub}</Text>
          {workspaceTab === 'home' && <FarmerButton label={cleanLabel(t.vehicle.fleetLabel)} secondary onPress={() => setWorkspaceTab('fleet')} style={{ marginTop: 12 }} />}
        </View> : visibleDeliveries.map((trip) => {
          const statusLabel = trip.status === 'ASSIGNED' ? ui.assigned : trip.status === 'ACCEPTED' ? ui.accepted
            : trip.status === 'PREPARING' ? ui.preparing : trip.status === 'DELIVERED' ? ui.completed
            : trip.status === 'READY_FOR_PICKUP' ? ui.ready : ui.transit;
          return <View key={trip.id} style={styles.deliveryCard}>
            <View style={styles.tripHeaderRow}>
              <Text style={styles.cargoTitle}>{trip.produceName}</Text>
              <View style={[styles.tripBadge, { backgroundColor: trip.status === 'ASSIGNED' ? C.amberBg : C.mint }]}>
                <Text style={[styles.tripBadgeText, { color: trip.status === 'ASSIGNED' ? C.amber : C.greenDark }]}>{statusLabel}</Text>
              </View>
            </View>
            <View style={styles.routeSummaryRow}><Ionicons name="ellipse-outline" size={16} color={C.green} /><View style={{ flex: 1 }}><Text style={styles.routeSummaryLabel}>{ui.pickup}</Text><Text style={styles.locationTitle}>{trip.pickupLocation}</Text></View></View>
            <View style={styles.routeSummaryRow}><Ionicons name="location-outline" size={18} color={C.green} /><View style={{ flex: 1 }}><Text style={styles.routeSummaryLabel}>{ui.destination}</Text><Text style={styles.locationTitle}>{trip.deliveryAddress}</Text></View></View>
            <FarmerButton label={trip.status === 'ASSIGNED' ? ui.reviewDelivery : ui.details} icon="arrow-forward-outline" onPress={() => setSelectedTripForTracking(trip)} style={{ marginTop: 16 }} />
          </View>;
        })}
      </ScrollView>)}
      <SafeAreaView edges={['bottom']} style={styles.navSafe}><View role="tablist" style={styles.nav}>
        {[
          ['home', lang === 'si' ? 'සාරාංශය' : lang === 'ta' ? 'சுருக்கம்' : ui.overview, 'grid-outline'],
          ['deliveries', lang === 'si' ? 'බෙදාහැරීම්' : lang === 'ta' ? 'விநியோகங்கள்' : ui.deliveries, 'cube-outline'],
          ['fleet', cleanLabel(t.vehicle.fleetLabel), 'car-outline'],
          ['profile', lang === 'si' ? 'ගිණුම' : lang === 'ta' ? 'சுயவிவரம்' : 'Profile', 'person-outline'],
        ].map(([key, label, icon]) => {
          const selected = showProfileScreen ? key === 'profile' : workspaceTab === key;
          return <TouchableOpacity key={key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} style={styles.navItem}
            onPress={() => { setShowProfileScreen(key === 'profile'); if (key !== 'profile') setWorkspaceTab(key); }}>
            <View style={[styles.navIcon, selected && styles.navIconActive]}><Ionicons name={icon} size={22} color={selected ? C.greenDark : C.muted} /></View>
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{label}</Text>
          </TouchableOpacity>;
        })}
      </View></SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  smallText: { fontSize: 12, lineHeight: 18, color: C.muted, flexShrink: 1 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterChipSelected: { backgroundColor: C.greenDark, borderColor: C.greenDark },
  filterText: { fontSize: 13, fontWeight: '600', color: C.muted },
  viewAllAction: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  routeSummaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14 },
  routeSummaryLabel: { fontSize: 11, color: C.muted, marginBottom: 3 },
  brandCaption: {
    fontSize: 8,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.3,
    marginTop: 2,
  },
  avatarInitial: { fontSize: 17, fontWeight: '700', color: C.greenDark },
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
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.ink, flexShrink: 1 },
  sectionMeta: { fontSize: 12, fontWeight: '600', color: C.green },
  safeArea: { flex: 1, backgroundColor: C.canvas },
  topHeader: {
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
  profileAvatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E1EBDD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  langPillText: { fontSize: 12, fontWeight: '700', color: C.muted },
  scrollContainer: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 28,
  },
  deliveryCard: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  tripHeaderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  cargoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.ink,
    flex: 1,
    marginRight: 8,
  },
  tripBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    marginTop: 1,
  },
  emptyCard: { backgroundColor: C.white, borderRadius: 22, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 6 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.ink,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: { fontSize: 14, lineHeight: 21, color: C.muted, textAlign: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  updateOrderStatus,
  subscribeToDriverVehicles,
  rejectDriverDelivery,
} from '../services/firebaseDatabase';
import { FARMER_COLORS as C, FarmerHeading, FarmerButton, IconTile, cleanLabel } from './FarmerDesign';
import AddVehicleScreen from './AddVehicleScreen';
import DriverVehiclesListScreen from './DriverVehiclesListScreen';
import UserProfileScreen from './UserProfileScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';
import { driverLocationLabel } from './DriverDesign';
import TourTarget from './GuidedTour/TourTarget';
import { useTour } from '../context/TourContext';

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

export default function DriverHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const [workspaceTab, setWorkspaceTab] = useState('home');
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [updatingTripId, setUpdatingTripId] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'vehiclesList' | 'addVehicle'
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [selectedTripForTracking, setSelectedTripForTracking] = useState(null);

  const { replayTour, setTabChangeHandler } = useTour();

  useEffect(() => {
    if (setTabChangeHandler) {
      setTabChangeHandler((tab) => {
        if (tab === 'profile') {
          setShowProfileScreen(true);
        } else {
          setShowProfileScreen(false);
          setWorkspaceTab(tab);
        }
      });
    }
  }, [setTabChangeHandler]);

  const handleReplayTour = () => {
    setShowProfileScreen(false);
    setWorkspaceTab('home');
    replayTour('driver');
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Real-time vehicles subscription
  useEffect(() => {
    if (!userProfile?.uid) return;
    let unsub = () => { };
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
        } catch (_e) { }
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
    farmerName: o.farmerName || '',
    farmerPhone: o.farmerPhone || '',
    pickupLocation: driverLocationLabel(o.pickupLocation || o.location, lang, ''),
    buyerName: o.buyerName || '',
    buyerPhone: o.buyerPhone || '',
    deliveryAddress: driverLocationLabel(o.deliveryAddress, lang, ''),
    // Use real logisticsFee; do NOT fallback to a hardcoded amount
    totalPrice: o.logisticsFee != null ? o.logisticsFee : (o.totalPrice != null ? o.totalPrice : null),
    status: o.status || 'PENDING',
    specialNotes: o.deliveryNotes || '',
  }));

  const allDriverTrips = realOrdersForDriver;

  const activeDeliveries = allDriverTrips.filter(
    (trip) =>
      trip.status === 'READY_FOR_PICKUP' ||
      trip.status === 'IN_TRANSIT' ||
      trip.status === 'ACCEPTED' ||
      trip.status === 'ASSIGNED'
  );
  const completedDeliveries = allDriverTrips.filter((trip) => trip.status === 'DELIVERED');
  const totalDriverEarnings = completedDeliveries.reduce(
    (sum, trip) => sum + (Number(trip.totalPrice) || 0),
    0
  );

  const handleTripProgression = async (trip) => {
    let nextStatus = '';
    if (
      trip.status === 'READY_FOR_PICKUP' ||
      trip.status === 'ACCEPTED' ||
      trip.status === 'PENDING' ||
      trip.status === 'ASSIGNED'
    ) {
      nextStatus = 'IN_TRANSIT';
    } else if (trip.status === 'IN_TRANSIT') {
      nextStatus = 'DELIVERED';
    }

    if (!nextStatus) return;

    setUpdatingTripId(trip.id);
    if (trip.id) {
      const res = await updateOrderStatus(trip.id, nextStatus, {
        driverName: userProfile?.fullName || '',
        driverPhone: userProfile?.phoneNumber || '',
        changedBy: userProfile?.fullName || 'Assigned Driver',
        actorRole: 'driver',
      });
      setUpdatingTripId(null);

      if (!res.success) {
        Alert.alert('Status Error', res.error || 'Failed to update order status');
        return;
      }
    } else {
      setUpdatingTripId(null);
    }

    if (nextStatus === 'IN_TRANSIT') {
      Alert.alert(
        'Cargo Picked Up! 🚛',
        `You have confirmed pickup at "${trip.pickupLocation}". The buyer and farmer have been notified that cargo is in transit.`
      );
    } else if (nextStatus === 'DELIVERED') {
      Alert.alert(
        'Delivery Complete! 🎉',
        `Successfully delivered to "${trip.deliveryAddress}". Logistics payment credited to your driver account!`
      );
    }
  };

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
          setCurrentScreen(vehiclesList.length > 0 ? 'vehiclesList' : 'dashboard');
        }}
        onVehicleSaved={() => {
          setEditingVehicle(null);
          setCurrentScreen('dashboard');
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
        <TourTarget id="driver-brand">
          <View style={styles.brandTitleRow}>
            <Image source={require('../assets/logo.png')} style={{ width: 88, height: 44 }} resizeMode="contain" />
            <Text style={styles.brandCaption}>DRIVER WORKSPACE</Text>
          </View>
        </TourTarget>
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
        onBack={() => setShowProfileScreen(false)} onLogout={onLogout} onChangeLanguage={onChangeLanguage} onProfileUpdated={onProfileUpdated} onReplayTour={handleReplayTour} /> : workspaceTab === 'fleet' ? (
          <DriverVehiclesListScreen embedded userProfile={userProfile} lang={lang} vehicles={vehiclesList}
            onBack={() => setWorkspaceTab('home')}
            onAddNewVehicle={() => { setEditingVehicle(null); setCurrentScreen('addVehicle'); }}
            onEditVehicle={(vehicle) => { setEditingVehicle(vehicle); setCurrentScreen('addVehicle'); }} />
        ) : (
        <ScrollView key={workspaceTab} style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <FarmerHeading eyebrow={workspaceTab === 'home' ? 'YOUR ROUTES, AT A GLANCE' : 'FARM PICKUP & DELIVERY'}
            title={workspaceTab === 'home' ? `Hello, ${userProfile?.fullName?.split(' ')[0] || 'Driver'}.` : t.tabs.assigned} subtitle={t.tagline} />
          {workspaceTab === 'home' && <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <TourTarget id="driver-tracking-feature">
                  <View style={styles.heroPill}><Ionicons name="location-outline" size={13} color="#D1E9D9" /><Text style={styles.heroEyebrow}>{driverLocationLabel(userProfile?.district, lang, 'Sri Lanka')}</Text></View>
                </TourTarget>
                <Ionicons name="car-outline" size={36} color="#82AE92" />
              </View>
              <Text style={styles.heroTitle}>Connecting farms,{'\n'}delivering fresh harvests.</Text>
              <Text style={styles.heroSub}>Plan your pickups, manage your fleet, and keep every delivery moving.</Text>
              <TourTarget id="driver-tab-deliveries">
                <FarmerButton label={cleanLabel(t.tabs.assigned)} icon="navigate-outline" onPress={() => setWorkspaceTab('deliveries')} style={styles.heroButton} />
              </TourTarget>
            </View>
            {/* SHIFT & DUTY STATUS CARD */}
            <TourTarget id="driver-duty-card">
              <View style={styles.dutyCard}>
                <View style={styles.dutyInfo}>
                  <Text style={styles.dutyTitle}>Logistics availability</Text>
                  <Text style={styles.dutySub}>
                    {isOnDuty ? 'Ready for farm pickup & dropoff dispatches' : 'Offline • No new trip requests'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.dutyToggleBtn, isOnDuty ? styles.dutyBtnOn : styles.dutyBtnOff]}
                  onPress={() => setIsOnDuty(!isOnDuty)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dutyToggleText, isOnDuty ? { color: C.green } : { color: C.red }]}>
                    {cleanLabel(isOnDuty ? t.shift.onDuty : t.shift.offDuty)}
                  </Text>
                </TouchableOpacity>
              </View>
            </TourTarget>

            {/* COMPACT FLEET ENTRY */}
            <TourTarget id="driver-fleet-management">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={cleanLabel(t.vehicle.viewAllBtn)}
                style={styles.fleetShortcut}
                onPress={() => setWorkspaceTab('fleet')}
                activeOpacity={0.75}
              >
                <IconTile name="car-outline" />
                <View style={styles.fleetShortcutContent}>
                  <Text style={styles.fleetShortcutTitle}>{t.vehicle.fleetLabel} ({vehiclesList.length})</Text>
                  <Text style={styles.fleetShortcutSubtitle}>{cleanLabel(t.vehicle.viewAllBtn)} · {cleanLabel(t.vehicle.addNewBtn)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.green} />
              </TouchableOpacity>
            </TourTarget>

            {/* DRIVER METRICS GRID */}
            <View style={styles.statsGrid}>
              <View style={styles.kpiCard}>
                <IconTile name="navigate-outline" /><Text style={styles.kpiLabel}>{t.stats.activeTrips}</Text>
                <Text style={styles.kpiValue}>{activeDeliveries.length}</Text>
              </View>

              <View style={styles.kpiCard}>
                <IconTile name="checkmark-circle-outline" /><Text style={styles.kpiLabel}>{t.stats.completedToday}</Text>
                <Text style={styles.kpiValue}>{completedDeliveries.length}</Text>
              </View>

              <View style={styles.kpiCard}>
                <IconTile name="wallet-outline" /><Text style={styles.kpiLabel}>{t.stats.estEarnings}</Text>
                <Text style={styles.kpiValue}>{t.currency} {totalDriverEarnings.toLocaleString()}</Text>
              </View>

              <View style={styles.kpiCard}>
                <IconTile name="star-outline" /><Text style={styles.kpiLabel}>{t.stats.rating}</Text>
                <Text style={styles.kpiValue}>5.0 ★</Text>
              </View>
            </View>

          </>}
          <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{cleanLabel(t.tabs.assigned)}</Text><Text style={styles.sectionMeta}>{activeDeliveries.length}</Text></View>

          {/* ASSIGNED DELIVERIES ROUTE CARDS */}
          <View>
            {activeDeliveries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={48} color={C.green} />
                <Text style={styles.emptyTitle}>All deliveries completed!</Text>
                <Text style={styles.emptySubtitle}>You have no pending pickup routes right now.</Text>
              </View>
            ) : (
              activeDeliveries.map((trip) => {
                const isInTransit = trip.status === 'IN_TRANSIT';
                const isAssigned = trip.status === 'ASSIGNED';
                const isReady = trip.status === 'READY_FOR_PICKUP' || trip.status === 'ACCEPTED' || trip.status === 'PENDING' || isAssigned;

        {/* DRIVER METRICS GRID */}
        <View style={styles.statsGrid}>
          <View style={styles.kpiCard}>
            <IconTile name="navigate-outline" /><Text style={styles.kpiLabel}>{t.stats.activeTrips}</Text>
            <Text style={styles.kpiValue}>{activeDeliveries.length}</Text>
          </View>

          <View style={styles.kpiCard}>
            <IconTile name="checkmark-circle-outline" /><Text style={styles.kpiLabel}>{t.stats.completedToday}</Text>
            <Text style={styles.kpiValue}>{completedDeliveries.length}</Text>
          </View>

          <View style={styles.kpiCard}>
            <IconTile name="wallet-outline" /><Text style={styles.kpiLabel}>{t.stats.estEarnings}</Text>
            <Text style={styles.kpiValue}>{t.currency} {totalDriverEarnings.toLocaleString()}</Text>
          </View>

          <View style={styles.kpiCard}>
            <IconTile name="star-outline" /><Text style={styles.kpiLabel}>{t.stats.rating}</Text>
            <Text style={styles.kpiValue}>{userProfile?.rating ? `${userProfile.rating} ★` : '—'}</Text>
          </View>
        </View>

        </>}
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{cleanLabel(t.tabs.assigned)}</Text><Text style={styles.sectionMeta}>{activeDeliveries.length}</Text></View>

        {/* ASSIGNED DELIVERIES ROUTE CARDS */}
        <View>
          {activeDeliveries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color={C.green} />
              <Text style={styles.emptyTitle}>All deliveries completed!</Text>
              <Text style={styles.emptySubtitle}>You have no pending pickup routes right now.</Text>
            </View>
          ) : (
            activeDeliveries.map((trip) => {
              const isInTransit = trip.status === 'IN_TRANSIT';
              const isAssigned = trip.status === 'ASSIGNED';
              const isReady = trip.status === 'READY_FOR_PICKUP' || trip.status === 'ACCEPTED' || trip.status === 'PENDING' || isAssigned;

              return (
                <View key={trip.id} style={styles.deliveryCard}>
                  {/* CARD HEADER ROW */}
                  <View style={styles.tripHeaderRow}>
                    <Text style={styles.cargoTitle}>{trip.produceName}</Text>
                    <View style={[
                      styles.tripBadge,
                      isInTransit ? styles.badgeInTransit : isAssigned ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1 } : styles.badgePending,
                    ]}>
                      <Text style={[
                        styles.tripBadgeText,
                        isInTransit ? { color: C.green } : isAssigned ? { color: '#2563EB' } : { color: C.muted },
                      ]}>
                        <Text style={[
                          styles.tripBadgeText,
                          isInTransit ? { color: C.green } : isAssigned ? { color: '#2563EB' } : { color: C.muted },
                        ]}>
                          {isInTransit ? 'IN TRANSIT' : isAssigned ? 'ASSIGNED' : 'READY FOR PICKUP'}
                        </Text>
                      </View>
                    </View>

                    {/* FARMER SUBHEADER ROW */}
                    <View style={styles.farmerRow}>
                      <Ionicons name="person-outline" size={14} color={C.muted} style={{ marginRight: 6 }} />
                      <Text style={styles.farmerNameText}>
                        {trip.farmerName} • 📞 {trip.farmerPhone || 'N/A'}
                      </Text>
                    </View>

                    {/* DIVIDER LINE */}
                    <View style={styles.cardDivider} />

                    {/* ROUTE TIMELINE VISUALIZER (MATCHES REQUEST SCREEN) */}
                    <View style={styles.routeContainer}>
                      {/* PICKUP NODE */}
                      <View style={styles.routeNodeRow}>
                        <View style={styles.pickupCircleOuter}>
                          <View style={styles.pickupCircleInner} />
                        </View>
                        <View style={styles.routeTextCol}>
                          <Text style={styles.routeLabelPickup}>PICKUP</Text>
                          <Text style={styles.locationTitle}>{trip.pickupLocation}</Text>
                        </View>
                      </View>

                      {/* CONNECTING LINE */}
                      <View style={styles.routeConnectingLine} />

                      {/* DESTINATION NODE */}
                      <View style={styles.routeNodeRow}>
                        <View style={styles.destCircleOuter} />
                        <View style={styles.routeTextCol}>
                          <Text style={styles.routeLabelDest}>DESTINATION</Text>
                          <Text style={styles.locationTitle}>{trip.deliveryAddress}</Text>
                          <Text style={styles.buyerContactSub}>Buyer: {trip.buyerName} • 📞 {trip.buyerPhone || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* HANDLING NOTES BANNER */}
                    {trip.specialNotes ? (
                      <View style={styles.specialNotesCard}>
                        <Ionicons name="information-circle-outline" size={16} color={C.blue} style={{ marginRight: 8 }} />
                        <Text style={styles.specialNotesText}>{trip.specialNotes}</Text>
                      </View>
                    ) : null}

                    {/* ACTION BUTTON */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isInTransit ? styles.actionBtnDelivered : styles.actionBtnTransit,
                      ]}
                      disabled={updatingTripId === trip.id}
                      onPress={() => handleTripProgression(trip)}
                      activeOpacity={0.85}
                    >
                      {updatingTripId === trip.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name={isInTransit ? 'checkmark-circle-outline' : 'car-outline'}
                            size={18}
                            color="#FFFFFF"
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.actionBtnText}>
                            {cleanLabel(isInTransit ? t.actions.markDelivered : t.actions.startTransit)}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* VIEW LIVE TRACKING BUTTON */}
                    <TouchableOpacity
                      style={styles.viewTrackingBtn}
                      onPress={() => setSelectedTripForTracking(trip)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewTrackingBtnText}>
                        View route & tracking details
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>)}
      <SafeAreaView edges={['bottom']} style={styles.navSafe}><View role="tablist" style={styles.nav}>
        {[
          ['home', lang === 'si' ? 'සාරාංශය' : lang === 'ta' ? 'சுருக்கம்' : 'Overview', 'grid-outline'],
          ['deliveries', lang === 'si' ? 'බෙදාහැරීම්' : lang === 'ta' ? 'விநியோகங்கள்' : 'Deliveries', 'cube-outline'],
          ['fleet', cleanLabel(t.vehicle.fleetLabel), 'car-outline'],
          ['profile', lang === 'si' ? 'ගිණුම' : lang === 'ta' ? 'சுயவிவரம்' : 'Profile', 'person-outline'],
        ].map(([key, label, icon]) => {
          const selected = showProfileScreen ? key === 'profile' : workspaceTab === key;
          return <TourTarget key={key} id={"driver-tab-" + key} style={{ flex: 1 }}>
            <TouchableOpacity accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} style={styles.navItem}
              onPress={() => { setShowProfileScreen(key === 'profile'); if (key !== 'profile') setWorkspaceTab(key); }}>
              <View style={[styles.navIcon, selected && styles.navIconActive]}><Ionicons name={icon} size={22} color={selected ? C.greenDark : C.muted} /></View>
              <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{label}</Text>
            </TouchableOpacity>
          </TourTarget>;
        })}
      </View></SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fleetShortcut: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 18, marginBottom: 20 },
  fleetShortcutContent: { flex: 1, minWidth: 0 },
  fleetShortcutTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  fleetShortcutSubtitle: { fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 4 },
  brandCaption: {
    fontSize: 8,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.3,
    marginTop: 2,
  },
  avatarInitial: { fontSize: 17, fontWeight: '700', color: C.greenDark },
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
  dutyCard: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.border, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  dutyInfo: { flexGrow: 1, flexBasis: 180 },
  dutyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  dutySub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  dutyToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  dutyBtnOn: {
    backgroundColor: C.mint,
    borderColor: C.border,
  },
  dutyBtnOff: {
    backgroundColor: C.redBg,
    borderColor: C.redBg,
  },
  dutyToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26 },
  kpiCard: {
    flexBasis: '46%',
    flexGrow: 1,
    padding: 18,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: C.ink,
    marginTop: 14,
  },
  kpiLabel: { fontSize: 12, color: C.muted, marginTop: 5 },
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
  badgePending: {
    backgroundColor: C.mint,
  },
  badgeInTransit: {
    backgroundColor: C.mint,
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  farmerNameText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: C.mint,
    marginVertical: 14,
  },
  routeContainer: {
    paddingLeft: 2,
  },
  routeNodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupCircleOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  pickupCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  destCircleOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: C.muted,
    marginRight: 10,
    marginTop: 2,
  },
  routeConnectingLine: {
    width: 2,
    height: 22,
    backgroundColor: C.border,
    marginLeft: 8,
    marginVertical: 2,
  },
  routeTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  routeLabelPickup: {
    fontSize: 10,
    fontWeight: '800',
    color: C.green,
    letterSpacing: 0.8,
  },
  routeLabelDest: {
    fontSize: 10,
    fontWeight: '800',
    color: C.muted,
    letterSpacing: 0.8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    marginTop: 1,
  },
  buyerContactSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  specialNotesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  specialNotesText: {
    fontSize: 12,
    color: C.ink,
    fontWeight: '500',
    flex: 1,
  },
  actionBtn: { borderRadius: 14, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnTransit: {
    backgroundColor: C.green,
  },
  actionBtnDelivered: {
    backgroundColor: C.green,
  },
  actionBtnText: { color: C.white, fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  viewTrackingBtn: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: C.mint,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTrackingBtnText: {
    color: C.greenDark,
    fontSize: 12,
    fontWeight: '700',
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

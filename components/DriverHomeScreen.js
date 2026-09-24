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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  updateOrderStatus,
  subscribeToDriverVehicles,
} from '../services/firebaseDatabase';
import AddVehicleScreen from './AddVehicleScreen';
import DriverVehiclesListScreen from './DriverVehiclesListScreen';
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
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
};

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
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'
  const [updatingTripId, setUpdatingTripId] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'vehiclesList' | 'addVehicle'
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

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

  // Determine currently active vehicle
  const activeVehicle =
    vehiclesList.find((v) => v.isActive) ||
    (vehiclesList.length > 0 ? vehiclesList[0] : null) ||
    userProfile?.vehicle ||
    null;

  // Real orders from Firestore mapped for Driver logistics view
  const realOrdersForDriver = ordersList.map((o) => ({
    id: o.id,
    produceName: `${o.produceName || 'Produce Batch'} (${o.qty || 0} ${o.unit || 'kg'})`,
    qty: o.qty,
    unit: o.unit || 'kg',
    farmerName: o.farmerName || 'GoviLink Farmer',
    farmerPhone: o.farmerPhone || '',
    pickupLocation: o.pickupLocation || o.location || 'Farm Origin',
    buyerName: o.buyerName || 'GoviLink Buyer',
    buyerPhone: o.buyerPhone || '',
    deliveryAddress: o.deliveryAddress || 'Delivery Destination',
    totalPrice: o.logisticsFee || 350,
    status: o.status || 'PENDING',
    specialNotes: o.deliveryNotes || 'Standard agricultural transport safety handling.',
  }));

  const allDriverTrips = realOrdersForDriver;

  const activeDeliveries = allDriverTrips.filter(
    (trip) => trip.status === 'READY_FOR_PICKUP' || trip.status === 'IN_TRANSIT' || trip.status === 'ACCEPTED'
  );
  const completedDeliveries = allDriverTrips.filter((trip) => trip.status === 'DELIVERED');
  const totalDriverEarnings = completedDeliveries.reduce(
    (sum, trip) => sum + (Number(trip.totalPrice) || 0),
    0
  );

  const handleTripProgression = async (trip) => {
    let nextStatus = '';
    if (trip.status === 'READY_FOR_PICKUP' || trip.status === 'ACCEPTED' || trip.status === 'PENDING') {
      nextStatus = 'IN_TRANSIT';
    } else if (trip.status === 'IN_TRANSIT') {
      nextStatus = 'DELIVERED';
    }

    if (!nextStatus) return;

    setUpdatingTripId(trip.id);
    if (trip.id) {
      await updateOrderStatus(trip.id, nextStatus, {
        driverName: userProfile?.fullName || 'Assigned Driver',
        driverPhone: userProfile?.phoneNumber || '',
      });
    }
    setUpdatingTripId(null);

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP APP HEADER */}
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
          <Text style={styles.brandTitle}>GoviLink</Text>
          <View style={styles.driverRoleBadge}>
            <Text style={styles.driverRoleBadgeText}>DRIVER</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {onChangeLanguage && (
            <TouchableOpacity
              style={styles.langPill}
              onPress={() => {
                const nextLang = lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en';
                onChangeLanguage(nextLang);
              }}
            >
              <Text style={styles.langPillText}>
                {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'තමි'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* PAGE TITLE & SUBTITLE */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Driver Logistics</Text>
          <Text style={styles.pageSubtitle}>Manage assigned farm pickups and delivery routes.</Text>
        </View>

        {/* SHIFT & DUTY STATUS CARD */}
        <View style={styles.dutyCard}>
          <View style={styles.dutyInfo}>
            <Text style={styles.dutyTitle}>📍 Logistics Availability</Text>
            <Text style={styles.dutySub}>
              {isOnDuty ? 'Ready for farm pickup & dropoff dispatches' : 'Offline • No new trip requests'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.dutyToggleBtn, isOnDuty ? styles.dutyBtnOn : styles.dutyBtnOff]}
            onPress={() => setIsOnDuty(!isOnDuty)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dutyToggleText, isOnDuty ? { color: '#006837' } : { color: '#DC2626' }]}>
              {isOnDuty ? t.shift.onDuty : t.shift.offDuty}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE DISPATCH VEHICLE CARD */}
        {activeVehicle ? (
          <View style={styles.registeredVehicleCard}>
            <View style={styles.vehicleHeaderRow}>
              <View style={styles.vehicleTitleRow}>
                <Text style={styles.vehicleIconBadge}>{activeVehicle.vehicleIcon || '🚚'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleCardTitle} numberOfLines={1}>
                    {activeVehicle.makeModel || 'Assigned Vehicle'}
                  </Text>
                  <Text style={styles.vehicleTypeTag}>
                    {activeVehicle.vehicleTypeLabel || 'Logistics Vehicle'} • 🟢 Operational
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editVehicleBtn}
                onPress={() => {
                  setEditingVehicle(activeVehicle);
                  setCurrentScreen('addVehicle');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.editVehicleBtnText}>{t.vehicle.editBtn}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleDetailsRow}>
              <View style={styles.platePill}>
                <Text style={styles.platePillText}>🇱🇰 {activeVehicle.plateNumber || 'WP-NB-4482'}</Text>
              </View>

              <View style={styles.capacityBadge}>
                <Text style={styles.capacityBadgeText}>
                  📦 {activeVehicle.capacity ? `${activeVehicle.capacity} kg` : '3500 kg'}
                </Text>
              </View>

              {activeVehicle.hasColdChain ? (
                <View style={styles.coldBadge}>
                  <Text style={styles.coldBadgeText}>{t.vehicle.coldChain}</Text>
                </View>
              ) : (
                <View style={styles.ambientBadge}>
                  <Text style={styles.ambientBadgeText}>{t.vehicle.standardCargo}</Text>
                </View>
              )}
            </View>

            {activeVehicle.image ? (
              <View style={styles.vehicleThumbnailContainer}>
                <Image
                  source={{ uri: activeVehicle.image }}
                  style={styles.vehicleThumbnail}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            <View style={styles.fleetActionsRow}>
              <TouchableOpacity
                style={styles.viewAllVehiclesBtn}
                onPress={() => setCurrentScreen('vehiclesList')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllVehiclesBtnText}>
                  {t.vehicle.viewAllBtn} ({vehiclesList.length || 1})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAddVehicleBtn}
                onPress={() => {
                  setEditingVehicle(null);
                  setCurrentScreen('addVehicle');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.quickAddVehicleBtnText}>
                  {t.vehicle.addNewBtn}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noVehicleCard}>
            <View style={styles.noVehicleContent}>
              <Text style={styles.noVehicleIcon}>🚚</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.noVehicleTitle}>{t.vehicle.noVehicleTitle}</Text>
                <Text style={styles.noVehicleSub}>{t.vehicle.noVehicleSub}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addVehicleBtn}
              onPress={() => {
                setEditingVehicle(null);
                setCurrentScreen('addVehicle');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.addVehicleBtnText}>{t.vehicle.addBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DRIVER METRICS GRID */}
        <View style={styles.statsGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.kpiLabel}>{t.stats.activeTrips}</Text>
            <Text style={styles.kpiValue}>{activeDeliveries.length}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.kpiLabel}>{t.stats.completedToday}</Text>
            <Text style={styles.kpiValue}>{completedDeliveries.length}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#006837' }]}>
            <Text style={styles.kpiLabel}>{t.stats.estEarnings}</Text>
            <Text style={styles.kpiValue}>{t.currency} {totalDriverEarnings.toLocaleString()}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.kpiLabel}>{t.stats.rating}</Text>
            <Text style={styles.kpiValue}>5.0 ★</Text>
          </View>
        </View>

        {/* TAB SELECTOR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'assigned' && styles.tabBtnActive]}
            onPress={() => setActiveTab('assigned')}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
              Assigned Deliveries ({activeDeliveries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'available' && styles.tabBtnActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
              Available Co-op Loads ({allDriverTrips.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ASSIGNED DELIVERIES ROUTE CARDS */}
        <View>
          {activeDeliveries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#006837" />
              <Text style={styles.emptyTitle}>All deliveries completed!</Text>
              <Text style={styles.emptySubtitle}>You have no pending pickup routes right now. Switch to 'Available Loads' to claim new trips.</Text>
            </View>
          ) : (
            activeDeliveries.map((trip) => {
              const isInTransit = trip.status === 'IN_TRANSIT';
              const isReady = trip.status === 'READY_FOR_PICKUP' || trip.status === 'ACCEPTED' || trip.status === 'PENDING';

              return (
                <View key={trip.id} style={styles.deliveryCard}>
                  {/* CARD HEADER ROW */}
                  <View style={styles.tripHeaderRow}>
                    <Text style={styles.cargoTitle}>{trip.produceName}</Text>
                    <View style={[
                      styles.tripBadge,
                      isInTransit ? styles.badgeInTransit : styles.badgePending,
                    ]}>
                      <Text style={[
                        styles.tripBadgeText,
                        isInTransit ? { color: '#059669' } : { color: '#64748B' },
                      ]}>
                        {isInTransit ? 'IN TRANSIT' : 'READY FOR PICKUP'}
                      </Text>
                    </View>
                  </View>

                  {/* FARMER SUBHEADER ROW */}
                  <View style={styles.farmerRow}>
                    <Ionicons name="person-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
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
                      <Ionicons name="information-circle-outline" size={16} color="#0284C7" style={{ marginRight: 8 }} />
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
                        <MaterialCommunityIcons
                          name={isInTransit ? 'check-circle' : 'truck-fast'}
                          size={18}
                          color="#FFFFFF"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.actionBtnText}>
                          {isInTransit ? t.actions.markDelivered : t.actions.startTransit}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* TOP APP HEADER */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
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
    gap: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#006837',
    letterSpacing: -0.3,
  },
  driverRoleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  driverRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
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
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* PAGE TITLE SECTION */
  pageTitleSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  /* DUTY AVAILABILITY CARD */
  dutyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dutyInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dutyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dutySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dutyToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dutyBtnOn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  dutyBtnOff: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  dutyToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* REGISTERED VEHICLE CARD */
  registeredVehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#006837',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIconBadge: {
    fontSize: 26,
    marginRight: 10,
  },
  vehicleCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleTypeTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  editVehicleBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editVehicleBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  platePill: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  platePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  capacityBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  capacityBadgeText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  coldBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  coldBadgeText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
  },
  ambientBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ambientBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  vehicleThumbnailContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  vehicleThumbnail: {
    width: '100%',
    height: '100%',
  },
  fleetActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewAllVehiclesBtn: {
    flex: 1.5,
    backgroundColor: '#E6F4EA',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  viewAllVehiclesBtnText: {
    color: '#006837',
    fontSize: 12,
    fontWeight: '700',
  },
  quickAddVehicleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickAddVehicleBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  /* NO VEHICLE CARD */
  noVehicleCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noVehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noVehicleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  noVehicleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  noVehicleSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  addVehicleBtn: {
    backgroundColor: '#006837',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* KPI METRICS GRID */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  /* TAB SELECTOR */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#006837',
    fontWeight: '800',
  },

  /* DELIVERY CARD (MATCHES REQUEST CARDS) */
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cargoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  tripBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: '#F1F5F9',
  },
  badgeInTransit: {
    backgroundColor: '#DCFCE7',
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
    color: '#64748B',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  /* ROUTE TIMELINE */
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
    borderColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  pickupCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006837',
  },
  destCircleOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    marginRight: 10,
    marginTop: 2,
  },
  routeConnectingLine: {
    width: 2,
    height: 22,
    backgroundColor: '#CBD5E1',
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
    color: '#006837',
    letterSpacing: 0.8,
  },
  routeLabelDest: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  buyerContactSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  specialNotesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  specialNotesText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },

  actionBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTransit: {
    backgroundColor: '#006837',
  },
  actionBtnDelivered: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* EMPTY STATE */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

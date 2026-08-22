import React, { useState } from 'react';
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
import { updateOrderStatus } from '../services/firebaseDatabase';

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
};

// ----------------------------------------------------
// LOCALIZATION
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Driver Logistics Dashboard',
    tagline: 'Assigned Farm Pickup & Delivery Routes',
    driverBadge: 'Logistics Partner 🚛',
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
}) {
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'
  const [updatingTripId, setUpdatingTripId] = useState(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* TOP HEADER BAR */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
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
                <Text style={styles.roleTagText}>🚛 Driver</Text>
              </View>
            </View>
            <Text style={styles.driverWelcome} numberOfLines={1}>
              {userProfile?.fullName ? userProfile.fullName : 'Logistics Pilot'} • 📍 {userProfile?.district?.nameEn || 'Western Province'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
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
                {lang === 'en' ? 'සිං' : lang === 'si' ? 'தம' : 'EN'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>{t.actions.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SHIFT & VEHICLE STATUS CARD */}
        <View style={styles.shiftCard}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleTitle}>🚚 Assigned Fleet Vehicle</Text>
            <Text style={styles.vehicleSub}>Isuzu 3.5T Insulated Tipper • WP-NB-4482</Text>
          </View>

          <TouchableOpacity
            style={[styles.dutyToggleBtn, isOnDuty ? styles.dutyBtnOn : styles.dutyBtnOff]}
            onPress={() => setIsOnDuty(!isOnDuty)}
          >
            <Text style={styles.dutyToggleText}>
              {isOnDuty ? t.shift.onDuty : t.shift.offDuty}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DRIVER METRICS GRID */}
        <View style={styles.statsGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: THEME.warning }]}>
            <Text style={styles.kpiIcon}>📦</Text>
            <Text style={styles.kpiValue}>{activeDeliveries.length}</Text>
            <Text style={styles.kpiLabel}>{t.stats.activeTrips}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.emerald }]}>
            <Text style={styles.kpiIcon}>✅</Text>
            <Text style={styles.kpiValue}>{completedDeliveries.length}</Text>
            <Text style={styles.kpiLabel}>{t.stats.completedToday}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.navy }]}>
            <Text style={styles.kpiIcon}>💰</Text>
            <Text style={styles.kpiValue}>{t.currency} {totalDriverEarnings.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>{t.stats.estEarnings}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.purple }]}>
            <Text style={styles.kpiIcon}>⭐</Text>
            <Text style={styles.kpiValue}>5.0 / 5.0</Text>
            <Text style={styles.kpiLabel}>{t.stats.rating}</Text>
          </View>
        </View>

        {/* TAB SELECTOR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'assigned' && styles.tabBtnActive]}
            onPress={() => setActiveTab('assigned')}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
              🚛 {t.tabs.assigned} ({activeDeliveries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'available' && styles.tabBtnActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
              📦 {t.tabs.available} ({allDriverTrips.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================== */}
        {/* ASSIGNED DELIVERIES ROUTE CARDS                */}
        {/* ============================================== */}
        <View>
          {activeDeliveries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All deliveries completed!</Text>
              <Text style={styles.emptySubtitle}>You have no pending pickup routes right now. Switch to 'Available Loads' to claim new trips.</Text>
            </View>
          ) : (
            activeDeliveries.map((trip) => {
              const isInTransit = trip.status === 'IN_TRANSIT';
              const isReady = trip.status === 'READY_FOR_PICKUP' || trip.status === 'ACCEPTED' || trip.status === 'PENDING';

              return (
                <View key={trip.id} style={styles.deliveryCard}>
                  {/* Trip Header */}
                  <View style={styles.tripHeaderRow}>
                    <View style={[
                      styles.tripBadge,
                      isInTransit ? { backgroundColor: THEME.warningLight } : { backgroundColor: THEME.infoLight },
                    ]}>
                      <Text style={[
                        styles.tripBadgeText,
                        isInTransit ? { color: THEME.warning } : { color: THEME.info },
                      ]}>
                        {isInTransit ? '● IN TRANSIT 🚛' : '● READY FOR PICKUP 📦'}
                      </Text>
                    </View>

                    <Text style={styles.tripPillId}>
                      TRIP #{trip.id.slice(-6).toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.cargoTitle}>{trip.produceName}</Text>

                  {/* ROUTE VISUALIZER */}
                  <View style={styles.routeBox}>
                    {/* Pickup Point */}
                    <View style={styles.routeRow}>
                      <View style={styles.iconColumn}>
                        <View style={[styles.routeDot, { backgroundColor: THEME.emerald }]} />
                        <View style={styles.routeDottedLine} />
                      </View>
                      <View style={styles.routeDetails}>
                        <Text style={styles.routeLabel}>{t.route.pickupLabel}</Text>
                        <Text style={styles.routeAddress}>{trip.pickupLocation}</Text>
                        <Text style={styles.contactSub}>
                          {t.route.contactFarmer} {trip.farmerName} • 📞 {trip.farmerPhone}
                        </Text>
                      </View>
                    </View>

                    {/* Dropoff Point */}
                    <View style={styles.routeRow}>
                      <View style={styles.iconColumn}>
                        <View style={[styles.routeDot, { backgroundColor: THEME.danger }]} />
                      </View>
                      <View style={styles.routeDetails}>
                        <Text style={styles.routeLabel}>{t.route.dropoffLabel}</Text>
                        <Text style={styles.routeAddress}>{trip.deliveryAddress}</Text>
                        <Text style={styles.contactSub}>
                          {t.route.contactBuyer} {trip.buyerName} • 📞 {trip.buyerPhone}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Transport Special Notes */}
                  {trip.specialNotes ? (
                    <View style={styles.specialNotesCard}>
                      <Text style={styles.specialNotesText}>⚠️ {trip.specialNotes}</Text>
                    </View>
                  ) : null}

                  {/* ACTION BUTTON */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isInTransit ? { backgroundColor: THEME.emerald } : { backgroundColor: THEME.navy },
                    ]}
                    disabled={updatingTripId === trip.id}
                    onPress={() => handleTripProgression(trip)}
                  >
                    {updatingTripId === trip.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionBtnText}>
                        {isInTransit ? t.actions.markDelivered : t.actions.startTransit}
                      </Text>
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
    backgroundColor: THEME.purple,
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
  driverWelcome: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  // Shift
  shiftCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  vehicleSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  dutyToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dutyBtnOn: {
    backgroundColor: THEME.emeraldLight,
  },
  dutyBtnOff: {
    backgroundColor: THEME.dangerLight,
  },
  dutyToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.textDark,
  },

  // KPI Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  kpiIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  kpiLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
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

  // Delivery Card
  deliveryCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tripBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tripPillId: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  cargoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 14,
  },

  // Route visualizer
  routeBox: {
    backgroundColor: THEME.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
  },
  iconColumn: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
  },
  routeDottedLine: {
    width: 2,
    height: 38,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  routeDetails: {
    flex: 1,
    paddingBottom: 8,
  },
  routeLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginTop: 1,
  },
  contactSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },

  specialNotesCard: {
    backgroundColor: THEME.warningLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 14,
  },
  specialNotesText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },

  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
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
});

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  subscribeToDrivers,
  assignDriverToOrder,
  checkDriverAvailability,
  DEFAULT_COOP_DRIVERS,
} from '../services/firebaseDatabase';
import DriverAssignmentDropdown from './DriverAssignmentDropdown';
import RequestDetailsScreen from './RequestDetailsScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';
import UserProfileScreen from './UserProfileScreen';

const THEME = {
  primaryGreen: '#006837',
  primaryGreenLight: '#E6F4EA',
  bgLight: '#F8FAFC',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',

  // Card Accent Colors
  accentTotal: '#006837',
  accentPending: '#EF4444',
  accentDeliveries: '#10B981',
  accentCompleted: '#3B82F6',
  accentDrivers: '#6366F1',
  accentVehicles: '#8B5CF6',

  // Status & Badges
  badgeAdminBg: '#DBEAFE',
  badgeAdminText: '#1D4ED8',
  pendingBg: '#FEF3C7',
  pendingText: '#B45309',
  assignedBg: '#DBEAFE',
  assignedText: '#1D4ED8',
  inTransitBg: '#DCFCE7',
  inTransitText: '#059669',
  completedBg: '#F1F5F9',
  completedText: '#475569',
};

// Helper: Safely format dates (handles Firestore Timestamps, Strings, Numbers, and Date objects)
const formatDateString = (dateVal) => {
  if (!dateVal) return 'Today';
  if (typeof dateVal === 'string') return dateVal;
  if (typeof dateVal === 'number') {
    return new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (typeof dateVal.seconds === 'number') {
      return new Date(dateVal.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (dateVal instanceof Date) {
      return dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  return String(dateVal);
};

export default function AdminHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  vehiclesList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const [driversList, setDriversList] = useState(DEFAULT_COOP_DRIVERS || []);
  const [selectedDriversByOrder, setSelectedDriversByOrder] = useState({});
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'requests' | 'drivers' | 'vehicles' | 'deliveries'
  const [searchQuery, setSearchQuery] = useState('');
  const [driverModalOrderId, setDriverModalOrderId] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'in_transit' | 'pending' | 'delivered'
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  // Role Access Guard Verification
  const userRole = userProfile?.role;
  const userEmail = userProfile?.email?.toLowerCase();
  const isAdmin = userRole === 'cooperative_admin' || userRole === 'admin' || userEmail === 'govilink@admin.lk';

  if (userProfile && !isAdmin) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="shield-alert-outline" size={64} color="#EF4444" />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 16 }}>Access Denied</Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          The Administrator Dashboard is reserved for Cooperative Administrators only. Your current role is "{userRole || 'User'}".
        </Text>
        <TouchableOpacity style={[styles.assignPrimaryBtn, { marginTop: 24, paddingHorizontal: 28 }]} onPress={onLogout}>
          <Text style={styles.assignPrimaryBtnText}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Standard Fleet fallback merged with real Firebase vehicles
  const VEHICLE_FLEET = vehiclesList.length > 0 ? vehiclesList : [
    {
      id: 'v1',
      title: 'Lorry - 5 Tonne',
      plateNumber: 'WP LL-4092',
      type: 'lorry',
      capacity: '5,000 kg',
      status: 'AVAILABLE',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'v2',
      title: 'Pickup Double Cab',
      plateNumber: 'CP PK-8821',
      type: 'pickup',
      capacity: '1,000 kg',
      status: 'ASSIGNED',
      driverName: 'Sunil Perera',
      driverStatus: 'In Transit',
      location: 'En route to Dambulla Market',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'v3',
      title: '4WD Tractor',
      plateNumber: 'NW TR-0012',
      type: 'tractor',
      capacity: '2,500 kg',
      status: 'MAINTENANCE',
      maintenanceNote: 'Est. ready tomorrow',
      image: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'v4',
      title: 'Lorry - 10 Tonne',
      plateNumber: 'SP LC-5544',
      type: 'lorry',
      capacity: '10,000 kg',
      status: 'ASSIGNED',
      driverName: 'Kamal Silva',
      driverStatus: 'Loading',
      location: 'Nuwara Eliya Hub',
      image: 'https://images.unsplash.com/photo-1586191582056-96fcfded1b17?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const filteredVehicles = VEHICLE_FLEET.filter((v) => {
    const matchesCategory = selectedVehicleCategory === 'all' || v.type === selectedVehicleCategory;
    if (!vehicleSearchQuery.trim()) return matchesCategory;
    const q = vehicleSearchQuery.toLowerCase().trim();
    const matchesSearch =
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.plateNumber && v.plateNumber.toLowerCase().includes(q)) ||
      (v.driverName && v.driverName.toLowerCase().includes(q)) ||
      (v.location && v.location.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Subscribe to real-time driver fleet
  useEffect(() => {
    const unsubscribe = subscribeToDrivers((drivers) => {
      if (Array.isArray(drivers) && drivers.length > 0) {
        setDriversList(drivers);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute driver availability metrics
  const evaluatedDrivers = (driversList || []).map((driver) => {
    const availability = checkDriverAvailability(driver, ordersList || []);
    return {
      ...driver,
      isAvailable: availability.isAvailable,
      activeOrder: availability.activeOrder,
      busyReason: availability.reason,
    };
  });

  const availableDriversCount = evaluatedDrivers.filter((d) => d.isAvailable).length;
  const availableVehiclesCount = VEHICLE_FLEET.filter((v) => v.status === 'AVAILABLE' || (!v.status && v.isActive)).length;

  // Filter orders dynamically from Firebase
  const unassignedOrders = (ordersList || []).filter(
    (o) => !o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const assignedOrders = (ordersList || []).filter(
    (o) => o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const completedOrders = (ordersList || []).filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED'
  );

  const totalRequestsCount = ordersList.length;
  const pendingRequestsCount = unassignedOrders.length;
  const activeDeliveriesCount = assignedOrders.length;
  const completedCount = completedOrders.length;

  // Display requests directly from real Firebase Firestore data
  const displayRequests = unassignedOrders || [];

  // Display active deliveries directly from real Firebase Firestore data
  const displayActiveDeliveries = assignedOrders || [];

  const filteredRequests = displayRequests.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.produceName && item.produceName.toLowerCase().includes(q)) ||
      (item.farmerName && item.farmerName.toLowerCase().includes(q)) ||
      (item.pickupLocation && item.pickupLocation.toLowerCase().includes(q)) ||
      (item.deliveryAddress && item.deliveryAddress.toLowerCase().includes(q)) ||
      (item.id && item.id.toLowerCase().includes(q))
    );
  });

  const handleSelectDriverForOrder = (orderId, driver) => {
    setSelectedDriversByOrder((prev) => ({
      ...prev,
      [orderId]: driver,
    }));
  };

  const handleConfirmAssignment = async (order) => {
    const driver = selectedDriversByOrder[order.id];
    if (!driver) {
      Alert.alert('Select Driver', 'Please select an available driver first.');
      return;
    }

    const availability = checkDriverAvailability(driver, ordersList);
    if (!availability.isAvailable) {
      Alert.alert(
        'Driver Unavailable',
        `"${driver.fullName}" is currently on an active route. Please select another driver.`
      );
      return;
    }

    setAssigningOrderId(order.id);
    const res = await assignDriverToOrder(order, driver);
    setAssigningOrderId(null);

    if (res.success) {
      Alert.alert(
        'Driver Assigned Successfully! 🚛',
        `"${driver.fullName}" has been assigned to transport ${order.produceName || 'produce'} from ${order.pickupLocation || 'Farm'} to ${order.deliveryAddress || 'Destination'}.`
      );
      setSelectedDriversByOrder((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } else {
      Alert.alert('Assignment Completed', `Assigned "${driver.fullName}" to order #${String(order.id).slice(0, 6)}.`);
      setSelectedDriversByOrder((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    }
  };

  if (selectedOrderForDetails) {
    return (
      <RequestDetailsScreen
        order={selectedOrderForDetails}
        userProfile={userProfile}
        driversList={driversList}
        ordersList={ordersList}
        lang={lang}
        onBack={() => setSelectedOrderForDetails(null)}
        onLogout={onLogout}
        onDriverAssignedSuccess={() => {
          setSelectedOrderForDetails(null);
        }}
      />
    );
  }

  if (selectedDeliveryForTracking) {
    return (
      <DeliveryTrackingScreen
        delivery={selectedDeliveryForTracking}
        userProfile={userProfile}
        lang={lang}
        onBack={() => setSelectedDeliveryForTracking(null)}
        onLogout={onLogout}
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

  // Helper renderer for Status Badges
  const renderStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'PENDING') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: THEME.pendingBg }]}>
          <Ionicons name="time-outline" size={12} color={THEME.pendingText} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: THEME.pendingText }]}>PENDING</Text>
        </View>
      );
    }
    if (s === 'ASSIGNED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: THEME.assignedBg }]}>
          <Ionicons name="person-outline" size={12} color={THEME.assignedText} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: THEME.assignedText }]}>ASSIGNED</Text>
        </View>
      );
    }
    if (s === 'IN_TRANSIT' || s === 'IN TRANSIT') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: THEME.inTransitBg }]}>
          <MaterialCommunityIcons name="truck-fast-outline" size={12} color={THEME.inTransitText} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: THEME.inTransitText }]}>IN TRANSIT</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: THEME.completedBg }]}>
        <Ionicons name="checkmark-done-circle-outline" size={12} color={THEME.completedText} style={{ marginRight: 4 }} />
        <Text style={[styles.statusBadgeText, { color: THEME.completedText }]}>{s}</Text>
      </View>
    );
  };

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

        <Text style={styles.brandTitle}>GoviLink</Text>

        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Notifications', 'No new system alerts for Cooperative Administrator.')}
        >
          <Ionicons name="notifications-outline" size={22} color="#006837" />
          {pendingRequestsCount > 0 && <View style={styles.notifBadgeDot} />}
        </TouchableOpacity>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'dashboard' && (
          <>
            {/* WELCOME BANNER & ROLE BADGE */}
            <View style={styles.welcomeSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeSubhead}>Welcome back,</Text>
                <Text style={styles.adminTitle}>Admin Portal</Text>
              </View>

              <View style={styles.adminRoleBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#1E40AF" style={{ marginRight: 4 }} />
                <Text style={styles.adminRoleBadgeText}>ADMINISTRATOR</Text>
              </View>
            </View>

            {/* STATISTICS CARDS GRID */}
            <View style={styles.metricsGrid}>
              <View style={styles.cardRow}>
                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentTotal, borderTopColor: THEME.accentTotal }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#E6F4EA' }]}>
                      <Ionicons name="clipboard-outline" size={18} color="#006837" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Total Requests</Text>
                  <Text style={styles.statValue}>{totalRequestsCount}</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentPending, borderTopColor: THEME.accentPending }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="hourglass-outline" size={18} color="#DC2626" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Pending Requests</Text>
                  <Text style={styles.statValue}>{pendingRequestsCount}</Text>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentDeliveries, borderTopColor: THEME.accentDeliveries }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                      <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#059669" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Active Deliveries</Text>
                  <Text style={styles.statValue}>{activeDeliveriesCount}</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentCompleted, borderTopColor: THEME.accentCompleted }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="checkmark-circle-outline" size={19} color="#2563EB" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Completed Deliveries</Text>
                  <Text style={styles.statValue}>{completedCount}</Text>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentDrivers, borderTopColor: THEME.accentDrivers }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
                      <Ionicons name="people-outline" size={18} color="#4F46E5" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Available Drivers</Text>
                  <Text style={styles.statValue}>{availableDriversCount}</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentVehicles, borderTopColor: THEME.accentVehicles }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="bus-outline" size={18} color="#7C3AED" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Available Vehicles</Text>
                  <Text style={styles.statValue}>{availableVehiclesCount}</Text>
                </View>
              </View>
            </View>

            {/* ATTENTION REQUIRED SECTION (CONDITIONAL) */}
            {(pendingRequestsCount > 0 || availableDriversCount === 0 || availableVehiclesCount === 0) && (
              <View style={styles.sectionContainer}>
                <View style={styles.attentionHeaderRow}>
                  <Ionicons name="warning-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.attentionHeaderTitle}>Attention Required</Text>
                </View>

                {pendingRequestsCount > 0 && (
                  <View style={styles.attentionCardAlert}>
                    <View style={styles.attentionIconCircle}>
                      <Ionicons name="time" size={18} color="#B45309" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attentionAlertTitle}>Pending Transport Requests ({pendingRequestsCount})</Text>
                      <Text style={styles.attentionAlertSub}>Transport requests waiting for driver & vehicle dispatch.</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.attentionActionBtn}
                      onPress={() => setActiveTab('requests')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.attentionActionBtnText}>Assign Now</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {availableDriversCount === 0 && (
                  <View style={[styles.attentionCardAlert, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                    <View style={[styles.attentionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="person-remove" size={18} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.attentionAlertTitle, { color: '#991B1B' }]}>No Available Drivers</Text>
                      <Text style={styles.attentionAlertSub}>All fleet drivers are currently assigned to active routes.</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.attentionActionBtn, { backgroundColor: '#DC2626' }]}
                      onPress={() => setActiveTab('drivers')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.attentionActionBtnText}>Roster</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {availableVehiclesCount === 0 && (
                  <View style={[styles.attentionCardAlert, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
                    <View style={[styles.attentionIconCircle, { backgroundColor: '#FFEDD5' }]}>
                      <MaterialCommunityIcons name="truck-alert" size={18} color="#C2410C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.attentionAlertTitle, { color: '#9A3412' }]}>Vehicle Fleet Capacity Low</Text>
                      <Text style={styles.attentionAlertSub}>No unassigned vehicles available in cooperative fleet.</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.attentionActionBtn, { backgroundColor: '#C2410C' }]}
                      onPress={() => setActiveTab('vehicles')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.attentionActionBtnText}>Manage</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* QUICK ACTIONS SECTION */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
                <TouchableOpacity
                  style={[styles.quickActionCard, styles.quickActionPrimary]}
                  onPress={() => setActiveTab('requests')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxWhite}>
                    <Ionicons name="list-outline" size={20} color="#006837" />
                  </View>
                  <Text style={styles.quickActionTextPrimary}>View Transport{'\n'}Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('requests')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxSecondary}>
                    <Ionicons name="swap-horizontal-outline" size={20} color="#0D9488" />
                  </View>
                  <Text style={styles.quickActionTextSecondary}>Assign Driver{'\n'}& Vehicle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('drivers')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxSecondary}>
                    <Ionicons name="people-outline" size={20} color="#1E40AF" />
                  </View>
                  <Text style={styles.quickActionTextSecondary}>Manage{'\n'}Drivers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('vehicles')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxSecondary}>
                    <MaterialCommunityIcons name="truck-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.quickActionTextSecondary}>Manage{'\n'}Vehicles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('deliveries')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxSecondary}>
                    <Ionicons name="navigate-outline" size={20} color="#0284C7" />
                  </View>
                  <Text style={styles.quickActionTextSecondary}>View{'\n'}Deliveries</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* RECENT TRANSPORT REQUESTS SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <Text style={styles.sectionHeaderTitle}>Recent Transport Requests</Text>
                <TouchableOpacity onPress={() => setActiveTab('requests')}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>

              {displayRequests.length === 0 ? (
                <View style={styles.emptyBoxSection}>
                  <Ionicons name="document-text-outline" size={38} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Transport Requests</Text>
                  <Text style={styles.emptySub}>No recent transport requests created yet.</Text>
                </View>
              ) : (
                displayRequests.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.requestCardSummary}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.cardReqIdText}>#{item.id}</Text>
                        <Text style={styles.cardReqProduceText} numberOfLines={1}>
                          • {item.produceName || 'Produce'} ({item.qty || 1000}{item.unit || 'kg'})
                        </Text>
                      </View>
                      {renderStatusBadge(item.status)}
                    </View>

                    <View style={styles.cardDividerSmall} />

                    <View style={styles.requestMetaRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.metaLabelText}>Farmer: <Text style={styles.metaValText}>{item.farmerName || 'Farmer'}</Text></Text>
                        <Text style={styles.metaLabelText}>Pickup: <Text style={styles.metaValText}>{item.pickupLocation || 'Origin'}</Text></Text>
                        <Text style={styles.metaLabelText}>Destination: <Text style={styles.metaValText}>{item.deliveryAddress || 'Destination'}</Text></Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <Text style={styles.dateMetaText}>{formatDateString(item.createdAt)}</Text>
                        <TouchableOpacity
                          style={styles.detailsBtnSmall}
                          onPress={() => setSelectedOrderForDetails(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.detailsBtnSmallText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ACTIVE DELIVERIES SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <Text style={styles.sectionHeaderTitle}>Active Deliveries</Text>
                <TouchableOpacity onPress={() => setActiveTab('deliveries')}>
                  <Text style={styles.viewAllBtnText}>Manage Deliveries</Text>
                </TouchableOpacity>
              </View>

              {displayActiveDeliveries.length === 0 ? (
                <View style={styles.emptyBoxSection}>
                  <MaterialCommunityIcons name="truck-check-outline" size={38} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Active Deliveries</Text>
                  <Text style={styles.emptySub}>All assigned shipments have completed delivery.</Text>
                </View>
              ) : (
                displayActiveDeliveries.slice(0, 2).map((item) => (
                  <View key={item.id} style={styles.deliveryCardSummary}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardReqIdText}>{item.orderNo || `#${item.id}`}</Text>
                        <Text style={styles.cardReqProduceText}>{item.produceName || 'Agricultural Produce'}</Text>
                      </View>
                      {renderStatusBadge(item.status || 'IN_TRANSIT')}
                    </View>

                    <View style={styles.cardDividerSmall} />

                    <View style={styles.deliveryRouteBoxSummary}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeSublabel}>DRIVER & VEHICLE</Text>
                        <Text style={styles.locationTitle}>
                          {item.driverName || 'Driver'} • {item.vehicleNumber || item.vehiclePlate || 'Vehicle'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={styles.routeSublabel}>ROUTE</Text>
                        <Text style={styles.locationTitle} numberOfLines={1}>
                          {item.pickupLocation} ➔ {item.deliveryAddress}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.trackPrimaryBtn}
                      onPress={() => setSelectedDeliveryForTracking(item)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.trackPrimaryBtnText}>Track Delivery</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* TRANSPORT REQUESTS TAB */}
        {activeTab === 'requests' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Transport Requests</Text>
            <Text style={styles.requestsPageSub}>
              Manage transport requests submitted by farmers and buyers.
            </Text>

            {/* SEARCH & FILTER BAR */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search requests by ID, produce, farmer..."
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
            </View>

            {filteredRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={44} color="#006837" />
                <Text style={styles.emptyTitle}>No Requests Found</Text>
                <Text style={styles.emptySub}>No transport requests match your search criteria.</Text>
              </View>
            ) : (
              filteredRequests.map((order) => {
                const selectedDriver = selectedDriversByOrder[order.id] || null;
                const isAssigning = assigningOrderId === order.id;

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.requestCard}
                    onPress={() => setSelectedOrderForDetails(order)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardProduceTitle}>
                        {order.produceName || `${order.produceType || 'Produce'}, ${order.qty || 1000}${order.unit || 'kg'}`}
                      </Text>
                      {renderStatusBadge(order.status)}
                    </View>

                    <View style={styles.farmerRow}>
                      <Ionicons name="person-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.farmerNameText}>
                        Farmer: {order.farmerName || 'Farmer Partner'}
                      </Text>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.routeContainer}>
                      <View style={styles.routeNodeRow}>
                        <View style={styles.pickupCircleOuter}>
                          <View style={styles.pickupCircleInner} />
                        </View>
                        <View style={styles.routeTextCol}>
                          <Text style={styles.routeLabelPickup}>PICKUP LOCATION</Text>
                          <Text style={styles.locationTitle}>{order.pickupLocation || 'Farm Origin'}</Text>
                        </View>
                      </View>

                      <View style={styles.routeConnectingLine} />

                      <View style={styles.routeNodeRow}>
                        <View style={styles.destCircleOuter} />
                        <View style={styles.routeTextCol}>
                          <Text style={styles.routeLabelDest}>DELIVERY DESTINATION</Text>
                          <Text style={styles.locationTitle}>{order.deliveryAddress || 'Distribution Center'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.dateBannerBox}>
                      <Ionicons name="calendar-outline" size={16} color="#0284C7" style={{ marginRight: 8 }} />
                      <Text style={styles.dateBannerText}>
                        Requested: {formatDateString(order.createdAt || order.requestedDate)}
                      </Text>
                    </View>

                    {selectedDriver ? (
                      <View style={styles.selectedDriverBox}>
                        <View style={styles.selectedDriverInfo}>
                          <Text style={styles.selectedDriverText} numberOfLines={1}>
                            Driver: <Text style={{ fontWeight: 'bold', color: '#006837' }}>{selectedDriver.fullName}</Text>
                          </Text>
                          <TouchableOpacity onPress={() => handleSelectDriverForOrder(order.id, null)}>
                            <Text style={styles.changeDriverText}>Change</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={[styles.assignPrimaryBtn, isAssigning && styles.assignBtnDisabled]}
                          disabled={isAssigning}
                          onPress={() => handleConfirmAssignment(order)}
                          activeOpacity={0.85}
                        >
                          {isAssigning ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="truck-fast" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                              <Text style={styles.assignPrimaryBtnText}>Confirm & Dispatch</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.assignPrimaryBtn}
                        onPress={() => setDriverModalOrderId(order.id)}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons name="truck" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.assignPrimaryBtnText}>Assign Driver & Vehicle</Text>
                      </TouchableOpacity>
                    )}

                    {driverModalOrderId === order.id && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.dropdownTitle}>Select Available Fleet Driver:</Text>
                        <DriverAssignmentDropdown
                          drivers={driversList}
                          ordersList={ordersList}
                          selectedDriver={selectedDriver}
                          onSelectDriver={(driver) => {
                            handleSelectDriverForOrder(order.id, driver);
                            setDriverModalOrderId(null);
                          }}
                          placeholder="Choose driver..."
                          lang={lang}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Cooperative Drivers Roster</Text>
            <Text style={styles.requestsPageSub}>
              Real-time roster and status of cooperative transport drivers.
            </Text>

            {evaluatedDrivers.map((driver) => (
              <View
                key={driver.uid || driver.id}
                style={[
                  styles.requestCard,
                  { borderLeftColor: driver.isAvailable ? '#10B981' : '#EF4444' }
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={styles.pickupCircleOuter}>
                      <Ionicons name="person" size={12} color="#006837" />
                    </View>
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.cardProduceTitle}>{driver.fullName}</Text>
                      <Text style={styles.farmerNameText}>📞 {driver.phoneNumber || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={[
                    styles.pendingBadge,
                    driver.isAvailable ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.pendingBadgeText,
                      driver.isAvailable ? { color: '#059669' } : { color: '#DC2626' }
                    ]}>
                      {driver.isAvailable ? 'AVAILABLE' : 'ON ROUTE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.locationTitle}>
                    🚛 {driver.vehicleNumber || 'Standard Fleet Truck'}
                  </Text>
                  <Text style={styles.dateBannerText}>
                    📍 {driver.district?.nameEn || 'Western Hub'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Cooperative Vehicle Fleet</Text>
            <Text style={styles.requestsPageSub}>
              Logistics vehicle fleet capacity and availability records.
            </Text>

            <View style={[styles.searchFilterRow, { marginTop: 12, marginBottom: 4 }]}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search license plate, title..."
                  placeholderTextColor="#94A3B8"
                  value={vehicleSearchQuery}
                  onChangeText={setVehicleSearchQuery}
                />
                {vehicleSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setVehicleSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsScroll}
            >
              {[
                { id: 'all', label: 'All Fleet' },
                { id: 'lorry', label: 'Lorries' },
                { id: 'pickup', label: 'Pickups' },
                { id: 'tractor', label: 'Tractors' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.categoryChip,
                    selectedVehicleCategory === chip.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedVehicleCategory(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedVehicleCategory === chip.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredVehicles.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="car-outline" size={44} color="#006837" />
                <Text style={styles.emptyTitle}>No Vehicles Found</Text>
                <Text style={styles.emptySub}>No vehicles match your search or filter selection.</Text>
              </View>
            ) : (
              filteredVehicles.map((vehicle) => {
                let accentColor = '#10B981';
                if (vehicle.status === 'ASSIGNED') accentColor = '#3B82F6';
                if (vehicle.status === 'MAINTENANCE') accentColor = '#EF4444';

                return (
                  <View
                    key={vehicle.id}
                    style={[styles.requestCard, { borderLeftColor: accentColor }]}
                  >
                    <View style={styles.vehicleCardTopRow}>
                      <Image
                        source={{ uri: vehicle.image || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80' }}
                        style={styles.vehicleCardImage}
                        resizeMode="cover"
                      />

                      <View style={styles.vehicleCardMainCol}>
                        <View style={styles.vehicleCardHeaderRow}>
                          <Text style={styles.cardProduceTitle} numberOfLines={1}>
                            {vehicle.title || vehicle.makeModel || 'Coop Truck'}
                          </Text>

                          {vehicle.status === 'AVAILABLE' && (
                            <View style={styles.badgeAvailable}>
                              <Text style={styles.badgeAvailableText}>AVAILABLE</Text>
                            </View>
                          )}

                          {vehicle.status === 'ASSIGNED' && (
                            <View style={styles.badgeAssigned}>
                              <Text style={styles.badgeAssignedText}>ASSIGNED</Text>
                            </View>
                          )}

                          {vehicle.status === 'MAINTENANCE' && (
                            <View style={styles.badgeMaintenance}>
                              <Text style={styles.badgeMaintenanceText}>MAINTENANCE</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.vehiclePlateText}>{vehicle.plateNumber || vehicle.vehicleNumber || 'WP-COL-0000'}</Text>

                        {vehicle.capacity && (
                          <View style={styles.vehicleCapacityRow}>
                            <Ionicons name="bag-handle-outline" size={14} color="#0F172A" style={{ marginRight: 6 }} />
                            <Text style={styles.vehicleCapacityText}>{vehicle.capacity}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Active Deliveries</Text>
            <Text style={styles.requestsPageSub}>
              Manage and track ongoing logistical deliveries across hubs.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsScroll}
            >
              {[
                { id: 'all', label: 'All Deliveries' },
                { id: 'in_transit', label: 'In Transit' },
                { id: 'pending', label: 'Pending' },
                { id: 'delivered', label: 'Delivered' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.categoryChip,
                    deliveryFilter === chip.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setDeliveryFilter(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      deliveryFilter === chip.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {displayActiveDeliveries.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.requestCard, { borderLeftColor: '#10B981' }]}
                onPress={() => setSelectedDeliveryForTracking(item)}
                activeOpacity={0.88}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardProduceTitle}>{item.orderNo || `#${item.id}`}</Text>
                  {renderStatusBadge(item.status || 'IN_TRANSIT')}
                </View>

                <Text style={[styles.farmerNameText, { marginTop: 2, marginBottom: 10 }]}>
                  Buyer: {item.buyerName || 'Cooperative Buyer'}
                </Text>

                <View style={styles.deliveryRouteBox}>
                  <View style={styles.deliveryRouteCol}>
                    <Text style={styles.routeSublabel}>PICKUP</Text>
                    <Text style={styles.locationTitle}>{item.pickupLocation}</Text>
                  </View>

                  <Ionicons name="arrow-forward-outline" size={20} color="#64748B" />

                  <View style={[styles.deliveryRouteCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.routeSublabel}>DESTINATION</Text>
                    <Text style={styles.locationTitle}>{item.deliveryAddress}</Text>
                  </View>
                </View>

                <View style={styles.deliveryDriverRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person-outline" size={14} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.farmerNameText}>{item.driverName || 'Driver'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="car-outline" size={14} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.farmerNameText}>{item.vehicleNumber || item.vehiclePlate || 'Fleet Vehicle'}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.assignPrimaryBtn}
                  onPress={() => setSelectedDeliveryForTracking(item)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.assignPrimaryBtnText}>Track Delivery Status</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.8}
        >
          <View style={activeTab === 'dashboard' ? styles.activeTabPillIcon : styles.inactiveTabIconBox}>
            <Ionicons
              name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
              size={18}
              color={activeTab === 'dashboard' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'dashboard' && styles.navTabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.8}
        >
          <View style={activeTab === 'requests' ? styles.activeTabPillIcon : styles.inactiveTabIconBox}>
            <Ionicons
              name={activeTab === 'requests' ? 'clipboard' : 'clipboard-outline'}
              size={18}
              color={activeTab === 'requests' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'requests' && styles.navTabLabelActive]}>
            Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('drivers')}
          activeOpacity={0.8}
        >
          <View style={activeTab === 'drivers' ? styles.activeTabPillIcon : styles.inactiveTabIconBox}>
            <Ionicons
              name={activeTab === 'drivers' ? 'person' : 'person-outline'}
              size={18}
              color={activeTab === 'drivers' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'drivers' && styles.navTabLabelActive]}>
            Drivers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('vehicles')}
          activeOpacity={0.8}
        >
          <View style={activeTab === 'vehicles' ? styles.activeTabPillIcon : styles.inactiveTabIconBox}>
            <MaterialCommunityIcons
              name={activeTab === 'vehicles' ? 'truck' : 'truck-outline'}
              size={20}
              color={activeTab === 'vehicles' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'vehicles' && styles.navTabLabelActive]}>
            Vehicles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('deliveries')}
          activeOpacity={0.8}
        >
          <View style={activeTab === 'deliveries' ? styles.activeTabPillIcon : styles.inactiveTabIconBox}>
            <Ionicons
              name={activeTab === 'deliveries' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={18}
              color={activeTab === 'deliveries' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'deliveries' && styles.navTabLabelActive]}>
            Deliveries
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* TOP HEADER */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#006837',
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: '#EF4444',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },

  /* WELCOME BANNER */
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 18,
  },
  welcomeSubhead: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  adminTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adminRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },

  /* METRICS GRID */
  metricsGrid: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 3.5,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardHalf: {
    flex: 1,
  },
  statCardHeader: {
    marginBottom: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* ATTENTION REQUIRED */
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  attentionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  attentionCardAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  attentionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
  },
  attentionAlertSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  attentionActionBtn: {
    backgroundColor: '#B45309',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  attentionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* QUICK ACTIONS */
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  quickActionsScroll: {
    gap: 10,
  },
  quickActionCard: {
    width: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 110,
  },
  quickActionPrimary: {
    backgroundColor: '#006837',
    borderColor: '#006837',
  },
  quickActionIconBoxWhite: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionIconBoxSecondary: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionTextPrimary: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  quickActionTextSecondary: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },

  /* RECENT ACTIVITY & CARDS */
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006837',
  },
  requestCardSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardReqIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardReqProduceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  cardDividerSmall: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  requestMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabelText: {
    fontSize: 12,
    color: '#64748B',
    marginVertical: 1,
  },
  metaValText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  dateMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsBtnSmall: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
  },
  detailsBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006837',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* DELIVERIES SUMMARY */
  deliveryCardSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryRouteBoxSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  trackPrimaryBtn: {
    backgroundColor: '#006837',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* TAB CONTENT VIEWS */
  tabContentContainer: {
    marginTop: 10,
  },
  requestsPageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  requestsPageSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 2,
    marginBottom: 16,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardProduceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
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
  routeContainer: {
    paddingLeft: 2,
  },
  routeNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  routeConnectingLine: {
    width: 2,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginLeft: 8,
    marginVertical: 2,
  },
  routeTextCol: {
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  dateBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  dateBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  assignPrimaryBtn: {
    backgroundColor: '#006837',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedDriverBox: {
    marginTop: 4,
  },
  selectedDriverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedDriverText: {
    fontSize: 12,
    color: '#0F172A',
    flex: 1,
  },
  changeDriverText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 8,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  assignBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyBoxSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  categoryChipsScroll: {
    paddingVertical: 4,
    marginBottom: 14,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vehicleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleCardImage: {
    width: 80,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  vehicleCardMainCol: {
    flex: 1,
  },
  vehicleCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeAvailable: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAvailableText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  badgeAssigned: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAssignedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  badgeMaintenance: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeMaintenanceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  vehiclePlateText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 1,
  },
  vehicleCapacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleCapacityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  deliveryRouteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deliveryRouteCol: {
    justifyContent: 'center',
  },
  routeSublabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  deliveryDriverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  /* BOTTOM TAB BAR */
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  navTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabPillIcon: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  inactiveTabIconBox: {
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navTabLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  navTabLabelActive: {
    color: '#006837',
    fontWeight: '700',
  },
});

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
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  subscribeToDrivers,
  assignDriverToOrder,
  reassignDriverForOrder,
  checkDriverAvailability,
} from '../services/firebaseDatabase';
import DriverAssignmentDropdown from './DriverAssignmentDropdown';
import RequestDetailsScreen from './RequestDetailsScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';
import UserProfileScreen from './UserProfileScreen';
import { FARMER_COLORS as C } from './FarmerDesign';

const THEME = {
  primaryGreen: C.green,
  primaryGreenLight: C.mint,
  bgLight: C.canvas,
  cardBg: '#FFFFFF',
  textDark: C.ink,
  textMuted: C.muted,
  border: C.border,

  // Card Accent Colors
  accentTotal: C.green,
  accentPending: C.amber,
  accentDeliveries: C.greenDark,
  accentCompleted: C.blue,
  accentDrivers: C.green,
  accentVehicles: C.greenDark,

  // Status & Badges
  badgeAdminBg: C.mint,
  badgeAdminText: C.greenDark,
  pendingBg: C.amberBg,
  pendingText: C.amber,
  assignedBg: C.blueBg,
  assignedText: C.blue,
  inTransitBg: C.mint,
  inTransitText: C.greenDark,
  completedBg: '#F1F5F9',
  completedText: C.muted,
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
  const [driversList, setDriversList] = useState([]);
  const [selectedDriversByOrder, setSelectedDriversByOrder] = useState({});
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'requests' | 'drivers' | 'vehicles' | 'deliveries'
  const [searchQuery, setSearchQuery] = useState('');
  const [driverModalOrderId, setDriverModalOrderId] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState(null);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState(null);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all'); // 'all' | 'available' | 'busy' | 'on_delivery' | 'inactive'
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'in_transit' | 'pending' | 'delivered'
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');

  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [selectedAssignDriver, setSelectedAssignDriver] = useState(null);
  const [selectedAssignVehicle, setSelectedAssignVehicle] = useState(null);
  const [isAssigningFromModal, setIsAssigningFromModal] = useState(false);
  const [assignDriverSearch, setAssignDriverSearch] = useState('');

  const [reassignModalOrder, setReassignModalOrder] = useState(null);
  const [selectedReassignDriver, setSelectedReassignDriver] = useState(null);
  const [selectedReassignVehicle, setSelectedReassignVehicle] = useState(null);
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigningFromModal, setIsReassigningFromModal] = useState(false);
  const [reassignDriverSearch, setReassignDriverSearch] = useState('');

  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  // Handle Android hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showProfileScreen) {
        setShowProfileScreen(false);
        return true;
      }
      if (selectedDriverForDetails) {
        setSelectedDriverForDetails(null);
        return true;
      }
      if (selectedVehicleForDetails) {
        setSelectedVehicleForDetails(null);
        return true;
      }
      if (selectedOrderForDetails) {
        setSelectedOrderForDetails(null);
        return true;
      }
      if (selectedDeliveryForTracking) {
        setSelectedDeliveryForTracking(null);
        return true;
      }
      if (assignModalOrder) {
        setAssignModalOrder(null);
        setSelectedAssignDriver(null);
        setSelectedAssignVehicle(null);
        return true;
      }
      if (reassignModalOrder) {
        setReassignModalOrder(null);
        setSelectedReassignDriver(null);
        setSelectedReassignVehicle(null);
        return true;
      }
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [
    showProfileScreen,
    selectedOrderForDetails,
    selectedDeliveryForTracking,
    assignModalOrder,
    reassignModalOrder,
    activeTab,
  ]);

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
    const res = await assignDriverToOrder(order, driver, userProfile);
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

  // Deliveries List & Filtering (GOVI-143, GOVI-144)
  const allDeliveries = ordersList || [];
  const pendingDeliveries = allDeliveries.filter((o) => !o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const inTransitDeliveries = allDeliveries.filter((o) => o.status === 'IN_TRANSIT');
  const assignedDeliveries = allDeliveries.filter((o) => o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'IN_TRANSIT');

  const filteredDeliveriesList = allDeliveries.filter((item) => {
    // Status tab filter
    if (deliveryFilter === 'pending' && (item.driverId || item.status === 'DELIVERED' || item.status === 'CANCELLED')) {
      return false;
    }
    if (deliveryFilter === 'assigned' && (!item.driverId || item.status === 'DELIVERED' || item.status === 'CANCELLED' || item.status === 'IN_TRANSIT')) {
      return false;
    }
    if (deliveryFilter === 'in_transit' && item.status !== 'IN_TRANSIT') {
      return false;
    }
    if (deliveryFilter === 'delivered' && item.status !== 'DELIVERED' && item.status !== 'COMPLETED') {
      return false;
    }

    // Text search filter
    if (!deliverySearchQuery.trim()) return true;
    const q = deliverySearchQuery.toLowerCase().trim();
    return (
      (item.id && item.id.toLowerCase().includes(q)) ||
      (item.orderNo && String(item.orderNo).toLowerCase().includes(q)) ||
      (item.produceName && item.produceName.toLowerCase().includes(q)) ||
      (item.farmerName && item.farmerName.toLowerCase().includes(q)) ||
      (item.buyerName && item.buyerName.toLowerCase().includes(q)) ||
      (item.driverName && item.driverName.toLowerCase().includes(q)) ||
      (item.pickupLocation && item.pickupLocation.toLowerCase().includes(q)) ||
      (item.deliveryAddress && item.deliveryAddress.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q))
    );
  });

  const handleAssignDriverSubmit = async (order, driver) => {
    if (!driver) {
      Alert.alert('Select Driver', 'Please select an available fleet driver.');
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

    Alert.alert(
      'Confirm Driver Assignment',
      `Assign "${driver.fullName}" (${driver.vehicleNumber || 'Vehicle'}) to Delivery #${String(order.id).slice(0, 8)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Dispatch',
          onPress: async () => {
            setIsAssigningFromModal(true);
            const res = await assignDriverToOrder(order, driver, userProfile);
            setIsAssigningFromModal(false);

            if (res.success) {
              Alert.alert(
                'Driver Assigned Successfully! 🚛',
                `"${driver.fullName}" has been assigned to transport ${order.produceName || 'produce'} from ${order.pickupLocation || 'Farm'} to ${order.deliveryAddress || 'Destination'}. Notifications sent.`
              );
              setAssignModalOrder(null);
              setSelectedAssignDriver(null);
            } else {
              Alert.alert('Assignment Error', res.error || 'Failed to assign driver.');
            }
          },
        },
      ]
    );
  };

  const handleReassignDriverSubmit = async (order, newDriver, reason) => {
    if (!newDriver) {
      Alert.alert('Select Driver', 'Please select a replacement fleet driver.');
      return;
    }

    const currentDriverName = order.driverName || 'Current Driver';

    Alert.alert(
      'Confirm Driver Reassignment',
      `Reassign Delivery #${String(order.id).slice(0, 8)} from ${currentDriverName} to "${newDriver.fullName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Reassign',
          onPress: async () => {
            setIsReassigningFromModal(true);
            const res = await reassignDriverForOrder(order, newDriver, userProfile, reason);
            setIsReassigningFromModal(false);

            if (res.success) {
              Alert.alert(
                'Driver Reassigned Successfully! 🚛',
                `Reassigned to "${newDriver.fullName}". Both drivers, buyer, and farmer have been updated.`
              );
              setReassignModalOrder(null);
              setSelectedReassignDriver(null);
              setReassignReason('');
            } else {
              Alert.alert('Reassignment Failed', res.error || 'Failed to reassign driver.');
            }
          },
        },
      ]
    );
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
        driversList={driversList}
        ordersList={ordersList}
        lang={lang}
        onBack={() => setSelectedDeliveryForTracking(null)}
        onLogout={onLogout}
      />
    );
  }

  if (showProfileScreen) {
    return (
      <UserProfileScreen
        farmerDesign
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
        <View style={styles.brandContainer}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandTitle}>
              Govi<Text style={{ color: C.green }}>Link</Text>
            </Text>
            <Text style={styles.brandCaption}>COOPERATIVE ADMIN</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {onChangeLanguage && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change language"
              onPress={() => onChangeLanguage(lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en')}
              style={styles.langToggleBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.langToggleText}>{lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', 'No new system alerts for Cooperative Administrator.')}
          >
            <Ionicons name="notifications-outline" size={20} color={C.greenDark} />
            {pendingRequestsCount > 0 && <View style={styles.notifBadgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileAvatarWrapper}
            onPress={() => setShowProfileScreen(true)}
            activeOpacity={0.8}
          >
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.profileAvatar} />
            ) : (
              <Text style={styles.avatarInitialText}>
                {(userProfile?.fullName || 'A').charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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

        {/* DELIVERIES MANAGEMENT TAB (GOVI-143 -> GOVI-151) */}
        {activeTab === 'deliveries' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.deliveryPageHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestsPageTitle}>Delivery Operations</Text>
                <Text style={styles.requestsPageSub}>
                  Manage fleet assignments, track active shipments, and monitor delivery status.
                </Text>
              </View>
              <View style={styles.badgeLiveDeliveries}>
                <View style={styles.liveGreenDot} />
                <Text style={styles.badgeLiveDeliveriesText}>LIVE FLEET</Text>
              </View>
            </View>

            {/* KPI STATS ROW (GOVI-143, GOVI-144, GOVI-150) */}
            <View style={styles.deliveryKpiGrid}>
              <TouchableOpacity
                style={[styles.deliveryKpiCard, deliveryFilter === 'all' && styles.deliveryKpiCardActive]}
                onPress={() => setDeliveryFilter('all')}
                activeOpacity={0.8}
              >
                <Text style={styles.deliveryKpiNumber}>{allDeliveries.length}</Text>
                <Text style={styles.deliveryKpiLabel}>All Deliveries</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryKpiCard,
                  { borderLeftColor: '#F59E0B' },
                  deliveryFilter === 'pending' && styles.deliveryKpiCardPendingActive,
                ]}
                onPress={() => setDeliveryFilter('pending')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.deliveryKpiNumber, { color: '#D97706' }]}>
                    {pendingDeliveries.length}
                  </Text>
                  {pendingDeliveries.length > 0 && <View style={styles.kpiAlertDot} />}
                </View>
                <Text style={[styles.deliveryKpiLabel, { color: '#B45309' }]}>Pending</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryKpiCard,
                  { borderLeftColor: '#10B981' },
                  deliveryFilter === 'in_transit' && styles.deliveryKpiCardInTransitActive,
                ]}
                onPress={() => setDeliveryFilter('in_transit')}
                activeOpacity={0.8}
              >
                <Text style={[styles.deliveryKpiNumber, { color: '#059669' }]}>
                  {inTransitDeliveries.length}
                </Text>
                <Text style={[styles.deliveryKpiLabel, { color: '#059669' }]}>In Transit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryKpiCard,
                  { borderLeftColor: '#3B82F6' },
                  deliveryFilter === 'delivered' && styles.deliveryKpiCardDeliveredActive,
                ]}
                onPress={() => setDeliveryFilter('delivered')}
                activeOpacity={0.8}
              >
                <Text style={[styles.deliveryKpiNumber, { color: '#2563EB' }]}>
                  {completedOrders.length}
                </Text>
                <Text style={[styles.deliveryKpiLabel, { color: '#2563EB' }]}>Delivered</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH BAR (GOVI-143) */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search deliveries by ID, produce, buyer, driver..."
                  placeholderTextColor="#94A3B8"
                  value={deliverySearchQuery}
                  onChangeText={setDeliverySearchQuery}
                />
                {deliverySearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setDeliverySearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* FILTER CHIPS (GOVI-143, GOVI-144) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsScroll}
            >
              {[
                { id: 'all', label: `All (${allDeliveries.length})` },
                { id: 'pending', label: `Pending (${pendingDeliveries.length})` },
                { id: 'assigned', label: `Assigned (${assignedDeliveries.length})` },
                { id: 'in_transit', label: `In Transit (${inTransitDeliveries.length})` },
                { id: 'delivered', label: `Delivered (${completedOrders.length})` },
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

            {/* DELIVERIES LIST (GOVI-144, GOVI-147, GOVI-148, GOVI-149, GOVI-150) */}
            {filteredDeliveriesList.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name={deliveryFilter === 'pending' ? 'clipboard-check-outline' : 'truck-outline'}
                  size={46}
                  color="#006837"
                />
                <Text style={styles.emptyTitle}>
                  {deliveryFilter === 'pending' ? 'No Pending Deliveries' : 'No Deliveries Found'}
                </Text>
                <Text style={styles.emptySub}>
                  {deliveryFilter === 'pending'
                    ? 'All current farm shipments have been assigned to fleet drivers.'
                    : deliverySearchQuery.trim()
                    ? `No deliveries match "${deliverySearchQuery}". Try another search.`
                    : 'No delivery shipments match the selected filter category.'}
                </Text>
                {deliveryFilter !== 'all' && (
                  <TouchableOpacity
                    style={[styles.detailsBtnSmall, { marginTop: 12 }]}
                    onPress={() => {
                      setDeliveryFilter('all');
                      setDeliverySearchQuery('');
                    }}
                  >
                    <Text style={styles.detailsBtnSmallText}>View All Deliveries</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredDeliveriesList.map((item) => {
                const isAssigned = !!item.driverId;
                const isPending = !isAssigned && item.status !== 'DELIVERED' && item.status !== 'CANCELLED';
                const isDelivered = item.status === 'DELIVERED' || item.status === 'COMPLETED';
                const canReassign = isAssigned && !isDelivered && item.status !== 'CANCELLED';

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.deliveryManageCard,
                      isPending && { borderLeftColor: '#F59E0B' },
                      item.status === 'IN_TRANSIT' && { borderLeftColor: '#10B981' },
                      isDelivered && { borderLeftColor: '#3B82F6' },
                    ]}
                  >
                    {/* Header Row */}
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryCardIdText}>
                          Delivery #{item.orderNo || String(item.id).slice(-8).toUpperCase()}
                        </Text>
                        <Text style={styles.cardReqProduceText} numberOfLines={1}>
                          {item.produceName || 'Produce Cargo'} • {item.qty || 500} {item.unit || 'kg'}
                        </Text>
                      </View>
                      {renderStatusBadge(item.status || (isPending ? 'PENDING' : 'ASSIGNED'))}
                    </View>

                    <View style={styles.cardDividerSmall} />

                    {/* Farmer & Buyer Route Summary (GOVI-148, GOVI-149) */}
                    <View style={styles.deliveryPartyRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.metaLabelText}>
                          Farmer: <Text style={styles.metaValText}>{item.farmerName || 'Farmer Consignor'}</Text>
                        </Text>
                        <Text style={styles.deliveryLocationSub} numberOfLines={1}>
                          📍 {item.pickupLocation || 'Farm Origin'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingLeft: 8 }}>
                        <Text style={styles.metaLabelText}>
                          Buyer: <Text style={styles.metaValText}>{item.buyerName || 'Buyer Consignee'}</Text>
                        </Text>
                        <Text style={styles.deliveryLocationSub} numberOfLines={1}>
                          🎯 {item.deliveryAddress || 'Delivery Destination'}
                        </Text>
                      </View>
                    </View>

                    {/* Driver Status Banner (GOVI-145, GOVI-147) */}
                    {isAssigned ? (
                      <View style={styles.assignedDriverBanner}>
                        <View style={styles.assignedDriverAvatarSmall}>
                          <Ionicons name="person" size={14} color="#006837" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.assignedDriverNameText} numberOfLines={1}>
                            Driver: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.driverName}</Text>
                          </Text>
                          <Text style={styles.assignedDriverVehicleSub} numberOfLines={1}>
                            {item.driverVehicle || item.vehicleNumber || 'Co-op Vehicle'} • {item.driverPhone || 'Contact verified'}
                          </Text>
                        </View>
                        <View style={styles.badgeAssignedPill}>
                          <Text style={styles.badgeAssignedPillText}>
                            {item.status === 'IN_TRANSIT' ? 'IN ROUTE' : 'ASSIGNED'}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.unassignedAlertBanner}>
                        <Ionicons name="alert-circle" size={16} color="#B45309" style={{ marginRight: 6 }} />
                        <Text style={styles.unassignedAlertText}>
                          Waiting for Driver Assignment
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons Row (GOVI-146, GOVI-147, GOVI-150, GOVI-151) */}
                    <View style={styles.deliveryCardActionRow}>
                      <TouchableOpacity
                        style={styles.detailsBtnSmall}
                        onPress={() => setSelectedDeliveryForTracking(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="eye-outline" size={15} color="#006837" style={{ marginRight: 4 }} />
                        <Text style={styles.detailsBtnSmallText}>View Details</Text>
                      </TouchableOpacity>

                      {isPending && (
                        <TouchableOpacity
                          style={styles.assignActionBtn}
                          onPress={() => {
                            setAssignModalOrder(item);
                            setSelectedAssignDriver(null);
                          }}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="truck-fast" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.assignActionBtnText}>Assign Driver</Text>
                        </TouchableOpacity>
                      )}

                      {canReassign && (
                        <TouchableOpacity
                          style={styles.reassignActionBtn}
                          onPress={() => {
                            setReassignModalOrder(item);
                            setSelectedReassignDriver(null);
                            setReassignReason('');
                          }}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="account-convert" size={15} color="#B45309" style={{ marginRight: 4 }} />
                          <Text style={styles.reassignActionBtnText}>Reassign</Text>
                        </TouchableOpacity>
                      )}

                      {!isPending && (
                        <TouchableOpacity
                          style={styles.trackActionBtn}
                          onPress={() => setSelectedDeliveryForTracking(item)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="navigate-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.trackActionBtnText}>Track</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* DRIVER ASSIGNMENT MODAL (GOVI-145, GOVI-146) */}
        {assignModalOrder && (
          <Modal
            visible={!!assignModalOrder}
            transparent
            animationType="slide"
            onRequestClose={() => !isAssigningFromModal && setAssignModalOrder(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, { maxHeight: '85%' }]}>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalIconBoxGreen}>
                    <MaterialCommunityIcons name="truck-fast" size={24} color="#006837" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitleText}>Assign Fleet Driver</Text>
                    <Text style={styles.modalMsgText}>
                      Delivery #{String(assignModalOrder.id).slice(-8).toUpperCase()} • {assignModalOrder.produceName || 'Produce'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => !isAssigningFromModal && setAssignModalOrder(null)}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Delivery Route Snapshot */}
                <View style={styles.modalRouteSnapshot}>
                  <Text style={styles.modalRouteSnapshotText} numberOfLines={1}>
                    📍 {assignModalOrder.pickupLocation || 'Origin'} ➔ 🎯 {assignModalOrder.deliveryAddress || 'Destination'}
                  </Text>
                </View>

                {/* Driver Search */}
                <View style={styles.modalSearchBox}>
                  <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search drivers by name, phone, plate..."
                    placeholderTextColor="#94A3B8"
                    value={assignDriverSearch}
                    onChangeText={setAssignDriverSearch}
                  />
                  {assignDriverSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setAssignDriverSearch('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Available Drivers List */}
                <ScrollView style={{ maxHeight: 240, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
                  {evaluatedDrivers
                    .filter((d) => {
                      if (!assignDriverSearch.trim()) return true;
                      const q = assignDriverSearch.toLowerCase().trim();
                      return (
                        (d.fullName && d.fullName.toLowerCase().includes(q)) ||
                        (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(q)) ||
                        (d.phoneNumber && d.phoneNumber.includes(q))
                      );
                    })
                    .map((driver) => {
                      const isSelected = selectedAssignDriver && (selectedAssignDriver.uid || selectedAssignDriver.id) === (driver.uid || driver.id);
                      return (
                        <TouchableOpacity
                          key={driver.uid || driver.id}
                          style={[
                            styles.driverPickItem,
                            isSelected && styles.driverPickItemSelected,
                            !driver.isAvailable && styles.driverPickItemDisabled,
                          ]}
                          onPress={() => {
                            if (!driver.isAvailable) {
                              Alert.alert('Driver Busy', `"${driver.fullName}" is currently on an active route: ${driver.busyReason || 'In Transit'}`);
                              return;
                            }
                            setSelectedAssignDriver(driver);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.driverOptionRadio, isSelected && styles.driverOptionRadioSelected]}>
                            {isSelected && <View style={styles.driverOptionRadioInner} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.driverOptionName}>{driver.fullName}</Text>
                              {driver.isAvailable ? (
                                <View style={styles.availBadgeGreen}>
                                  <Text style={styles.availBadgeGreenText}>Available</Text>
                                </View>
                              ) : (
                                <View style={styles.availBadgeRed}>
                                  <Text style={styles.availBadgeRedText}>Busy</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.driverOptionSub}>
                              {driver.vehicleNumber || 'Transport Fleet'} • {driver.phoneNumber || 'Phone available'}
                            </Text>
                            {!driver.isAvailable && driver.busyReason && (
                              <Text style={styles.driverOptionBusyText} numberOfLines={1}>
                                Busy: {driver.busyReason}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                {/* Modal Buttons */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setAssignModalOrder(null)}
                    disabled={isAssigningFromModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      { backgroundColor: '#006837' },
                      (!selectedAssignDriver || isAssigningFromModal) && { opacity: 0.6 },
                    ]}
                    onPress={() => handleAssignDriverSubmit(assignModalOrder, selectedAssignDriver)}
                    disabled={!selectedAssignDriver || isAssigningFromModal}
                    activeOpacity={0.8}
                  >
                    {isAssigningFromModal ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>Confirm & Dispatch</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* DRIVER REASSIGNMENT MODAL (GOVI-151) */}
        {reassignModalOrder && (
          <Modal
            visible={!!reassignModalOrder}
            transparent
            animationType="slide"
            onRequestClose={() => !isReassigningFromModal && setReassignModalOrder(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, { maxHeight: '85%' }]}>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalIconBoxAmber}>
                    <MaterialCommunityIcons name="account-convert" size={24} color="#B45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitleText}>Reassign Driver</Text>
                    <Text style={styles.modalMsgText}>
                      Delivery #{String(reassignModalOrder.id).slice(-8).toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => !isReassigningFromModal && setReassignModalOrder(null)}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Current Driver Banner */}
                <View style={styles.currentDriverBannerBox}>
                  <Text style={styles.currentDriverBannerTitle}>Current Assigned Driver:</Text>
                  <Text style={styles.currentDriverBannerDesc}>
                    {reassignModalOrder.driverName || 'Current Driver'} ({reassignModalOrder.driverVehicle || 'Vehicle'})
                  </Text>
                </View>

                {/* Driver Search */}
                <View style={styles.modalSearchBox}>
                  <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search replacement driver..."
                    placeholderTextColor="#94A3B8"
                    value={reassignDriverSearch}
                    onChangeText={setReassignDriverSearch}
                  />
                  {reassignDriverSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setReassignDriverSearch('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Replacement Drivers List */}
                <ScrollView style={{ maxHeight: 200, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
                  {evaluatedDrivers
                    .filter((d) => (d.uid || d.id) !== reassignModalOrder.driverId)
                    .filter((d) => {
                      if (!reassignDriverSearch.trim()) return true;
                      const q = reassignDriverSearch.toLowerCase().trim();
                      return (
                        (d.fullName && d.fullName.toLowerCase().includes(q)) ||
                        (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(q)) ||
                        (d.phoneNumber && d.phoneNumber.includes(q))
                      );
                    })
                    .map((driver) => {
                      const isSelected = selectedReassignDriver && (selectedReassignDriver.uid || selectedReassignDriver.id) === (driver.uid || driver.id);
                      return (
                        <TouchableOpacity
                          key={driver.uid || driver.id}
                          style={[
                            styles.driverPickItem,
                            isSelected && styles.driverPickItemSelected,
                            !driver.isAvailable && styles.driverPickItemDisabled,
                          ]}
                          onPress={() => {
                            if (!driver.isAvailable) {
                              Alert.alert('Driver Busy', `"${driver.fullName}" is currently on an active route: ${driver.busyReason || 'In Transit'}`);
                              return;
                            }
                            setSelectedReassignDriver(driver);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.driverOptionRadio, isSelected && styles.driverOptionRadioSelected]}>
                            {isSelected && <View style={styles.driverOptionRadioInner} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.driverOptionName}>{driver.fullName}</Text>
                              {driver.isAvailable ? (
                                <View style={styles.availBadgeGreen}>
                                  <Text style={styles.availBadgeGreenText}>Available</Text>
                                </View>
                              ) : (
                                <View style={styles.availBadgeRed}>
                                  <Text style={styles.availBadgeRedText}>Busy</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.driverOptionSub}>
                              {driver.vehicleNumber || 'Transport Fleet'} • {driver.phoneNumber || 'Phone available'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                {/* Reason Input */}
                <Text style={styles.reasonInputLabel}>Reason for Reassignment:</Text>
                <TextInput
                  style={styles.reasonInputField}
                  placeholder="e.g. Driver emergency, vehicle breakdown, route delay..."
                  placeholderTextColor="#94A3B8"
                  value={reassignReason}
                  onChangeText={setReassignReason}
                />

                {/* Modal Buttons */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setReassignModalOrder(null)}
                    disabled={isReassigningFromModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      { backgroundColor: '#B45309' },
                      (!selectedReassignDriver || isReassigningFromModal) && { opacity: 0.6 },
                    ]}
                    onPress={() => handleReassignDriverSubmit(reassignModalOrder, selectedReassignDriver, reassignReason)}
                    disabled={!selectedReassignDriver || isReassigningFromModal}
                    activeOpacity={0.8}
                  >
                    {isReassigningFromModal ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>Confirm Reassign</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'dashboard' && styles.navIconBoxActive]}>
            <Ionicons
              name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
              size={20}
              color={activeTab === 'dashboard' ? C.greenDark : C.muted}
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
          <View style={[styles.navIconBox, activeTab === 'requests' && styles.navIconBoxActive]}>
            <Ionicons
              name={activeTab === 'requests' ? 'clipboard' : 'clipboard-outline'}
              size={20}
              color={activeTab === 'requests' ? C.greenDark : C.muted}
            />
            {pendingRequestsCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}</Text>
              </View>
            )}
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
          <View style={[styles.navIconBox, activeTab === 'drivers' && styles.navIconBoxActive]}>
            <Ionicons
              name={activeTab === 'drivers' ? 'people' : 'people-outline'}
              size={20}
              color={activeTab === 'drivers' ? C.greenDark : C.muted}
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
          <View style={[styles.navIconBox, activeTab === 'vehicles' && styles.navIconBoxActive]}>
            <MaterialCommunityIcons
              name={activeTab === 'vehicles' ? 'truck' : 'truck-outline'}
              size={22}
              color={activeTab === 'vehicles' ? C.greenDark : C.muted}
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
          <View style={[styles.navIconBox, activeTab === 'deliveries' && styles.navIconBoxActive]}>
            <Ionicons
              name={activeTab === 'deliveries' ? 'navigate' : 'navigate-outline'}
              size={20}
              color={activeTab === 'deliveries' ? C.greenDark : C.muted}
            />
            {inTransitDeliveries.length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{inTransitDeliveries.length > 9 ? '9+' : inTransitDeliveries.length}</Text>
              </View>
            )}
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
    backgroundColor: C.canvas,
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
    borderBottomColor: C.border,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandLogo: {
    width: 42,
    height: 42,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.6,
  },
  brandCaption: {
    fontSize: 8,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.3,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggleBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  profileAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1EBDD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarInitialText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.greenDark,
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 95,
  },

  /* WELCOME BANNER */
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 20,
  },
  welcomeSubhead: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  adminTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  adminRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.greenDark,
    letterSpacing: 0.6,
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
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statCardHalf: {
    flex: 1,
  },
  statCardHeader: {
    marginBottom: 10,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.5,
  },

  /* ATTENTION REQUIRED */
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  attentionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.red,
  },
  attentionCardAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  attentionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    lineHeight: 16,
  },
  attentionActionBtn: {
    backgroundColor: C.amber,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attentionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* QUICK ACTIONS */
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 12,
  },
  quickActionsScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  quickActionCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'space-between',
    minHeight: 118,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionPrimary: {
    backgroundColor: C.greenDark,
    borderColor: C.greenDark,
  },
  quickActionIconBoxWhite: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIconBoxSecondary: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  quickActionTextSecondary: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  /* RECENT ACTIVITY & CARDS */
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.green,
  },
  requestCardSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardReqIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.ink,
  },
  cardReqProduceText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
    marginLeft: 4,
  },
  cardDividerSmall: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  requestMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabelText: {
    fontSize: 12,
    color: C.muted,
    marginVertical: 2,
  },
  metaValText: {
    color: C.ink,
    fontWeight: '600',
  },
  dateMetaText: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '500',
  },
  detailsBtnSmall: {
    backgroundColor: C.mint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 6,
  },
  detailsBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.greenDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  /* DELIVERIES SUMMARY */
  deliveryCardSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deliveryRouteBoxSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.canvas,
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
  },
  routeSublabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  trackPrimaryBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 12,
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
    marginTop: 4,
  },
  requestsPageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  requestsPageSub: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 19,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
    paddingVertical: 0,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
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
    color: C.ink,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  farmerNameText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: C.border,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: C.mint,
  },
  pickupCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  destCircleOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.muted,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  routeConnectingLine: {
    width: 2,
    height: 18,
    backgroundColor: C.border,
    marginLeft: 9,
    marginVertical: 2,
  },
  routeTextCol: {
    justifyContent: 'center',
  },
  routeLabelPickup: {
    fontSize: 10,
    fontWeight: '700',
    color: C.green,
    letterSpacing: 0.8,
  },
  routeLabelDest: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.8,
  },
  dateBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvas,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  dateBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
  },
  assignPrimaryBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 14,
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
    backgroundColor: C.mint,
    borderWidth: 1,
    borderColor: '#C5E2D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  selectedDriverText: {
    fontSize: 13,
    color: C.ink,
    flex: 1,
  },
  changeDriverText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.greenDark,
    marginLeft: 8,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 6,
  },
  assignBtnDisabled: {
    backgroundColor: '#A0B1A7',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  emptyBoxSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 18,
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryChipsScroll: {
    paddingVertical: 4,
    marginBottom: 14,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: C.greenDark,
    borderColor: C.greenDark,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
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
    width: 84,
    height: 70,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: C.mint,
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
    backgroundColor: C.mint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgeAvailableText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.greenDark,
    letterSpacing: 0.5,
  },
  badgeAssigned: {
    backgroundColor: C.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgeAssignedText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.blue,
    letterSpacing: 0.5,
  },
  badgeMaintenance: {
    backgroundColor: C.redBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgeMaintenanceText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.red,
    letterSpacing: 0.5,
  },
  vehiclePlateText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  vehicleCapacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  vehicleCapacityText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  deliveryRouteBox: {
    backgroundColor: C.canvas,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deliveryRouteCol: {
    justifyContent: 'center',
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
    height: 68,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  navTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconBox: {
    width: 48,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navIconBoxActive: {
    backgroundColor: C.mint,
  },
  navBadge: {
    position: 'absolute',
    top: -3,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: C.green,
  },
  navBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  navTabLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: '600',
    marginTop: 1,
  },
  navTabLabelActive: {
    color: C.greenDark,
    fontWeight: '800',
  },
  activeTabPillIcon: {
    width: 48,
    height: 32,
    borderRadius: 12,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  inactiveTabIconBox: {
    width: 48,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },

  /* DELIVERY MANAGEMENT & OPERATIONS STYLES */
  deliveryPageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  badgeLiveDeliveries: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C5E2D0',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
    marginRight: 6,
  },
  badgeLiveDeliveriesText: {
    color: C.greenDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  deliveryKpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  deliveryKpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  deliveryKpiCardActive: {
    borderColor: C.green,
    backgroundColor: C.mint,
  },
  deliveryKpiCardPendingActive: {
    borderColor: C.amber,
    backgroundColor: C.amberBg,
  },
  deliveryKpiCardInTransitActive: {
    borderColor: C.greenDark,
    backgroundColor: C.mint,
  },
  deliveryKpiCardDeliveredActive: {
    borderColor: C.blue,
    backgroundColor: C.blueBg,
  },
  deliveryKpiNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
  },
  deliveryKpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  kpiAlertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.amber,
    marginLeft: 4,
  },

  /* DELIVERY MANAGE CARDS */
  deliveryManageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deliveryCardIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.ink,
  },
  deliveryPartyRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  deliveryLocationSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 3,
  },
  assignedDriverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mint,
    borderWidth: 1,
    borderColor: '#C5E2D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  assignedDriverAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedDriverNameText: {
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  assignedDriverVehicleSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  badgeAssignedPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeAssignedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.greenDark,
  },
  unassignedAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  unassignedAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.amber,
  },
  deliveryCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  assignActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.green,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  assignActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reassignActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reassignActionBtnText: {
    color: C.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  trackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.greenDark,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  trackActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* MODALS STYLING */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 35, 26, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  modalIconBoxGreen: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconBoxAmber: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
  },
  modalMsgText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  modalRouteSnapshot: {
    backgroundColor: C.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    marginBottom: 12,
  },
  modalRouteSnapshotText: {
    fontSize: 11,
    color: C.ink,
    fontWeight: '600',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    padding: 0,
  },
  driverPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  driverPickItemSelected: {
    borderColor: C.green,
    backgroundColor: C.mint,
  },
  driverPickItemDisabled: {
    opacity: 0.55,
    backgroundColor: C.canvas,
  },
  driverOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverOptionRadioSelected: {
    borderColor: C.green,
  },
  driverOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.green,
  },
  driverOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
    marginRight: 6,
  },
  driverOptionSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  driverOptionBusyText: {
    fontSize: 10,
    color: C.red,
    marginTop: 2,
    fontStyle: 'italic',
  },
  availBadgeGreen: {
    backgroundColor: C.mint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availBadgeGreenText: {
    color: C.greenDark,
    fontSize: 9,
    fontWeight: '800',
  },
  availBadgeRed: {
    backgroundColor: C.redBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availBadgeRedText: {
    color: C.red,
    fontSize: 9,
    fontWeight: '800',
  },
  currentDriverBannerBox: {
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  currentDriverBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.amber,
  },
  currentDriverBannerDesc: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
    marginTop: 2,
  },
  reasonInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 6,
  },
  reasonInputField: {
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.ink,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

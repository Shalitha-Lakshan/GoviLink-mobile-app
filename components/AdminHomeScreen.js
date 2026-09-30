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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../services/i18n';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  subscribeToDrivers,
  subscribeToAllTransportRequests,
  assignDriverAndVehicleTransaction,
  completeDeliveryTransaction,
  deleteVehicleWithGuard,
  updateDriverStatusByAdmin,
  checkDriverAvailability,
  DEFAULT_COOP_DRIVERS,
} from '../services/firebaseDatabase';
import DriverAssignmentDropdown from './DriverAssignmentDropdown';
import RequestDetailsScreen from './RequestDetailsScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';
import UserProfileScreen from './UserProfileScreen';
import AddVehicleScreen from './AddVehicleScreen';

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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || lang || 'en';
  const [driversList, setDriversList] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'requests' | 'drivers' | 'vehicles' | 'deliveries'

  // Search & Filter state
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState('all'); // 'all' | 'available' | 'on_delivery' | 'offline'
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState('all'); // 'all' | 'available' | 'assigned' | 'maintenance'
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'active' | 'in_transit' | 'delivered' | 'completed'
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');

  // Selection & Modal states
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState(null);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState(null);

  // Vehicle CRUD & Realtime Transport state
  const [showAddVehicleScreen, setShowAddVehicleScreen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [realtimeTransportRequests, setRealtimeTransportRequests] = useState([]);

  // Multi-step Assignment Flow Modal State
  const [assignmentModalOrder, setAssignmentModalOrder] = useState(null);
  const [assignmentStep, setAssignmentStep] = useState(1); // 1: Driver, 2: Vehicle, 3: Review, 4: Success
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState(null);
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState(null);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

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

  // Real Fleet vehicles array directly from Firebase Firestore
  const VEHICLE_FLEET = vehiclesList || [];

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

  // Subscribe to real-time transport requests
  useEffect(() => {
    const unsub = subscribeToAllTransportRequests((reqs) => {
      setRealtimeTransportRequests(reqs || []);
    });
    return () => unsub && unsub();
  }, []);

  // Handler for Vehicle Deletion with Guard
  const handleDeleteVehicle = (vehicle) => {
    if (!vehicle?.id) return;
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to remove vehicle "${vehicle.title || vehicle.plateNumber}" from the fleet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteVehicleWithGuard(vehicle.id, vehicle.status, vehicle.availability);
            if (res.success) {
              Alert.alert('Vehicle Deleted', 'Vehicle has been removed from the fleet.');
              setSelectedVehicleForDetails(null);
            } else {
              Alert.alert('Cannot Delete Vehicle', res.error);
            }
          },
        },
      ]
    );
  };

  // Handler for Driver Status Toggle
  const handleToggleDriverStatus = async (driver) => {
    const nextStatus = driver.isAvailable ? 'BUSY' : 'AVAILABLE';
    const res = await updateDriverStatusByAdmin(driver.uid || driver.id, nextStatus);
    if (res.success) {
      Alert.alert('Driver Status Updated', `Driver "${driver.fullName}" set to ${nextStatus}.`);
      setSelectedDriverForDetails(null);
    } else {
      Alert.alert('Error', res.error || 'Could not update driver status.');
    }
  };

  // Handler for Completing Delivery
  const handleCompleteDelivery = async (deliveryOrder) => {
    Alert.alert(
      'Complete Delivery',
      `Mark shipment #${deliveryOrder.orderNo || deliveryOrder.id} as DELIVERED and release assigned driver/vehicle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: async () => {
            const res = await completeDeliveryTransaction({
              orderId: deliveryOrder.id,
              transportRequestId: deliveryOrder.requestId,
              driverId: deliveryOrder.driverId,
              vehicleId: deliveryOrder.vehicleId,
              farmerId: deliveryOrder.farmerId,
              buyerId: deliveryOrder.buyerId,
            });
            if (res.success) {
              Alert.alert('Delivery Completed! 🎉', 'Order status updated to DELIVERED and driver released.');
              setSelectedDeliveryForTracking(null);
            } else {
              Alert.alert('Error', res.error || 'Failed to complete delivery.');
            }
          },
        },
      ]
    );
  };

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

  const availableDriversList = evaluatedDrivers.filter((d) => d.isAvailable);
  const busyDriversList = evaluatedDrivers.filter((d) => !d.isAvailable);

  const availableDriversCount = availableDriversList.length;
  const busyDriversCount = busyDriversList.length;
  const offlineDriversCount = evaluatedDrivers.filter((d) => d.status === 'OFFLINE').length;

  const availableVehiclesList = VEHICLE_FLEET.filter((v) => v.status === 'AVAILABLE' || (!v.status && v.isActive));
  const assignedVehiclesList = VEHICLE_FLEET.filter((v) => v.status === 'ASSIGNED');
  const maintenanceVehiclesList = VEHICLE_FLEET.filter((v) => v.status === 'MAINTENANCE');

  const availableVehiclesCount = availableVehiclesList.length;
  const assignedVehiclesCount = assignedVehiclesList.length;
  const maintenanceVehiclesCount = maintenanceVehiclesList.length;

  // Filter orders dynamically from Firebase
  const unassignedOrders = (ordersList || []).filter(
    (o) => !o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'COMPLETED'
  );
  const assignedOrders = (ordersList || []).filter(
    (o) => o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'COMPLETED'
  );
  const completedOrders = (ordersList || []).filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED'
  );

  const totalRequestsCount = ordersList.length;
  const pendingRequestsCount = unassignedOrders.length;
  const activeDeliveriesCount = assignedOrders.length;
  const completedCount = completedOrders.length;

  // Filter requests list by tab & search query
  const filteredRequests = ordersList.filter((item) => {
    let matchesStatus = true;
    const s = (item.status || 'PENDING').toUpperCase();
    if (requestFilter === 'pending') matchesStatus = !item.driverId && s !== 'DELIVERED' && s !== 'CANCELLED';
    else if (requestFilter === 'assigned') matchesStatus = item.driverId && s !== 'IN_TRANSIT' && s !== 'DELIVERED';
    else if (requestFilter === 'in_progress') matchesStatus = s === 'IN_TRANSIT' || s === 'IN TRANSIT';
    else if (requestFilter === 'completed') matchesStatus = s === 'DELIVERED' || s === 'COMPLETED';
    else if (requestFilter === 'cancelled') matchesStatus = s === 'CANCELLED';

    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.produceName && item.produceName.toLowerCase().includes(q)) ||
      (item.farmerName && item.farmerName.toLowerCase().includes(q)) ||
      (item.buyerName && item.buyerName.toLowerCase().includes(q)) ||
      (item.pickupLocation && item.pickupLocation.toLowerCase().includes(q)) ||
      (item.deliveryAddress && item.deliveryAddress.toLowerCase().includes(q)) ||
      (item.id && item.id.toLowerCase().includes(q))
    );
  });

  // Filter drivers list by tab & search query
  const filteredDrivers = evaluatedDrivers.filter((driver) => {
    let matchesStatus = true;
    if (driverFilter === 'available') matchesStatus = driver.isAvailable;
    else if (driverFilter === 'on_delivery') matchesStatus = !driver.isAvailable;
    else if (driverFilter === 'offline') matchesStatus = driver.status === 'OFFLINE';

    if (!matchesStatus) return false;
    if (!driverSearchQuery.trim()) return true;
    const q = driverSearchQuery.toLowerCase().trim();
    return (
      (driver.fullName && driver.fullName.toLowerCase().includes(q)) ||
      (driver.phoneNumber && driver.phoneNumber.includes(q)) ||
      (driver.district?.nameEn && driver.district.nameEn.toLowerCase().includes(q)) ||
      (driver.vehicleNumber && driver.vehicleNumber.toLowerCase().includes(q))
    );
  });

  // Filter vehicles list by category & search query
  const filteredVehicles = VEHICLE_FLEET.filter((v) => {
    let matchesCat = true;
    if (selectedVehicleCategory === 'available') matchesCat = v.status === 'AVAILABLE';
    else if (selectedVehicleCategory === 'assigned') matchesCat = v.status === 'ASSIGNED';
    else if (selectedVehicleCategory === 'maintenance') matchesCat = v.status === 'MAINTENANCE';

    if (!matchesCat) return false;
    if (!vehicleSearchQuery.trim()) return true;
    const q = vehicleSearchQuery.toLowerCase().trim();
    return (
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.plateNumber && v.plateNumber.toLowerCase().includes(q)) ||
      (v.driverName && v.driverName.toLowerCase().includes(q)) ||
      (v.location && v.location.toLowerCase().includes(q))
    );
  });

  // Filter deliveries list
  const filteredDeliveries = ordersList.filter((item) => {
    if (!item.driverId && item.status !== 'IN_TRANSIT' && item.status !== 'DELIVERED') return false;
    let matchesFilter = true;
    const s = (item.status || 'ASSIGNED').toUpperCase();
    if (deliveryFilter === 'in_transit') matchesFilter = s === 'IN_TRANSIT' || s === 'IN TRANSIT';
    else if (deliveryFilter === 'pending') matchesFilter = s === 'PENDING' || s === 'ASSIGNED';
    else if (deliveryFilter === 'delivered') matchesFilter = s === 'DELIVERED' || s === 'COMPLETED';

    if (!matchesFilter) return false;
    if (!deliverySearchQuery.trim()) return true;
    const q = deliverySearchQuery.toLowerCase().trim();
    return (
      (item.orderNo && item.orderNo.toLowerCase().includes(q)) ||
      (item.produceName && item.produceName.toLowerCase().includes(q)) ||
      (item.driverName && item.driverName.toLowerCase().includes(q)) ||
      (item.pickupLocation && item.pickupLocation.toLowerCase().includes(q)) ||
      (item.deliveryAddress && item.deliveryAddress.toLowerCase().includes(q))
    );
  });

  // Recent system logs derived from real orders
  const recentActivities = ordersList.slice(0, 4).map((item, idx) => {
    let text = `Transport request #${item.id || idx + 101} received for ${item.produceName || 'Harvest'}`;
    let icon = 'document-text-outline';
    let color = '#3B82F6';

    if (item.status === 'DELIVERED' || item.status === 'COMPLETED') {
      text = `Delivery completed for order #${item.orderNo || item.id} (${item.produceName})`;
      icon = 'checkmark-circle-outline';
      color = '#10B981';
    } else if (item.status === 'IN_TRANSIT' || item.status === 'IN TRANSIT') {
      text = `Shipment in transit by ${item.driverName || 'Driver'} to ${item.deliveryAddress || 'Market'}`;
      icon = 'truck-fast-outline';
      color = '#006837';
    } else if (item.driverId) {
      text = `Driver ${item.driverName || 'assigned'} assigned to order #${item.orderNo || item.id}`;
      icon = 'person-add-outline';
      color = '#6366F1';
    }

    return {
      id: `act_${item.id || idx}`,
      text,
      time: formatDateString(item.createdAt),
      icon,
      color,
    };
  });

  // Handlers for starting the multi-step assignment flow modal
  const handleOpenAssignmentFlow = (order) => {
    setAssignmentModalOrder(order);
    setAssignmentStep(1);
    setSelectedDriverForAssign(null);
    setSelectedVehicleForAssign(availableVehiclesList[0] || VEHICLE_FLEET[0]);
  };

  const handleConfirmAssignmentFlow = async () => {
    if (!assignmentModalOrder || !selectedDriverForAssign) return;

    setIsSubmittingAssignment(true);
    const res = await assignDriverAndVehicleTransaction({
      transportRequestId: assignmentModalOrder.requestId || assignmentModalOrder.id,
      orderId: assignmentModalOrder.id || assignmentModalOrder.orderId,
      driver: selectedDriverForAssign,
      vehicle: selectedVehicleForAssign,
    });
    setIsSubmittingAssignment(false);

    if (res.success) {
      setAssignmentStep(4); // Show success step
    } else {
      Alert.alert('Assignment Error', res.error || 'Could not complete assignment.');
    }
  };

  // Renderer for Status Badges
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

  if (showAddVehicleScreen) {
    return (
      <AddVehicleScreen
        userProfile={userProfile}
        lang={lang}
        initialVehicle={editingVehicle}
        onBack={() => {
          setShowAddVehicleScreen(false);
          setEditingVehicle(null);
        }}
        onVehicleSaved={() => {
          setShowAddVehicleScreen(false);
          setEditingVehicle(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={{ width: 28, height: 28, borderRadius: 6 }}
          />
          <Text style={styles.brandTitle}>GoviLink</Text>
          <View style={styles.adminRoleBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#1E40AF" style={{ marginRight: 4 }} />
            <Text style={styles.adminRoleBadgeText}>COOP ADMIN</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.langBadgeBtn}
            onPress={async () => {
              const nextLang = currentLang === 'en' ? 'si' : currentLang === 'si' ? 'ta' : 'en';
              await changeAppLanguage(nextLang);
              if (onChangeLanguage) {
                onChangeLanguage(nextLang);
              }
            }}
          >
            <Text style={styles.langBadgeText}>
              {currentLang === 'en' ? 'EN' : currentLang === 'si' ? 'සිං' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', `You have ${pendingRequestsCount} pending transport requests waiting for assignment.`)}
          >
            <Ionicons name="notifications-outline" size={22} color="#006837" />
            {pendingRequestsCount > 0 && <View style={styles.notifBadgeDot} />}
          </TouchableOpacity>

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
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'dashboard' && (
          <>
            {/* 2. ADMIN WELCOME / HUB CARD */}
            <View style={styles.welcomeHubCard}>
              <View style={styles.welcomeHubTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeHubSubhead}>{t('admin.welcome')}</Text>
                  <Text style={styles.welcomeHubAdminName}>
                    {userProfile?.fullName || 'System Administrator'}
                  </Text>
                  <Text style={styles.welcomeHubLocation}>
                    📍 {userProfile?.district || 'Dambulla Regional Hub'} • Central Province
                  </Text>
                </View>
                <View style={styles.opsStatusBadge}>
                  <View style={styles.opsDotGreen} />
                  <Text style={styles.opsStatusText}>ACTIVE OPS</Text>
                </View>
              </View>
            </View>

            {/* 3. QUICK OVERVIEW (2x2 GRID) */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>Logistics Operations Overview</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentPending }]}
                    onPress={() => setActiveTab('requests')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="hourglass-outline" size={18} color="#DC2626" />
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#94A3B8" />
                    </View>
                    <Text style={styles.statLabel}>{t('admin.pendingRequests')}</Text>
                    <Text style={styles.statValue}>{pendingRequestsCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentDeliveries }]}
                    onPress={() => setActiveTab('deliveries')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                        <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#059669" />
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#94A3B8" />
                    </View>
                    <Text style={styles.statLabel}>{t('admin.activeDeliveries')}</Text>
                    <Text style={styles.statValue}>{activeDeliveriesCount}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentDrivers }]}
                    onPress={() => setActiveTab('drivers')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="people-outline" size={18} color="#4F46E5" />
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#94A3B8" />
                    </View>
                    <Text style={styles.statLabel}>{t('admin.availableDrivers')}</Text>
                    <Text style={styles.statValue}>{availableDriversCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentVehicles }]}
                    onPress={() => setActiveTab('vehicles')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
                        <Ionicons name="bus-outline" size={18} color="#7C3AED" />
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#94A3B8" />
                    </View>
                    <Text style={styles.statLabel}>{t('admin.availableVehicles')}</Text>
                    <Text style={styles.statValue}>{availableVehiclesCount}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 4. PRIORITY TRANSPORT REQUESTS */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <Text style={styles.sectionHeaderTitle}>{t('admin.priorityRequests')}</Text>
                <TouchableOpacity onPress={() => setActiveTab('requests')}>
                  <Text style={styles.viewAllBtnText}>{t('admin.viewAllRequests')}</Text>
                </TouchableOpacity>
              </View>

              {unassignedOrders.length === 0 ? (
                <View style={styles.emptyBoxSection}>
                  <Ionicons name="checkmark-done-circle-outline" size={38} color="#10B981" />
                  <Text style={styles.emptyTitle}>No Pending Requests</Text>
                  <Text style={styles.emptySub}>{t('admin.noRequests')}</Text>
                </View>
              ) : (
                unassignedOrders.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.requestCardSummary}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.cardReqIdText}>#{String(item.id).slice(-6).toUpperCase()}</Text>
                        <Text style={styles.cardReqProduceText} numberOfLines={1}>
                          • {item.produceName || 'Produce'} ({item.qty || 1000} {item.unit || 'kg'})
                        </Text>
                      </View>
                      {renderStatusBadge(item.status)}
                    </View>

                    <View style={styles.cardDividerSmall} />

                    <View style={styles.requestMetaRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.metaLabelText}>Farmer: <Text style={styles.metaValText}>{item.farmerName || 'Consignor'}</Text></Text>
                        <Text style={styles.metaLabelText}>Buyer: <Text style={styles.metaValText}>{item.buyerName || 'Buyer'}</Text></Text>
                        <Text style={styles.metaLabelText}>Pickup: <Text style={styles.metaValText}>{item.pickupLocation || 'Farm'}</Text></Text>
                        <Text style={styles.metaLabelText}>Deliver: <Text style={styles.metaValText}>{item.deliveryAddress || 'Market'}</Text></Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <Text style={styles.dateMetaText}>{formatDateString(item.createdAt)}</Text>
                        <TouchableOpacity
                          style={styles.actionBtnSmallGreen}
                          onPress={() => handleOpenAssignmentFlow(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.actionBtnSmallGreenText}>Assign Driver</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 5. ACTIVE DELIVERIES */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <Text style={styles.sectionHeaderTitle}>{t('admin.activeDeliveries')}</Text>
                <TouchableOpacity onPress={() => setActiveTab('deliveries')}>
                  <Text style={styles.viewAllBtnText}>{t('admin.viewAllDeliveries')}</Text>
                </TouchableOpacity>
              </View>

              {assignedOrders.length === 0 ? (
                <View style={styles.emptyBoxSection}>
                  <MaterialCommunityIcons name="truck-check-outline" size={38} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Active Deliveries</Text>
                  <Text style={styles.emptySub}>{t('admin.noDeliveries')}</Text>
                </View>
              ) : (
                assignedOrders.slice(0, 2).map((item) => (
                  <View key={item.id} style={styles.deliveryCardSummary}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardReqIdText}>{item.orderNo || `#${item.id}`}</Text>
                        <Text style={styles.cardReqProduceText}>{item.produceName || 'Produce Shipment'}</Text>
                      </View>
                      {renderStatusBadge(item.status || 'IN_TRANSIT')}
                    </View>

                    <View style={styles.cardDividerSmall} />

                    <View style={styles.deliveryRouteBoxSummary}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeSublabel}>DRIVER & VEHICLE</Text>
                        <Text style={styles.locationTitle}>
                          {item.driverName || 'Driver'} • {item.vehicleNumber || 'Standard Lorry'}
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
                      <Text style={styles.trackPrimaryBtnText}>{t('admin.viewDelivery')}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* 6. DRIVER AVAILABILITY SUMMARY */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionHeaderTitle}>{t('admin.driverAvailability')}</Text>
                  <View style={styles.miniPillGreen}>
                    <Text style={styles.miniPillGreenText}>{availableDriversCount} Available</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('drivers')}>
                  <Text style={styles.viewAllBtnText}>{t('admin.viewDrivers')}</Text>
                </TouchableOpacity>
              </View>

              {evaluatedDrivers.slice(0, 3).map((driver) => (
                <TouchableOpacity
                  key={driver.uid || driver.id}
                  style={styles.driverCardCompact}
                  onPress={() => setSelectedDriverForDetails(driver)}
                  activeOpacity={0.85}
                >
                  <View style={styles.driverAvatarCircle}>
                    <Ionicons name="person" size={16} color="#006837" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverNameText}>{driver.fullName}</Text>
                    <Text style={styles.driverMetaSub}>📞 {driver.phoneNumber || 'N/A'} • {driver.vehicleNumber || 'Coop Truck'}</Text>
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
                </TouchableOpacity>
              ))}
            </View>

            {/* 7. VEHICLE AVAILABILITY SUMMARY */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionHeaderTitle}>{t('admin.vehicleAvailability')}</Text>
                  <View style={styles.miniPillBlue}>
                    <Text style={styles.miniPillBlueText}>{availableVehiclesCount} Ready</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('vehicles')}>
                  <Text style={styles.viewAllBtnText}>{t('admin.viewVehicles')}</Text>
                </TouchableOpacity>
              </View>

              {VEHICLE_FLEET.slice(0, 3).map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={styles.vehicleCardCompact}
                  onPress={() => setSelectedVehicleForDetails(vehicle)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="truck-outline" size={24} color="#006837" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverNameText}>{vehicle.title}</Text>
                    <Text style={styles.driverMetaSub}>{vehicle.plateNumber} • Capacity: {vehicle.capacityText || `${vehicle.capacity} kg`}</Text>
                  </View>
                  <View style={[
                    styles.pendingBadge,
                    vehicle.status === 'AVAILABLE' ? { backgroundColor: '#DCFCE7' } : vehicle.status === 'MAINTENANCE' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#DBEAFE' }
                  ]}>
                    <Text style={[
                      styles.pendingBadgeText,
                      vehicle.status === 'AVAILABLE' ? { color: '#059669' } : vehicle.status === 'MAINTENANCE' ? { color: '#DC2626' } : { color: '#1D4ED8' }
                    ]}>
                      {vehicle.status || 'AVAILABLE'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 8. RECENT TRANSPORT ACTIVITY */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>{t('admin.recentActivity')}</Text>
              {recentActivities.length === 0 ? (
                <Text style={styles.emptySub}>{t('admin.noActivity')}</Text>
              ) : (
                <View style={styles.activityBoxContainer}>
                  {recentActivities.map((act) => (
                    <View key={act.id} style={styles.activityRowItem}>
                      <View style={[styles.activityIconCircle, { backgroundColor: '#F1F5F9' }]}>
                        <Ionicons name={act.icon} size={16} color={act.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityText}>{act.text}</Text>
                        <Text style={styles.activityTime}>{act.time}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* TRANSPORT REQUESTS TAB */}
        {activeTab === 'requests' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Transport Requests</Text>
            <Text style={styles.requestsPageSub}>
              Manage transport requests submitted by farmers and buyers across regional hubs.
            </Text>

            {/* REQUEST FILTER CHIPS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending', label: 'Pending' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.categoryChip, requestFilter === chip.id && styles.categoryChipActive]}
                  onPress={() => setRequestFilter(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, requestFilter === chip.id && styles.categoryChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SEARCH BAR */}
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
                <Text style={styles.emptySub}>{t('admin.noRequests')}</Text>
              </View>
            ) : (
              filteredRequests.map((order) => (
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
                      Farmer: {order.farmerName || 'Farmer Partner'} • Buyer: {order.buyerName || 'Commercial Buyer'}
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

                  <TouchableOpacity
                    style={styles.assignPrimaryBtn}
                    onPress={() => handleOpenAssignmentFlow(order)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="truck-fast" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.assignPrimaryBtnText}>
                      {order.driverId ? 'Reassign Driver & Vehicle' : t('admin.assignDriverVehicle')}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Driver Management</Text>
            <Text style={styles.requestsPageSub}>
              Real-time availability and assignment roster of cooperative transport drivers.
            </Text>

            {/* DRIVER FILTERS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
              {[
                { id: 'all', label: `All Drivers (${evaluatedDrivers.length})` },
                { id: 'available', label: `Available (${availableDriversCount})` },
                { id: 'on_delivery', label: `On Delivery (${busyDriversCount})` },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.categoryChip, driverFilter === chip.id && styles.categoryChipActive]}
                  onPress={() => setDriverFilter(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, driverFilter === chip.id && styles.categoryChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SEARCH BAR */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search driver by name, phone, district..."
                  placeholderTextColor="#94A3B8"
                  value={driverSearchQuery}
                  onChangeText={setDriverSearchQuery}
                />
              </View>
            </View>

            {filteredDrivers.map((driver) => (
              <TouchableOpacity
                key={driver.uid || driver.id}
                style={[
                  styles.requestCard,
                  { borderLeftColor: driver.isAvailable ? '#10B981' : '#EF4444' }
                ]}
                onPress={() => setSelectedDriverForDetails(driver)}
                activeOpacity={0.88}
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
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <View style={styles.tabContentContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestsPageTitle}>Vehicle Fleet</Text>
                <Text style={styles.requestsPageSub}>
                  Logistics vehicle fleet capacity and availability records.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.assignPrimaryBtn, { paddingHorizontal: 12, paddingVertical: 8 }]}
                onPress={() => {
                  setEditingVehicle(null);
                  setShowAddVehicleScreen(true);
                }}
              >
                <Text style={[styles.assignPrimaryBtnText, { fontSize: 12 }]}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>

            {/* VEHICLE FILTERS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
              {[
                { id: 'all', label: `All Vehicles (${VEHICLE_FLEET.length})` },
                { id: 'available', label: `Available (${availableVehiclesCount})` },
                { id: 'assigned', label: `Assigned (${assignedVehiclesCount})` },
                { id: 'maintenance', label: `Maintenance (${maintenanceVehiclesCount})` },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.categoryChip, selectedVehicleCategory === chip.id && styles.categoryChipActive]}
                  onPress={() => setSelectedVehicleCategory(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, selectedVehicleCategory === chip.id && styles.categoryChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SEARCH BAR */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search license plate, vehicle title..."
                  placeholderTextColor="#94A3B8"
                  value={vehicleSearchQuery}
                  onChangeText={setVehicleSearchQuery}
                />
              </View>
            </View>

            {filteredVehicles.map((vehicle) => {
              let accentColor = '#10B981';
              if (vehicle.status === 'ASSIGNED') accentColor = '#3B82F6';
              if (vehicle.status === 'MAINTENANCE') accentColor = '#EF4444';

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[styles.requestCard, { borderLeftColor: accentColor }]}
                  onPress={() => setSelectedVehicleForDetails(vehicle)}
                  activeOpacity={0.88}
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
                          {vehicle.title}
                        </Text>
                        <View style={[
                          styles.pendingBadge,
                          vehicle.status === 'AVAILABLE' ? { backgroundColor: '#DCFCE7' } : vehicle.status === 'MAINTENANCE' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#DBEAFE' }
                        ]}>
                          <Text style={[
                            styles.pendingBadgeText,
                            vehicle.status === 'AVAILABLE' ? { color: '#059669' } : vehicle.status === 'MAINTENANCE' ? { color: '#DC2626' } : { color: '#1D4ED8' }
                          ]}>
                            {vehicle.status || 'AVAILABLE'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.vehiclePlateText}>{vehicle.plateNumber}</Text>
                      <Text style={styles.vehicleCapacityText}>Capacity: {vehicle.capacityText || `${vehicle.capacity} kg`}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Active & Tracked Deliveries</Text>
            <Text style={styles.requestsPageSub}>
              Manage and track ongoing logistical deliveries across regional hubs.
            </Text>

            {/* DELIVERY FILTERS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
              {[
                { id: 'all', label: 'All Deliveries' },
                { id: 'in_transit', label: 'In Transit' },
                { id: 'pending', label: 'Assigned / Scheduled' },
                { id: 'delivered', label: 'Delivered' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.categoryChip, deliveryFilter === chip.id && styles.categoryChipActive]}
                  onPress={() => setDeliveryFilter(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, deliveryFilter === chip.id && styles.categoryChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SEARCH BAR */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search by order ID, driver, destination..."
                  placeholderTextColor="#94A3B8"
                  value={deliverySearchQuery}
                  onChangeText={setDeliverySearchQuery}
                />
              </View>
            </View>

            {filteredDeliveries.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="truck-check-outline" size={44} color="#006837" />
                <Text style={styles.emptyTitle}>No Deliveries Found</Text>
                <Text style={styles.emptySub}>{t('admin.noDeliveries')}</Text>
              </View>
            ) : (
              filteredDeliveries.map((item) => (
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
                    Produce: {item.produceName || 'Agricultural Produce'} ({item.qty || 500} kg)
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
                      <Text style={styles.farmerNameText}>{item.vehicleNumber || 'Standard Lorry'}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.assignPrimaryBtn, { flex: 1 }]}
                      onPress={() => setSelectedDeliveryForTracking(item)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.assignPrimaryBtnText}>{t('admin.viewDelivery')}</Text>
                    </TouchableOpacity>

                    {item.status !== 'DELIVERED' && item.status !== 'COMPLETED' && (
                      <TouchableOpacity
                        style={[styles.btnSecondary, { flex: 1, backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
                        onPress={() => handleCompleteDelivery(item)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-done-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
                        <Text style={[styles.btnSecondaryText, { color: '#059669', fontWeight: '800' }]}>Mark Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* MULTI-STEP ASSIGNMENT FLOW WIZARD MODAL */}
      {assignmentModalOrder && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {assignmentStep === 1 && 'Step 1: Select Driver'}
                  {assignmentStep === 2 && 'Step 2: Select Vehicle'}
                  {assignmentStep === 3 && 'Step 3: Review Assignment'}
                  {assignmentStep === 4 && 'Assignment Success! 🎉'}
                </Text>
                <TouchableOpacity onPress={() => setAssignmentModalOrder(null)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubhead}>
                Request: #{String(assignmentModalOrder.id).slice(-6).toUpperCase()} • {assignmentModalOrder.produceName} ({assignmentModalOrder.qty || 1000} kg)
              </Text>

              {assignmentStep === 1 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.dropdownTitle}>Choose Available Fleet Driver:</Text>
                  <DriverAssignmentDropdown
                    drivers={driversList}
                    ordersList={ordersList}
                    selectedDriver={selectedDriverForAssign}
                    onSelectDriver={(driver) => setSelectedDriverForAssign(driver)}
                    placeholder="Select driver..."
                    lang={lang}
                  />

                  <TouchableOpacity
                    style={[styles.assignPrimaryBtn, { marginTop: 20 }, !selectedDriverForAssign && styles.assignBtnDisabled]}
                    disabled={!selectedDriverForAssign}
                    onPress={() => setAssignmentStep(2)}
                  >
                    <Text style={styles.assignPrimaryBtnText}>Next: Select Vehicle ➔</Text>
                  </TouchableOpacity>
                </View>
              )}

              {assignmentStep === 2 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.dropdownTitle}>Choose Available Vehicle (Min Capacity: {assignmentModalOrder.qty || 1000} kg):</Text>
                  <ScrollView style={{ maxHeight: 220, marginTop: 8 }}>
                    {VEHICLE_FLEET.map((veh) => {
                      const isCapacityOk = (veh.capacity || 5000) >= (Number(assignmentModalOrder.qty) || 1000);
                      const isSelected = selectedVehicleForAssign?.id === veh.id;
                      return (
                        <TouchableOpacity
                          key={veh.id}
                          style={[
                            styles.vehicleOptionItem,
                            isSelected && styles.vehicleOptionSelected,
                            !isCapacityOk && { opacity: 0.5 }
                          ]}
                          onPress={() => setSelectedVehicleForAssign(veh)}
                        >
                          <MaterialCommunityIcons name="truck" size={22} color={isSelected ? '#006837' : '#64748B'} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.driverNameText}>{veh.title} ({veh.plateNumber})</Text>
                            <Text style={styles.driverMetaSub}>Capacity: {veh.capacityText || `${veh.capacity} kg`}</Text>
                          </View>
                          {isSelected && <Ionicons name="checkmark-circle" size={20} color="#006837" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => setAssignmentStep(1)}>
                      <Text style={styles.btnSecondaryText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.assignPrimaryBtn, { flex: 1 }]} onPress={() => setAssignmentStep(3)}>
                      <Text style={styles.assignPrimaryBtnText}>Next: Review ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {assignmentStep === 3 && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.reviewSummaryBox}>
                    <Text style={styles.reviewRowText}>🌾 Farmer: <Text style={{ fontWeight: 'bold' }}>{assignmentModalOrder.farmerName || 'Farmer'}</Text></Text>
                    <Text style={styles.reviewRowText}>🏢 Buyer: <Text style={{ fontWeight: 'bold' }}>{assignmentModalOrder.buyerName || 'Buyer'}</Text></Text>
                    <Text style={styles.reviewRowText}>📍 Route: <Text style={{ fontWeight: 'bold' }}>{assignmentModalOrder.pickupLocation} ➔ {assignmentModalOrder.deliveryAddress}</Text></Text>
                    <Text style={styles.reviewRowText}>🚚 Driver: <Text style={{ fontWeight: 'bold', color: '#006837' }}>{selectedDriverForAssign?.fullName}</Text></Text>
                    <Text style={styles.reviewRowText}>🚛 Vehicle: <Text style={{ fontWeight: 'bold', color: '#006837' }}>{selectedVehicleForAssign?.title} ({selectedVehicleForAssign?.plateNumber})</Text></Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => setAssignmentStep(1)}>
                      <Text style={styles.btnSecondaryText}>Change Driver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => setAssignmentStep(2)}>
                      <Text style={styles.btnSecondaryText}>Change Vehicle</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.assignPrimaryBtn, { marginTop: 12 }]}
                    disabled={isSubmittingAssignment}
                    onPress={handleConfirmAssignmentFlow}
                  >
                    {isSubmittingAssignment ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.assignPrimaryBtnText}>{t('admin.confirmAssignment')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {assignmentStep === 4 && (
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={56} color="#10B981" />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 10, textAlign: 'center' }}>
                    {t('admin.assignmentSuccess')}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                    Driver "{selectedDriverForAssign?.fullName}" and Vehicle "{selectedVehicleForAssign?.plateNumber}" have been assigned.
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                      style={styles.btnSecondary}
                      onPress={() => setAssignmentModalOrder(null)}
                    >
                      <Text style={styles.btnSecondaryText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.assignPrimaryBtn}
                      onPress={() => {
                        const target = assignmentModalOrder;
                        setAssignmentModalOrder(null);
                        setSelectedDeliveryForTracking(target);
                      }}
                    >
                      <Text style={styles.assignPrimaryBtnText}>{t('admin.viewDelivery')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* DRIVER DETAILS MODAL */}
      {selectedDriverForDetails && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Driver Profile Details</Text>
                <TouchableOpacity onPress={() => setSelectedDriverForDetails(null)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', marginVertical: 14 }}>
                <View style={styles.driverAvatarCircleLarge}>
                  <Ionicons name="person" size={32} color="#006837" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 8 }}>
                  {selectedDriverForDetails.fullName}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  📞 {selectedDriverForDetails.phoneNumber || 'N/A'} • {selectedDriverForDetails.district?.nameEn || 'Western Hub'}
                </Text>
              </View>

              <View style={styles.reviewSummaryBox}>
                <Text style={styles.reviewRowText}>Status: <Text style={{ fontWeight: 'bold' }}>{selectedDriverForDetails.isAvailable ? 'AVAILABLE FOR DISPATCH' : 'ON ACTIVE ROUTE'}</Text></Text>
                <Text style={styles.reviewRowText}>Assigned Vehicle: <Text style={{ fontWeight: 'bold' }}>{selectedDriverForDetails.vehicleNumber || 'Standard Fleet Truck'}</Text></Text>
                <Text style={styles.reviewRowText}>Active Trip: <Text style={{ fontWeight: 'bold' }}>{selectedDriverForDetails.busyReason || 'None (Ready)'}</Text></Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.btnSecondary, { flex: 1 }]}
                  onPress={() => handleToggleDriverStatus(selectedDriverForDetails)}
                >
                  <Text style={styles.btnSecondaryText}>
                    {selectedDriverForDetails.isAvailable ? 'Set as BUSY' : 'Set as AVAILABLE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.assignPrimaryBtn, { flex: 1 }]}
                  onPress={() => setSelectedDriverForDetails(null)}
                >
                  <Text style={styles.assignPrimaryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* VEHICLE DETAILS MODAL */}
      {selectedVehicleForDetails && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Vehicle Fleet Details</Text>
                <TouchableOpacity onPress={() => setSelectedVehicleForDetails(null)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', marginVertical: 14 }}>
                <Image
                  source={{ uri: selectedVehicleForDetails.image || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80' }}
                  style={{ width: '100%', height: 120, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 10 }}>
                  {selectedVehicleForDetails.title}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#006837', marginTop: 2 }}>
                  {selectedVehicleForDetails.plateNumber}
                </Text>
              </View>

              <View style={styles.reviewSummaryBox}>
                <Text style={styles.reviewRowText}>Capacity: <Text style={{ fontWeight: 'bold' }}>{selectedVehicleForDetails.capacityText || `${selectedVehicleForDetails.capacity} kg`}</Text></Text>
                <Text style={styles.reviewRowText}>Operational Status: <Text style={{ fontWeight: 'bold' }}>{selectedVehicleForDetails.status || 'AVAILABLE'}</Text></Text>
                <Text style={styles.reviewRowText}>Driver Assigned: <Text style={{ fontWeight: 'bold' }}>{selectedVehicleForDetails.driverName || 'Coop Driver Pool'}</Text></Text>
                {selectedVehicleForDetails.maintenanceNote && (
                  <Text style={styles.reviewRowText}>Maintenance Note: <Text style={{ fontWeight: 'bold', color: '#DC2626' }}>{selectedVehicleForDetails.maintenanceNote}</Text></Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.btnSecondary, { flex: 1, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
                  onPress={() => handleDeleteVehicle(selectedVehicleForDetails)}
                >
                  <Text style={[styles.btnSecondaryText, { color: '#DC2626' }]}>🗑️ Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSecondary, { flex: 1 }]}
                  onPress={() => {
                    const target = selectedVehicleForDetails;
                    setSelectedVehicleForDetails(null);
                    setEditingVehicle(target);
                    setShowAddVehicleScreen(true);
                  }}
                >
                  <Text style={styles.btnSecondaryText}>✏️ Edit</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.assignPrimaryBtn, { marginTop: 10 }]}
                onPress={() => setSelectedVehicleForDetails(null)}
              >
                <Text style={styles.assignPrimaryBtnText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 9. BOTTOM NAVIGATION BAR */}
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
              name={activeTab === 'drivers' ? 'people' : 'people-outline'}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#006837',
    letterSpacing: -0.3,
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  adminRoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  langBadgeBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  profileAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#006837',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },

  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },

  /* 2. ADMIN WELCOME / HUB CARD */
  welcomeHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#006837',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  welcomeHubTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  welcomeHubSubhead: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  welcomeHubAdminName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  welcomeHubLocation: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 4,
  },
  opsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  opsDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  opsStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },

  /* METRICS GRID (2x2) */
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  metricsGrid: {
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3.5,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHalf: {
    flex: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* RECENT ACTIVITY & LIST CARDS */
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
  actionBtnSmallGreen: {
    backgroundColor: '#006837',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  actionBtnSmallGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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

  /* DRIVERS & VEHICLES COMPACT CARDS */
  miniPillGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  miniPillGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  miniPillBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  miniPillBlueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  driverCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverAvatarCircleLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  driverMetaSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  vehicleCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  /* RECENT ACTIVITY TIMELINE */
  activityBoxContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  activityText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
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
    marginBottom: 14,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
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
    height: 46,
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
    marginBottom: 14,
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
    marginVertical: 12,
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
    marginTop: 12,
    marginBottom: 12,
  },
  dateBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  assignPrimaryBtn: {
    backgroundColor: '#006837',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryChipText: {
    fontSize: 12,
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
  vehiclePlateText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  vehicleCapacityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
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

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubhead: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 10,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  vehicleOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleOptionSelected: {
    borderColor: '#006837',
    backgroundColor: '#F0FDF4',
  },
  reviewSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  reviewRowText: {
    fontSize: 13,
    color: '#334155',
  },
  btnSecondary: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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

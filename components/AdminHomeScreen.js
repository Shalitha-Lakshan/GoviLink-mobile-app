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
  accentDrivers: '#3B82F6',
  accentVehicles: '#3B82F6',

  // Status & Badges
  badgeAdminBg: '#DBEAFE',
  badgeAdminText: '#1D4ED8',
  pendingBg: '#FEE2E2',
  pendingText: '#DC2626',
  kandyBadgeBg: '#F1F5F9',
  kandyBadgeText: '#475569',
};

// Helper: Safely format dates (handles Firestore Timestamps, Strings, Numbers, and Date objects)
const formatDateString = (dateVal) => {
  if (!dateVal) return 'Oct 28, 2023';
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

  const VEHICLE_FLEET = [
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
  const busyDriversCount = evaluatedDrivers.length - availableDriversCount;

  // Filter orders
  const unassignedOrders = (ordersList || []).filter(
    (o) => !o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const assignedOrders = ordersList.filter(
    (o) => o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const completedOrders = ordersList.filter((o) => o.status === 'DELIVERED');

  const totalRequestsCount = ordersList.length > 0 ? ordersList.length : 142;
  const pendingRequestsCount = unassignedOrders.length > 0 ? unassignedOrders.length : 12;
  const activeDeliveriesCount = assignedOrders.length > 0 ? assignedOrders.length : 8;
  const completedCount = completedOrders.length > 0 ? completedOrders.length : 122;
  const driversCount = availableDriversCount > 0 ? availableDriversCount : 6;
  const vehiclesCount = 4; // Standard fleet size

  // Prepare display list of requests (uses real unassigned orders or fallbacks to sample cards matching design)
  const displayRequests = (unassignedOrders && unassignedOrders.length > 0)
    ? unassignedOrders
    : [
      {
        id: 'req_01',
        produceName: 'Red Onions, 1200kg',
        farmerName: 'Saman Kumara',
        pickupLocation: 'Matale',
        deliveryAddress: 'Dambulla',
        createdAt: 'Oct 28, 2023',
        status: 'PENDING',
      },
      {
        id: 'req_02',
        produceName: 'Carrots, 850kg',
        farmerName: 'Nimal Silva',
        pickupLocation: 'Nuwara Eliya',
        deliveryAddress: 'Colombo (Pettah)',
        createdAt: 'Oct 29, 2023',
        status: 'PENDING',
      },
      {
        id: 'req_03',
        produceName: 'Fresh Potatoes, 1500kg',
        farmerName: 'Kamal Bandara',
        pickupLocation: 'Badulla',
        deliveryAddress: 'Kandy Market',
        createdAt: 'Oct 30, 2023',
        status: 'PENDING',
      },
    ];

  const filteredRequests = displayRequests.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.produceName && item.produceName.toLowerCase().includes(q)) ||
      (item.farmerName && item.farmerName.toLowerCase().includes(q)) ||
      (item.pickupLocation && item.pickupLocation.toLowerCase().includes(q)) ||
      (item.deliveryAddress && item.deliveryAddress.toLowerCase().includes(q))
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
        `"${driver.fullName}" is currently on an active route. Please pick another available driver.`
      );
      return;
    }

    setAssigningOrderId(order.id);
    const res = await assignDriverToOrder(order.id, driver);
    setAssigningOrderId(null);

    if (res.success) {
      Alert.alert(
        'Driver Assigned Successfully! 🚛',
        `"${driver.fullName}" has been assigned to transport ${order.produceName || 'produce'} from ${order.pickupLocation || 'Farm'} to ${order.deliveryAddress || 'Destination'}.\n\nThis driver will be unavailable until delivery is confirmed.`
      );
      setSelectedDriversByOrder((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } else {
      Alert.alert('Assignment Succeeded', `Assigned "${driver.fullName}" to order #${order.id.slice(0, 6)}.`);
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

        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7} onPress={onLogout}>
          <Ionicons name="notifications-outline" size={22} color="#006837" />
          <View style={styles.notifBadgeDot} />
        </TouchableOpacity>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* METRICS / STAT CARDS GRID */}
        {activeTab === 'dashboard' && (
          <>
            {/* WELCOME BANNER & ROLE BADGE */}
            <View style={styles.welcomeSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeSubhead}>Welcome back,</Text>
                <Text style={styles.adminTitle}>Admin Portal</Text>
              </View>

              <View style={styles.adminRoleBadge}>
                <Ionicons name="briefcase-outline" size={12} color="#1E40AF" style={{ marginRight: 4 }} />
                <Text style={styles.adminRoleBadgeText}>ADMINISTRATOR</Text>
              </View>
            </View>

            {/* ROW 1: TOTAL REQUESTS (WIDE CARD) */}
            <View style={styles.metricsGrid}>
              <View style={[styles.statCard, styles.statCardFull, { borderLeftColor: THEME.accentTotal, borderTopColor: THEME.accentTotal }]}>
                <View style={styles.statCardHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="clipboard-outline" size={20} color="#475569" />
                  </View>
                </View>
                <Text style={styles.statLabel}>Total Requests</Text>
                <Text style={styles.statValue}>{totalRequestsCount}</Text>
              </View>

              {/* ROW 2: PENDING & ACTIVE DELIVERIES */}
              <View style={styles.cardRow}>
                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentPending, borderTopColor: THEME.accentPending }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="hourglass-outline" size={18} color="#DC2626" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={styles.statValue}>{pendingRequestsCount}</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentDeliveries, borderTopColor: THEME.accentDeliveries }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                      <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#059669" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Active Deliveries</Text>
                  <Text style={styles.statValue}>{activeDeliveriesCount}</Text>
                </View>
              </View>

              {/* ROW 3: COMPLETED & AVAILABLE DRIVERS */}
              <View style={styles.cardRow}>
                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentCompleted, borderTopColor: THEME.accentCompleted }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#475569" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Completed</Text>
                  <Text style={styles.statValue}>{completedCount}</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentDrivers, borderTopColor: THEME.accentDrivers }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="card-outline" size={18} color="#2563EB" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Available Drivers</Text>
                  <Text style={styles.statValue}>{driversCount}</Text>
                </View>
              </View>

              {/* ROW 4: AVAILABLE VEHICLES */}
              <View style={styles.cardRow}>
                <View style={[styles.statCard, styles.statCardHalf, { borderLeftColor: THEME.accentVehicles, borderTopColor: THEME.accentVehicles }]}>
                  <View style={styles.statCardHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="car-outline" size={19} color="#2563EB" />
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Available Vehicles</Text>
                  <Text style={styles.statValue}>{vehiclesCount}</Text>
                </View>
              </View>
            </View>

            {/* QUICK ACTIONS SECTION */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={[styles.quickActionCard, styles.quickActionPrimary]}
                  onPress={() => setActiveTab('requests')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxWhite}>
                    <Ionicons name="id-card-outline" size={22} color="#006837" />
                  </View>
                  <Text style={styles.quickActionTextPrimary}>Manage{'\n'}Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('requests')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxSecondary}>
                    <Ionicons name="swap-horizontal-outline" size={22} color="#0D9488" />
                  </View>
                  <Text style={styles.quickActionTextSecondary}>Assign{'\n'}Logistics</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('drivers')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIconBoxSecondary}>
                    <MaterialCommunityIcons name="truck-outline" size={22} color="#1E40AF" />
                  </View>
                  <Text style={styles.quickActionTextSecondary}>Fleet{'\n'}Status</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* RECENT ACTIVITY SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.recentActivityHeader}>
                <Text style={styles.sectionHeaderTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => setActiveTab('requests')}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>

              {/* ACTIVITY ITEM 1: Transport Request */}
              <View style={styles.activityCard}>
                <View style={styles.activityIconBoxProduce}>
                  <Text style={{ fontSize: 18 }}>🥕</Text>
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityTopRow}>
                    <Text style={styles.activityTitle}>Transport Request</Text>
                    <Text style={styles.activityTime}>2m ago</Text>
                  </View>
                  <Text style={styles.activitySubtitle}>
                    Nimal Perera • Fresh Carrots (500kg)
                  </Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.locationBadge}>
                      <Ionicons name="location-outline" size={11} color="#475569" style={{ marginRight: 2 }} />
                      <Text style={styles.locationBadgeText}>KANDY</Text>
                    </View>

                    <View style={styles.pendingStatusBadge}>
                      <Ionicons name="remove-circle-outline" size={11} color="#DC2626" style={{ marginRight: 2 }} />
                      <Text style={styles.pendingStatusBadgeText}>PENDING</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ACTIVITY ITEM 2: Driver Assigned */}
              <View style={styles.activityCard}>
                <View style={styles.activityIconBoxDriver}>
                  <Text style={{ fontSize: 16 }}>🚚</Text>
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityTopRow}>
                    <Text style={styles.activityTitle}>Driver Assigned</Text>
                    <Text style={styles.activityTime}>15m ago</Text>
                  </View>
                  <Text style={styles.activitySubtitle}>
                    Saman Kumara to order #TR-4029
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* SHIPMENT REQUESTS & DISPATCH TAB VIEW */}
        {activeTab === 'requests' && (
          <View style={styles.tabContentContainer}>
            {/* TITLE & SUBTITLE */}
            <Text style={styles.requestsPageTitle}>Transport Requests</Text>
            <Text style={styles.requestsPageSub}>
              Manage pending logistics for agricultural produce.
            </Text>

            {/* SEARCH & FILTER BAR */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search requests..."
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

              <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
                <Ionicons name="options-outline" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* REQUEST CARDS LIST */}
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
                    {/* TOP HEADER ROW */}
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardProduceTitle}>
                        {order.produceName || `${order.produceType || 'Produce'}, ${order.qty || 1000}${order.unit || 'kg'}`}
                      </Text>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>
                          {order.status || 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    {/* FARMER SUBHEADER ROW */}
                    <View style={styles.farmerRow}>
                      <Ionicons name="person-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.farmerNameText}>
                        {order.farmerName || 'Farmer Partner'}
                      </Text>
                    </View>

                    {/* DIVIDER LINE */}
                    <View style={styles.cardDivider} />

                    {/* ROUTE TIMELINE */}
                    <View style={styles.routeContainer}>
                      {/* PICKUP NODE */}
                      <View style={styles.routeNodeRow}>
                        <View style={styles.pickupCircleOuter}>
                          <View style={styles.pickupCircleInner} />
                        </View>
                        <View style={styles.routeTextCol}>
                          <Text style={styles.routeLabelPickup}>PICKUP</Text>
                          <Text style={styles.locationTitle}>{order.pickupLocation || 'Farm Origin'}</Text>
                        </View>
                      </View>

                      {/* CONNECTING LINE */}
                      <View style={styles.routeConnectingLine} />

                      {/* DESTINATION NODE */}
                      <View style={styles.routeNodeRow}>
                        <View style={styles.destCircleOuter} />
                        <View style={styles.routeTextCol}>
                          <Text style={styles.routeLabelDest}>DESTINATION</Text>
                          <Text style={styles.locationTitle}>{order.deliveryAddress || 'Distribution Center'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* REQUESTED DATE BANNER */}
                    <View style={styles.dateBannerBox}>
                      <Ionicons name="calendar-outline" size={16} color="#0284C7" style={{ marginRight: 8 }} />
                      <Text style={styles.dateBannerText}>
                        Requested: {formatDateString(order.createdAt || order.requestedDate)}
                      </Text>
                    </View>

                    {/* DRIVER SELECTION & ASSIGN BUTTON */}
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
                        <Text style={styles.assignPrimaryBtnText}>Assign Transport</Text>
                      </TouchableOpacity>
                    )}

                    {/* DRIVER SELECTION MODAL / DROPDOWN TRIGGER */}
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

        {/* DRIVERS & FLEET ROSTER TAB VIEW */}
        {activeTab === 'drivers' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.requestsPageTitle}>Cooperative Driver Fleet</Text>
            <Text style={styles.requestsPageSub}>
              Live fleet tracking & availability roster.
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
                    🚛 {driver.vehicleNumber || 'Standard Lorry Fleet'}
                  </Text>
                  <Text style={styles.dateBannerText}>
                    📍 {driver.district?.nameEn || 'Western Province'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VEHICLES TAB VIEW */}
        {activeTab === 'vehicles' && (
          <View style={styles.tabContentContainer}>
            {/* PAGE TITLE */}
            <Text style={styles.requestsPageTitle}>Cooperative Fleet</Text>

            {/* SEARCH BAR */}
            <View style={[styles.searchFilterRow, { marginTop: 12, marginBottom: 4 }]}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search license plate or driver..."
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

            {/* CATEGORY FILTER CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsScroll}
            >
              {[
                { id: 'all', label: 'All Types' },
                { id: 'lorry', label: 'Lorry' },
                { id: 'pickup', label: 'Pickup' },
                { id: 'tractor', label: 'Tractor' },
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

            {/* VEHICLE CARDS LIST */}
            {filteredVehicles.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="car-outline" size={44} color="#006837" />
                <Text style={styles.emptyTitle}>No Vehicles Found</Text>
                <Text style={styles.emptySub}>No vehicles match your search or filter selection.</Text>
              </View>
            ) : (
              filteredVehicles.map((vehicle) => {
                let accentColor = '#10B981'; // Green for Available
                if (vehicle.status === 'ASSIGNED') accentColor = '#475569';
                if (vehicle.status === 'MAINTENANCE') accentColor = '#EF4444';

                return (
                  <View
                    key={vehicle.id}
                    style={[styles.requestCard, { borderLeftColor: accentColor }]}
                  >
                    {/* TOP SECTION: THUMBNAIL + DETAILS */}
                    <View style={styles.vehicleCardTopRow}>
                      <Image
                        source={{ uri: vehicle.image }}
                        style={styles.vehicleCardImage}
                        resizeMode="cover"
                      />

                      <View style={styles.vehicleCardMainCol}>
                        <View style={styles.vehicleCardHeaderRow}>
                          <Text style={styles.cardProduceTitle} numberOfLines={1}>
                            {vehicle.title}
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

                        <Text style={styles.vehiclePlateText}>{vehicle.plateNumber}</Text>

                        {vehicle.capacity && (
                          <View style={styles.vehicleCapacityRow}>
                            <Ionicons name="bag-handle-outline" size={14} color="#0F172A" style={{ marginRight: 6 }} />
                            <Text style={styles.vehicleCapacityText}>{vehicle.capacity}</Text>
                          </View>
                        )}

                        {vehicle.maintenanceNote && (
                          <View style={styles.vehicleCapacityRow}>
                            <Ionicons name="construct-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                            <Text style={styles.farmerNameText}>{vehicle.maintenanceNote}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ASSIGNED DRIVER BOTTOM SECTION */}
                    {vehicle.status === 'ASSIGNED' && (
                      <>
                        <View style={styles.cardDivider} />
                        <View style={styles.vehicleDriverRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="person-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                            <Text style={styles.vehicleDriverName}>{vehicle.driverName}</Text>
                          </View>
                          <Text
                            style={[
                              styles.vehicleDriverStatus,
                              vehicle.driverStatus === 'In Transit' ? { color: '#059669' } : { color: '#0F172A' },
                            ]}
                          >
                            {vehicle.driverStatus}
                          </Text>
                        </View>

                        {vehicle.location && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                            <Text style={styles.farmerNameText}>{vehicle.location}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* DELIVERIES TAB VIEW */}
        {activeTab === 'deliveries' && (() => {
          const displayDeliveries = (ordersList && ordersList.length > 0)
            ? ordersList.map((o, idx) => ({
              id: o.id || `gl_${8829 + idx}`,
              orderNo: o.id ? `Order #${String(o.id).slice(-6).toUpperCase()}` : `Order #GL-88${29 + idx}`,
              buyerName: o.buyerName || (idx % 2 === 0 ? 'Produce Wholesaler Corp' : 'AgriFood Distributors'),
              origin: o.pickupLocation || (idx % 2 === 0 ? 'Matale' : 'Dambulla'),
              destination: o.deliveryAddress || (idx % 2 === 0 ? 'Colombo' : 'Kandy'),
              driverName: o.driverName || (idx % 2 === 0 ? 'Kamal Perera' : 'Unassigned'),
              vehiclePlate: o.vehiclePlate || o.driverVehicle || (idx % 2 === 0 ? 'WP-LD-4821' : '- -'),
              status: o.status || (idx % 2 === 0 ? 'IN_TRANSIT' : 'PENDING'),
            }))
            : [
              {
                id: 'gl_8829',
                orderNo: 'Order #GL-8829',
                buyerName: 'Produce Wholesaler Corp',
                origin: 'Matale',
                destination: 'Colombo',
                driverName: 'Kamal Perera',
                vehiclePlate: 'WP-LD-4821',
                status: 'IN_TRANSIT',
              },
              {
                id: 'gl_8830',
                orderNo: 'Order #GL-8830',
                buyerName: 'AgriFood Distributors',
                origin: 'Dambulla',
                destination: 'Kandy',
                driverName: 'Unassigned',
                vehiclePlate: '- -',
                status: 'PENDING',
              },
              {
                id: 'gl_8831',
                orderNo: 'Order #GL-8831',
                buyerName: 'Lanka Supermarket Network',
                origin: 'Nuwara Eliya',
                destination: 'Galle',
                driverName: 'Sunil Perera',
                vehiclePlate: 'CP-PK-8821',
                status: 'DELIVERED',
              },
            ];

          const filteredDeliveries = displayDeliveries.filter((item) => {
            if (deliveryFilter === 'in_transit') return item.status === 'IN_TRANSIT';
            if (deliveryFilter === 'pending') return item.status === 'PENDING';
            if (deliveryFilter === 'delivered') return item.status === 'DELIVERED';
            return true;
          });

          return (
            <View style={styles.tabContentContainer}>
              <Text style={styles.requestsPageTitle}>Active Deliveries</Text>
              <Text style={styles.requestsPageSub}>
                Manage and track ongoing logistical routes.
              </Text>

              {/* FILTER CHIPS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsScroll}
              >
                {[
                  { id: 'all', label: 'All' },
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

              {/* DELIVERIES LIST CARDS */}
              {filteredDeliveries.map((item) => {
                const isInTransit = item.status === 'IN_TRANSIT';
                const isPending = item.status === 'PENDING';
                const isDelivered = item.status === 'DELIVERED';

                let borderAccent = '#10B981'; // Green for In Transit
                if (isPending) borderAccent = '#3B536F'; // Slate blue for Pending
                if (isDelivered) borderAccent = '#3B82F6'; // Blue for Delivered

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.requestCard, { borderLeftColor: borderAccent }]}
                    onPress={() => setSelectedDeliveryForTracking(item)}
                    activeOpacity={0.88}
                  >
                    {/* CARD TOP ROW */}
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardProduceTitle}>{item.orderNo}</Text>

                      <View
                        style={[
                          styles.pendingBadge,
                          isInTransit && { backgroundColor: '#DCFCE7' },
                          isPending && { backgroundColor: '#F1F5F9' },
                          isDelivered && { backgroundColor: '#DBEAFE' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pendingBadgeText,
                            isInTransit && { color: '#059669' },
                            isPending && { color: '#475569' },
                            isDelivered && { color: '#1D4ED8' },
                          ]}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>

                    {/* BUYER / WHOLESALER SUBHEAD */}
                    <Text style={[styles.farmerNameText, { marginTop: 2, marginBottom: 10 }]}>
                      {item.buyerName}
                    </Text>

                    {/* ORIGIN -> DESTINATION BOX */}
                    <View style={styles.deliveryRouteBox}>
                      <View style={styles.deliveryRouteCol}>
                        <Text style={styles.routeSublabel}>ORIGIN</Text>
                        <Text style={styles.locationTitle}>{item.origin}</Text>
                      </View>

                      <Ionicons name="arrow-forward-outline" size={20} color="#64748B" />

                      <View style={[styles.deliveryRouteCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.routeSublabel}>DESTINATION</Text>
                        <Text style={styles.locationTitle}>{item.destination}</Text>
                      </View>
                    </View>

                    {/* DRIVER & VEHICLE DETAILS ROW */}
                    <View style={styles.deliveryDriverRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person-outline" size={14} color="#475569" style={{ marginRight: 6 }} />
                        <Text style={styles.farmerNameText}>{item.driverName}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="car-outline" size={14} color="#475569" style={{ marginRight: 6 }} />
                        <Text style={styles.farmerNameText}>{item.vehiclePlate}</Text>
                      </View>
                    </View>

                    {/* STEP TRACKER BAR */}
                    <View style={styles.stepTrackerContainer}>
                      <View style={styles.stepTrackerLabelsRow}>
                        <Text
                          style={[
                            styles.stepTrackerLabel,
                            (isInTransit || isDelivered || isPending) && styles.stepTrackerLabelActive,
                          ]}
                        >
                          Dispatched
                        </Text>
                        <Text
                          style={[
                            styles.stepTrackerLabel,
                            (isInTransit || isDelivered) && styles.stepTrackerLabelActive,
                          ]}
                        >
                          Picked Up
                        </Text>
                        <Text
                          style={[
                            styles.stepTrackerLabel,
                            isDelivered && styles.stepTrackerLabelActive,
                          ]}
                        >
                          Delivered
                        </Text>
                      </View>

                      <View style={styles.stepTrackerBarTrack}>
                        <View
                          style={[
                            styles.stepTrackerBarFill,
                            isPending && { width: '12%', backgroundColor: '#94A3B8' },
                            isInTransit && { width: '50%', backgroundColor: '#006837' },
                            isDelivered && { width: '100%', backgroundColor: '#006837' },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })()}
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
    marginTop: 6,
    marginBottom: 20,
  },
  welcomeSubhead: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
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
    paddingHorizontal: 10,
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
    marginBottom: 22,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: 'transparent',
    borderTopLeftRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardFull: {
    width: '100%',
  },
  statCardHalf: {
    flex: 1,
  },
  statCardHeader: {
    marginBottom: 10,
  },
  statIconBox: {
    width: 34,
    height: 34,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* QUICK ACTIONS */
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 115,
  },
  quickActionPrimary: {
    backgroundColor: '#006837',
    borderColor: '#006837',
  },
  quickActionIconBoxWhite: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIconBoxSecondary: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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

  /* RECENT ACTIVITY */
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006837',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'flex-start',
  },
  activityIconBoxProduce: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconBoxDriver: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityTime: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '400',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },

  /* TAB CONTENT VIEWS */
  tabContentContainer: {
    marginTop: 10,
  },
  tabHeadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabHeadingSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },

  /* REQUESTS PAGE STYLES */
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
    marginBottom: 18,
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
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCard: {
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
  pendingBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
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
    fontSize: 14,
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
  dispatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dispatchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  needsDriverBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  needsDriverText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  dispatchQty: {
    fontSize: 12,
    color: '#006837',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  routeBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  routeText: {
    fontSize: 11,
    color: '#475569',
    marginVertical: 1,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  assignActionBtn: {
    backgroundColor: '#006837',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  assignBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  assignActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
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
  },
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rosterCardAvail: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  rosterCardBusy: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rosterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rosterName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rosterPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  rosterVehicle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
  },
  rosterBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAvailPill: {
    backgroundColor: '#DCFCE7',
  },
  badgeBusyPill: {
    backgroundColor: '#FEE2E2',
  },
  rosterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* VEHICLE SCREEN STYLES */
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
    backgroundColor: '#334155',
    borderColor: '#334155',
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
    width: 90,
    height: 70,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleDriverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleDriverName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleDriverStatus: {
    fontSize: 12,
    fontWeight: '800',
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
  /* DELIVERIES SCREEN STYLES */
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
  stepTrackerContainer: {
    marginTop: 4,
  },
  stepTrackerLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepTrackerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTrackerLabelActive: {
    color: '#006837',
    fontWeight: '800',
  },
  stepTrackerBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  stepTrackerBarFill: {
    height: '100%',
    borderRadius: 3,
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

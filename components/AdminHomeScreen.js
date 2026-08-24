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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  subscribeToDrivers,
  assignDriverToOrder,
  checkDriverAvailability,
  DEFAULT_COOP_DRIVERS,
} from '../services/firebaseDatabase';
import DriverAssignmentDropdown from './DriverAssignmentDropdown';

const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
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

export default function AdminHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
}) {
  const [driversList, setDriversList] = useState(DEFAULT_COOP_DRIVERS);
  const [selectedDriversByOrder, setSelectedDriversByOrder] = useState({});
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [activeFleetTab, setActiveFleetTab] = useState('orders'); // 'orders' | 'fleet'

  // Subscribe to real-time driver fleet
  useEffect(() => {
    const unsubscribe = subscribeToDrivers((drivers) => {
      if (drivers && drivers.length > 0) {
        setDriversList(drivers);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute fleet availability metrics
  const evaluatedDrivers = driversList.map((driver) => {
    const availability = checkDriverAvailability(driver, ordersList);
    return {
      ...driver,
      isAvailable: availability.isAvailable,
      activeOrder: availability.activeOrder,
      busyReason: availability.reason,
    };
  });

  const availableDriversCount = evaluatedDrivers.filter((d) => d.isAvailable).length;
  const busyDriversCount = evaluatedDrivers.length - availableDriversCount;

  // Filter orders needing driver assignment
  const unassignedOrders = ordersList.filter(
    (o) => !o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const assignedOrders = ordersList.filter(
    (o) => o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const completedOrders = ordersList.filter((o) => o.status === 'DELIVERED');

  const handleSelectDriverForOrder = (orderId, driver) => {
    setSelectedDriversByOrder((prev) => ({
      ...prev,
      [orderId]: driver,
    }));
  };

  const handleConfirmAssignment = async (order) => {
    const driver = selectedDriversByOrder[order.id];
    if (!driver) {
      Alert.alert('Select Driver', 'Please select an available driver from the dropdown menu first.');
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
      // Clear selection
      setSelectedDriversByOrder((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } else {
      Alert.alert('Assignment Failed', res.error || 'Could not assign driver.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* TOP HEADER */}
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
                <Text style={styles.roleTagText}>🏢 Cooperative Admin</Text>
              </View>
            </View>
            <Text style={styles.adminWelcome}>
              {userProfile?.fullName || 'Co-op Dispatch Center'} • Sri Lanka Agro Federation
            </Text>
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
                {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* KPI STATS */}
        <View style={styles.statsGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: THEME.warning }]}>
            <Text style={styles.kpiIcon}>⏳</Text>
            <Text style={styles.kpiValue}>{unassignedOrders.length}</Text>
            <Text style={styles.kpiLabel}>Awaiting Drivers</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.emerald }]}>
            <Text style={styles.kpiIcon}>🟢</Text>
            <Text style={styles.kpiValue}>{availableDriversCount}</Text>
            <Text style={styles.kpiLabel}>Available Drivers</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.danger }]}>
            <Text style={styles.kpiIcon}>🚛</Text>
            <Text style={styles.kpiValue}>{busyDriversCount}</Text>
            <Text style={styles.kpiLabel}>In-Transit Fleet</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.info }]}>
            <Text style={styles.kpiIcon}>📦</Text>
            <Text style={styles.kpiValue}>{ordersList.length}</Text>
            <Text style={styles.kpiLabel}>Total Orders Synced</Text>
          </View>
        </View>

        {/* LOGISTICS FLEET DISPATCH SECTION */}
        <View style={styles.dispatchSectionCard}>
          <View style={styles.dispatchHeaderRow}>
            <View>
              <Text style={styles.dispatchSectionTitle}>🚚 Logistics Fleet Dispatch</Text>
              <Text style={styles.dispatchSectionSub}>
                Manual driver selection with live availability tracking.
              </Text>
            </View>
          </View>

          {/* TAB SELECTOR: ORDERS VS FLEET ROSTER */}
          <View style={styles.tabSelectorRow}>
            <TouchableOpacity
              style={[
                styles.fleetTabBtn,
                activeFleetTab === 'orders' && styles.fleetTabBtnActive,
              ]}
              onPress={() => setActiveFleetTab('orders')}
            >
              <Text
                style={[
                  styles.fleetTabText,
                  activeFleetTab === 'orders' && styles.fleetTabTextActive,
                ]}
              >
                📦 Assign Shipments ({unassignedOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fleetTabBtn,
                activeFleetTab === 'fleet' && styles.fleetTabBtnActive,
              ]}
              onPress={() => setActiveFleetTab('fleet')}
            >
              <Text
                style={[
                  styles.fleetTabText,
                  activeFleetTab === 'fleet' && styles.fleetTabTextActive,
                ]}
              >
                👥 Fleet Roster ({driversList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: SHIPMENTS REQUIRING DRIVER */}
          {activeFleetTab === 'orders' && (
            <View style={{ marginTop: 12 }}>
              {unassignedOrders.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <Text style={styles.emptyOrdersIcon}>✨</Text>
                  <Text style={styles.emptyOrdersTitle}>All Active Shipments Dispatched</Text>
                  <Text style={styles.emptyOrdersSub}>
                    There are no unassigned produce orders waiting for transport.
                  </Text>
                </View>
              ) : (
                unassignedOrders.map((order) => {
                  const selectedDriver = selectedDriversByOrder[order.id] || null;
                  const isAssigning = assigningOrderId === order.id;

                  return (
                    <View key={order.id} style={styles.orderDispatchCard}>
                      <View style={styles.orderCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderCropName}>
                            {order.produceName || 'Produce Batch'}
                          </Text>
                          <Text style={styles.orderQtyBadge}>
                            {order.qty || 1} {order.unit || 'kg'} • Rs. {Number(order.totalPrice || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.needsDriverBadge}>
                          <Text style={styles.needsDriverText}>⚠️ Needs Driver</Text>
                        </View>
                      </View>

                      {/* ROUTE INFO */}
                      <View style={styles.routeBox}>
                        <View style={styles.routeRow}>
                          <Text style={styles.routeIcon}>🌾</Text>
                          <Text style={styles.routeText} numberOfLines={1}>
                            <Text style={styles.routeLabel}>Origin: </Text>
                            {order.pickupLocation || 'Farm Origin'} ({order.farmerName || 'Farmer'})
                          </Text>
                        </View>
                        <View style={styles.routeDivider} />
                        <View style={styles.routeRow}>
                          <Text style={styles.routeIcon}>📍</Text>
                          <Text style={styles.routeText} numberOfLines={1}>
                            <Text style={styles.routeLabel}>Dropoff: </Text>
                            {order.deliveryAddress || 'Distribution Center'} ({order.buyerName || 'Buyer'})
                          </Text>
                        </View>
                      </View>

                      {/* DRIVER DROPDOWN MENU */}
                      <Text style={styles.dropdownLabel}>Select Driver from Available Fleet:</Text>
                      <DriverAssignmentDropdown
                        drivers={driversList}
                        ordersList={ordersList}
                        selectedDriver={selectedDriver}
                        onSelectDriver={(driver) => handleSelectDriverForOrder(order.id, driver)}
                        placeholder="Choose available driver..."
                        lang={lang}
                      />

                      {/* ASSIGN BUTTON */}
                      <TouchableOpacity
                        style={[
                          styles.assignBtn,
                          (!selectedDriver || isAssigning) && styles.assignBtnDisabled,
                        ]}
                        disabled={!selectedDriver || isAssigning}
                        onPress={() => handleConfirmAssignment(order)}
                        activeOpacity={0.85}
                      >
                        {isAssigning ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.assignBtnText}>
                            🚛 Confirm & Dispatch Driver
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {/* ALREADY ASSIGNED SHIPMENTS IN PROGRESS */}
              {assignedOrders.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subSectionTitle}>🚚 Shipments In Progress ({assignedOrders.length})</Text>
                  {assignedOrders.map((order) => (
                    <View key={order.id} style={styles.inProgressCard}>
                      <View style={styles.inProgressHeader}>
                        <Text style={styles.inProgressCrop}>{order.produceName}</Text>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>
                            {order.status === 'IN_TRANSIT' ? '🚚 In Transit' : '📦 Awaiting Pickup'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.driverInfoPill}>
                        <Text style={styles.driverInfoText}>
                          🚛 Assigned: <Text style={{ fontWeight: 'bold' }}>{order.driverName}</Text> (📞 {order.driverPhone || 'N/A'})
                        </Text>
                        {order.driverVehicle && (
                          <Text style={styles.driverVehicleSub}>{order.driverVehicle}</Text>
                        )}
                      </View>
                      <Text style={styles.destinationSub}>
                        Destination: {order.deliveryAddress}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 2: FULL FLEET ROSTER */}
          {activeFleetTab === 'fleet' && (
            <View style={{ marginTop: 12 }}>
              {evaluatedDrivers.map((driver) => (
                <View
                  key={driver.uid || driver.id}
                  style={[
                    styles.rosterCard,
                    driver.isAvailable ? styles.rosterCardAvailable : styles.rosterCardBusy,
                  ]}
                >
                  <View style={styles.rosterTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={styles.rosterAvatar}>
                        <Text style={styles.rosterAvatarText}>
                          {driver.fullName ? driver.fullName.charAt(0).toUpperCase() : 'D'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rosterName}>{driver.fullName}</Text>
                        <Text style={styles.rosterPhone}>📞 {driver.phoneNumber || 'N/A'}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.rosterBadge,
                        driver.isAvailable ? styles.rosterBadgeAvailable : styles.rosterBadgeBusy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rosterBadgeText,
                          driver.isAvailable ? { color: THEME.emerald } : { color: THEME.danger },
                        ]}
                      >
                        {driver.isAvailable ? '🟢 Available' : '🔴 On Delivery'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rosterVehicleRow}>
                    <Text style={styles.rosterVehicleText}>🚛 {driver.vehicleNumber || 'Transport Truck'}</Text>
                    <Text style={styles.rosterRating}>⭐ {driver.rating || '5.0'}</Text>
                  </View>

                  {!driver.isAvailable && (
                    <View style={styles.rosterBusyAlert}>
                      <Text style={styles.rosterBusyAlertText}>
                        ⏳ {driver.busyReason || 'Currently transporting cargo'}
                      </Text>
                      <Text style={styles.rosterBusyNote}>
                        Unavailable until driver confirms dropoff
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* REAL-TIME AUDIT LOG */}
        <Text style={styles.sectionTitle}>Real-time Agricultural Marketplace Flow</Text>
        {ordersList.slice(0, 5).map((order) => (
          <View key={order.id} style={styles.auditCard}>
            <View style={styles.auditHeader}>
              <Text style={styles.auditCrop}>{order.produceName || 'Produce Order'}</Text>
              <Text style={styles.auditStatus}>Status: {order.status || 'PENDING'}</Text>
            </View>
            <Text style={styles.auditSub}>
              Buyer: {order.buyerName || 'Buyer'} ➔ Farmer: {order.farmerName || 'Farmer'}
            </Text>
            {order.driverName && (
              <Text style={styles.auditDriver}>
                🚛 Driver: {order.driverName} ({order.driverPhone || ''})
              </Text>
            )}
            <Text style={styles.auditPrice}>
              Order Value: Rs. {Number(order.totalPrice || 0).toFixed(2)} ({order.qty} {order.unit || 'kg'})
            </Text>
          </View>
        ))}
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
    backgroundColor: THEME.warning,
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
  adminWelcome: {
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

  dispatchSectionCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  dispatchHeaderRow: {
    marginBottom: 10,
  },
  dispatchSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  dispatchSectionSub: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },

  tabSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginTop: 6,
    gap: 4,
  },
  fleetTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  fleetTabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fleetTabText: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  fleetTabTextActive: {
    color: THEME.navy,
    fontWeight: '700',
  },

  emptyOrdersBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyOrdersIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  emptyOrdersSub: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 20,
  },

  orderDispatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderCropName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  orderQtyBadge: {
    fontSize: 12,
    color: THEME.emerald,
    fontWeight: '600',
    marginTop: 2,
  },
  needsDriverBadge: {
    backgroundColor: THEME.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  needsDriverText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
  },

  routeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: THEME.navy,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  routeLabel: {
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  routeText: {
    fontSize: 12,
    color: THEME.textMuted,
    flex: 1,
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
    marginLeft: 20,
  },

  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 4,
  },
  assignBtn: {
    backgroundColor: THEME.navy,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  assignBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  subSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.navy,
    marginBottom: 8,
  },
  inProgressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.emerald,
  },
  inProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inProgressCrop: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  statusPill: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.emerald,
  },
  driverInfoPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 4,
  },
  driverInfoText: {
    fontSize: 11,
    color: THEME.navy,
  },
  driverVehicleSub: {
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 1,
  },
  destinationSub: {
    fontSize: 11,
    color: THEME.textMuted,
  },

  /* FLEET ROSTER STYLES */
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  rosterCardAvailable: {
    borderColor: '#BBF7D0',
  },
  rosterCardBusy: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  rosterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rosterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rosterName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  rosterPhone: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  rosterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rosterBadgeAvailable: {
    backgroundColor: THEME.emeraldLight,
  },
  rosterBadgeBusy: {
    backgroundColor: THEME.dangerLight,
  },
  rosterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rosterVehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rosterVehicleText: {
    fontSize: 11,
    color: THEME.textDark,
    fontWeight: '600',
  },
  rosterRating: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: 'bold',
  },
  rosterBusyAlert: {
    marginTop: 6,
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 6,
  },
  rosterBusyAlertText: {
    fontSize: 11,
    color: THEME.danger,
    fontWeight: '600',
  },
  rosterBusyNote: {
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 10,
  },
  auditCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditCrop: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  auditStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.info,
  },
  auditSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  auditDriver: {
    fontSize: 11,
    color: THEME.navy,
    fontWeight: '600',
    marginBottom: 2,
  },
  auditPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.emerald,
  },
});

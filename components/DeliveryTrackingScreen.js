/**
 * DeliveryTrackingScreen.js
 *
 * Shared Delivery Details screen used by both:
 *   - Cooperative Admin (isAdmin=true) → sees Reassign Driver button, full details
 *   - Delivery Driver  (isAdmin=false) → sees status update actions, Google Maps directions, Reject
 *
 * REAL DATA ONLY — no hardcoded names, fake coordinates, fake ETA, or demo maps.
 *
 * Map section: DeliveryRouteMap component (react-native-webview + Leaflet + OSM tiles).
 *   - Geocodes address strings via Nominatim (free, no API key)
 *   - Draws road-following route via OSRM public API (free, no API key)
 *   - Falls back gracefully if coordinates or route are unavailable
 */

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
  Linking,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  updateOrderStatus,
  subscribeToOrderById,
  reassignDriverForOrder,
  checkDriverAvailability,
} from '../services/firebaseDatabase';
import { FARMER_COLORS as C } from './FarmerDesign';
import DeliveryRouteMap from './DeliveryRouteMap';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Firestore Timestamp, ISO string, or number into a readable label. */
const formatTimestamp = (val) => {
  if (!val) return null;
  try {
    let d;
    if (typeof val === 'string') {
      d = new Date(val);
    } else if (typeof val === 'number') {
      d = new Date(val);
    } else if (typeof val.toDate === 'function') {
      d = val.toDate();
    } else if (typeof val.seconds === 'number') {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    }
    if (!d || isNaN(d.getTime())) return null;
    return (
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    );
  } catch (_) {
    return null;
  }
};

/** Safely render a string value. Returns null (not a fallback) when empty. */
const safeStr = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'number') return String(val);
  return null;
};

/**
 * Open Google Maps with a destination.
 * Prefers lat/lng; falls back to encoded address string.
 */
const openGoogleMaps = async (lat, lng, address) => {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  let url;
  if (hasCoords) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else if (address) {
    const encoded = encodeURIComponent(address);
    url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  } else {
    Alert.alert('Location Unavailable', 'No location data is available for this destination.');
    return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback: try browser
      await Linking.openURL(url);
    }
  } catch (err) {
    Alert.alert('Cannot Open Maps', 'Unable to open Google Maps on this device.');
  }
};

// ─── Status display helpers ────────────────────────────────────────────────────

const STATUS_LABELS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  PENDING:          { bg: '#FEF3C7', text: '#D97706' },
  ASSIGNED:         { bg: '#DBEAFE', text: '#2563EB' },
  ACCEPTED:         { bg: '#DBEAFE', text: '#2563EB' },
  PREPARING:        { bg: '#DBEAFE', text: '#2563EB' },
  READY_FOR_PICKUP: { bg: '#DBEAFE', text: '#2563EB' },
  IN_TRANSIT:       { bg: C.mint,    text: C.greenDark },
  DELIVERED:        { bg: '#E8F5E9', text: '#006837' },
  CANCELLED:        { bg: '#FEE2E2', text: '#DC2626' },
};

// ─── Delivery progress stages ─────────────────────────────────────────────────

const PROGRESS_STAGES = [
  {
    key: 'placed',
    label: 'Order Placed',
    matchStatuses: ['PENDING'],
    doneWhen: ['ASSIGNED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'],
    activeWhen: ['PENDING'],
  },
  {
    key: 'assigned',
    label: 'Driver Assigned',
    matchStatuses: ['ASSIGNED', 'ACCEPTED', 'PREPARING'],
    doneWhen: ['READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'],
    activeWhen: ['ASSIGNED', 'ACCEPTED', 'PREPARING'],
  },
  {
    key: 'ready',
    label: 'Ready for Pickup',
    matchStatuses: ['READY_FOR_PICKUP'],
    doneWhen: ['IN_TRANSIT', 'DELIVERED'],
    activeWhen: ['READY_FOR_PICKUP'],
  },
  {
    key: 'transit',
    label: 'In Transit',
    matchStatuses: ['IN_TRANSIT'],
    doneWhen: ['DELIVERED'],
    activeWhen: ['IN_TRANSIT'],
  },
  {
    key: 'delivered',
    label: 'Delivered',
    matchStatuses: ['DELIVERED'],
    doneWhen: [],
    activeWhen: ['DELIVERED'],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeliveryTrackingScreen({
  delivery = {},
  userProfile,
  driversList = [],
  ordersList = [],
  lang = 'en',
  onBack,
  onLogout,
  onStatusUpdated,
  onRejectDelivery,
}) {
  const [currentDelivery, setCurrentDelivery] = useState(delivery);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionModal, setStatusActionModal] = useState(null);

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedReplacementDriver, setSelectedReplacementDriver] = useState(null);
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Role detection
  const userRole = userProfile?.role;
  const userEmail = userProfile?.email?.toLowerCase();
  const isAdmin =
    userRole === 'cooperative_admin' ||
    userRole === 'admin' ||
    userEmail === 'govilink@admin.lk';
  const isDriver = userRole === 'driver';

  // Keep local state in sync with prop changes
  useEffect(() => {
    setCurrentDelivery(delivery);
  }, [delivery]);

  // Real-time listener for live order updates (GOVI-112)
  useEffect(() => {
    const orderId = delivery?.id || delivery?.orderNo;
    if (!orderId) return;
    const unsub = subscribeToOrderById(orderId, (freshOrder) => {
      if (freshOrder) setCurrentDelivery(freshOrder);
    });
    return () => unsub && unsub();
  }, [delivery?.id, delivery?.orderNo]);

  // ── Derived real values (NO hardcoded fallbacks) ───────────────────────────

  const currentStatus = (currentDelivery?.status || 'PENDING').toUpperCase();
  const rawDeliveryId = currentDelivery?.id || currentDelivery?.orderNo;
  const deliveryLabel = rawDeliveryId
    ? `Delivery #${String(rawDeliveryId).slice(-8).toUpperCase()}`
    : 'Delivery Details';

  // Driver (read from order doc — set by assignDriverToOrder)
  const driverName    = safeStr(currentDelivery?.driverName);
  const driverPhone   = safeStr(currentDelivery?.driverPhone);
  const driverId      = safeStr(currentDelivery?.driverId);

  // Farmer / consignor
  const farmerName    = safeStr(currentDelivery?.farmerName);
  const farmerPhone   = safeStr(currentDelivery?.farmerPhone);
  const pickupAddress = safeStr(currentDelivery?.pickupLocation);
  const pickupRegion  = safeStr(currentDelivery?.pickupRegion);
  // Coordinates (may not exist — no map library, used only for Google Maps URL)
  const pickupLat     = currentDelivery?.pickupLatitude  ?? currentDelivery?.pickupLat  ?? null;
  const pickupLng     = currentDelivery?.pickupLongitude ?? currentDelivery?.pickupLng  ?? null;

  // Buyer / consignee
  const buyerName        = safeStr(currentDelivery?.buyerName);
  const buyerPhone       = safeStr(currentDelivery?.buyerPhone);
  const deliveryAddress  = safeStr(currentDelivery?.deliveryAddress);
  const deliveryRegion   = safeStr(currentDelivery?.deliveryRegion);
  const deliveryNotes    = safeStr(currentDelivery?.notes || currentDelivery?.deliveryNotes);
  // Destination coordinates
  const destLat = currentDelivery?.deliveryLatitude  ?? currentDelivery?.destLat  ?? null;
  const destLng = currentDelivery?.deliveryLongitude ?? currentDelivery?.destLng  ?? null;

  // Vehicle — fix field name mismatches vs. what assignDriverToOrder actually writes
  const vehiclePlate    = safeStr(
    currentDelivery?.vehiclePlateNumber ||   // correct field from assignDriverToOrder
    currentDelivery?.vehiclePlate            // legacy / manual entries
  );
  const vehicleModel    = safeStr(
    currentDelivery?.vehicleMakeModel ||     // correct field from assignDriverToOrder
    currentDelivery?.vehicleModel            // legacy
  );
  const vehicleCapacity = safeStr(
    currentDelivery?.vehicleCapacity !== undefined
      ? String(currentDelivery.vehicleCapacity)
      : null
  );
  const vehicleType     = safeStr(currentDelivery?.driverVehicleType || currentDelivery?.vehicleType);
  // driverVehicle is the formatted label stored by assignDriverToOrder: e.g. "WP-NB-4482 (Isuzu Elf)"
  const vehicleLabel    = safeStr(currentDelivery?.driverVehicle);

  // Produce / order
  const produceName = safeStr(currentDelivery?.produceName);
  const qty         = currentDelivery?.qty != null ? String(currentDelivery.qty) : null;
  const unit        = safeStr(currentDelivery?.unit) || 'kg';
  const totalPrice  = currentDelivery?.totalPrice ?? currentDelivery?.logisticsFee ?? null;
  const createdAt   = currentDelivery?.createdAt;

  // Status history
  const statusHistory = Array.isArray(currentDelivery?.statusHistory)
    ? currentDelivery.statusHistory
    : [];

  // ── Delivery progress: build from statusHistory ────────────────────────────

  const getHistoryEntryForStatus = (statusKeys) => {
    for (const key of statusKeys) {
      const entry = statusHistory.find(
        (h) => h.status && h.status.toUpperCase() === key.toUpperCase()
      );
      if (entry) return entry;
    }
    return null;
  };

  // ── Status update ──────────────────────────────────────────────────────────

  const handleApplyStatus = async (targetStatus) => {
    const orderId = currentDelivery?.id || currentDelivery?.orderNo;
    if (!orderId) {
      Alert.alert('Error', 'Order ID is required to update delivery status.');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await updateOrderStatus(orderId, targetStatus, {
        driverName:
          userProfile?.fullName ||
          currentDelivery?.driverName ||
          'Driver',
        driverPhone: userProfile?.phoneNumber || currentDelivery?.driverPhone || '',
        changedBy: userProfile?.fullName || 'Authorized User',
        actorRole: userProfile?.role || 'driver',
      });

      setIsUpdatingStatus(false);
      setStatusActionModal(null);

      if (res.success) {
        setCurrentDelivery((prev) => ({
          ...prev,
          status: targetStatus,
          inTransitIso: res.inTransitAt || prev.inTransitIso,
          deliveredIso: res.deliveredAt || prev.deliveredIso,
        }));
        if (onStatusUpdated) onStatusUpdated(orderId, targetStatus);

        const msg =
          targetStatus === 'IN_TRANSIT'
            ? 'Delivery is now In Transit 🚛. Buyer & Farmer notified.'
            : targetStatus === 'DELIVERED'
            ? 'Delivery completed and confirmed! 🎉'
            : `Status updated to ${targetStatus.replace(/_/g, ' ')}.`;

        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Status Updated', msg);
      } else {
        if (Platform.OS === 'web') window.alert(res.error || 'Failed to update status.');
        else Alert.alert('Update Failed', res.error || 'Failed to update status.');
      }
    } catch (err) {
      setIsUpdatingStatus(false);
      setStatusActionModal(null);
      if (Platform.OS === 'web') window.alert(err.message || 'An error occurred.');
      else Alert.alert('Error', err.message || 'An error occurred.');
    }
  };

  // ── Reject delivery (driver) ───────────────────────────────────────────────

  const canRejectDelivery =
    typeof onRejectDelivery === 'function' &&
    isDriver &&
    currentDelivery?.driverId === userProfile?.uid &&
    ['ASSIGNED', 'ACCEPTED', 'READY_FOR_PICKUP'].includes(currentStatus);

  const rejectText =
    lang === 'si'
      ? 'බෙදාහැරීම ප්‍රතික්ෂේප කරන්න'
      : lang === 'ta'
      ? 'விநியோகத்தை நிராகரி'
      : 'Reject Delivery';

  const handleRejectDelivery = async () => {
    if (!canRejectDelivery || isRejecting) return;
    setIsRejecting(true);
    try {
      const result = await onRejectDelivery(
        currentDelivery.id || currentDelivery.orderNo
      );
      if (!result?.success) {
        const message = result?.error || 'Could not reject this delivery. Please try again.';
        if (Platform.OS === 'web') window.alert(message);
        else Alert.alert('Rejection Failed', message);
      } else {
        setShowRejectModal(false);
      }
    } catch (_err) {
      if (Platform.OS === 'web')
        window.alert('Could not reject this delivery. Please try again.');
      else Alert.alert('Error', 'Could not reject this delivery. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  // ── Reassign driver (admin) ────────────────────────────────────────────────

  const allDriversToConsider = Array.isArray(driversList) ? driversList : [];
  const currentDriverId = currentDelivery?.driverId;

  const evaluatedFleetDrivers = allDriversToConsider
    .filter((d) => (d.uid || d.id) !== currentDriverId)
    .map((driver) => {
      const avail = checkDriverAvailability(driver, ordersList);
      return { ...driver, isAvailable: avail.isAvailable, busyReason: avail.reason };
    });

  const filteredReplacementDrivers = evaluatedFleetDrivers.filter((d) => {
    if (!driverSearchQuery.trim()) return true;
    const q = driverSearchQuery.toLowerCase().trim();
    return (
      (d.fullName && d.fullName.toLowerCase().includes(q)) ||
      (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(q)) ||
      (d.phoneNumber && d.phoneNumber.includes(q))
    );
  });

  const handleExecuteReassign = async () => {
    if (!selectedReplacementDriver) {
      Alert.alert('Select Driver', 'Please select a replacement driver.');
      return;
    }
    if (currentStatus === 'DELIVERED') {
      Alert.alert('Restricted', 'Driver cannot be reassigned after delivery completion.');
      return;
    }
    if (currentStatus === 'CANCELLED') {
      Alert.alert('Restricted', 'Cannot reassign driver for a cancelled delivery order.');
      return;
    }

    Alert.alert(
      'Confirm Driver Reassignment',
      `Replace ${driverName || 'current driver'} with "${selectedReplacementDriver.fullName}" for ${deliveryLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Reassign',
          onPress: async () => {
            setIsReassigning(true);
            const res = await reassignDriverForOrder(
              currentDelivery,
              selectedReplacementDriver,
              userProfile,
              reassignReason || 'Reassigned by administrator'
            );
            setIsReassigning(false);
            if (res.success) {
              setCurrentDelivery((prev) => ({
                ...prev,
                driverId: selectedReplacementDriver.uid || selectedReplacementDriver.id,
                driverName: selectedReplacementDriver.fullName,
                driverPhone: selectedReplacementDriver.phoneNumber,
                driverVehicle:
                  selectedReplacementDriver.vehicleNumber || prev.driverVehicle,
              }));
              setShowReassignModal(false);
              setSelectedReplacementDriver(null);
              setReassignReason('');
              Alert.alert(
                'Driver Reassigned 🚛',
                `Successfully reassigned to "${selectedReplacementDriver.fullName}". Notifications sent.`
              );
              if (onStatusUpdated) onStatusUpdated(currentDelivery.id, currentDelivery.status);
            } else {
              Alert.alert(
                'Reassignment Failed',
                res.error || 'Failed to reassign driver.'
              );
            }
          },
        },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const sc = STATUS_COLORS[currentStatus] || STATUS_COLORS.PENDING;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── TOP HEADER ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={C.greenDark} />
          </TouchableOpacity>
          <View style={styles.brand}>
            <Image
              source={require('../assets/splash-icon.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>
                Govi<Text style={{ color: C.green }}>Link</Text>
              </Text>
              <Text style={styles.brandCaption}>
                {isAdmin ? 'COOPERATIVE ADMIN' : 'DRIVER WORKSPACE'}
              </Text>
            </View>
          </View>
        </View>

        {onLogout && (
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7} onPress={onLogout}>
            <Ionicons name="notifications-outline" size={22} color={C.greenDark} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════
            MAP — Delivery Route (real Leaflet/OSM/OSRM)
            Shown at the top so admins and drivers see the
            route immediately. Uses real address strings from
            the order document; geocoded via Nominatim (free).
        ══════════════════════════════════════════════ */}
        <View style={{ marginBottom: 14 }}>
          <DeliveryRouteMap
            pickupAddress={pickupAddress}
            destAddress={deliveryAddress}
            pickupLat={pickupLat}
            pickupLng={pickupLng}
            destLat={destLat}
            destLng={destLng}
            statusLabel={STATUS_LABELS[currentStatus] || currentStatus}
            height={248}
          />
        </View>

        {/* ══════════════════════════════════════════════
            1. DELIVERY HEADER — ID + STATUS
        ══════════════════════════════════════════════ */}
        <View style={styles.deliveryHeaderCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryTitle}>{deliveryLabel}</Text>
            {createdAt && (
              <Text style={styles.deliverySubDate}>
                {formatTimestamp(createdAt) || ''}
              </Text>
            )}
          </View>
          <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusPillDot, { backgroundColor: sc.text }]} />
            <Text style={[styles.statusPillText, { color: sc.text }]}>
              {STATUS_LABELS[currentStatus] || currentStatus.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════
            2. DELIVERY ROUTE — replaces fake "live tracking" map
            No map library installed → show real address cards
        ══════════════════════════════════════════════ */}
        <View style={styles.routeCard}>
          {/* Header */}
          <View style={styles.routeCardHeader}>
            <View style={styles.routeCardIconBox}>
              <MaterialCommunityIcons name="map-marker-path" size={20} color={C.greenDark} />
            </View>
            <Text style={styles.routeCardTitle}>Delivery Route</Text>
          </View>

          <View style={styles.routeBody}>
            {/* Pickup */}
            <View style={styles.routeRow}>
              <View style={styles.routeNodeCol}>
                <View style={styles.pickupNode}>
                  <Ionicons name="location" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.routeConnector} />
              </View>
              <View style={styles.routeTextCol}>
                <Text style={styles.routeRoleLabel}>PICKUP</Text>
                {pickupAddress ? (
                  <Text style={styles.routeAddressText}>{pickupAddress}</Text>
                ) : (
                  <Text style={styles.routeAddressMissing}>Pickup address unavailable</Text>
                )}
                {pickupRegion ? (
                  <Text style={styles.routeRegionText}>{pickupRegion}</Text>
                ) : null}
                {farmerName ? (
                  <Text style={styles.routePartyText}>
                    <Ionicons name="person-outline" size={11} color={C.muted} /> {farmerName}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Arrow label */}
            <View style={styles.routeArrowRow}>
              <MaterialCommunityIcons name="truck-fast-outline" size={14} color={C.muted} style={{ marginRight: 6 }} />
              <Text style={styles.routeArrowLabel}>Delivery Route</Text>
            </View>

            {/* Destination */}
            <View style={styles.routeRow}>
              <View style={styles.routeNodeCol}>
                <View style={styles.destNode}>
                  <Ionicons name="flag" size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.routeTextCol}>
                <Text style={[styles.routeRoleLabel, { color: C.blue }]}>DESTINATION</Text>
                {deliveryAddress ? (
                  <Text style={styles.routeAddressText}>{deliveryAddress}</Text>
                ) : (
                  <Text style={styles.routeAddressMissing}>Destination address unavailable</Text>
                )}
                {deliveryRegion ? (
                  <Text style={styles.routeRegionText}>{deliveryRegion}</Text>
                ) : null}
                {buyerName ? (
                  <Text style={styles.routePartyText}>
                    <Ionicons name="person-outline" size={11} color={C.muted} /> {buyerName}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Driver direction buttons (driver role only) ── */}
          {isDriver && (
            <View style={styles.directionsRow}>
              {(pickupAddress || (pickupLat != null && pickupLng != null)) && (
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() => openGoogleMaps(pickupLat, pickupLng, pickupAddress)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate-outline" size={15} color={C.greenDark} style={{ marginRight: 6 }} />
                  <Text style={styles.directionsBtnText}>Directions to Pickup</Text>
                </TouchableOpacity>
              )}
              {(deliveryAddress || (destLat != null && destLng != null)) && (
                <TouchableOpacity
                  style={[styles.directionsBtn, { backgroundColor: C.blueBg, borderColor: '#BFDBFE' }]}
                  onPress={() => openGoogleMaps(destLat, destLng, deliveryAddress)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={15} color={C.blue} style={{ marginRight: 6 }} />
                  <Text style={[styles.directionsBtnText, { color: C.blue }]}>
                    Directions to Customer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            3. DELIVERY PROGRESS TIMELINE
        ══════════════════════════════════════════════ */}
        <View style={styles.cardBox}>
          <View style={styles.cardSectionHeader}>
            <Ionicons name="git-commit-outline" size={18} color={C.green} style={{ marginRight: 8 }} />
            <Text style={styles.cardSectionTitle}>Delivery Progress</Text>
          </View>

          {PROGRESS_STAGES.map((stage, idx) => {
            const isDone = stage.doneWhen.includes(currentStatus) ||
              statusHistory.some((h) =>
                stage.matchStatuses.includes((h.status || '').toUpperCase())
              );
            const isActive = !isDone && stage.activeWhen.includes(currentStatus);
            const isUpcoming = !isDone && !isActive;
            const isCancelled = currentStatus === 'CANCELLED';
            const isLast = idx === PROGRESS_STAGES.length - 1;

            // Find a real timestamp for this stage from statusHistory
            const historyEntry = getHistoryEntryForStatus(stage.matchStatuses);
            const timestampText = historyEntry
              ? formatTimestamp(historyEntry.timestamp)
              : null;
            const actorText = historyEntry?.changedBy
              ? `by ${historyEntry.changedBy}`
              : null;

            return (
              <View key={stage.key} style={styles.timelineRow}>
                <View style={styles.timelineLeftCol}>
                  {isDone && !isCancelled && (
                    <View style={styles.completedCircleNode}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  )}
                  {isActive && !isCancelled && (
                    <View style={styles.activeDoubleRingNode}>
                      <View style={styles.activeInnerDot} />
                    </View>
                  )}
                  {(isUpcoming || isCancelled) && (
                    <View style={styles.upcomingCircleNode}>
                      {isCancelled ? (
                        <Ionicons name="close" size={10} color="#94A3B8" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={10} color="#94A3B8" />
                      )}
                    </View>
                  )}
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineConnectingLine,
                        isDone && !isCancelled && styles.timelineLineActive,
                        isActive && styles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.timelineContentCol}>
                  <Text
                    style={[
                      styles.timelineEventTitle,
                      isActive && styles.timelineEventTitleActive,
                      isUpcoming && styles.timelineEventTitleUpcoming,
                      isCancelled && { color: C.muted },
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {timestampText && (
                    <Text style={styles.timelineEventDetail}>{timestampText}</Text>
                  )}
                  {!timestampText && actorText && (
                    <Text style={styles.timelineEventDetail}>{actorText}</Text>
                  )}
                  {!timestampText && !actorText && isActive && (
                    <Text style={styles.timelineEventDetail}>In progress</Text>
                  )}
                </View>
              </View>
            );
          })}

          {currentStatus === 'CANCELLED' && (
            <View style={[styles.terminalStateCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 10 }} />
              <Text style={[styles.terminalTitle, { color: '#DC2626' }]}>Order Cancelled</Text>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            4. ASSIGNED DRIVER
        ══════════════════════════════════════════════ */}
        <View style={styles.cardBox}>
          <View style={styles.cardSectionHeader}>
            <Ionicons name="person-outline" size={18} color={C.green} style={{ marginRight: 8 }} />
            <Text style={styles.cardSectionTitle}>Assigned Driver</Text>
          </View>

          {driverName ? (
            <>
              {/* Driver info row — NO fake avatar, NO fake rating, NO fake run count */}
              <View style={styles.driverInfoRow}>
                <View style={styles.driverAvatarFallback}>
                  <Text style={styles.driverAvatarInitials}>
                    {driverName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverNameText}>{driverName}</Text>
                  {driverPhone ? (
                    <Text style={styles.driverPhoneText}>
                      <Ionicons name="call-outline" size={12} color={C.muted} /> {driverPhone}
                    </Text>
                  ) : (
                    <Text style={styles.driverPhoneText}>Phone not available</Text>
                  )}
                </View>

                {/* Call button (only when real phone exists) */}
                {driverPhone && (
                  <TouchableOpacity
                    style={styles.callIconBtn}
                    onPress={() =>
                      Linking.openURL(`tel:${driverPhone}`).catch(() =>
                        Alert.alert('Call Driver', `Phone: ${driverPhone}`)
                      )
                    }
                    activeOpacity={0.8}
                    accessibilityLabel={`Call ${driverName}`}
                  >
                    <Ionicons name="call" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Admin: Reassign Driver button */}
              {isAdmin && (
                <TouchableOpacity
                  style={[
                    styles.reassignDriverBtn,
                    (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') &&
                      styles.reassignDriverBtnDisabled,
                  ]}
                  onPress={() => {
                    if (currentStatus === 'DELIVERED') {
                      Alert.alert(
                        'Reassignment Restricted',
                        'Driver cannot be reassigned after delivery completion.'
                      );
                      return;
                    }
                    if (currentStatus === 'CANCELLED') {
                      Alert.alert(
                        'Reassignment Restricted',
                        'Cannot reassign driver for a cancelled delivery.'
                      );
                      return;
                    }
                    setShowReassignModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="account-convert"
                    size={16}
                    color={
                      currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED'
                        ? '#94A3B8'
                        : '#B45309'
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.reassignDriverBtnText,
                      (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') && {
                        color: '#94A3B8',
                      },
                    ]}
                  >
                    {currentStatus === 'DELIVERED'
                      ? 'Reassignment Closed (Delivered)'
                      : 'Reassign Driver (Admin)'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No driver assigned.</Text>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            5. ASSIGNED VEHICLE
        ══════════════════════════════════════════════ */}
        <View style={styles.cardBox}>
          <View style={styles.cardSectionHeader}>
            <MaterialCommunityIcons
              name="truck-outline"
              size={18}
              color={C.green}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.cardSectionTitle}>Assigned Vehicle</Text>
          </View>

          {vehiclePlate || vehicleModel || vehicleLabel ? (
            <>
              <View style={styles.vehicleHeaderRow}>
                <View style={styles.vehicleIconBox}>
                  <MaterialCommunityIcons name="truck-outline" size={22} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plateNumberText}>
                    {vehiclePlate || vehicleLabel || 'Plate unavailable'}
                  </Text>
                  {vehicleModel ? (
                    <Text style={styles.vehicleModelText}>{vehicleModel}</Text>
                  ) : vehicleType ? (
                    <Text style={styles.vehicleModelText}>{vehicleType}</Text>
                  ) : null}
                </View>
              </View>

              {vehicleCapacity && (
                <View style={styles.vehicleSpecRow}>
                  <Ionicons name="scale-outline" size={13} color={C.muted} style={{ marginRight: 6 }} />
                  <Text style={styles.specLabel}>CAPACITY</Text>
                  <Text style={styles.specValue}>{vehicleCapacity} kg</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No vehicle assigned.</Text>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            6. FARMER / PICKUP DETAILS
        ══════════════════════════════════════════════ */}
        <View style={styles.cardBox}>
          <View style={styles.partyHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="leaf-outline" size={18} color={C.green} style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>Farmer & Pickup</Text>
            </View>
            <View style={styles.partyRoleBadgeFarmer}>
              <Text style={styles.partyRoleTextFarmer}>CONSIGNOR</Text>
            </View>
          </View>

          {farmerName || pickupAddress ? (
            <View style={styles.partyDetailsRow}>
              <View style={styles.partyAvatarBox}>
                <Ionicons name="person" size={20} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                {farmerName && <Text style={styles.partyName}>{farmerName}</Text>}
                {pickupAddress && (
                  <Text style={styles.partySub}>{pickupAddress}</Text>
                )}
                {pickupRegion && (
                  <Text style={styles.partyRegionText}>{pickupRegion}</Text>
                )}
                {!farmerName && !pickupAddress && (
                  <Text style={styles.noDataText}>Farmer details unavailable.</Text>
                )}
              </View>
              {farmerPhone && (
                <TouchableOpacity
                  style={styles.partyCallBtn}
                  onPress={() =>
                    Linking.openURL(`tel:${farmerPhone}`).catch(() =>
                      Alert.alert('Contact Farmer', `Phone: ${farmerPhone}`)
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={16} color={C.green} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>Farmer details unavailable.</Text>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            7. BUYER / DESTINATION DETAILS
        ══════════════════════════════════════════════ */}
        <View style={styles.cardBox}>
          <View style={styles.partyHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="business-outline" size={18} color={C.blue} style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>Buyer & Destination</Text>
            </View>
            <View style={styles.partyRoleBadgeBuyer}>
              <Text style={styles.partyRoleTextBuyer}>RECIPIENT</Text>
            </View>
          </View>

          {buyerName || deliveryAddress ? (
            <View style={styles.partyDetailsRow}>
              <View style={[styles.partyAvatarBox, { backgroundColor: C.blueBg }]}>
                <Ionicons name="cart" size={20} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                {buyerName && <Text style={styles.partyName}>{buyerName}</Text>}
                {deliveryAddress && (
                  <Text style={styles.partySub}>{deliveryAddress}</Text>
                )}
                {deliveryRegion && (
                  <Text style={styles.partyRegionText}>{deliveryRegion}</Text>
                )}
                {deliveryNotes && (
                  <Text style={styles.partyNotes}>Note: {deliveryNotes}</Text>
                )}
              </View>
              {buyerPhone && (
                <TouchableOpacity
                  style={[styles.partyCallBtn, { backgroundColor: C.blueBg }]}
                  onPress={() =>
                    Linking.openURL(`tel:${buyerPhone}`).catch(() =>
                      Alert.alert('Contact Buyer', `Phone: ${buyerPhone}`)
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={16} color={C.blue} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>Buyer details unavailable.</Text>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            8. ORDER DETAILS
        ══════════════════════════════════════════════ */}
        {produceName && (
          <View style={styles.cardBox}>
            <View style={styles.cardSectionHeader}>
              <Ionicons name="cube-outline" size={18} color={C.green} style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>Order Details</Text>
            </View>

            <View style={styles.orderItemRow}>
              <View style={styles.orderItemIconBox}>
                <Ionicons name="leaf" size={18} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderProduceName}>{produceName}</Text>
                {qty && (
                  <Text style={styles.orderQtyText}>
                    {qty} {unit}
                  </Text>
                )}
              </View>
              {totalPrice != null && (
                <Text style={styles.orderPriceText}>
                  Rs. {Number(totalPrice).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════
            9. DELIVERY STATUS UPDATE (driver + admin actions)
        ══════════════════════════════════════════════ */}
        <View style={styles.cardBox}>
          <View style={styles.cardSectionHeader}>
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={18}
              color={C.green}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.cardSectionTitle}>Delivery Status</Text>
          </View>

          {/* Current status pill */}
          <View style={styles.statusCurrentRow}>
            <Text style={styles.statusCurrentLabel}>Current Status:</Text>
            <View style={[styles.statusLivePill, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusLivePillText, { color: sc.text }]}>
                ● {STATUS_LABELS[currentStatus] || currentStatus.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* PENDING */}
          {currentStatus === 'PENDING' && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnReady]}
                onPress={() =>
                  setStatusActionModal({
                    targetStatus: 'READY_FOR_PICKUP',
                    title: 'Mark Ready for Pickup 📦',
                    message:
                      'Confirm that produce is packed and ready for driver collection at the farm origin?',
                  })
                }
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>📦 Ready for Pickup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnTransit]}
                onPress={() =>
                  setStatusActionModal({
                    targetStatus: 'IN_TRANSIT',
                    title: 'Start Transit 🚛',
                    message:
                      'Confirm pickup and start transport? The buyer and farmer will be notified.',
                  })
                }
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>🚛 Pickup & Start Transit</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ASSIGNED */}
          {currentStatus === 'ASSIGNED' && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnReady]}
                onPress={() =>
                  setStatusActionModal({
                    targetStatus: 'READY_FOR_PICKUP',
                    title: 'Mark Ready for Pickup 📦',
                    message: 'Confirm produce is packed and ready for collection?',
                  })
                }
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>📦 Mark Ready for Pickup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnTransit]}
                onPress={() =>
                  setStatusActionModal({
                    targetStatus: 'IN_TRANSIT',
                    title: 'Pickup Cargo & Start Transit 🚛',
                    message: 'Confirm cargo pickup and start transport? Buyer and farmer will be notified.',
                  })
                }
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>🚛 Pickup Cargo & Start Transit</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* READY_FOR_PICKUP / ACCEPTED / PREPARING */}
          {(currentStatus === 'READY_FOR_PICKUP' ||
            currentStatus === 'ACCEPTED' ||
            currentStatus === 'PREPARING') && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnTransit]}
                onPress={() =>
                  setStatusActionModal({
                    targetStatus: 'IN_TRANSIT',
                    title: 'Pickup Cargo & Start Transit 🚛',
                    message:
                      'Confirm cargo pickup at farm origin. The order will be marked In Transit.',
                  })
                }
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>🚛 Pickup Cargo & Start Transit</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* IN_TRANSIT */}
          {currentStatus === 'IN_TRANSIT' && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnDelivered]}
                onPress={() =>
                  setStatusActionModal({
                    targetStatus: 'DELIVERED',
                    title: 'Confirm Dropoff & Mark Delivered ✅',
                    message:
                      'Confirm delivery to buyer destination? This will finalise the order and cannot be undone.',
                  })
                }
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>✅ Confirm Dropoff & Delivered</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* DELIVERED terminal */}
          {currentStatus === 'DELIVERED' && (
            <View style={styles.terminalStateCard}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={C.green}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.terminalTitle}>Delivery Finalised 🎉</Text>
                <Text style={styles.terminalSubtitle}>
                  This delivery is marked as Delivered. Status cannot be modified.
                </Text>
              </View>
            </View>
          )}

          {/* CANCELLED terminal */}
          {currentStatus === 'CANCELLED' && (
            <View
              style={[
                styles.terminalStateCard,
                { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
              ]}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color="#DC2626"
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.terminalTitle, { color: '#DC2626' }]}>
                  Order Cancelled
                </Text>
                <Text style={[styles.terminalSubtitle, { color: '#991B1B' }]}>
                  This order was cancelled and cannot transition to active delivery.
                </Text>
              </View>
            </View>
          )}

          {/* Driver reject button */}
          {canRejectDelivery && (
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: C.redBg, marginTop: 12 }]}
              disabled={isUpdatingStatus || isRejecting}
              onPress={() => setShowRejectModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statusBtnText, { color: C.red }]}>{rejectText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── REJECT MODAL ── */}
      {canRejectDelivery && (
        <Modal
          visible={showRejectModal}
          transparent
          animationType="fade"
          onRequestClose={() => !isRejecting && setShowRejectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitleText}>{rejectText}?</Text>
              <Text style={styles.modalMsgText}>
                This removes the delivery from your assignments and returns it for
                reassignment. The buyer's order stays open.
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  disabled={isRejecting}
                  onPress={() => setShowRejectModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Keep Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: C.red }]}
                  disabled={isRejecting || !canRejectDelivery}
                  onPress={handleRejectDelivery}
                >
                  {isRejecting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>{rejectText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── STATUS CONFIRMATION MODAL ── */}
      <Modal
        visible={!!statusActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isUpdatingStatus && setStatusActionModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <MaterialCommunityIcons
                name={
                  statusActionModal?.targetStatus === 'DELIVERED'
                    ? 'check-circle-outline'
                    : 'truck-fast-outline'
                }
                size={32}
                color={
                  statusActionModal?.targetStatus === 'DELIVERED' ? C.green : C.blue
                }
              />
            </View>
            <Text style={styles.modalTitleText}>{statusActionModal?.title}</Text>
            <Text style={styles.modalMsgText}>{statusActionModal?.message}</Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setStatusActionModal(null)}
                disabled={isUpdatingStatus}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor:
                      statusActionModal?.targetStatus === 'DELIVERED' ? C.green : C.blue,
                  },
                ]}
                onPress={() => handleApplyStatus(statusActionModal?.targetStatus)}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── REASSIGN DRIVER MODAL (admin only) ── */}
      <Modal
        visible={showReassignModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isReassigning && setShowReassignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%', alignItems: 'stretch' }]}>
            {/* Header */}
            <View style={styles.reassignModalHeader}>
              <View style={styles.reassignModalIconBox}>
                <MaterialCommunityIcons name="account-convert" size={24} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitleText}>Reassign Driver</Text>
                <Text style={styles.modalMsgText}>{deliveryLabel}</Text>
              </View>
              <TouchableOpacity
                onPress={() => !isReassigning && setShowReassignModal(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current driver banner */}
            {driverName && (
              <View style={styles.currentDriverBanner}>
                <Text style={styles.currentDriverBannerLabel}>Current Driver: </Text>
                <Text style={styles.currentDriverBannerVal}>
                  {driverName}
                  {driverPhone ? ` (${driverPhone})` : ''}
                </Text>
              </View>
            )}

            {/* Search */}
            <View style={styles.driverSearchInputBox}>
              <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.driverSearchInputField}
                placeholder="Search drivers by name, plate, phone..."
                placeholderTextColor="#94A3B8"
                value={driverSearchQuery}
                onChangeText={setDriverSearchQuery}
              />
              {driverSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setDriverSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Driver list */}
            <ScrollView
              style={{ maxHeight: 220, marginVertical: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {filteredReplacementDrivers.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>
                    No replacement drivers found.
                  </Text>
                </View>
              ) : (
                filteredReplacementDrivers.map((driver) => {
                  const isSelected =
                    selectedReplacementDriver &&
                    (selectedReplacementDriver.uid || selectedReplacementDriver.id) ===
                      (driver.uid || driver.id);
                  return (
                    <TouchableOpacity
                      key={driver.uid || driver.id}
                      style={[
                        styles.driverOptionCard,
                        isSelected && styles.driverOptionCardSelected,
                        !driver.isAvailable && styles.driverOptionCardDisabled,
                      ]}
                      onPress={() => {
                        if (!driver.isAvailable) {
                          Alert.alert(
                            'Driver Busy',
                            `"${driver.fullName}" is currently busy: ${driver.busyReason || 'Active route'}`
                          );
                          return;
                        }
                        setSelectedReplacementDriver(driver);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.driverOptionRadio,
                          isSelected && styles.driverOptionRadioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.driverOptionRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
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
                          {driver.vehicleNumber || 'Fleet Vehicle'} •{' '}
                          {driver.phoneNumber || 'Contact available'}
                        </Text>
                        {!driver.isAvailable && driver.busyReason && (
                          <Text style={styles.driverOptionBusyText} numberOfLines={1}>
                            Busy: {driver.busyReason}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Reason input */}
            <Text style={styles.reasonInputLabel}>Reason for Reassignment (Optional):</Text>
            <TextInput
              style={styles.reasonInputField}
              placeholder="e.g., Vehicle breakdown, route change..."
              placeholderTextColor="#94A3B8"
              value={reassignReason}
              onChangeText={setReassignReason}
            />

            {/* Action buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReassignModal(false)}
                disabled={isReassigning}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: '#B45309' },
                  (!selectedReplacementDriver || isReassigning) && { opacity: 0.6 },
                ]}
                onPress={handleExecuteReassign}
                disabled={!selectedReplacementDriver || isReassigning}
                activeOpacity={0.8}
              >
                {isReassigning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm Reassignment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 42,
    height: 42,
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
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E1EBDD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },

  /* ── 1. DELIVERY HEADER CARD ── */
  deliveryHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
  },
  deliverySubDate: {
    fontSize: 12,
    color: C.muted,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* ── 2. DELIVERY ROUTE CARD ── */
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeCardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.ink,
  },
  routeBody: {
    paddingLeft: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeNodeCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  pickupNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeConnector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  routeTextCol: {
    flex: 1,
    paddingBottom: 12,
    paddingTop: 2,
  },
  routeRoleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.green,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  routeAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 20,
  },
  routeAddressMissing: {
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
  },
  routeRegionText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  routePartyText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  routeArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 38,
    marginBottom: 8,
    marginTop: -4,
  },
  routeArrowLabel: {
    fontSize: 11,
    color: C.muted,
    fontStyle: 'italic',
  },
  /* Google Maps direction buttons */
  directionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.mint,
    borderWidth: 1,
    borderColor: '#C5E2D0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 140,
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.greenDark,
  },

  /* ── 3. PROGRESS TIMELINE ── */
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  completedCircleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDoubleRingNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: C.green,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.green,
  },
  upcomingCircleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineConnectingLine: {
    width: 2,
    height: 38,
    backgroundColor: C.border,
    marginTop: 2,
  },
  timelineLineActive: {
    backgroundColor: C.green,
  },
  timelineContentCol: {
    flex: 1,
    paddingTop: 1,
  },
  timelineEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  timelineEventTitleActive: {
    color: C.greenDark,
    fontWeight: '800',
  },
  timelineEventTitleUpcoming: {
    color: C.muted,
    fontWeight: '600',
  },
  timelineEventDetail: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  terminalStateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mint,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  terminalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.greenDark,
  },
  terminalSubtitle: {
    fontSize: 11,
    color: C.green,
    lineHeight: 15,
    marginTop: 2,
  },

  /* ── GENERIC CARD ── */
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.ink,
  },
  noDataText: {
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
  },

  /* ── 4. DRIVER CARD ── */
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  driverAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAvatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: C.greenDark,
  },
  driverNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  driverPhoneText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  callIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reassignDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: '#F5DCA8',
    borderRadius: 14,
    minHeight: 48,
    paddingVertical: 12,
    marginTop: 12,
  },
  reassignDriverBtnDisabled: {
    backgroundColor: C.canvas,
    borderColor: C.border,
    opacity: 0.7,
  },
  reassignDriverBtnText: {
    color: C.amber,
    fontSize: 13,
    fontWeight: '800',
  },

  /* ── 5. VEHICLE CARD ── */
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plateNumberText: {
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
  },
  vehicleModelText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  vehicleSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.muted,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },

  /* ── 6 & 7. PARTY CARDS ── */
  partyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partyRoleBadgeFarmer: {
    backgroundColor: C.mint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partyRoleTextFarmer: {
    color: C.greenDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partyRoleBadgeBuyer: {
    backgroundColor: C.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partyRoleTextBuyer: {
    color: C.blue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partyDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partyAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  partySub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  partyRegionText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  partyNotes: {
    fontSize: 12,
    color: C.amber,
    fontStyle: 'italic',
    marginTop: 3,
  },
  partyCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── 8. ORDER DETAILS ── */
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderProduceName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  orderQtyText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  orderPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.greenDark,
  },

  /* ── 9. STATUS UPDATE ── */
  statusCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  statusCurrentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
  },
  statusLivePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLivePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusActionBtnContainer: {
    gap: 10,
  },
  statusBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnReady: {
    backgroundColor: C.blue,
  },
  statusBtnTransit: {
    backgroundColor: C.greenDark,
  },
  statusBtnDelivered: {
    backgroundColor: C.green,
  },
  statusBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* ── MODALS ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 35, 26, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMsgText: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.mint,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.greenDark,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Reassign modal internals */
  reassignModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
    width: '100%',
  },
  reassignModalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDriverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 4,
    width: '100%',
  },
  currentDriverBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
  },
  currentDriverBannerVal: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
    flex: 1,
  },
  driverSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 6,
    width: '100%',
  },
  driverSearchInputField: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    padding: 0,
  },
  driverOptionCard: {
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
  driverOptionCardSelected: {
    borderColor: C.green,
    backgroundColor: C.mint,
  },
  driverOptionCardDisabled: {
    opacity: 0.55,
    backgroundColor: C.canvas,
  },
  driverOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
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
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  availBadgeGreenText: {
    color: C.greenDark,
    fontSize: 9,
    fontWeight: '800',
  },
  availBadgeRed: {
    backgroundColor: C.redBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  availBadgeRedText: {
    color: C.red,
    fontSize: 9,
    fontWeight: '800',
  },
  reasonInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  reasonInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: C.ink,
    marginBottom: 14,
    width: '100%',
  },

  // cardSublabel kept for compatibility if anything references it
  cardSublabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.muted,
    marginBottom: 12,
    letterSpacing: 0.8,
  },
});

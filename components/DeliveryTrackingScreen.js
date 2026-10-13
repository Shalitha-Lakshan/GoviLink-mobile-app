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
  DELIVERY_STATUSES,
  VALID_DELIVERY_TRANSITIONS,
  reassignDriverForOrder,
  checkDriverAvailability,
  DEFAULT_COOP_DRIVERS,
} from '../services/firebaseDatabase';

// Map background placeholder matching design mockup
const MAP_PREVIEW_URI =
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80';

// Helper: Format timestamps cleanly
const formatTimestamp = (isoOrObj) => {
  if (!isoOrObj) return null;
  try {
    if (typeof isoOrObj === 'string') {
      const d = new Date(isoOrObj);
      if (isNaN(d.getTime())) return null;
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' • ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    }
    if (typeof isoOrObj.toDate === 'function') {
      const d = isoOrObj.toDate();
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' • ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    }
    if (isoOrObj.seconds) {
      const d = new Date(isoOrObj.seconds * 1000);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' • ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    }
  } catch (_e) {
    return null;
  }
  return null;
};

export default function DeliveryTrackingScreen({
  delivery = {},
  userProfile,
  driversList = [],
  ordersList = [],
  lang = 'en',
  onBack,
  onLogout,
  onStatusUpdated,
}) {
  const [currentDelivery, setCurrentDelivery] = useState(delivery);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionModal, setStatusActionModal] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedReplacementDriver, setSelectedReplacementDriver] = useState(null);
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');

  // Admin Role Verification
  const userRole = userProfile?.role;
  const userEmail = userProfile?.email?.toLowerCase();
  const isAdmin = userRole === 'cooperative_admin' || userRole === 'admin' || userEmail === 'govilink@admin.lk';

  // Sync state if prop changes
  useEffect(() => {
    setCurrentDelivery(delivery);
  }, [delivery]);

  // Real-time listener for live order changes (GOVI-112)
  useEffect(() => {
    const orderId = delivery?.orderNo || delivery?.id;
    if (!orderId) return;

    const unsub = subscribeToOrderById(orderId, (freshOrder) => {
      if (freshOrder) {
        setCurrentDelivery(freshOrder);
      }
    });
    return () => unsub && unsub();
  }, [delivery?.id, delivery?.orderNo]);

  const deliveryId = currentDelivery?.orderNo || currentDelivery?.id ? `Delivery #${currentDelivery.orderNo || currentDelivery.id}` : 'Delivery #GL-8492';
  const estArrival = currentDelivery?.estArrival || 'Today, 14:30 PM';
  const currentStatus = (currentDelivery?.status || 'IN_TRANSIT').toUpperCase();

  // Driver details
  const driverName = currentDelivery?.driverName || 'Kamal Perera';
  const driverRating = currentDelivery?.driverRating || '4.8';
  const driverRuns = currentDelivery?.driverRuns || '124 runs';
  const driverPhone = currentDelivery?.driverPhone || '0771234567';
  const driverAvatar = currentDelivery?.driverAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  // Farmer / Consignor details (GOVI-148)
  const farmerName = currentDelivery?.farmerName || 'Sunil Gamage';
  const farmerPhone = currentDelivery?.farmerPhone || '0779876543';
  const pickupLocation = currentDelivery?.pickupLocation || 'Farm Origin Hub, Dambulla';
  const pickupRegion = currentDelivery?.pickupRegion || 'Central Province';

  // Buyer / Consignee details (GOVI-149)
  const buyerName = currentDelivery?.buyerName || 'Cooperative Market Buyer';
  const buyerPhone = currentDelivery?.buyerPhone || '0714567890';
  const deliveryAddress = currentDelivery?.deliveryAddress || 'Distribution Center, Colombo';
  const deliveryNotes = currentDelivery?.notes || '';

  // Vehicle details
  const vehiclePlate = currentDelivery?.vehiclePlate || 'WP LI-4920';
  const vehicleModel = currentDelivery?.vehicleModel || 'Refrigerated Isuzu 10ft';
  const capacity = currentDelivery?.capacity || '3.5 Tons';
  const tempControl = currentDelivery?.tempControl || 'Active';

  // Cargo manifest items (dynamic fallback from produce order)
  const manifestItems = currentDelivery?.manifestItems || [
    {
      id: currentDelivery?.id || 'c1',
      title: currentDelivery?.produceName || 'Grade A Fresh Tomatoes',
      farm: `Farm: ${currentDelivery?.farmerName || currentDelivery?.pickupLocation || 'Nuwara Eliya Co-op'}`,
      weight: `${currentDelivery?.qty || 500} ${currentDelivery?.unit || 'kg'}`,
      sublabel: currentDelivery?.category ? `${currentDelivery.category.toUpperCase()}` : '32 CRATES',
      image: currentDelivery?.image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
    },
  ];

  // Dynamic Timeline events synced with real timestamps (GOVI-111 & GOVI-112)
  const history = Array.isArray(currentDelivery?.statusHistory) ? currentDelivery.statusHistory : [];
  const placedEntry = history.find((h) => h.status === 'PENDING');
  const readyEntry = history.find((h) => h.status === 'READY_FOR_PICKUP' || h.status === 'ACCEPTED' || h.status === 'PREPARING');
  const inTransitEntry = history.find((h) => h.status === 'IN_TRANSIT');
  const deliveredEntry = history.find((h) => h.status === 'DELIVERED');

  const placedTime = formatTimestamp(placedEntry?.timestamp || currentDelivery?.createdAt) || 'Verified by Cooperative Admin';
  const readyTime = formatTimestamp(readyEntry?.timestamp || currentDelivery?.readyIso || currentDelivery?.acceptedIso) || (currentDelivery?.driverName ? `${currentDelivery.driverName} assigned` : 'Co-op logistics assignment');
  const inTransitTime = formatTimestamp(inTransitEntry?.timestamp || currentDelivery?.inTransitIso) || (currentStatus === 'IN_TRANSIT' || currentStatus === 'DELIVERED' ? 'En route to destination' : 'Pending farm pickup');
  const deliveredTime = formatTimestamp(deliveredEntry?.timestamp || currentDelivery?.deliveredIso) || (currentDelivery?.deliveryAddress || 'Destination address');

  const timelineEvents = currentDelivery?.timelineEvents || [
    {
      id: 't1',
      title: 'Order Placed & Verified',
      detail: placedTime,
      status: 'completed',
    },
    {
      id: 't2',
      title: 'Driver Assigned & Cargo Ready',
      detail: readyTime,
      status: currentStatus !== 'PENDING' ? 'completed' : 'upcoming',
    },
    {
      id: 't3',
      title: 'Cargo In Transit',
      detail: inTransitTime,
      status: currentStatus === 'DELIVERED' ? 'completed' : (currentStatus === 'IN_TRANSIT' ? 'active' : 'upcoming'),
    },
    {
      id: 't4',
      title: 'Arrival at Destination & Delivered',
      detail: deliveredTime,
      status: currentStatus === 'DELIVERED' ? 'completed' : 'upcoming',
    },
  ];

  const handleCallDriver = () => {
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`).catch(() => {
        Alert.alert('Contact Driver', `Phone: ${driverPhone}`);
      });
    } else {
      Alert.alert('Contact Driver', 'Phone number not available.');
    }
  };

  const handleMessageDriver = () => {
    Alert.alert('Message Driver', `Opening message thread with ${driverName}...`);
  };

  // Status update execution (GOVI-108, GOVI-109, GOVI-110, GOVI-115)
  const handleApplyStatus = async (targetStatus) => {
    const orderId = currentDelivery?.id || currentDelivery?.orderNo;
    if (!orderId) {
      Alert.alert('Error', 'Order ID is required to update delivery status.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await updateOrderStatus(orderId, targetStatus, {
        driverName: userProfile?.fullName || currentDelivery?.driverName || 'Kamal Perera',
        driverPhone: userProfile?.phoneNumber || currentDelivery?.driverPhone || '',
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

        if (onStatusUpdated) {
          onStatusUpdated(orderId, targetStatus);
        }

        const successMsg =
          targetStatus === 'IN_TRANSIT'
            ? 'Delivery is now In Transit 🚛. Buyer & Farmer notified.'
            : targetStatus === 'DELIVERED'
            ? 'Delivery completed and confirmed! 🎉'
            : `Status changed to ${targetStatus.replace(/_/g, ' ')}.`;

        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert('Status Updated', successMsg);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(res.error || 'Failed to update status.');
        } else {
          Alert.alert('Update Failed', res.error || 'Failed to update status.');
        }
      }
    } catch (err) {
      setIsUpdatingStatus(false);
      setStatusActionModal(null);
      console.error('Error applying delivery status:', err);
      if (Platform.OS === 'web') {
        window.alert(err.message || 'An error occurred.');
      } else {
        Alert.alert('Error', err.message || 'An error occurred.');
      }
    }
  };

  // Available replacement drivers evaluation (GOVI-145, GOVI-151)
  const allDriversToConsider = driversList.length > 0 ? driversList : DEFAULT_COOP_DRIVERS;
  const currentDriverId = currentDelivery?.driverId;
  const evaluatedFleetDrivers = allDriversToConsider
    .filter((d) => (d.uid || d.id) !== currentDriverId)
    .map((driver) => {
      const avail = checkDriverAvailability(driver, ordersList);
      return {
        ...driver,
        isAvailable: avail.isAvailable,
        busyReason: avail.reason,
      };
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
      Alert.alert('Select Driver', 'Please select an available replacement driver.');
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
      `Replace ${driverName} with "${selectedReplacementDriver.fullName}" for ${deliveryId}?`,
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
                driverVehicle: selectedReplacementDriver.vehicleNumber || prev.driverVehicle,
                driverRating: selectedReplacementDriver.rating || prev.driverRating,
              }));
              setShowReassignModal(false);
              setSelectedReplacementDriver(null);
              setReassignReason('');
              Alert.alert(
                'Driver Reassigned! 🚛',
                `Successfully reassigned to "${selectedReplacementDriver.fullName}". Notifications sent to all parties.`
              );
              if (onStatusUpdated) {
                onStatusUpdated(currentDelivery.id, currentDelivery.status);
              }
            } else {
              Alert.alert('Reassignment Failed', res.error || 'Failed to reassign driver.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>GoviLink</Text>

        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7} onPress={onLogout}>
          <Ionicons name="notifications-outline" size={22} color="#006837" />
          <View style={styles.notifBadgeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* LIVE TRACKING MAP BANNER */}
        <View style={styles.mapContainer}>
          <Image source={{ uri: MAP_PREVIEW_URI }} style={styles.mapImage} resizeMode="cover" />

          {/* LIVE TRACKING BADGE */}
          <View style={styles.liveTrackingBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTrackingText}>LIVE TRACKING</Text>
          </View>

          {/* CENTER TRUCK PIN NODE */}
          <View style={styles.mapPinNode}>
            <MaterialCommunityIcons name="truck-fast" size={22} color="#FFFFFF" />
          </View>
        </View>

        {/* DELIVERY STATUS CARD */}
        <View style={styles.deliveryCard}>
          <Text style={styles.deliveryTitle}>{deliveryId}</Text>
          <View style={styles.estRow}>
            <Ionicons name="time-outline" size={15} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.estText}>Est. Arrival: {estArrival}</Text>
          </View>

          <View style={[
            styles.inTransitPill,
            currentStatus === 'PENDING' && { backgroundColor: '#FEF3C7' },
            (currentStatus === 'ACCEPTED' || currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'PREPARING') && { backgroundColor: '#DBEAFE' },
            currentStatus === 'IN_TRANSIT' && { backgroundColor: '#DCFCE7' },
            currentStatus === 'DELIVERED' && { backgroundColor: '#E8F5E9' },
            currentStatus === 'CANCELLED' && { backgroundColor: '#FEE2E2' },
          ]}>
            <Ionicons
              name={currentStatus === 'DELIVERED' ? 'checkmark-done-circle' : 'checkmark-circle-outline'}
              size={16}
              color={
                currentStatus === 'PENDING' ? '#D97706' :
                (currentStatus === 'ACCEPTED' || currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'PREPARING') ? '#2563EB' :
                currentStatus === 'DELIVERED' ? '#006837' : '#16A34A'
              }
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.inTransitPillText,
              currentStatus === 'PENDING' && { color: '#D97706' },
              (currentStatus === 'ACCEPTED' || currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'PREPARING') && { color: '#2563EB' },
              currentStatus === 'IN_TRANSIT' && { color: '#16A34A' },
              currentStatus === 'DELIVERED' && { color: '#006837' },
              currentStatus === 'CANCELLED' && { color: '#DC2626' },
            ]}>
              {currentStatus === 'IN_TRANSIT' ? 'In Transit 🚛' : (currentStatus === 'DELIVERED' ? 'Delivered ✅' : currentStatus.replace(/_/g, ' '))}
            </Text>
          </View>
        </View>

        {/* ASSIGNED DRIVER CARD */}
        <View style={styles.cardBox}>
          <Text style={styles.cardSublabel}>Assigned Driver</Text>
          <View style={styles.driverMainRow}>
            <Image source={{ uri: driverAvatar }} style={styles.driverAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.driverRatingText}>{driverRating} ({driverRuns})</Text>
              </View>
            </View>
          </View>

          <View style={styles.driverActionsRow}>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={handleMessageDriver}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCallDriver}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>

          {/* ADMIN REASSIGN DRIVER BUTTON (GOVI-151) */}
          {isAdmin && (
            <TouchableOpacity
              style={[
                styles.reassignDriverBtn,
                (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') && styles.reassignDriverBtnDisabled,
              ]}
              onPress={() => {
                if (currentStatus === 'DELIVERED') {
                  Alert.alert('Reassignment Restricted', 'Driver cannot be reassigned after delivery completion.');
                  return;
                }
                if (currentStatus === 'CANCELLED') {
                  Alert.alert('Reassignment Restricted', 'Cannot reassign driver for a cancelled delivery order.');
                  return;
                }
                setShowReassignModal(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="account-convert"
                size={18}
                color={currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED' ? '#94A3B8' : '#B45309'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.reassignDriverBtnText,
                  (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') && { color: '#94A3B8' },
                ]}
              >
                {currentStatus === 'DELIVERED' ? 'Reassignment Closed (Delivered)' : 'Reassign Driver (Admin)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FARMER / CONSIGNOR DETAILS CARD (GOVI-148) */}
        <View style={styles.cardBox}>
          <View style={styles.partyHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="leaf-outline" size={18} color="#006837" style={{ marginRight: 8 }} />
              <Text style={styles.manifestTitle}>Farmer & Farm Origin</Text>
            </View>
            <View style={styles.partyRoleBadgeFarmer}>
              <Text style={styles.partyRoleTextFarmer}>CONSIGNOR</Text>
            </View>
          </View>

          <View style={styles.partyDetailsRow}>
            <View style={styles.partyAvatarBox}>
              <Ionicons name="person" size={20} color="#006837" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partyName}>{farmerName}</Text>
              <Text style={styles.partySub}>{pickupLocation}</Text>
              <Text style={styles.partyRegionText}>{pickupRegion}</Text>
            </View>
            {farmerPhone ? (
              <TouchableOpacity
                style={styles.partyCallBtn}
                onPress={() => Linking.openURL(`tel:${farmerPhone}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="#006837" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* BUYER / DESTINATION DETAILS CARD (GOVI-149) */}
        <View style={styles.cardBox}>
          <View style={styles.partyHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="business-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.manifestTitle}>Buyer & Delivery Destination</Text>
            </View>
            <View style={styles.partyRoleBadgeBuyer}>
              <Text style={styles.partyRoleTextBuyer}>RECIPIENT</Text>
            </View>
          </View>

          <View style={styles.partyDetailsRow}>
            <View style={[styles.partyAvatarBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cart" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partyName}>{buyerName}</Text>
              <Text style={styles.partySub}>{deliveryAddress}</Text>
              {deliveryNotes ? (
                <Text style={styles.partyNotes}>Instructions: {deliveryNotes}</Text>
              ) : null}
            </View>
            {buyerPhone ? (
              <TouchableOpacity
                style={[styles.partyCallBtn, { backgroundColor: '#DBEAFE' }]}
                onPress={() => Linking.openURL(`tel:${buyerPhone}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="#2563EB" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* TRANSPORT VEHICLE CARD */}
        <View style={styles.cardBox}>
          <Text style={styles.cardSublabel}>Transport Vehicle</Text>
          <View style={styles.vehicleHeaderRow}>
            <View style={styles.vehicleIconBox}>
              <MaterialCommunityIcons name="truck-outline" size={24} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.plateNumberText}>{vehiclePlate}</Text>
              <Text style={styles.vehicleModelText}>{vehicleModel}</Text>
            </View>
          </View>

          <View style={styles.vehicleDivider} />

          <View style={styles.vehicleSpecsRow}>
            <View style={styles.specCol}>
              <Text style={styles.specLabel}>CAPACITY</Text>
              <Text style={styles.specValue}>{capacity}</Text>
            </View>

            <View style={styles.specCol}>
              <Text style={styles.specLabel}>TEMP CONTROL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialCommunityIcons name="snowflake" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.tempControlValue}>{tempControl}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CARGO MANIFEST CARD */}
        <View style={styles.cardBox}>
          <View style={styles.manifestHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cube-outline" size={20} color="#006837" style={{ marginRight: 8 }} />
              <Text style={styles.manifestTitle}>Cargo Manifest</Text>
            </View>

            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountText}>{manifestItems.length} ITEMS</Text>
            </View>
          </View>

          {manifestItems.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.manifestItemRow,
                idx < manifestItems.length - 1 && styles.manifestItemBorder,
              ]}
            >
              <Image source={{ uri: item.image }} style={styles.manifestThumb} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.cargoItemTitle}>{item.title}</Text>
                <Text style={styles.cargoItemFarm}>{item.farm}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cargoItemWeight}>{item.weight}</Text>
                <Text style={styles.cargoItemSublabel}>{item.sublabel}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* TRACKING TIMELINE SECTION */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="git-commit-outline" size={20} color="#006837" style={{ marginRight: 8 }} />
            <Text style={styles.manifestTitle}>Tracking Timeline</Text>
          </View>

          {timelineEvents.map((evt, idx) => {
            const isCompleted = evt.status === 'completed';
            const isActive = evt.status === 'active';
            const isLast = idx === timelineEvents.length - 1;

            return (
              <View key={evt.id || idx} style={styles.timelineRow}>
                {/* NODE ICON & CONNECTING LINE */}
                <View style={styles.timelineLeftCol}>
                  {isCompleted && (
                    <View style={styles.completedCircleNode}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}

                  {isActive && (
                    <View style={styles.activeDoubleRingNode}>
                      <View style={styles.activeInnerDot} />
                    </View>
                  )}

                  {!isCompleted && !isActive && (
                    <View style={styles.upcomingCircleNode}>
                      <Ionicons name="location-outline" size={12} color="#94A3B8" />
                    </View>
                  )}

                  {!isLast && (
                    <View
                      style={[
                        styles.timelineConnectingLine,
                        (isCompleted || isActive) && styles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>

                {/* TIMELINE EVENT CONTENT */}
                <View style={styles.timelineContentCol}>
                  <Text
                    style={[
                      styles.timelineEventTitle,
                      isActive && styles.timelineEventTitleActive,
                      !isCompleted && !isActive && styles.timelineEventTitleUpcoming,
                    ]}
                  >
                    {evt.title}
                  </Text>
                  <Text
                    style={[
                      styles.timelineEventDetail,
                      !isCompleted && !isActive && { color: '#94A3B8' },
                    ]}
                  >
                    {evt.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* =================================================== */}
        {/* DELIVERY STATUS UPDATE CARD (GOVI-108 -> GOVI-115)  */}
        {/* =================================================== */}
        <View style={styles.cardBox}>
          <View style={styles.statusUpdateHeaderRow}>
            <View style={styles.statusUpdateIconBox}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#006837" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusUpdateCardTitle}>Delivery Status Actions</Text>
              <Text style={styles.statusUpdateCardSub}>
                Authorized Logistics & Dispatch Management
              </Text>
            </View>
          </View>

          <View style={styles.statusCurrentRow}>
            <Text style={styles.statusCurrentLabel}>Current Status:</Text>
            <View style={[
              styles.statusLivePill,
              currentStatus === 'PENDING' && { backgroundColor: '#FEF3C7' },
              (currentStatus === 'ACCEPTED' || currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'PREPARING') && { backgroundColor: '#DBEAFE' },
              currentStatus === 'IN_TRANSIT' && { backgroundColor: '#DCFCE7' },
              currentStatus === 'DELIVERED' && { backgroundColor: '#E8F5E9' },
              currentStatus === 'CANCELLED' && { backgroundColor: '#FEE2E2' },
            ]}>
              <Text style={[
                styles.statusLivePillText,
                currentStatus === 'PENDING' && { color: '#D97706' },
                (currentStatus === 'ACCEPTED' || currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'PREPARING') && { color: '#2563EB' },
                currentStatus === 'IN_TRANSIT' && { color: '#16A34A' },
                currentStatus === 'DELIVERED' && { color: '#006837' },
                currentStatus === 'CANCELLED' && { color: '#DC2626' },
              ]}>
                ● {currentStatus === 'IN_TRANSIT' ? 'IN TRANSIT 🚛' : (currentStatus === 'DELIVERED' ? 'DELIVERED ✅' : currentStatus.replace(/_/g, ' '))}
              </Text>
            </View>
          </View>

          {/* TRANSITION BUTTONS BASED ON WORKFLOW */}
          {currentStatus === 'PENDING' && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnReady]}
                onPress={() => setStatusActionModal({
                  targetStatus: 'READY_FOR_PICKUP',
                  title: 'Mark Ready for Pickup 📦',
                  message: 'Confirm that produce is packed and ready for driver collection at the farm origin?',
                })}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>📦 Ready for Pickup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnTransit]}
                onPress={() => setStatusActionModal({
                  targetStatus: 'IN_TRANSIT',
                  title: 'Start Transit 🚛',
                  message: 'Confirm pickup and start transport route? The buyer and farmer will be notified.',
                })}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>🚛 Pickup & Start Transit</Text>
              </TouchableOpacity>
            </View>
          )}

          {(currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'ACCEPTED' || currentStatus === 'PREPARING') && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnTransit]}
                onPress={() => setStatusActionModal({
                  targetStatus: 'IN_TRANSIT',
                  title: 'Pickup Cargo & Start Transit 🚛',
                  message: 'Confirm cargo pickup at farm origin. The order will be marked In Transit.',
                })}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>🚛 Pickup Cargo & Start Transit</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStatus === 'IN_TRANSIT' && (
            <View style={styles.statusActionBtnContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusBtnDelivered]}
                onPress={() => setStatusActionModal({
                  targetStatus: 'DELIVERED',
                  title: 'Confirm Dropoff & Mark Delivered ✅',
                  message: 'Confirm delivery to buyer destination? This will finalize the order and cannot be undone.',
                })}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.statusBtnText}>✅ Confirm Dropoff & Delivered</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStatus === 'DELIVERED' && (
            <View style={styles.terminalStateCard}>
              <Ionicons name="checkmark-circle" size={24} color="#006837" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.terminalTitle}>Delivery Finalized 🎉</Text>
                <Text style={styles.terminalSubtitle}>
                  This delivery is marked as Delivered. All payments and receipts are finalized. Status cannot be modified.
                </Text>
              </View>
            </View>
          )}

          {currentStatus === 'CANCELLED' && (
            <View style={[styles.terminalStateCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Ionicons name="close-circle" size={24} color="#DC2626" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.terminalTitle, { color: '#DC2626' }]}>Order Cancelled ✕</Text>
                <Text style={[styles.terminalSubtitle, { color: '#991B1B' }]}>
                  This order has been cancelled and cannot transition to active delivery.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* STATUS CONFIRMATION MODAL */}
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
                  statusActionModal?.targetStatus === 'DELIVERED'
                    ? '#006837'
                    : '#0284C7'
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
                  statusActionModal?.targetStatus === 'DELIVERED'
                    ? { backgroundColor: '#006837' }
                    : { backgroundColor: '#0284C7' },
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

      {/* REASSIGN DRIVER MODAL (GOVI-151) */}
      <Modal
        visible={showReassignModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isReassigning && setShowReassignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.reassignModalHeader}>
              <View style={styles.reassignModalIconBox}>
                <MaterialCommunityIcons name="account-convert" size={26} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitleText}>Reassign Delivery Driver</Text>
                <Text style={styles.modalMsgText}>Select a replacement fleet driver for {deliveryId}</Text>
              </View>
              <TouchableOpacity
                onPress={() => !isReassigning && setShowReassignModal(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current Driver Banner */}
            <View style={styles.currentDriverBanner}>
              <Text style={styles.currentDriverBannerLabel}>Current Driver:</Text>
              <Text style={styles.currentDriverBannerVal}>{driverName} ({driverPhone || 'No phone'})</Text>
            </View>

            {/* Search Drivers */}
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

            {/* Driver List */}
            <ScrollView style={{ maxHeight: 220, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              {filteredReplacementDrivers.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>No replacement drivers found.</Text>
                </View>
              ) : (
                filteredReplacementDrivers.map((driver) => {
                  const isSelected = selectedReplacementDriver && (selectedReplacementDriver.uid || selectedReplacementDriver.id) === (driver.uid || driver.id);
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
                          Alert.alert('Driver Busy', `"${driver.fullName}" is currently busy: ${driver.busyReason || 'Active route'}`);
                          return;
                        }
                        setSelectedReplacementDriver(driver);
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
                          {driver.vehicleNumber || 'Fleet Vehicle'} • {driver.phoneNumber || 'Contact available'}
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

            {/* Optional Reason Input */}
            <Text style={styles.reasonInputLabel}>Reason for Reassignment (Optional):</Text>
            <TextInput
              style={styles.reasonInputField}
              placeholder="e.g., Driver requested swap, vehicle breakdown, route change..."
              placeholderTextColor="#94A3B8"
              value={reassignReason}
              onChangeText={setReassignReason}
            />

            {/* Action Buttons */}
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 40,
  },

  /* LIVE MAP BANNER */
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 6,
    marginBottom: 16,
    backgroundColor: '#E0E7FF',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  liveTrackingBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveTrackingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  mapPinNode: {
    position: 'absolute',
    top: '40%',
    left: '46%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  /* DELIVERY STATUS CARD */
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  deliveryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  estRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  estText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  inTransitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  inTransitPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006837',
  },

  /* GENERIC CARD CONTAINER */
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSublabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 12,
  },

  /* DRIVER CARD */
  driverMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  driverRatingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  driverActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  messageBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#006837',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* VEHICLE CARD */
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plateNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleModelText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  vehicleSpecsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specCol: {
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  tempControlValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  /* CARGO MANIFEST */
  manifestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manifestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemsCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  manifestItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  manifestItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  manifestThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  cargoItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cargoItemFarm: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  cargoItemWeight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cargoItemSublabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },

  /* TRACKING TIMELINE */
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    backgroundColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDoubleRingNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#006837',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006837',
  },
  upcomingCircleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineConnectingLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
  },
  timelineLineActive: {
    backgroundColor: '#006837',
  },
  timelineContentCol: {
    flex: 1,
    paddingTop: 1,
  },
  timelineEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineEventTitleActive: {
    color: '#006837',
    fontWeight: '800',
  },
  timelineEventTitleUpcoming: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  timelineEventDetail: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },

  /* STATUS UPDATE ACTION CARD STYLES */
  statusUpdateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusUpdateIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusUpdateCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusUpdateCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 14,
  },
  statusCurrentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBtnReady: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
  },
  statusBtnTransit: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
  },
  statusBtnDelivered: {
    backgroundColor: '#006837',
    shadowColor: '#006837',
  },
  statusBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  terminalStateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
  },
  terminalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006837',
    marginBottom: 2,
  },
  terminalSubtitle: {
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15,
  },

  /* CONFIRMATION MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMsgText: {
    fontSize: 13,
    color: '#64748B',
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ADMIN REASSIGN BUTTON */
  reassignDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 12,
  },
  reassignDriverBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  reassignDriverBtnText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '800',
  },

  /* PARTY CARDS (FARMER & BUYER) */
  partyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partyRoleBadgeFarmer: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partyRoleTextFarmer: {
    color: '#006837',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partyRoleBadgeBuyer: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partyRoleTextBuyer: {
    color: '#1D4ED8',
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
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  partySub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18,
  },
  partyRegionText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  partyNotes: {
    fontSize: 12,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: 3,
  },
  partyCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* REASSIGN MODAL STYLES */
  reassignModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  reassignModalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDriverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  currentDriverBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  currentDriverBannerVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  driverSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  driverSearchInputField: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  driverOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  driverOptionCardSelected: {
    borderColor: '#B45309',
    backgroundColor: '#FFFBEB',
  },
  driverOptionCardDisabled: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
  },
  driverOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverOptionRadioSelected: {
    borderColor: '#B45309',
  },
  driverOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B45309',
  },
  driverOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  driverOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  driverOptionBusyText: {
    fontSize: 10,
    color: '#DC2626',
    marginTop: 2,
    fontStyle: 'italic',
  },
  availBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  availBadgeGreenText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '800',
  },
  availBadgeRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  availBadgeRedText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  reasonInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  reasonInputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 14,
  },
});

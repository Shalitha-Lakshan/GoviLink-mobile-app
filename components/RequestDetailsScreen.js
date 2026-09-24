import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DriverAssignmentDropdown from './DriverAssignmentDropdown';
import { checkDriverAvailability, assignDriverToOrder } from '../services/firebaseDatabase';

// Map preview placeholder image URL
const MAP_PREVIEW_URI = 'https://maps.googleapis.com/maps/api/staticmap?center=7.8731,80.7718&zoom=10&size=600x200&sensor=false';

// Helper: Safely format dates (handles Firestore Timestamps, Strings, Numbers, and Date objects)
const formatDateString = (dateVal, fallback = 'Tomorrow, Oct 24') => {
  if (!dateVal) return fallback;
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
  return fallback;
};

// Helper: Safely format string values
const safeString = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.name) return String(val.name);
    if (val.address) return String(val.address);
    if (val.title) return String(val.title);
  }
  return fallback;
};

export default function RequestDetailsScreen({
  order = {},
  userProfile,
  driversList = [],
  ordersList = [],
  lang = 'en',
  onBack,
  onLogout,
  onDriverAssignedSuccess,
}) {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showDriverPickerModal, setShowDriverPickerModal] = useState(false);

  // Derived details with safe string and date formatters matching design screenshot
  const requestId = order?.id ? `TR-${String(order.id).slice(-6).toUpperCase()}-N` : 'TR-8492-N';
  const produceName = safeString(order?.produceName || order?.produceType, 'Tomatoes');
  const qty = typeof order?.qty === 'number' || typeof order?.qty === 'string' ? order.qty : 500;
  const unit = safeString(order?.unit, 'kg');
  const gradeInfo = safeString(order?.grade, 'Grade A • Perishable');
  const farmerName = safeString(order?.farmerName, 'Nimal Silva');
  const farmerPhone = safeString(order?.farmerPhone, '0771234567');
  const farmerRating = safeString(order?.farmerRating, '4.9');
  const farmerTotalOrders = typeof order?.farmerTotalOrders === 'number' ? order.farmerTotalOrders : 142;
  const pickupLocation = safeString(order?.pickupLocation, 'Silva Agri Farm, Plot 42');
  const pickupRegion = safeString(order?.pickupRegion, 'Dambulla, Central Province');
  const deliveryAddress = safeString(order?.deliveryAddress, 'Manning Market, Gate 3');
  const deliveryRegion = safeString(order?.deliveryRegion, 'Peliyagoda, Western Province');
  const estDuration = safeString(order?.estDuration, '4.5 HOURS');
  const scheduledDate = formatDateString(order?.scheduledDate || order?.createdAt, 'Tomorrow, Oct 24');
  const scheduledTimeSlot = safeString(order?.scheduledTimeSlot, '04:00 AM - 06:00 AM');
  const status = safeString(order?.status, 'PENDING');

  const handleCallFarmer = () => {
    if (farmerPhone) {
      Linking.openURL(`tel:${farmerPhone}`).catch(() => {
        Alert.alert('Consignor Contact', `Farmer Phone: ${farmerPhone}`);
      });
    } else {
      Alert.alert('Consignor Contact', 'Phone number not available.');
    }
  };

  const handleConfirmAssignment = async (driverToAssign) => {
    const driver = driverToAssign || selectedDriver;
    if (!driver) {
      setShowDriverPickerModal(true);
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

    setIsAssigning(true);
    const res = await assignDriverToOrder(order.id || 'order_demo', driver);
    setIsAssigning(false);

    Alert.alert(
      'Driver Assigned Successfully! 🚛',
      `"${driver.fullName}" has been assigned to transport ${produceName} from ${pickupLocation} to ${deliveryAddress}.`
    );

    if (onDriverAssignedSuccess) {
      onDriverAssignedSuccess(order.id, driver);
    }
    if (onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <View style={styles.profileAvatarWrapper}>
          <Image
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : require('../assets/splash-icon.png')
            }
            style={styles.profileAvatar}
          />
        </View>

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
        {/* BACK LINK */}
        <TouchableOpacity style={styles.backBtnRow} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color="#3B82F6" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Back to Requests</Text>
        </TouchableOpacity>

        {/* TITLE & REQUEST ID BAR */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Request Details</Text>
          <View style={styles.subTitleRow}>
            <Text style={styles.requestIdText}>ID: {requestId}</Text>

            <View style={styles.statusBadgeNeeds}>
              <View style={styles.statusDotRed} />
              <Text style={styles.statusTextNeeds}>
                {status === 'PENDING' ? 'NEEDS ASSIGNMENT' : status}
              </Text>
            </View>
          </View>
        </View>

        {/* CARD 1: CARGO PAYLOAD */}
        <View style={styles.cardPayload}>
          <View style={styles.payloadLeftRow}>
            <View style={styles.payloadIconBox}>
              <Text style={{ fontSize: 24 }}>🍅</Text>
            </View>
            <View style={styles.payloadInfoCol}>
              <Text style={styles.cardSubHeaderLabel}>CARGO PAYLOAD</Text>
              <Text style={styles.payloadTitle}>{produceName}</Text>
              <Text style={styles.payloadGradeText}>{gradeInfo}</Text>
            </View>
          </View>

          <View style={styles.volumeBox}>
            <Text style={styles.volumeValue}>
              {qty} <Text style={{ fontSize: 14 }}>{unit}</Text>
            </Text>
            <Text style={styles.volumeLabel}>Total Volume</Text>
          </View>
        </View>

        {/* CARD 2: CONSIGNOR (FARMER INFO) */}
        <View style={styles.cardConsignor}>
          <View style={styles.consignorLeftRow}>
            <View style={styles.farmerAvatarWrapper}>
              <Image
                source={require('../assets/splash-icon.png')}
                style={styles.farmerAvatar}
              />
              <View style={styles.verifiedCheckBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#006837" />
              </View>
            </View>

            <View style={styles.consignorTextCol}>
              <Text style={styles.cardSubHeaderLabel}>CONSIGNOR</Text>
              <Text style={styles.farmerName}>{farmerName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>
                  {farmerRating} <Text style={styles.ordersCountText}>({farmerTotalOrders} orders)</Text>
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallFarmer}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* CARD 3: TRANSIT ROUTE */}
        <View style={styles.cardRoute}>
          <View style={styles.routeHeaderRow}>
            <Text style={styles.routeSectionTitle}>Transit Route</Text>
            <View style={styles.estBadge}>
              <Text style={styles.estBadgeText}>EST: {estDuration}</Text>
            </View>
          </View>

          {/* PICKUP NODE */}
          <View style={styles.routeNodeBlock}>
            <View style={styles.pickupDoubleCircle}>
              <View style={styles.pickupInnerCircle} />
            </View>
            <View style={styles.routeTextCol}>
              <Text style={styles.routeNodeLabel}>PICKUP LOCATION</Text>
              <Text style={styles.locationMainTitle}>{pickupLocation}</Text>
              <Text style={styles.locationSubTitle}>{pickupRegion}</Text>

              {/* MAP PREVIEW THUMBNAIL */}
              <View style={styles.mapContainer}>
                <Image
                  source={{ uri: MAP_PREVIEW_URI }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
                <View style={styles.mapPinOverlay}>
                  <Ionicons name="location" size={22} color="#DC2626" />
                </View>
              </View>
            </View>
          </View>

          {/* CONNECTING LINE */}
          <View style={styles.routeConnectingLine} />

          {/* DESTINATION NODE */}
          <View style={styles.routeNodeBlock}>
            <View style={styles.destPinIconBox}>
              <Ionicons name="location-outline" size={22} color="#006837" />
            </View>
            <View style={styles.routeTextCol}>
              <Text style={styles.routeNodeLabel}>DELIVERY DESTINATION</Text>
              <Text style={styles.locationMainTitle}>{deliveryAddress}</Text>
              <Text style={styles.locationSubTitle}>{deliveryRegion}</Text>
            </View>
          </View>
        </View>

        {/* CARD 4: REQUESTED SCHEDULE */}
        <View style={styles.cardSchedule}>
          <View style={styles.scheduleLeftRow}>
            <View style={styles.calendarCircleIcon}>
              <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.scheduleTextCol}>
              <Text style={styles.cardSubHeaderLabel}>REQUESTED SCHEDULE</Text>
              <Text style={styles.scheduleDateTitle}>{scheduledDate}</Text>
            </View>
          </View>

          <View style={styles.timeSlotBadge}>
            <Text style={styles.timeSlotBadgeText}>{scheduledTimeSlot}</Text>
          </View>
        </View>

        {/* DRIVER ASSIGNMENT SELECTOR WHEN ACTION CLICKED */}
        {showDriverPickerModal && (
          <View style={styles.driverSelectionContainer}>
            <Text style={styles.driverPickerHeading}>Choose Fleet Driver to Dispatch:</Text>
            <DriverAssignmentDropdown
              drivers={driversList}
              ordersList={ordersList}
              selectedDriver={selectedDriver}
              onSelectDriver={(d) => {
                setSelectedDriver(d);
                setShowDriverPickerModal(false);
              }}
              placeholder="Select driver..."
              lang={lang}
            />
          </View>
        )}
      </ScrollView>

      {/* BOTTOM ACTION FOOTER BAR */}
      <View style={styles.bottomFooterBar}>
        <TouchableOpacity
          style={styles.editRequestBtn}
          onPress={() => Alert.alert('Edit Request', 'Editing details for request #' + requestId)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
          <Text style={styles.editRequestBtnText}>Edit Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.assignPrimaryBtn}
          onPress={() => {
            if (selectedDriver) {
              handleConfirmAssignment(selectedDriver);
            } else {
              setShowDriverPickerModal(true);
            }
          }}
          activeOpacity={0.85}
          disabled={isAssigning}
        >
          <MaterialCommunityIcons name="truck-fast" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.assignPrimaryBtnText}>
            {selectedDriver ? `Dispatch ${selectedDriver.fullName.split(' ')[0]}` : 'Assign Driver & Vehicle'}
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
    paddingBottom: 100,
  },

  /* BACK BUTTON LINK */
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },

  /* TITLE SECTION */
  titleSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  requestIdText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadgeNeeds: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  statusTextNeeds: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },

  /* CARD 1: CARGO PAYLOAD */
  cardPayload: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  payloadLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payloadIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  payloadInfoCol: {
    flex: 1,
  },
  cardSubHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  payloadTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  payloadGradeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginTop: 2,
  },
  volumeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  volumeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#006837',
  },
  volumeLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },

  /* CARD 2: CONSIGNOR (FARMER INFO) */
  cardConsignor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  consignorLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmerAvatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  farmerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  consignorTextCol: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  ordersCountText: {
    fontWeight: '400',
    color: '#64748B',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CARD 3: TRANSIT ROUTE */
  cardRoute: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  estBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  estBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  routeNodeBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDoubleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#475569',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  pickupInnerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  destPinIconBox: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  routeNodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  locationMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  locationSubTitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  mapContainer: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPinOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -11,
    marginTop: -11,
  },
  routeConnectingLine: {
    width: 2,
    height: 32,
    backgroundColor: '#CBD5E1',
    marginLeft: 9,
    marginVertical: 4,
  },

  /* CARD 4: REQUESTED SCHEDULE */
  cardSchedule: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleTextCol: {
    flex: 1,
  },
  scheduleDateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  timeSlotBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeSlotBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006837',
  },

  driverSelectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#006837',
    marginTop: 10,
    marginBottom: 16,
  },
  driverPickerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },

  /* BOTTOM FOOTER BAR */
  bottomFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  editRequestBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editRequestBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignPrimaryBtn: {
    flex: 1.4,
    backgroundColor: '#006837',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

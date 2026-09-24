import React from 'react';
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

// Map background placeholder matching design mockup
const MAP_PREVIEW_URI =
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80';

export default function DeliveryTrackingScreen({
  delivery = {},
  userProfile,
  lang = 'en',
  onBack,
  onLogout,
}) {
  const deliveryId = delivery?.orderNo || delivery?.id ? `Delivery #${delivery.orderNo || delivery.id}` : 'Delivery #GL-8492';
  const estArrival = delivery?.estArrival || 'Today, 14:30 PM';
  const status = delivery?.status || 'IN_TRANSIT';

  // Driver details
  const driverName = delivery?.driverName || 'Kamal Perera';
  const driverRating = delivery?.driverRating || '4.8';
  const driverRuns = delivery?.driverRuns || '124 runs';
  const driverPhone = delivery?.driverPhone || '0771234567';
  const driverAvatar = delivery?.driverAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  // Vehicle details
  const vehiclePlate = delivery?.vehiclePlate || 'WP LI-4920';
  const vehicleModel = delivery?.vehicleModel || 'Refrigerated Isuzu 10ft';
  const capacity = delivery?.capacity || '3.5 Tons';
  const tempControl = delivery?.tempControl || 'Active';

  // Cargo manifest items
  const manifestItems = delivery?.manifestItems || [
    {
      id: 'c1',
      title: 'Grade A Tomatoes',
      farm: 'Farm: Nuwara Eliya Co-op',
      weight: '500 kg',
      sublabel: '32 CRATES',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'c2',
      title: 'Green Cabbage',
      farm: 'Farm: Dambulla Ag',
      weight: '250 kg',
      sublabel: '10 SACKS',
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=200&q=80',
    },
  ];

  // Timeline events
  const timelineEvents = delivery?.timelineEvents || [
    {
      id: 't1',
      title: 'Order Placed',
      detail: '08:15 AM • Verified by Admin',
      status: 'completed',
    },
    {
      id: 't2',
      title: 'Driver Assigned',
      detail: '09:30 AM • Kamal Perera accepted',
      status: 'completed',
    },
    {
      id: 't3',
      title: 'Cargo Picked Up',
      detail: '11:45 AM • Dambulla Hub',
      status: 'completed',
    },
    {
      id: 't4',
      title: 'In Transit',
      detail: 'Current location: Near Kurunegala Bypass. Expected delay of 10 mins due to traffic.',
      status: 'active',
    },
    {
      id: 't5',
      title: 'Arrival at Destination',
      detail: 'Colombo Wholesale Market',
      status: 'upcoming',
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

          <View style={styles.inTransitPill}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#006837" style={{ marginRight: 6 }} />
            <Text style={styles.inTransitPillText}>In Transit</Text>
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
      </ScrollView>
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
});

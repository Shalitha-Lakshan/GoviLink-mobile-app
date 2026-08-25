import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { checkDriverAvailability } from '../services/firebaseDatabase';

const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
  emeraldLight: '#E8F5E9',
  accentLeaf: '#2ECC71',
  bg: '#F8FAFC',
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
};

/**
 * DriverAssignmentDropdown Component
 *
 * @param {object} props
 * @param {Array} props.drivers - List of all registered / fleet drivers
 * @param {Array} props.ordersList - Current real-time orders list to calculate availability
 * @param {object} props.selectedDriver - Currently selected driver
 * @param {function} props.onSelectDriver - Callback when driver is selected
 * @param {string} props.orderId - (Optional) ID of order being assigned
 * @param {string} props.placeholder - Dropdown placeholder text
 * @param {boolean} props.disabled - Disable dropdown interaction
 * @param {string} props.lang - Language code ('en' | 'si' | 'ta')
 */
export default function DriverAssignmentDropdown({
  drivers = [],
  ordersList = [],
  selectedDriver = null,
  onSelectDriver,
  orderId = null,
  placeholder = 'Select an Available Driver...',
  disabled = false,
  lang = 'en',
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute availability for all drivers
  const evaluatedDrivers = useMemo(() => {
    const list = Array.isArray(drivers) ? drivers : [];
    return list.map((driver) => {
      const availability = checkDriverAvailability(driver, ordersList || []);
      return {
        ...driver,
        isAvailable: availability.isAvailable,
        activeOrder: availability.activeOrder,
        busyReason: availability.reason,
      };
    });
  }, [drivers, ordersList]);

  // Filter based on search query
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return evaluatedDrivers;
    const q = searchQuery.toLowerCase().trim();
    return evaluatedDrivers.filter(
      (d) =>
        (d.fullName && d.fullName.toLowerCase().includes(q)) ||
        (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(q)) ||
        (d.district?.nameEn && d.district.nameEn.toLowerCase().includes(q)) ||
        (d.phoneNumber && d.phoneNumber.includes(q))
    );
  }, [evaluatedDrivers, searchQuery]);

  const availableCount = evaluatedDrivers.filter((d) => d.isAvailable).length;
  const busyCount = evaluatedDrivers.length - availableCount;

  const handleSelectDriver = (driver) => {
    if (!driver.isAvailable) {
      Alert.alert(
        'Driver Currently Busy 🚛',
        `"${driver.fullName}" is currently assigned to another active shipment.\n\n${driver.busyReason || 'In-transit'}\n\nDrivers become available automatically once they confirm delivery.`
      );
      return;
    }

    onSelectDriver(driver);
    setModalVisible(false);
  };

  const getDistrictName = (district) => {
    if (!district) return 'Sri Lanka';
    if (typeof district === 'string') return district;
    if (lang === 'si' && district.nameSi) return district.nameSi;
    if (lang === 'ta' && district.nameTa) return district.nameTa;
    return district.nameEn || 'Sri Lanka';
  };

  return (
    <View style={styles.container}>
      {/* DROPDOWN TRIGGER BUTTON */}
      <TouchableOpacity
        style={[
          styles.dropdownBtn,
          disabled && styles.dropdownBtnDisabled,
          selectedDriver && styles.dropdownBtnSelected,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownLeft}>
          <Text style={styles.driverIcon}>🚛</Text>
          <View style={styles.selectedInfo}>
            {selectedDriver ? (
              <>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.selectedDriverName} numberOfLines={1}>
                    {selectedDriver.fullName || selectedDriver.name}
                  </Text>
                  <View style={styles.greenDot} />
                </View>
                <Text style={styles.selectedDriverSub} numberOfLines={1}>
                  {selectedDriver.vehicleNumber || 'Transport Fleet'} • {selectedDriver.phoneNumber || ''}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholderText} numberOfLines={1}>
                {placeholder} ({availableCount} Available)
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.chevronIcon}>▼</Text>
      </TouchableOpacity>

      {/* DRIVER SELECTION MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚚 Select Logistics Driver</Text>
                <Text style={styles.modalSubTitle}>
                  Available: <Text style={styles.boldGreen}>{availableCount}</Text> • In Transit:{' '}
                  <Text style={styles.boldRed}>{busyCount}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH INPUT */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search driver name, vehicle, district..."
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* DRIVERS LIST */}
            <FlatList
              data={filteredDrivers}
              keyExtractor={(item) => item.uid || item.id || item.email}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🚚</Text>
                  <Text style={styles.emptyTitle}>No Drivers Found</Text>
                  <Text style={styles.emptySub}>
                    Try searching with another name or register new drivers in the fleet.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected =
                  selectedDriver &&
                  (selectedDriver.uid === item.uid || selectedDriver.id === item.id);

                return (
                  <TouchableOpacity
                    style={[
                      styles.driverCard,
                      item.isAvailable ? styles.driverCardAvailable : styles.driverCardBusy,
                      isSelected && styles.driverCardSelected,
                    ]}
                    onPress={() => handleSelectDriver(item)}
                    activeOpacity={item.isAvailable ? 0.7 : 0.9}
                  >
                    <View style={styles.driverTopRow}>
                      <View style={styles.driverMainInfo}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'D'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.nameRow}>
                            <Text style={styles.driverName} numberOfLines={1}>
                              {item.fullName}
                            </Text>
                            {item.rating && (
                              <View style={styles.ratingBadge}>
                                <Text style={styles.ratingText}>{item.rating}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.driverPhone}>📞 {item.phoneNumber || 'N/A'}</Text>
                        </View>
                      </View>

                      {/* AVAILABILITY BADGE */}
                      <View
                        style={[
                          styles.statusBadge,
                          item.isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeBusy,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            item.isAvailable ? styles.statusTextAvailable : styles.statusTextBusy,
                          ]}
                        >
                          {item.isAvailable ? '🟢 Available' : '🔴 On Delivery'}
                        </Text>
                      </View>
                    </View>

                    {/* VEHICLE & DISTRICT DETAILS */}
                    <View style={styles.vehicleDetailsRow}>
                      <Text style={styles.vehicleText} numberOfLines={1}>
                        🚛 {item.vehicleNumber || 'Lorry Fleet'}
                      </Text>
                      <Text style={styles.districtTag}>📍 {getDistrictName(item.district)}</Text>
                    </View>

                    {/* BUSY WARNING BANNER IF NOT AVAILABLE */}
                    {!item.isAvailable && (
                      <View style={styles.busyBanner}>
                        <Text style={styles.busyBannerText}>
                          ⏳ {item.busyReason || 'Currently handling active delivery'}
                        </Text>
                        <Text style={styles.busySubNotice}>
                          Unavailable until delivery confirmation
                        </Text>
                      </View>
                    )}

                    {/* SELECTION INDICATOR */}
                    {isSelected && (
                      <View style={styles.selectedMarker}>
                        <Text style={styles.selectedMarkerText}>✓ Selected Driver</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.cardBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownBtnSelected: {
    borderColor: THEME.emerald,
    backgroundColor: '#F0FDF4',
  },
  dropdownBtnDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  driverIcon: {
    fontSize: 20,
  },
  selectedInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedDriverName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.emerald,
  },
  selectedDriverSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 1,
  },
  placeholderText: {
    fontSize: 13,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  chevronIcon: {
    fontSize: 12,
    color: THEME.textMuted,
    marginLeft: 8,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 37, 69, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.navy,
  },
  modalSubTitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  boldGreen: {
    color: THEME.emerald,
    fontWeight: 'bold',
  },
  boldRed: {
    color: THEME.danger,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: THEME.textDark,
    fontWeight: 'bold',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.textDark,
    padding: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: THEME.textMuted,
    paddingHorizontal: 4,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  driverCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  driverCardAvailable: {
    borderColor: '#BBF7D0',
  },
  driverCardBusy: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
    opacity: 0.85,
  },
  driverCardSelected: {
    borderColor: THEME.emerald,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
  },
  driverTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
    flexShrink: 1,
  },
  ratingBadge: {
    backgroundColor: THEME.warningLight,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309',
  },
  driverPhone: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 1,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeAvailable: {
    backgroundColor: THEME.emeraldLight,
  },
  statusBadgeBusy: {
    backgroundColor: THEME.dangerLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextAvailable: {
    color: THEME.emerald,
  },
  statusTextBusy: {
    color: THEME.danger,
  },

  vehicleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 11,
    color: THEME.textDark,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  districtTag: {
    fontSize: 10,
    color: THEME.textMuted,
    fontWeight: '500',
  },

  busyBanner: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.danger,
  },
  busyBannerText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
  },
  busySubNotice: {
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 2,
  },

  selectedMarker: {
    marginTop: 8,
    backgroundColor: THEME.emerald,
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  selectedMarkerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

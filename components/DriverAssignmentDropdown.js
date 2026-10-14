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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { checkDriverAvailability } from '../services/firebaseDatabase';
import { FARMER_COLORS as C } from './FarmerDesign';

const THEME = {
  ink: C.ink,
  green: C.green,
  greenDark: C.greenDark,
  mint: C.mint,
  bg: C.canvas,
  cardBg: C.white,
  textDark: C.ink,
  textMuted: C.muted,
  border: C.border,
  warning: C.amber,
  warningLight: C.amberBg,
  danger: C.red,
  dangerLight: C.redBg,
  info: C.blue,
  infoLight: C.blueBg,
};

/**
 * DriverAssignmentDropdown Component
 * Handles the strict 2-step assignment flow:
 * 1. Select Driver (from real drivers, showing availability & status)
 * 2. Select Vehicle (disabled until Driver is selected; strictly filtered to that driver's available vehicles)
 */
export default function DriverAssignmentDropdown({
  drivers = [],
  vehiclesList = [],
  ordersList = [],
  selectedDriver = null,
  selectedVehicle = null,
  onSelectDriver,
  onSelectVehicle,
  orderId = null,
  placeholder = 'Select an Available Driver...',
  vehiclePlaceholder = 'Select Vehicle for this Driver...',
  disabled = false,
  lang = 'en',
}) {
  const [driverModalVisible, setModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  // 1. Compute driver availability
  const evaluatedDrivers = useMemo(() => {
    const list = Array.isArray(drivers) ? drivers : [];
    return list.map((driver) => {
      const driverId = driver.uid || driver.id;
      const availability = checkDriverAvailability(driver, ordersList || []);
      const driverVehicles = (vehiclesList || []).filter((v) => v.driverUid === driverId);
      return {
        ...driver,
        isAvailable: availability.isAvailable,
        activeOrder: availability.activeOrder,
        busyReason: availability.reason,
        vehiclesCount: driverVehicles.length,
      };
    });
  }, [drivers, ordersList, vehiclesList]);

  // Filter drivers based on search query
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return evaluatedDrivers;
    const q = searchQuery.toLowerCase().trim();
    return evaluatedDrivers.filter(
      (d) =>
        (d.fullName && d.fullName.toLowerCase().includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.phoneNumber && d.phoneNumber.includes(q)) ||
        (typeof d.district === 'string' && d.district.toLowerCase().includes(q)) ||
        (d.district?.nameEn && d.district.nameEn.toLowerCase().includes(q))
    );
  }, [evaluatedDrivers, searchQuery]);

  const availableCount = evaluatedDrivers.filter((d) => d.isAvailable).length;
  const busyCount = evaluatedDrivers.length - availableCount;

  // 2. Compute vehicles belonging ONLY to the selected driver
  const driverVehicles = useMemo(() => {
    if (!selectedDriver) return [];
    const driverId = selectedDriver.uid || selectedDriver.id;
    return (vehiclesList || []).filter((v) => v.driverUid === driverId).map((v) => {
      const isAssignedToOther = (ordersList || []).some(
        (o) =>
          (o.id !== orderId) &&
          (o.vehicleId === v.id || o.driverVehicleId === v.id) &&
          ['ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PENDING_DELIVERY'].includes(o.status)
      );

      const isMaintenance = v.status === 'MAINTENANCE';
      const isInactive = v.status === 'INACTIVE';
      const isBusy = isAssignedToOther || v.status === 'IN_USE';
      const isAvailable = !isMaintenance && !isInactive && !isBusy;

      return {
        ...v,
        isAvailable,
        statusLabel: isMaintenance
          ? 'MAINTENANCE'
          : isBusy
          ? 'IN_USE'
          : isInactive
          ? 'INACTIVE'
          : 'AVAILABLE',
      };
    });
  }, [selectedDriver, vehiclesList, ordersList, orderId]);

  const filteredDriverVehicles = useMemo(() => {
    if (!vehicleSearchQuery.trim()) return driverVehicles;
    const q = vehicleSearchQuery.toLowerCase().trim();
    return driverVehicles.filter(
      (v) =>
        (v.plateNumber && v.plateNumber.toLowerCase().includes(q)) ||
        (v.makeModel && v.makeModel.toLowerCase().includes(q)) ||
        (v.vehicleType && v.vehicleType.toLowerCase().includes(q))
    );
  }, [driverVehicles, vehicleSearchQuery]);

  const availableVehiclesCount = driverVehicles.filter((v) => v.isAvailable).length;

  const handleSelectDriver = (driver) => {
    if (!driver.isAvailable) {
      Alert.alert(
        'Driver Currently Busy 🚛',
        `"${driver.fullName}" is unavailable.\n\n${driver.busyReason || 'Currently assigned to another active route.'}`
      );
      return;
    }

    if (onSelectDriver) {
      onSelectDriver(driver);
    }
    // Rule 12: Clear previous vehicle selection immediately on driver change
    if (onSelectVehicle) {
      onSelectVehicle(null);
    }
    setModalVisible(false);
  };

  const handleSelectVehicle = (vehicle) => {
    if (!vehicle.isAvailable) {
      Alert.alert(
        'Vehicle Unavailable 🚚',
        `Vehicle ${vehicle.plateNumber} is currently ${vehicle.statusLabel.toLowerCase().replace('_', ' ')}.`
      );
      return;
    }
    if (onSelectVehicle) {
      onSelectVehicle(vehicle);
    }
    setVehicleModalVisible(false);
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
      {/* ── STEP 1: DRIVER SELECTOR ──────────────────────── */}
      <View style={styles.stepBlock}>
        <Text style={styles.stepLabel}>Step 1: Assign Delivery Driver</Text>
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
            <View style={[styles.avatarBadge, selectedDriver && styles.avatarBadgeActive]}>
              <Text style={[styles.avatarBadgeText, selectedDriver && styles.avatarBadgeTextActive]}>
                {selectedDriver?.fullName ? selectedDriver.fullName.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
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
                    📞 {selectedDriver.phoneNumber || selectedDriver.email || 'Registered Driver'} • {selectedDriver.vehiclesCount || driverVehicles.length} vehicles
                  </Text>
                </>
              ) : (
                <Text style={styles.placeholderText} numberOfLines={1}>
                  {placeholder} ({availableCount} Available)
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={18} color={THEME.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── STEP 2: VEHICLE SELECTOR (DISABLED UNTIL DRIVER CHOSEN) ── */}
      <View style={[styles.stepBlock, { marginTop: 10 }]}>
        <Text style={styles.stepLabel}>
          Step 2: Assign Driver's Vehicle {!selectedDriver && '(Disabled)'}
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownBtn,
            (!selectedDriver || disabled) && styles.dropdownBtnDisabled,
            selectedVehicle && styles.dropdownBtnSelected,
          ]}
          onPress={() => {
            if (!selectedDriver) {
              Alert.alert('Select Driver First', 'Please select a delivery driver before selecting a vehicle.');
              return;
            }
            if (driverVehicles.length === 0) {
              Alert.alert('No Vehicles', 'This driver does not have any registered vehicles in their fleet.');
              return;
            }
            if (availableVehiclesCount === 0) {
              Alert.alert('No Available Vehicles', 'All vehicles for this driver are currently in use or under maintenance.');
              return;
            }
            setVehicleModalVisible(true);
          }}
          activeOpacity={0.8}
          disabled={!selectedDriver || disabled}
        >
          <View style={styles.dropdownLeft}>
            <View style={[styles.avatarBadge, selectedVehicle && styles.avatarBadgeActive]}>
              <Ionicons
                name="car-outline"
                size={18}
                color={selectedVehicle ? THEME.greenDark : THEME.textMuted}
              />
            </View>
            <View style={styles.selectedInfo}>
              {!selectedDriver ? (
                <Text style={styles.placeholderTextMuted} numberOfLines={1}>
                  Select driver first to view vehicles...
                </Text>
              ) : selectedVehicle ? (
                <>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.selectedDriverName} numberOfLines={1}>
                      {selectedVehicle.plateNumber}
                    </Text>
                    <View style={styles.greenDot} />
                  </View>
                  <Text style={styles.selectedDriverSub} numberOfLines={1}>
                    {selectedVehicle.vehicleTypeLabel || selectedVehicle.vehicleType || 'Vehicle'} • {selectedVehicle.capacity ? `${selectedVehicle.capacity} kg` : 'Standard'} • Available
                  </Text>
                </>
              ) : driverVehicles.length === 0 ? (
                <Text style={styles.warningPlaceholderText} numberOfLines={1}>
                  ⚠️ No vehicles registered for this driver
                </Text>
              ) : availableVehiclesCount === 0 ? (
                <Text style={styles.warningPlaceholderText} numberOfLines={1}>
                  ⚠️ No available vehicles for this driver
                </Text>
              ) : (
                <Text style={styles.placeholderText} numberOfLines={1}>
                  {vehiclePlaceholder} ({availableVehiclesCount} available)
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={18} color={THEME.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── MODAL 1: DRIVER SELECTION ─────────────────────── */}
      <Modal
        visible={driverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚚 Select Logistics Driver</Text>
                <Text style={styles.modalSubTitle}>
                  Available: <Text style={styles.boldGreen}>{availableCount}</Text> • In Transit:{' '}
                  <Text style={styles.boldRed}>{busyCount}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={THEME.greenDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={THEME.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search driver by name, phone, district..."
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredDrivers}
              keyExtractor={(item) => item.uid || item.id || item.email}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={44} color={THEME.textMuted} />
                  <Text style={styles.emptyTitle}>No registered drivers found</Text>
                  <Text style={styles.emptySub}>
                    No drivers match your search query in the cooperative roster.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected =
                  selectedDriver && (selectedDriver.uid === item.uid || selectedDriver.id === item.id);

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
                          <Text style={styles.driverName} numberOfLines={1}>
                            {item.fullName}
                          </Text>
                          <Text style={styles.driverPhone}>📞 {item.phoneNumber || item.email || 'N/A'}</Text>
                        </View>
                      </View>

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
                          {item.isAvailable ? '🟢 Available' : '🔴 In Transit'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleDetailsRow}>
                      <Text style={styles.vehicleText} numberOfLines={1}>
                        🚛 {item.vehiclesCount || 0} registered vehicle{(item.vehiclesCount || 0) === 1 ? '' : 's'}
                      </Text>
                      <Text style={styles.districtTag}>📍 {getDistrictName(item.district)}</Text>
                    </View>

                    {!item.isAvailable && (
                      <View style={styles.busyBanner}>
                        <Text style={styles.busyBannerText}>
                          ⏳ {item.busyReason || 'Currently handling active delivery'}
                        </Text>
                      </View>
                    )}

                    {isSelected && (
                      <View style={styles.selectedMarker}>
                        <Ionicons name="checkmark-circle" size={14} color={THEME.green} style={{ marginRight: 4 }} />
                        <Text style={styles.selectedMarkerText}>Selected Driver</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: VEHICLE SELECTION (LOADS ONLY THIS DRIVER'S VEHICLES) ── */}
      <Modal
        visible={vehicleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVehicleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚚 Select Vehicle for Dispatch</Text>
                <Text style={styles.modalSubTitle}>
                  Driver: <Text style={styles.boldGreen}>{selectedDriver?.fullName || 'Driver'}</Text> • Available:{' '}
                  <Text style={styles.boldGreen}>{availableVehiclesCount}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setVehicleModalVisible(false)}>
                <Ionicons name="close" size={20} color={THEME.greenDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={THEME.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plate number, type, model..."
                placeholderTextColor={THEME.textMuted}
                value={vehicleSearchQuery}
                onChangeText={setVehicleSearchQuery}
              />
              {vehicleSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setVehicleSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredDriverVehicles}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="car-outline" size={44} color={THEME.textMuted} />
                  <Text style={styles.emptyTitle}>No Available Vehicles for this Driver</Text>
                  <Text style={styles.emptySub}>
                    This driver has no vehicles ready for cargo dispatch right now.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedVehicle && selectedVehicle.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.driverCard,
                      item.isAvailable ? styles.driverCardAvailable : styles.driverCardBusy,
                      isSelected && styles.driverCardSelected,
                    ]}
                    onPress={() => handleSelectVehicle(item)}
                    activeOpacity={item.isAvailable ? 0.7 : 0.9}
                  >
                    <View style={styles.driverTopRow}>
                      <View style={styles.driverMainInfo}>
                        <View style={styles.avatarCircle}>
                          <Ionicons name="car-outline" size={18} color={THEME.greenDark} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.driverName} numberOfLines={1}>
                            {item.plateNumber}
                          </Text>
                          <Text style={styles.driverPhone}>
                            {item.makeModel ? `${item.makeModel} • ` : ''}
                            {item.vehicleTypeLabel || item.vehicleType || 'Transport'}
                          </Text>
                        </View>
                      </View>

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
                          {item.statusLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleDetailsRow}>
                      <Text style={styles.vehicleText}>
                        Payload: {item.capacity ? `${item.capacity} kg` : 'Standard'}
                      </Text>
                      {item.hasColdChain && <Text style={styles.coldBadge}>❄️ Cold-Chain Ready</Text>}
                    </View>

                    {!item.isAvailable && (
                      <View style={styles.busyBanner}>
                        <Text style={styles.busyBannerText}>
                          ⚠️ Vehicle currently {item.statusLabel.toLowerCase().replace('_', ' ')}
                        </Text>
                      </View>
                    )}

                    {isSelected && (
                      <View style={styles.selectedMarker}>
                        <Ionicons name="checkmark-circle" size={14} color={THEME.green} style={{ marginRight: 4 }} />
                        <Text style={styles.selectedMarkerText}>Selected Vehicle</Text>
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
  stepBlock: {
    width: '100%',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 5,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownBtnSelected: {
    borderColor: THEME.green,
    backgroundColor: THEME.mint,
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
  avatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  avatarBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  avatarBadgeTextActive: {
    color: THEME.greenDark,
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
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDark,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.green,
  },
  selectedDriverSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 1,
  },
  placeholderText: {
    fontSize: 13,
    color: THEME.textDark,
    fontWeight: '500',
  },
  placeholderTextMuted: {
    fontSize: 12,
    color: THEME.textMuted,
    fontStyle: 'italic',
  },
  warningPlaceholderText: {
    fontSize: 12,
    color: THEME.warning,
    fontWeight: '600',
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 35, 26, 0.55)',
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
    fontSize: 17,
    fontWeight: '800',
    color: THEME.ink,
  },
  modalSubTitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  boldGreen: {
    color: THEME.green,
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
    backgroundColor: THEME.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.textDark,
    padding: 0,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  driverCardAvailable: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.green,
  },
  driverCardBusy: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.danger,
    opacity: 0.75,
  },
  driverCardSelected: {
    borderColor: THEME.green,
    backgroundColor: THEME.mint,
  },
  driverTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.greenDark,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
  },
  driverPhone: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeAvailable: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeBusy: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextAvailable: {
    color: '#059669',
  },
  statusTextBusy: {
    color: '#DC2626',
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vehicleText: {
    fontSize: 12,
    color: THEME.textDark,
    fontWeight: '600',
  },
  districtTag: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  coldBadge: {
    fontSize: 10,
    color: THEME.info,
    fontWeight: '700',
  },
  busyBanner: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 8,
  },
  busyBannerText: {
    fontSize: 11,
    color: THEME.danger,
    fontWeight: '600',
  },
  selectedMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  selectedMarkerText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.green,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textDark,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

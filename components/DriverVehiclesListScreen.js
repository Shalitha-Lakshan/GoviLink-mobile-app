import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  deleteDriverVehicle,
  setActiveDriverVehicle,
} from '../services/firebaseDatabase';

// ----------------------------------------------------
// THEME & COLOR PALETTE
// ----------------------------------------------------
const THEME = {
  navy: '#0B2545',
  navyDark: '#06172E',
  emerald: '#16A34A',
  emeraldDark: '#15803D',
  emeraldLight: '#E8F5E9',
  accentLeaf: '#2ECC71',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  placeholder: '#94A3B8',
  border: '#CBD5E1',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
};

const TRANSLATIONS = {
  en: {
    title: 'My Transport Fleet',
    subtitle: 'Manage all registered vehicles & select active dispatch vehicle',
    addVehicleBtn: '+ Register New Vehicle',
    totalFleet: 'Total Fleet',
    activeVehicle: 'Active in Dispatch',
    totalCapacity: 'Combined Capacity',
    vehiclesLabel: 'Vehicles',
    kgLabel: 'kg',
    activeBadge: '● Active for Dispatch',
    setActiveBtn: '⚡ Set as Active Vehicle',
    editBtn: '✏️ Edit',
    deleteBtn: '🗑️ Delete',
    coldChain: '❄️ Cold-Chain',
    ambient: '📦 Ambient Cargo',
    emptyTitle: 'No Vehicles Registered',
    emptySub: 'You have not added any transport vehicles yet. Register your first lorry, pickup, or cargo carrier.',
    emptyBtn: '+ Register My First Vehicle',
    deleteConfirmTitle: 'Delete Vehicle?',
    deleteConfirmMsg: (plate) => `Are you sure you want to remove vehicle "${plate}" from your registered fleet?`,
    deleteSuccess: 'Vehicle deleted successfully.',
    activeSuccess: 'Active vehicle updated successfully.',
    cannotDeleteActive: 'This vehicle is currently set as your active dispatch vehicle. Please set another vehicle as active first or proceed with deletion (next available vehicle will become active).',
  },
  si: {
    title: 'මගේ වාහන එකතුව',
    subtitle: 'සියලුම වාහන කළමනාකරණය කර ප්‍රවාහනය සඳහා ක්‍රියාකාරී වාහනය තෝරන්න',
    addVehicleBtn: '+ නව වාහනයක් ඇතුළත් කරන්න',
    totalFleet: 'මුළු වාහන',
    activeVehicle: 'ක්‍රියාකාරී වාහනය',
    totalCapacity: 'මුළු ධාරිතාවය',
    vehiclesLabel: 'වාහන',
    kgLabel: 'කි.ග්‍රෑ.',
    activeBadge: '● ප්‍රවාහනය සඳහා සක්‍රියයි',
    setActiveBtn: '⚡ සක්‍රිය වාහනය ලෙස තෝරන්න',
    editBtn: '✏️ සංස්කරණය',
    deleteBtn: '🗑️ ඉවත් කරන්න',
    coldChain: '❄️ ශීතකරණ සහිතයි',
    ambient: '📦 සාමාන්‍ය ප්‍රවාහන',
    emptyTitle: 'තවමත් වාහන ලියාපදිංචි කර නැත',
    emptySub: 'ඔබගේ පළමු ලොරි, පිකප් හෝ ප්‍රවාහන රථය ලියාපදිංචි කරන්න.',
    emptyBtn: '+ මගේ පළමු වාහනය ලියාපදිංචි කරන්න',
    deleteConfirmTitle: 'වාහනය ඉවත් කරන්නද?',
    deleteConfirmMsg: (plate) => `ඔබට "${plate}" අංක දරන වාහනය ඉවත් කිරීමට අවශ්‍යද?`,
    deleteSuccess: 'වාහනය සාර්ථකව ඉවත් කෙරිණි.',
    activeSuccess: 'ක්‍රියාකාරී වාහනය යාවත්කාලීන විය.',
    cannotDeleteActive: 'මෙම වාහනය සක්‍රිය වාහනය ලෙස තෝරා ඇත.',
  },
  ta: {
    title: 'எனது வாகனங்கள்',
    subtitle: 'அனைத்து வாகனங்களையும் நிர்வகித்து செயலில் உள்ள வாகனத்தை தேர்ந்தெடுக்கவும்',
    addVehicleBtn: '+ புதிய வாகனம் சேர்க்க',
    totalFleet: 'மொத்த வாகனங்கள்',
    activeVehicle: 'செயலில் உள்ள வாகனம்',
    totalCapacity: 'மொத்த சுமை திறன்',
    vehiclesLabel: 'வாகனங்கள்',
    kgLabel: 'கிலோ',
    activeBadge: '● விநியோகத்தில் செயலில் உள்ளது',
    setActiveBtn: '⚡ செயலில் உள்ளதாக அமைக்கவும்',
    editBtn: '✏️ திருத்த',
    deleteBtn: '🗑️ நீக்க',
    coldChain: '❄️ குளிரூட்டல்',
    ambient: '📦 வழக்கமான சரக்கு',
    emptyTitle: 'வாகனங்கள் பதிவு செய்யப்படவில்லை',
    emptySub: 'விநியோக பணிகளைத் தொடங்க உங்கள் முதல் வாகனத்தை பதிவு செய்யவும்.',
    emptyBtn: '+ முதல் வாகனத்தை பதிவு செய்',
    deleteConfirmTitle: 'வாகனத்தை நீக்கவா?',
    deleteConfirmMsg: (plate) => `வாகனம் "${plate}" ஐ நீக்க விரும்புகிறீர்களா?`,
    deleteSuccess: 'வாகனம் நீக்கப்பட்டது.',
    activeSuccess: 'செயலில் உள்ள வாகனம் மாற்றப்பட்டது.',
    cannotDeleteActive: 'இந்த வாகனம் தற்போது செயலில் உள்ளது.',
  },
};

export default function DriverVehiclesListScreen({
  userProfile,
  lang = 'en',
  vehicles = [],
  onBack,
  onAddNewVehicle,
  onEditVehicle,
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [processingId, setProcessingId] = useState(null);

  // Compute fleet stats
  const totalVehiclesCount = vehicles.length;
  const activeVehicleObj = vehicles.find((v) => v.isActive) || (vehicles.length > 0 ? vehicles[0] : null);
  const totalCapacityKg = vehicles.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);

  // Set Active Handler
  const handleSetActive = async (vehicle) => {
    if (vehicle.isActive) return;
    setProcessingId(vehicle.id);
    const result = await setActiveDriverVehicle(userProfile?.uid, vehicle.id);
    setProcessingId(null);

    if (result.success) {
      Alert.alert('Active Vehicle Selected 🚛', `"${vehicle.makeModel || vehicle.plateNumber}" is now active for your delivery dispatches.`);
    } else {
      Alert.alert('Error', result.error || 'Failed to set active vehicle.');
    }
  };

  // Delete Handler
  const handleDelete = (vehicle) => {
    Alert.alert(
      t.deleteConfirmTitle,
      t.deleteConfirmMsg(vehicle.plateNumber || vehicle.makeModel),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(vehicle.id);
            const result = await deleteDriverVehicle(vehicle.id, userProfile?.uid);
            setProcessingId(null);
            if (result.success) {
              Alert.alert('Vehicle Deleted', t.deleteSuccess);
            } else {
              Alert.alert('Error', result.error || 'Failed to delete vehicle.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* HEADER */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={onAddNewVehicle}
          activeOpacity={0.8}
        >
          <Text style={styles.headerAddBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FLEET KPI SUMMARY CARD */}
        {totalVehiclesCount > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>{t.totalFleet}</Text>
              <Text style={styles.summaryValue}>
                {totalVehiclesCount} <Text style={styles.summaryUnit}>{t.vehiclesLabel}</Text>
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>{t.totalCapacity}</Text>
              <Text style={styles.summaryValue}>
                {totalCapacityKg >= 1000 ? `${(totalCapacityKg / 1000).toFixed(1)}T` : `${totalCapacityKg}kg`}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>{t.activeVehicle}</Text>
              <Text style={[styles.summaryValue, { color: THEME.emerald }]} numberOfLines={1}>
                {activeVehicleObj?.plateNumber || 'None'}
              </Text>
            </View>
          </View>
        )}

        {/* LIST OF VEHICLES */}
        {vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚚</Text>
            <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{t.emptySub}</Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={onAddNewVehicle}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyActionBtnText}>{t.emptyBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((veh) => {
            const isThisActive = Boolean(veh.isActive);
            const isBusy = processingId === veh.id;

            return (
              <View
                key={veh.id}
                style={[
                  styles.vehicleCard,
                  isThisActive && styles.vehicleCardActive,
                ]}
              >
                {/* Active Indicator Banner */}
                {isThisActive && (
                  <View style={styles.activeBanner}>
                    <Text style={styles.activeBannerText}>{t.activeBadge}</Text>
                  </View>
                )}

                <View style={styles.cardMainRow}>
                  {/* Vehicle Thumbnail or Icon */}
                  {veh.image ? (
                    <Image
                      source={{ uri: veh.image }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.iconAvatar}>
                      <Text style={styles.iconAvatarText}>{veh.vehicleIcon || '🚚'}</Text>
                    </View>
                  )}

                  {/* Vehicle Details */}
                  <View style={styles.detailsCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.makeModelText} numberOfLines={1}>
                        {veh.makeModel || 'Registered Vehicle'}
                      </Text>
                    </View>

                    <Text style={styles.typeLabelText}>
                      {veh.vehicleTypeLabel || 'Logistics Vehicle'} • 📍 {veh.district || 'Western'}
                    </Text>

                    {/* Badges Row */}
                    <View style={styles.badgesRow}>
                      {/* Plate Number */}
                      <View style={styles.platePill}>
                        <Text style={styles.platePillText}>🇱🇰 {veh.plateNumber || 'WP-NB-4482'}</Text>
                      </View>

                      {/* Capacity */}
                      <View style={styles.capBadge}>
                        <Text style={styles.capBadgeText}>
                          📦 {veh.capacity ? `${veh.capacity} kg` : '3500 kg'}
                        </Text>
                      </View>

                      {/* Cold chain */}
                      {veh.hasColdChain ? (
                        <View style={styles.coldBadge}>
                          <Text style={styles.coldBadgeText}>{t.coldChain}</Text>
                        </View>
                      ) : (
                        <View style={styles.ambientBadge}>
                          <Text style={styles.ambientBadgeText}>{t.ambient}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Card Actions Footer */}
                <View style={styles.cardFooter}>
                  {/* Set Active Button */}
                  {!isThisActive ? (
                    <TouchableOpacity
                      style={styles.setActiveBtn}
                      disabled={isBusy}
                      onPress={() => handleSetActive(veh)}
                      activeOpacity={0.8}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={THEME.emerald} />
                      ) : (
                        <Text style={styles.setActiveBtnText}>{t.setActiveBtn}</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inUseStatus}>
                      <Text style={styles.inUseStatusText}>🟢 Currently In Use</Text>
                    </View>
                  )}

                  <View style={styles.footerRightButtons}>
                    {/* Edit */}
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onEditVehicle(veh)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editBtnText}>{t.editBtn}</Text>
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      disabled={isBusy}
                      onPress={() => handleDelete(veh)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteBtnText}>{t.deleteBtn}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* BOTTOM ADD VEHICLE BUTTON */}
        {vehicles.length > 0 && (
          <TouchableOpacity
            style={styles.bottomAddBtn}
            onPress={onAddNewVehicle}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomAddBtnText}>{t.addVehicleBtn}</Text>
          </TouchableOpacity>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 2,
  },
  headerAddBtn: {
    backgroundColor: THEME.emerald,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    backgroundColor: THEME.bg,
    padding: 16,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: 'normal',
    color: THEME.textMuted,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: THEME.border,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  vehicleCardActive: {
    borderColor: THEME.emerald,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  activeBanner: {
    backgroundColor: THEME.emeraldLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  activeBannerText: {
    color: THEME.emeraldDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  iconAvatar: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  iconAvatarText: {
    fontSize: 36,
  },
  detailsCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  makeModelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  typeLabelText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  platePill: {
    backgroundColor: THEME.navy,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  platePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  capBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  capBadgeText: {
    color: THEME.textDark,
    fontSize: 10,
    fontWeight: '600',
  },
  coldBadge: {
    backgroundColor: THEME.cyanLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  coldBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ambientBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  ambientBadgeText: {
    color: THEME.textMuted,
    fontSize: 10,
  },

  // Card Footer Actions
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  setActiveBtn: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.emerald,
  },
  setActiveBtnText: {
    color: THEME.emeraldDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  inUseStatus: {
    paddingVertical: 6,
  },
  inUseStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  footerRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textDark,
  },
  deleteBtn: {
    backgroundColor: THEME.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.error,
  },

  // Empty State
  emptyContainer: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: THEME.emerald,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Bottom Add Button
  bottomAddBtn: {
    backgroundColor: THEME.emerald,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: THEME.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

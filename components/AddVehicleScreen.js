import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  addDriverVehicle,
  updateDriverVehicle,
  saveDriverVehicle,
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
  borderActive: '#16A34A',
  error: '#EF4444',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
};

const VEHICLE_TYPES = [
  { id: 'lorry_heavy', labelEn: 'Standard Lorry (3.5T - 10T)', labelSi: 'ලොරි රථය (3.5T - 10T)', labelTa: 'லாரி (3.5T - 10T)', icon: '🚚', defaultCap: '3500' },
  { id: 'mini_lorry', labelEn: 'Mini Lorry / Dimo Batta (1T - 2.5T)', labelSi: 'කුඩා ලොරි / ඩිමෝ බට්ටා (1T - 2.5T)', labelTa: 'மினி லாரி (1T - 2.5T)', icon: '🛻', defaultCap: '1500' },
  { id: 'cold_chain', labelEn: 'Refrigerated / Insulated Truck', labelSi: 'ශීතකරණ / පරිවරණය කළ රථය', labelTa: 'குளிரூட்டப்பட்ட வாகனம்', icon: '❄️', defaultCap: '3000' },
  { id: 'pickup', labelEn: 'Pickup / Crew Cab', labelSi: 'පිකප් රථය', labelTa: 'பிக்கப் வாகனம்', icon: '🚙', defaultCap: '1000' },
  { id: 'three_wheeler', labelEn: '3-Wheeler Cargo Carrier', labelSi: 'ත්‍රිවිල් භාණ්ඩ ප්‍රවාහන රථය', labelTa: '3-சக்கர சரக்கு வாகனம்', icon: '🛺', defaultCap: '500' },
  { id: 'tractor', labelEn: 'Farm Tractor & Trailer', labelSi: 'ට්‍රැක්ටර් සහ ට්‍රේලර්', labelTa: 'டிராக்டர் & டிரெய்லர்', icon: '🚜', defaultCap: '4000' },
];

const CAPACITY_PRESETS = ['500', '1000', '1500', '2500', '3500', '5000', '8000'];

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const DEFAULT_VEHICLE_IMAGES = {
  lorry_heavy: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
  mini_lorry: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=600&q=80',
  cold_chain: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  pickup: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
  three_wheeler: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  tractor: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=600&q=80',
};

const TRANSLATIONS = {
  en: {
    titleAdd: 'Register My Vehicle',
    titleEdit: 'Edit Vehicle Details',
    subtitle: 'Add your transport fleet vehicle for farm pickup and delivery routes',
    sectionType: '1. Select Vehicle Classification',
    sectionDetails: '2. Vehicle Identification & Model',
    sectionCapacity: '3. Cargo Capacity & Perishable Handling',
    sectionDistrict: '4. Base Operating District',
    sectionPhoto: '5. Vehicle Photograph',
    plateLabel: 'Vehicle Registration / Plate Number *',
    platePlaceholder: 'e.g. WP-NB-4482 or CP-DA-1234',
    makeModelLabel: 'Make & Model / Vehicle Name *',
    makeModelPlaceholder: 'e.g. Isuzu Elf 3.5T / Tata Dimo Batta EX',
    capacityLabel: 'Maximum Payload Capacity (kg) *',
    capacityPlaceholder: 'e.g. 3500',
    capacityHint: 'kg (kilograms)',
    coldChainTitle: 'Cold Storage / Insulation Available ❄️',
    coldChainSub: 'Enable if your vehicle has refrigeration or insulated lining for fresh fruits and vegetables.',
    districtLabel: 'Base Operating District *',
    districtPlaceholder: 'Select base district...',
    photoUploadTitle: 'Upload Vehicle Photo',
    photoUploadSub: 'Helps farmers and buyers identify your vehicle upon arrival at pickup points.',
    chooseGallery: 'Choose from Gallery',
    takePhoto: 'Take a Photo',
    removePhoto: 'Remove Photo',
    submitBtnAdd: 'Register Vehicle to Fleet 🚛',
    submitBtnEdit: 'Save Vehicle Changes ✅',
    cancel: 'Cancel',
    successTitle: 'Vehicle Saved Successfully! 🎉',
    successMsgAdd: 'Your vehicle has been registered to your driver profile and is ready for cargo assignments.',
    successMsgEdit: 'Your vehicle details have been updated.',
    fillRequired: 'Please fill in the Vehicle Registration Plate and Make/Model.',
  },
  si: {
    titleAdd: 'මගේ වාහනය ලියාපදිංචි කරන්න',
    titleEdit: 'වාහන විස්තර සංස්කරණය',
    subtitle: 'අස්වනු ප්‍රවාහන මෙහෙයුම් සඳහා ඔබගේ වාහන තොරතුරු ඇතුළත් කරන්න',
    sectionType: '1. වාහන වර්ගය තෝරන්න',
    sectionDetails: '2. වාහන අංකය සහ මාදිලිය',
    sectionCapacity: '3. උපරිම බර ධාරිතාවය සහ ශීතකරණ පහසුකම්',
    sectionDistrict: '4. ප්‍රවාහන මෙහෙයුම් දිස්ත්‍රික්කය',
    sectionPhoto: '5. වාහනයේ ඡායාරූපය',
    plateLabel: 'ලියාපදිංචි අංක තහඩුව *',
    platePlaceholder: 'උදා: WP-NB-4482 හෝ CP-DA-1234',
    makeModelLabel: 'වාහනයේ වර්ගය සහ මාදිලිය *',
    makeModelPlaceholder: 'උදා: Isuzu Elf 3.5T / Tata Dimo Batta',
    capacityLabel: 'උපරිම බර ධාරිතාව (kg) *',
    capacityPlaceholder: 'උදා: 3500',
    capacityHint: 'කිලෝග්‍රෑම් (kg)',
    coldChainTitle: 'ශීතකරණ / පරිවරණ පහසුකම් ඇත ❄️',
    coldChainSub: 'නැවුම් එළවළු සහ පලතුරු සඳහා ශීතකරණ හෝ තාප පරිවරණ සහිත නම් සක්‍රිය කරන්න.',
    districtLabel: 'ප්‍රධාන දිස්ත්‍රික්කය *',
    districtPlaceholder: 'දිස්ත්‍රික්කය තෝරන්න...',
    photoUploadTitle: 'වාහනයේ ඡායාරූපය එක් කරන්න',
    photoUploadSub: 'අස්වනු ලබාගැනීමේදී ගොවීන්ට ඔබව හඳුනාගැනීමට උපකාරී වේ.',
    chooseGallery: 'ගැලරියෙන් තෝරන්න',
    takePhoto: 'ඡායාරූපයක් ගන්න',
    removePhoto: 'ඡායාරූපය ඉවත් කරන්න',
    submitBtnAdd: 'වාහනය ලියාපදිංචි කරන්න 🚛',
    submitBtnEdit: 'වෙනස්කම් සුරකින්න ✅',
    cancel: 'අවලංගු කරන්න',
    successTitle: 'වාහන විස්තර සාර්ථකව සුරැකිණි! 🎉',
    successMsgAdd: 'ඔබගේ වාහනය සාර්ථකව ලියාපදිංචි විය.',
    successMsgEdit: 'වාහන තොරතුරු යාවත්කාලීන විය.',
    fillRequired: 'කරුණාකර වාහන අංකය සහ මාදිලිය ඇතුළත් කරන්න.',
  },
  ta: {
    titleAdd: 'வாகனத்தை பதிவு செய்யவும்',
    titleEdit: 'வாகன விவரங்களை மாற்றவும்',
    subtitle: 'விவசாய விநியோகத்திற்கான உங்கள் வாகன விவரங்களை உள்ளிடவும்',
    sectionType: '1. வாகன வகையைத் தேர்ந்தெடுக்கவும்',
    sectionDetails: '2. பதிவு எண் & மாதிரி',
    sectionCapacity: '3. சுமை திறன் & குளிரூட்டல்',
    sectionDistrict: '4. இயக்க மாவட்டம்',
    sectionPhoto: '5. வாகன புகைப்படம்',
    plateLabel: 'வாகன பதிவு எண் *',
    platePlaceholder: 'உதா: WP-NB-4482 அல்லது CP-DA-1234',
    makeModelLabel: 'வாகன மாதிரி *',
    makeModelPlaceholder: 'உதா: Isuzu Elf 3.5T / Tata Dimo Batta',
    capacityLabel: 'அதிகபட்ச சுமை திறன் (kg) *',
    capacityPlaceholder: 'உதா: 3500',
    capacityHint: 'கிலோ (kg)',
    coldChainTitle: 'குளிரூட்டல் வசதி உள்ளது ❄️',
    coldChainSub: 'காய்கறிகள் மற்றும் பழங்களுக்கான குளிரூட்டல் வசதி இருந்தால் இயக்கவும்.',
    districtLabel: 'இயக்க மாவட்டம் *',
    districtPlaceholder: 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்...',
    photoUploadTitle: 'வாகன புகைப்படம் பதிவேற்றவும்',
    photoUploadSub: 'விவசாயிகள் உங்கள் வாகனத்தை எளிதில் அடையாளம் காண உதவும்.',
    chooseGallery: 'கேலரியில் இருந்து',
    takePhoto: 'புகைப்படம் எடு',
    removePhoto: 'புகைப்படத்தை அகற்று',
    submitBtnAdd: 'வாகனத்தை பதிவு செய் 🚛',
    submitBtnEdit: 'சேமிக்கவும் ✅',
    cancel: 'ரத்து',
    successTitle: 'வாகனம் வெற்றிகரமாக சேமிக்கப்பட்டது! 🎉',
    successMsgAdd: 'உங்கள் வாகனம் பதிவு செய்யப்பட்டு தயாராக உள்ளது.',
    successMsgEdit: 'விவரங்கள் புதுப்பிக்கப்பட்டன.',
    fillRequired: 'தயவுசெய்து பதிவு எண் மற்றும் மாதிரியை நிரப்பவும்.',
  },
};

export default function AddVehicleScreen({
  userProfile,
  lang = 'en',
  onBack,
  onVehicleSaved,
  initialVehicle = null,
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isEditing = Boolean(initialVehicle && (initialVehicle.plateNumber || initialVehicle.makeModel));

  const [vehicleType, setVehicleType] = useState(() => initialVehicle?.vehicleType || 'lorry_heavy');
  const [plateNumber, setPlateNumber] = useState(() => initialVehicle?.plateNumber || '');
  const [makeModel, setMakeModel] = useState(() => initialVehicle?.makeModel || '');
  const [capacity, setCapacity] = useState(() => (initialVehicle?.capacity ? String(initialVehicle.capacity) : '3500'));
  const [hasColdChain, setHasColdChain] = useState(() => Boolean(initialVehicle?.hasColdChain));
  const [district, setDistrict] = useState(() => initialVehicle?.district || userProfile?.district?.nameEn || 'Western Province');
  const [selectedImage, setSelectedImage] = useState(() => initialVehicle?.image || null);

  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [imageActionModalVisible, setImageActionModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle vehicle type change
  const handleSelectVehicleType = (type) => {
    setVehicleType(type.id);
    if (!capacity || capacity === '0') {
      setCapacity(type.defaultCap);
    }
    if (type.id === 'cold_chain') {
      setHasColdChain(true);
    }
  };

  // Image picking
  const pickFromGallery = async () => {
    setImageActionModalVisible(false);
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImage(event.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } catch (err) {
        console.error('Web file picker error:', err);
      }
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are needed to select vehicle photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Gallery pick error:', e);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const takePhotoWithCamera = async () => {
    setImageActionModalVisible(false);
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture a photo of your vehicle.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Camera capture error:', e);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!plateNumber.trim() || !makeModel.trim()) {
      Alert.alert('Incomplete Information', t.fillRequired);
      return;
    }

    const currentTypeObj = VEHICLE_TYPES.find((v) => v.id === vehicleType) || VEHICLE_TYPES[0];
    const typeLabel = lang === 'si' ? currentTypeObj.labelSi : lang === 'ta' ? currentTypeObj.labelTa : currentTypeObj.labelEn;

    const vehiclePayload = {
      vehicleType,
      vehicleTypeLabel: typeLabel,
      vehicleIcon: currentTypeObj.icon,
      plateNumber: plateNumber.trim().toUpperCase(),
      makeModel: makeModel.trim(),
      capacity: Number(capacity) || 1000,
      hasColdChain,
      district,
      image: selectedImage || DEFAULT_VEHICLE_IMAGES[vehicleType] || DEFAULT_VEHICLE_IMAGES.lorry_heavy,
      isVerified: true,
      driverName: userProfile?.fullName || 'GoviLink Driver',
      driverPhone: userProfile?.phoneNumber || '',
    };

    setIsSubmitting(true);
    let result;
    if (initialVehicle?.id) {
      result = await updateDriverVehicle(initialVehicle.id, vehiclePayload, userProfile?.uid);
    } else {
      result = await addDriverVehicle(userProfile?.uid, vehiclePayload);
    }
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        t.successTitle,
        isEditing ? t.successMsgEdit : t.successMsgAdd,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onVehicleSaved) onVehicleSaved(result.vehicle);
              if (onBack) onBack();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error Saving Vehicle', result.error || 'Failed to save vehicle details to database.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{isEditing ? t.titleEdit : t.titleAdd}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{t.subtitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. VEHICLE TYPE SELECTOR */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.sectionType}</Text>
            <View style={styles.typesGrid}>
              {VEHICLE_TYPES.map((type) => {
                const isSelected = vehicleType === type.id;
                const label = lang === 'si' ? type.labelSi : lang === 'ta' ? type.labelTa : type.labelEn;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                    onPress={() => handleSelectVehicleType(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                      {label}
                    </Text>
                    {isSelected && (
                      <View style={styles.typeCheckBadge}>
                        <Text style={styles.typeCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. IDENTIFICATION & MODEL */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.sectionDetails}</Text>

            {/* License Plate Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.plateLabel}</Text>
              <TextInput
                style={styles.textInput}
                value={plateNumber}
                onChangeText={setPlateNumber}
                placeholder={t.platePlaceholder}
                placeholderTextColor={THEME.placeholder}
                autoCapitalize="characters"
              />
            </View>

            {/* Make & Model */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.makeModelLabel}</Text>
              <TextInput
                style={styles.textInput}
                value={makeModel}
                onChangeText={setMakeModel}
                placeholder={t.makeModelPlaceholder}
                placeholderTextColor={THEME.placeholder}
              />
            </View>
          </View>

          {/* 3. PAYLOAD CAPACITY & COLD STORAGE */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.sectionCapacity}</Text>

            {/* Capacity Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.capacityLabel}</Text>
              <View style={styles.capacityInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder={t.capacityPlaceholder}
                  placeholderTextColor={THEME.placeholder}
                  keyboardType="numeric"
                />
                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>{t.capacityHint}</Text>
                </View>
              </View>

              {/* Quick Capacity Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {CAPACITY_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, capacity === preset && styles.presetChipActive]}
                    onPress={() => setCapacity(preset)}
                  >
                    <Text style={[styles.presetChipText, capacity === preset && styles.presetChipTextActive]}>
                      {Number(preset) >= 1000 ? `${(Number(preset)/1000).toFixed(1)}T (${preset}kg)` : `${preset}kg`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Cold Chain Toggle */}
            <View style={styles.coldChainRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.coldChainTitle}>{t.coldChainTitle}</Text>
                <Text style={styles.coldChainSub}>{t.coldChainSub}</Text>
              </View>
              <Switch
                value={hasColdChain}
                onValueChange={setHasColdChain}
                trackColor={{ false: '#CBD5E1', true: THEME.accentLeaf }}
                thumbColor={hasColdChain ? THEME.navy : '#FFFFFF'}
              />
            </View>
          </View>

          {/* 4. BASE OPERATING DISTRICT */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.sectionDistrict}</Text>
            <TouchableOpacity
              style={styles.districtSelector}
              onPress={() => setDistrictModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.districtIcon}>📍</Text>
              <Text style={styles.districtText}>
                {district || t.districtPlaceholder}
              </Text>
              <Text style={styles.chevronText}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* 5. VEHICLE PHOTO */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.sectionPhoto}</Text>
            <Text style={styles.photoUploadSub}>{t.photoUploadSub}</Text>

            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.changeImageBtn}
                  onPress={() => setImageActionModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.changeImageBtnText}>📷 Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadPlaceholder}
                onPress={() => setImageActionModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadCameraIcon}>📸</Text>
                <Text style={styles.uploadPromptTitle}>{t.photoUploadTitle}</Text>
                <Text style={styles.uploadPromptSub}>Tap to upload or take a snapshot</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? t.submitBtnEdit : t.submitBtnAdd}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DISTRICT SELECTION MODAL */}
      <Modal visible={districtModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Operating District</Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.districtList} showsVerticalScrollIndicator={false}>
              {DISTRICTS.map((dist) => (
                <TouchableOpacity
                  key={dist}
                  style={[styles.districtItem, district === dist && styles.districtItemActive]}
                  onPress={() => {
                    setDistrict(dist);
                    setDistrictModalVisible(false);
                  }}
                >
                  <Text style={[styles.districtItemText, district === dist && styles.districtItemTextActive]}>
                    📍 {dist}
                  </Text>
                  {district === dist && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* IMAGE ACTION MODAL */}
      <Modal visible={imageActionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.imageActionSheet}>
            <Text style={styles.modalTitle}>{t.photoUploadTitle}</Text>
            <TouchableOpacity style={styles.actionOptionBtn} onPress={pickFromGallery}>
              <Text style={styles.actionOptionIcon}>🖼️</Text>
              <Text style={styles.actionOptionText}>{t.chooseGallery}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOptionBtn} onPress={takePhotoWithCamera}>
              <Text style={styles.actionOptionIcon}>📸</Text>
              <Text style={styles.actionOptionText}>{t.takePhoto}</Text>
            </TouchableOpacity>

            {selectedImage && (
              <TouchableOpacity
                style={[styles.actionOptionBtn, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setSelectedImage(null);
                  setImageActionModalVisible(false);
                }}
              >
                <Text style={styles.actionOptionIcon}>🗑️</Text>
                <Text style={[styles.actionOptionText, { color: THEME.error }]}>{t.removePhoto}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setImageActionModalVisible(false)}
            >
              <Text style={styles.cancelModalBtnText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginRight: 12,
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
  scrollContent: {
    backgroundColor: THEME.bg,
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 12,
  },

  // Vehicle Types Grid
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: THEME.emerald,
    backgroundColor: THEME.emeraldLight,
  },
  typeIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textDark,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: THEME.emeraldDark,
    fontWeight: 'bold',
  },
  typeCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: THEME.emerald,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Inputs
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.textDark,
  },
  capacityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  chipsScroll: {
    marginTop: 10,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  presetChipActive: {
    backgroundColor: THEME.emerald,
    borderColor: THEME.emerald,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textDark,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },

  // Cold Chain Row
  coldChainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.cyanLight,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 8,
  },
  coldChainTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  coldChainSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
    lineHeight: 15,
  },

  // District Selector
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  districtIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  districtText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
  },
  chevronText: {
    fontSize: 11,
    color: THEME.textMuted,
  },

  // Photo Upload
  photoUploadSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadCameraIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  uploadPromptTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  changeImageBtn: {
    backgroundColor: 'rgba(11, 37, 69, 0.85)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeImageBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Submit Button
  submitButton: {
    backgroundColor: THEME.emerald,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textMuted,
  },
  districtList: {
    marginTop: 10,
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  districtItemActive: {
    backgroundColor: THEME.emeraldLight,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  districtItemText: {
    fontSize: 14,
    color: THEME.textDark,
  },
  districtItemTextActive: {
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  checkIcon: {
    color: THEME.emeraldDark,
    fontWeight: 'bold',
  },

  imageActionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
  },
  cancelModalBtn: {
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textMuted,
  },
});

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
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addProduceListing, updateProduceListing } from '../services/firebaseDatabase';

// ----------------------------------------------------
// THEME & COLOR PALETTE (MATCHING THE DESIGN SPEC)
// ----------------------------------------------------
const THEME = {
  headerGreen: '#006837',
  titleGreen: '#005A2B',
  buttonGreen: '#006837',
  iconGreen: '#1E3A2F',
  borderGreen: '#D1E7DD',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textDark: '#1E293B',
  textMuted: '#64748B',
  placeholder: '#94A3B8',
  border: '#CBD5E1',
  borderActive: '#006837',
  error: '#EF4444',
  lightGreenBg: '#F0FDF4',
  inputBg: '#FFFFFF',
};

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Spices',
  'Tea & Beverages',
  'Coconut & Palm',
  'Root Crops',
];

const UNITS = ['Kg', 'g', 'Bundles', 'Bags', 'Boxes', 'Units'];

const DEFAULT_IMAGES = {
  Vegetables: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
  Fruits: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  Grains: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  Spices: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
  'Tea & Beverages': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  'Coconut & Palm': 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
  'Root Crops': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
};

// SVG-like Vector Icons using React Native Views
const BackArrowIcon = () => (
  <View style={styles.backIconWrap}>
    <View style={styles.backArrowHead} />
    <View style={styles.backArrowStem} />
  </View>
);

const UploadImageIcon = () => (
  <View style={styles.uploadIconContainer}>
    <View style={styles.uploadMountain} />
    <View style={styles.uploadSun} />
    <View style={styles.uploadCornerFolder} />
  </View>
);

const ChevronDownIcon = () => (
  <View style={styles.chevronWrap}>
    <View style={styles.chevronLeft} />
    <View style={styles.chevronRight} />
  </View>
);

const CalendarIcon = () => (
  <View style={styles.calendarWrap}>
    <View style={styles.calendarBody}>
      <View style={styles.calendarHeader} />
      <View style={styles.calendarPinsRow}>
        <View style={styles.calendarPin} />
        <View style={styles.calendarPin} />
      </View>
    </View>
  </View>
);

export default function AddProduceScreen({
  userProfile,
  lang = 'en',
  onBack,
  onProduceAdded,
  initialProduce = null,
}) {
  const isEditing = Boolean(initialProduce && initialProduce.id);
  const [productName, setProductName] = useState(() => initialProduce?.nameEn || initialProduce?.nameSi || '');
  const [category, setCategory] = useState(() => initialProduce?.category || '');
  const [quantity, setQuantity] = useState(() => (initialProduce?.stockQty != null ? String(initialProduce.stockQty) : ''));
  const [unit, setUnit] = useState(() => initialProduce?.unitEn || 'Kg');
  const [price, setPrice] = useState(() => (initialProduce?.price != null ? String(initialProduce.price) : ''));
  const [harvestDate, setHarvestDate] = useState(() => {
    if (initialProduce?.harvestDate) return initialProduce.harvestDate;
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  });
  const [selectedImage, setSelectedImage] = useState(() => initialProduce?.image || null);
  const [description, setDescription] = useState(() => initialProduce?.description || '');

  // Modals
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [imageActionModalVisible, setImageActionModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pick Image from Gallery
  const pickFromGallery = async () => {
    if (Platform.OS === 'web') {
      setImageActionModalVisible(false);
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

    // Native (Android / iOS)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Gallery picker primary attempt failed, trying fallback:', error);
      try {
        const fallbackResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
        if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets.length > 0) {
          setSelectedImage(fallbackResult.assets[0].uri);
        }
      } catch (err) {
        console.error('Fallback gallery picker failed:', err);
        Alert.alert('Gallery Error', err.message || 'Could not open photo gallery.');
      }
    } finally {
      setImageActionModalVisible(false);
    }
  };

  // Take Image with Camera
  const takeFromCamera = async () => {
    if (Platform.OS === 'web') {
      setImageActionModalVisible(false);
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
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
        console.error('Web camera picker error:', err);
      }
      return;
    }

    // Native (Android / iOS)
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Needed',
          'Please allow camera access in your device settings to take fresh produce photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Camera primary attempt failed, trying fallback:', error);
      try {
        const fallbackResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
        if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets.length > 0) {
          setSelectedImage(fallbackResult.assets[0].uri);
        }
      } catch (err) {
        console.error('Fallback camera failed:', err);
        Alert.alert('Camera Error', err.message || 'Could not open camera.');
      }
    } finally {
      setImageActionModalVisible(false);
    }
  };

  const handlePublish = async () => {
    if (!productName.trim()) {
      Alert.alert('Required Field', 'Please enter the product name.');
      return;
    }
    if (!category) {
      Alert.alert('Required Field', 'Please select a produce category.');
      return;
    }
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert('Required Field', 'Please enter a valid quantity.');
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      Alert.alert('Required Field', 'Please enter a valid price per unit.');
      return;
    }

    setIsSubmitting(true);

    const produceImageUrl =
      selectedImage ||
      initialProduce?.image ||
      DEFAULT_IMAGES[category] ||
      DEFAULT_IMAGES.Vegetables;

    const produceData = {
      nameEn: productName.trim(),
      nameSi: productName.trim(),
      nameTa: productName.trim(),
      category: category,
      price: parseFloat(price),
      stockQty: parseFloat(quantity),
      unitEn: unit,
      unitSi: unit === 'Kg' ? 'කි.ග්‍රෑ.' : unit,
      unitTa: unit === 'Kg' ? 'கிலோ' : unit,
      harvestDate: harvestDate || '',
      description: description.trim(),
      location: initialProduce?.location || userProfile?.district?.nameEn || 'Nuwara Eliya',
      grade: initialProduce?.grade || 'Fresh Harvest',
      farmerName: userProfile?.fullName || initialProduce?.farmerName || 'Verified Farmer',
      farmerId: userProfile?.uid || initialProduce?.farmerId || 'farmer_uid',
      farmerPhone: userProfile?.phoneNumber || initialProduce?.farmerPhone || '',
      image: produceImageUrl,
    };

    let res;
    if (isEditing) {
      res = await updateProduceListing(initialProduce.id, produceData);
    } else {
      res = await addProduceListing(produceData);
    }
    setIsSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Success 🌱',
        isEditing ? 'Produce listing updated successfully!' : 'Produce listing published successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onProduceAdded) onProduceAdded();
              else if (onBack) onBack();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', res.error || `Failed to ${isEditing ? 'update' : 'publish'} produce listing.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>GoviLink</Text>

        {/* Spacer to maintain perfect center alignment */}
        <View style={styles.headerIconButtonPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* PAGE TITLE */}
          <Text style={styles.pageHeading}>
            {isEditing ? 'EDIT PRODUCE DETAILS' : 'ADD NEW PRODUCE'}
          </Text>

          {/* UPLOAD IMAGE BOX */}
          <TouchableOpacity
            style={[
              styles.uploadBox,
              selectedImage && styles.uploadBoxWithImage,
            ]}
            onPress={() => setImageActionModalVisible(true)}
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <View style={styles.changeImageBadge}>
                  <Text style={styles.changeImageText}>Change Image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholderContent}>
                <UploadImageIcon />
                <Text style={styles.uploadText}>UPLOAD IMAGE</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* PRODUCT NAME */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>PRODUCT NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Organic Tomatoes"
              placeholderTextColor={THEME.placeholder}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* CATEGORY DROPDOWN */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>CATEGORY</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  !category && styles.dropdownPlaceholder,
                ]}
              >
                {category || 'Select Category'}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>

          {/* QUANTITY & UNIT ROW */}
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>QUANTITY</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={THEME.placeholder}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>UNIT</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setUnitModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownButtonText}>{unit}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>
          </View>

          {/* PRICE (PER UNIT) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>PRICE (PER UNIT)</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencyPrefix}>Rs.</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor={THEME.placeholder}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* HARVEST DATE */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>HARVEST DATE</Text>
            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => setDateModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateInputText,
                  !harvestDate && styles.dropdownPlaceholder,
                ]}
              >
                {harvestDate || 'mm/dd/yyyy'}
              </Text>
              <CalendarIcon />
            </TouchableOpacity>
          </View>

          {/* DESCRIPTION / NOTES */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>DESCRIPTION / NOTES</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Freshly hand-picked, organic grade, pesticide-free harvest."
              placeholderTextColor={THEME.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handlePublish}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>
                {isEditing ? 'SAVE CHANGES' : 'PUBLISH PRODUCT'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ======================================================== */}
      {/* MODAL: IMAGE UPLOAD OPTIONS (GALLERY vs CAMERA)          */}
      {/* ======================================================== */}
      <Modal
        visible={imageActionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImageActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop button to close modal */}
          <Pressable
            style={styles.modalBackdropPressable}
            onPress={() => setImageActionModalVisible(false)}
          />

          {/* Action sheet content (sibling to backdrop) */}
          <View style={styles.actionSheetCard}>
            <Text style={styles.actionSheetTitle}>Upload Produce Image</Text>
            <Text style={styles.actionSheetSub}>Choose how you want to add photo:</Text>

            {/* Option 1: Select from Gallery */}
            <TouchableOpacity
              style={styles.actionSheetBtn}
              onPress={pickFromGallery}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconBox}>
                <Text style={styles.actionIconEmoji}>🖼️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionBtnTitle}>Select from Gallery</Text>
                <Text style={styles.actionBtnSub}>Choose an existing photo from your library</Text>
              </View>
              <Text style={styles.actionArrow}>➔</Text>
            </TouchableOpacity>

            {/* Option 2: Take Photo from Camera */}
            <TouchableOpacity
              style={styles.actionSheetBtn}
              onPress={takeFromCamera}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.actionIconEmoji}>📷</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionBtnTitle}>Take Photo from Camera</Text>
                <Text style={styles.actionBtnSub}>Capture fresh harvest directly with camera</Text>
              </View>
              <Text style={styles.actionArrow}>➔</Text>
            </TouchableOpacity>

            {/* Optional: Remove Image */}
            {selectedImage && (
              <TouchableOpacity
                style={styles.removeImageActionBtn}
                onPress={() => {
                  setSelectedImage(null);
                  setImageActionModalVisible(false);
                }}
              >
                <Text style={styles.removeImageActionText}>✕ Remove Selected Image</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.actionCancelBtn}
              onPress={() => setImageActionModalVisible(false)}
            >
              <Text style={styles.actionCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: CATEGORY SELECTOR                                 */}
      {/* ======================================================== */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.modalOptionItem,
                    category === cat && styles.modalOptionItemActive,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      category === cat && styles.modalOptionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                  {category === cat && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: UNIT SELECTOR                                     */}
      {/* ======================================================== */}
      <Modal visible={unitModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setUnitModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Unit</Text>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.modalOptionItem,
                  unit === u && styles.modalOptionItemActive,
                ]}
                onPress={() => {
                  setUnit(u);
                  setUnitModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    unit === u && styles.modalOptionTextActive,
                  ]}
                >
                  {u}
                </Text>
                {unit === u && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: DATE SELECTOR / PRESETS                          */}
      {/* ======================================================== */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Harvest Date</Text>
            <TouchableOpacity
              style={styles.modalOptionItem}
              onPress={() => {
                const today = new Date();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const yyyy = today.getFullYear();
                setHarvestDate(`${mm}/${dd}/${yyyy}`);
                setDateModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>Today (Freshly Harvested)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOptionItem}
              onPress={() => {
                const yesterday = new Date(Date.now() - 86400000);
                const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
                const dd = String(yesterday.getDate()).padStart(2, '0');
                const yyyy = yesterday.getFullYear();
                setHarvestDate(`${mm}/${dd}/${yyyy}`);
                setDateModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>Yesterday</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOptionItem}
              onPress={() => {
                const tomorrow = new Date(Date.now() + 86400000);
                const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
                const dd = String(tomorrow.getDate()).padStart(2, '0');
                const yyyy = tomorrow.getFullYear();
                setHarvestDate(`${mm}/${dd}/${yyyy}`);
                setDateModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>Tomorrow (Scheduled Harvest)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// STYLESHEET (MATCHING THE SCREENSHOT EXACTLY)
// ----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconButton: {
    padding: 6,
  },
  headerIconButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.headerGreen,
    letterSpacing: -0.3,
  },

  /* Vector Back Arrow */
  backArrowWrapper: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowStem: {
    position: 'absolute',
    width: 14,
    height: 2.2,
    backgroundColor: THEME.iconGreen,
    borderRadius: 1,
    left: 4,
  },
  backArrowHeadTop: {
    position: 'absolute',
    width: 8,
    height: 2.2,
    backgroundColor: THEME.iconGreen,
    borderRadius: 1,
    left: 3,
    top: 6.5,
    transform: [{ rotate: '-45deg' }],
  },
  backArrowHeadBottom: {
    position: 'absolute',
    width: 8,
    height: 2.2,
    backgroundColor: THEME.iconGreen,
    borderRadius: 1,
    left: 3,
    bottom: 6.5,
    transform: [{ rotate: '45deg' }],
  },

  /* Main Container */
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.titleGreen,
    letterSpacing: 0.5,
    marginBottom: 20,
  },

  /* Upload Box */
  uploadBox: {
    width: '100%',
    height: 210,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    overflow: 'hidden',
  },
  uploadBoxWithImage: {
    borderStyle: 'solid',
    borderColor: THEME.borderGreen,
  },
  uploadPlaceholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '700',
    color: THEME.iconGreen,
    letterSpacing: 1.5,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Vector Upload Icon */
  uploadIconContainer: {
    width: 44,
    height: 38,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadFrame: {
    width: 38,
    height: 32,
    borderWidth: 2.2,
    borderColor: THEME.iconGreen,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  mountainLeft: {
    position: 'absolute',
    bottom: -4,
    left: 2,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: THEME.iconGreen,
    transform: [{ rotate: '45deg' }],
  },
  mountainRight: {
    position: 'absolute',
    bottom: -6,
    right: 1,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: THEME.iconGreen,
    transform: [{ rotate: '-45deg' }],
  },
  uploadPlusBadge: {
    position: 'absolute',
    top: -4,
    right: 0,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusH: {
    position: 'absolute',
    width: 10,
    height: 2.2,
    backgroundColor: THEME.iconGreen,
    borderRadius: 1,
  },
  plusV: {
    position: 'absolute',
    width: 2.2,
    height: 10,
    backgroundColor: THEME.iconGreen,
    borderRadius: 1,
  },

  /* Form Elements */
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textDark,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: THEME.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    fontSize: 14,
    color: THEME.textDark,
  },
  textArea: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: THEME.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.textDark,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: THEME.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: THEME.textDark,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: THEME.placeholder,
    fontWeight: '400',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Price Input Container */
  priceInputContainer: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: THEME.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textDark,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: THEME.textDark,
    padding: 0,
  },

  /* Harvest Date Input */
  dateInputButton: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: THEME.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: 14,
    color: THEME.textDark,
  },

  /* Vector Chevron Down */
  chevronWrapper: {
    width: 14,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chevronLeft: {
    position: 'absolute',
    left: 1,
    top: 2,
    width: 7,
    height: 1.8,
    backgroundColor: THEME.textDark,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  chevronRight: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 7,
    height: 1.8,
    backgroundColor: THEME.textDark,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },

  /* Vector Calendar Icon */
  calendarWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBody: {
    width: 16,
    height: 15,
    borderWidth: 1.6,
    borderColor: THEME.iconGreen,
    borderRadius: 3,
    position: 'relative',
  },
  calendarHeader: {
    width: '100%',
    height: 4,
    backgroundColor: THEME.iconGreen,
  },
  calendarPinsRow: {
    position: 'absolute',
    top: -4,
    left: 2,
    right: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarPin: {
    width: 2,
    height: 4,
    backgroundColor: THEME.iconGreen,
    borderRadius: 1,
  },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  publishButton: {
    height: 52,
    backgroundColor: THEME.buttonGreen,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* Action Sheet Modal (Camera & Gallery) */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textDark,
    textAlign: 'center',
  },
  actionSheetSub: {
    fontSize: 13,
    color: THEME.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: THEME.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionIconEmoji: {
    fontSize: 22,
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textDark,
  },
  actionBtnSub: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 16,
    color: THEME.headerGreen,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  removeImageActionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  removeImageActionText: {
    color: THEME.error,
    fontSize: 14,
    fontWeight: '700',
  },
  actionCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  actionCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textDark,
  },

  /* Standard Modal Styling (Categories, Units, Dates) */
  modalCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 12,
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionItemActive: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalOptionText: {
    fontSize: 14,
    color: THEME.textDark,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: THEME.headerGreen,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 14,
    color: THEME.headerGreen,
    fontWeight: 'bold',
  },
});

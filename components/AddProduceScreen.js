import React, { useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FARMER_COLORS as C } from './FarmerDesign';
import * as ImagePicker from 'expo-image-picker';
import { addProduceListing, updateProduceListing } from '../services/firebaseDatabase';

// ----------------------------------------------------
// THEME & COLOR PALETTE (MATCHING THE DESIGN SPEC)
// ----------------------------------------------------
const THEME = {
  headerGreen: C.green,
  titleGreen: C.ink,
  buttonGreen: C.green,
  iconGreen: C.ink,
  borderGreen: C.border,
  bg: C.canvas,
  cardBg: '#FFFFFF',
  textDark: C.ink,
  textMuted: C.muted,
  placeholder: '#94A3B8',
  border: C.border,
  borderActive: C.green,
  error: '#EF4444',
  lightGreenBg: C.mint,
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
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const DEFAULT_IMAGES = {
  Vegetables: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
  Fruits: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  Grains: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  Spices: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
  'Tea & Beverages': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  'Coconut & Palm': 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
  'Root Crops': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
};

function FormSection({ number, title, subtitle, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{number}</Text></View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export default function AddProduceScreen({
  userProfile,
  lang = 'en',
  onBack,
  onProduceAdded,
  initialProduce = null,
}) {
  const scrollRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const [formError, setFormError] = useState('');
  const showFormError = (message) => { setFormError(message); scrollRef.current?.scrollTo({ y: 0, animated: true }); };
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
  const sheetOffset = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(800);
  const isDismissing = useRef(false);
  const sheetPanResponder = useMemo(() => {
    const snapBack = () => Animated.spring(sheetOffset, {
      toValue: 0, tension: 90, friction: 14, useNativeDriver: false,
    }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => !isSubmitting && !isDismissing.current
        && gesture.dy > 6 && gesture.dy > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        sheetOffset.stopAnimation();
        Keyboard.dismiss();
      },
      onPanResponderMove: (_, gesture) => sheetOffset.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (!isSubmitting && (gesture.dy > 100 || (gesture.dy > 25 && gesture.vy > 0.7))) {
          isDismissing.current = true;
          Animated.timing(sheetOffset, {
            toValue: sheetHeight.current, duration: 180, useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) onBack?.();
          });
        } else snapBack();
      },
      onPanResponderTerminate: snapBack,
    });
  }, [isSubmitting, onBack, sheetOffset]);

  // Helper: Compress web images to keep memory and Firestore documents compact
  const compressWebImageDataUrl = (dataUrl, maxDim = 800, quality = 0.65) => {
    return new Promise((resolve) => {
      if (typeof Image === 'undefined') return resolve(dataUrl);
      try {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch (_e) {
        resolve(dataUrl);
      }
    });
  };

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
            reader.onload = async (event) => {
              if (event.target?.result) {
                const compressed = await compressWebImageDataUrl(event.target.result);
                setSelectedImage(compressed);
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
            reader.onload = async (event) => {
              if (event.target?.result) {
                const compressed = await compressWebImageDataUrl(event.target.result);
                setSelectedImage(compressed);
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
      showFormError('Enter a product name so buyers can find your harvest.');
      return;
    }
    if (!category) {
      showFormError('Choose a category for your harvest.');
      return;
    }
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      showFormError('Enter an available quantity greater than zero.');
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      showFormError('Enter a price per unit greater than zero.');
      return;
    }

    setFormError('');
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
      farmerUid: userProfile?.uid || initialProduce?.farmerUid || initialProduce?.farmerId || 'farmer_uid',
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
      if (Platform.OS === 'web') {
        window.alert(isEditing ? 'Harvest updated successfully.' : 'Harvest published successfully.');
        if (onProduceAdded) onProduceAdded();
        else if (onBack) onBack();
        return;
      }
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
      showFormError(res.error || `Could not ${isEditing ? 'update' : 'publish'} your harvest. Please try again.`);
    }
  };

  const closeForm = () => { if (!isSubmitting) onBack?.(); };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={closeForm} statusBarTranslucent>
      <View style={styles.popupOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeForm} disabled={isSubmitting}
          accessibilityRole="button" accessibilityLabel="Close harvest form" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.popupPositioner} pointerEvents="box-none">
          <AnimatedSafeAreaView edges={['bottom', 'left', 'right']}
            onLayout={(event) => { sheetHeight.current = event.nativeEvent.layout.height; }}
            style={[styles.popupSheet, { transform: [{ translateY: sheetOffset }] }]}
            accessibilityViewIsModal role={Platform.OS === 'web' ? 'dialog' : undefined}
            aria-modal={true} aria-label={isEditing ? 'Edit harvest' : 'Add new harvest'}>
            <View {...sheetPanResponder.panHandlers} style={styles.sheetDragArea}>
            <View style={styles.sheetHandleArea}><View style={styles.sheetHandle} /></View>
            <View style={styles.sheetHeader}>
              <Text accessibilityRole="header" style={styles.sheetTitle}>{isEditing ? 'Edit harvest' : 'Add new harvest'}</Text>
              <Text style={styles.sheetSubtitle}>Share the details of your fresh produce.</Text>
              <TouchableOpacity onPress={closeForm} disabled={isSubmitting} style={styles.sheetClose}
                accessibilityRole="button" accessibilityLabel="Close harvest form" accessibilityState={{ disabled: isSubmitting }}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>
            </View>
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formIntro}><Ionicons name="information-circle-outline" size={17} color={C.green} /><Text style={styles.formIntroText}>Fields marked * are required. Photos and notes help your listing stand out.</Text></View>
          {!!formError && <View accessibilityRole="alert" style={styles.errorBanner}><Ionicons name="alert-circle-outline" size={20} color={C.red} /><Text style={styles.errorText}>{formError}</Text></View>}

          <FormSection number="01" title="Produce details" subtitle="Help buyers recognize your harvest.">
            <View style={styles.labelRow}>
              <Text style={styles.label}>Produce photo</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
            </View>
            {/* UPLOAD IMAGE BOX */}
            <TouchableOpacity
              style={[
                styles.uploadBox,
                selectedImage && styles.uploadBoxWithImage,
              ]}
              accessibilityRole="button"
              accessibilityLabel={selectedImage ? 'Change produce photo' : 'Add produce photo'}
              onPress={() => setImageActionModalVisible(true)}
              activeOpacity={0.8}
            >
              {selectedImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <View style={styles.changeImageBadge}>
                    <Text style={styles.changeImageText}>Change photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholderContent}>
                  <View style={styles.photoIcon}><Ionicons name="camera-outline" size={26} color={THEME.buttonGreen} /></View>
                  <Text style={styles.uploadText}>Add a produce photo</Text>
                  <Text style={styles.uploadHint}>Take a photo or choose from your gallery</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* PRODUCT NAME */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product name *</Text>
              <TextInput
                onFocus={() => setFocusedField('productName')}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, focusedField === 'productName' && styles.inputFocused]}
                placeholder="e.g. Organic Tomatoes"
                placeholderTextColor={THEME.placeholder}
                accessibilityLabel="Product name, required"
                value={productName}
                onChangeText={setProductName}
              />
            </View>

            {/* CATEGORY DROPDOWN */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                accessibilityRole="button"
                accessibilityLabel="Category, required"
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
                <Ionicons name="chevron-down" size={18} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>

          </FormSection>

          <FormSection number="02" title="Quantity & pricing" subtitle="Set how much you have and the price buyers pay.">
            {/* QUANTITY & UNIT ROW */}
            <View style={styles.row}>
              <View style={[styles.formGroup, styles.rowField]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  onFocus={() => setFocusedField('quantity')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, focusedField === 'quantity' && styles.inputFocused]}
                  placeholder="0"
                  placeholderTextColor={THEME.placeholder}
                  keyboardType="numeric"
                  accessibilityLabel="Available quantity, required"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              <View style={[styles.formGroup, styles.rowField]}>
                <Text style={styles.label}>Selling unit</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  accessibilityRole="button"
                  accessibilityLabel="Selling unit"
                  onPress={() => setUnitModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownButtonText}>{unit}</Text>
                  <Ionicons name="chevron-down" size={18} color={THEME.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* PRICE (PER UNIT) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price per unit *</Text>
              <View style={[styles.priceInputContainer, focusedField === 'price' && styles.inputFocused]}>
                <Text style={styles.currencyPrefix}>Rs.</Text>
                <TextInput
                  onFocus={() => setFocusedField('price')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.priceInput, focusedField === 'price' && styles.inputFocused]}
                  placeholder="0.00"
                  placeholderTextColor={THEME.placeholder}
                  keyboardType="numeric"
                  accessibilityLabel="Price per unit, required"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            <Text style={styles.fieldHint}>Price shown to buyers in Rs. per {unit.toLowerCase()}.</Text>
          </FormSection>

          <FormSection number="03" title="Harvest information" subtitle="Let buyers know when it is ready and what to expect.">
            {/* HARVEST DATE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Harvest date</Text>
              <TouchableOpacity
                style={styles.dateInputButton}
                accessibilityRole="button"
                accessibilityLabel="Harvest date"
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
                <Ionicons name="calendar-outline" size={20} color={THEME.buttonGreen} />
              </TouchableOpacity>
            </View>

            {/* DESCRIPTION / NOTES */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}><Text style={styles.label}>Description / notes</Text><Text style={styles.optionalLabel}>Optional</Text></View>
              <TextInput
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                style={[styles.textArea, focusedField === 'description' && styles.inputFocused]}
                placeholder="e.g. Freshly hand-picked, organic grade, pesticide-free harvest."
                placeholderTextColor={THEME.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Description or notes, optional"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </FormSection>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            onPress={handlePublish}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>
                {isEditing ? 'Save changes' : 'Publish produce'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={closeForm} disabled={isSubmitting}
            accessibilityRole="button" accessibilityState={{ disabled: isSubmitting }}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

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
          </AnimatedSafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ----------------------------------------------------
// STYLESHEET (MATCHING THE SCREENSHOT EXACTLY)
// ----------------------------------------------------
const styles = StyleSheet.create({
  popupOverlay: { flex: 1, backgroundColor: 'rgba(13, 30, 24, 0.48)' },
  popupPositioner: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  popupSheet: { width: '100%', maxWidth: 640, height: '88%', maxHeight: 800, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetDragArea: Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none', cursor: 'grab' } : {},
  sheetHandleArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#BCD3C4' },
  sheetHeader: { paddingTop: 12, paddingBottom: 18, paddingHorizontal: 56, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetTitle: { fontSize: 21, fontWeight: '700', color: C.ink, textAlign: 'center' },
  sheetSubtitle: { fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center', marginTop: 5 },
  sheetClose: { position: 'absolute', right: 10, top: 7, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  cancelButton: { minHeight: 44, borderWidth: 1, borderColor: C.border, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelButtonText: { fontSize: 13, fontWeight: '600', color: C.ink },
  inputFocused: { borderColor: C.green, backgroundColor: '#F7FCF8' },
  formIntro: { flexDirection: 'row', gap: 8, backgroundColor: C.mint, padding: 14, borderRadius: 13, marginBottom: 22 },
  formIntroText: { flex: 1, fontSize: 12, lineHeight: 18, color: C.greenDark },
  errorBanner: { flexDirection: 'row', gap: 8, backgroundColor: C.redBg, padding: 14, borderRadius: 13, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 20, color: C.red },
  publishSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 648, alignSelf: 'center', marginBottom: 12 },
  publishSummaryText: { flex: 1, color: C.muted, fontSize: 12 },
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: THEME.lightGreenBg,
  },
  headerIconButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.headerGreen,
    letterSpacing: -0.3,
  },

  /* Main Container */
  container: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.titleGreen,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: THEME.textMuted,
  },
  requiredNote: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 12,
    marginBottom: 22,
  },
  sectionCard: {
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    padding: 20,
    paddingBottom: 4,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 22,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: THEME.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: { fontSize: 12, fontWeight: '700', color: THEME.buttonGreen },
  sectionHeading: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark },
  sectionSubtitle: { fontSize: 12, lineHeight: 18, color: THEME.textMuted, marginTop: 4 },
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  optionalLabel: { fontSize: 12, color: THEME.textMuted, marginBottom: 8 },
  photoIcon: { padding: 12, borderRadius: 16, backgroundColor: '#E1F3E8' },
  uploadHint: { fontSize: 12, color: THEME.textMuted, textAlign: 'center', marginTop: 5 },
  fieldHint: { fontSize: 12, color: THEME.textMuted, lineHeight: 18, marginTop: -8, marginBottom: 18 },
  rowField: { flex: 1, minWidth: 110 },

  /* Upload Box */
  uploadBox: {
    width: '100%',
    height: 130,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.mint,
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
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.iconGreen,
    letterSpacing: 0,
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

  /* Form Elements */
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 8,
  },
  input: {
    minHeight: 50,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: THEME.textDark,
  },
  textArea: {
    minHeight: 108,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.textDark,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    minHeight: 50,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    flex: 1,
    marginRight: 8,
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
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
  },

  /* Price Input Container */
  priceInputContainer: {
    minHeight: 50,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
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
    minHeight: 24,
    fontSize: 14,
    color: THEME.textDark,
    padding: 0,
  },

  /* Harvest Date Input */
  dateInputButton: {
    minHeight: 50,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: 14,
    color: THEME.textDark,
  },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  publishButtonDisabled: { opacity: 0.65 },
  publishButton: {
    width: '100%',
    maxWidth: 648,
    alignSelf: 'center',
    minHeight: 52,
    paddingVertical: 14,
    backgroundColor: THEME.buttonGreen,
    borderRadius: 26,
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
    fontWeight: '700',
    letterSpacing: 0,
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
    backgroundColor: C.canvas,
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
    backgroundColor: C.mint,
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

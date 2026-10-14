import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Switch,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FARMER_COLORS as C, FarmerHeading } from './FarmerDesign';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfileInFirestore, uploadProduceImage } from '../services/firebaseDatabase';
import { TOUR_TRANSLATIONS } from '../translations/tourTranslations';

// Standard Sri Lankan Districts for Selection
const DISTRICTS_LIST = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Dambulla / Matale',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

export default function UserProfileScreen({
  userProfile = {},
  lang = 'en',
  onBack,
  onLogout,
  onChangeLanguage,
  onProfileUpdated,
  onReplayTour,
  embedded = false,
  farmerDesign = false,
}) {
  const styles = farmerDesign ? farmerStyles : baseStyles;
  const Container = embedded ? View : SafeAreaView;
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [email, setEmail] = useState(userProfile?.email || userProfile?.userEmail || '');
  const [district, setDistrict] = useState(
    typeof userProfile?.district === 'string'
      ? userProfile.district
      : userProfile?.district?.nameEn || 'Nuwara Eliya'
  );
  const [farmOrBusinessName, setFarmOrBusinessName] = useState(
    userProfile?.farmName || userProfile?.businessName || ''
  );
  const [photoURL, setPhotoURL] = useState(
    userProfile?.photoURL || (farmerDesign ? null : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80')
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const role = (userProfile?.role || 'FARMER').toUpperCase(); // 'ADMIN' | 'FARMER' | 'DRIVER' | 'BUYER'
  const tourTexts = (TOUR_TRANSLATIONS[lang] || TOUR_TRANSLATIONS.en).common;

  // Handle Android hardware back button
  useEffect(() => {
    if (!onBack) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to change your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Avatar picker error:', err);
      Alert.alert('Image Error', 'Could not open image library.');
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setSaveMessage({ error: true, text: 'Please enter your full name.' });
      return;
    }

    setSaveMessage(null);
    setIsSaving(true);

    let finalPhotoUrl = photoURL;
    const targetUid = userProfile?.uid || userProfile?.id;

    // Upload local file:// or data: image to Firebase Storage / base64 fallback
    if (photoURL && (photoURL.startsWith('file://') || photoURL.startsWith('data:'))) {
      try {
        const uploadedUrl = await uploadProduceImage(photoURL, `avatar_${targetUid}`);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
          setPhotoURL(uploadedUrl);
        }
      } catch (uploadErr) {
        console.warn('Avatar image upload warning:', uploadErr);
      }
    }

    const updatedData = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      district: { nameEn: district, nameSi: district, nameTa: district },
      farmName: farmOrBusinessName.trim(),
      businessName: farmOrBusinessName.trim(),
      photoURL: finalPhotoUrl,
    };

    if (!targetUid) {
      setIsSaving(false);
      setSaveMessage({ error: true, text: 'Please sign in again before saving your profile.' });
      return;
    }
    if (targetUid) {
      try {
        const result = await updateUserProfileInFirestore(targetUid, updatedData);
        if (!result?.success) throw new Error(result?.error || 'Please try again.');
      } catch (err) {
        setIsSaving(false);
        setSaveMessage({ error: true, text: 'Could not save your profile. ' + err.message });
        return;
      }
    }

    setIsSaving(false);

    if (onProfileUpdated) {
      onProfileUpdated(updatedData);
    }

    setSaveMessage({ error: false, text: 'Your profile changes have been saved.' });
  };

  return (
    <Container style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {!embedded && (
        <View style={styles.topHeader}>
          <View style={styles.headerLeftGroup}>
            {onBack && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back to Dashboard"
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={farmerDesign ? C.greenDark : '#0F172A'} />
              </TouchableOpacity>
            )}

            {farmerDesign ? (
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
                    {role === 'ADMIN' ? 'COOPERATIVE ADMIN' : 'FARMER PROFILE'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.headerTitle}>User Profile</Text>
            )}
          </View>

          {onLogout && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={styles.logoutHeaderBtn}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {onBack && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={role === 'ADMIN' ? 'Back to Admin Dashboard' : 'Back to Dashboard'}
            style={styles.backBtnRow}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={farmerDesign ? C.green : '#0F172A'}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.backBtnText}>
              {role === 'ADMIN' ? 'Back to Admin Dashboard' : 'Back to Dashboard'}
            </Text>
          </TouchableOpacity>
        )}

        {farmerDesign && (
          <FarmerHeading
            eyebrow={role === 'ADMIN' ? 'ADMINISTRATOR ACCOUNT' : 'YOUR ACCOUNT'}
            title={role === 'ADMIN' ? 'Admin Profile' : 'My profile'}
            subtitle={role === 'ADMIN' ? 'Manage your administrator details and system preferences.' : 'Your farm, your details, your connections.'}
          />
        )}
        {/* AVATAR & COVER BANNER CARD */}
        <View style={styles.profileBannerCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarImage}>{photoURL ? <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%', borderRadius: 50 }} /> : <Text style={{ fontSize: 32, fontWeight: '700', color: C.greenDark }}>{(fullName || 'F').charAt(0).toUpperCase()}</Text>}</View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change profile photo" style={styles.cameraBadgeBtn} onPress={handlePickAvatar} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileNameText}>{fullName || 'GoviLink User'}</Text>
          <Text style={styles.profilePhoneText}>{phoneNumber || 'No phone number added'}</Text>

          {/* ROLE BADGE */}
          <View style={styles.roleBadgeContainer}>
            <View
              style={[
                styles.roleBadgePill,
                role === 'ADMIN' && { backgroundColor: '#DBEAFE' },
                role === 'FARMER' && { backgroundColor: '#DCFCE7' },
                role === 'DRIVER' && { backgroundColor: '#FEF3C7' },
                role === 'BUYER' && { backgroundColor: '#F3E8FF' },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  role === 'ADMIN' && { color: '#1E40AF' },
                  role === 'FARMER' && { color: '#059669' },
                  role === 'DRIVER' && { color: '#B45309' },
                  role === 'BUYER' && { color: '#7E22CE' },
                ]}
              >
                {role === 'ADMIN'
                  ? '🛡️ ADMINISTRATOR'
                  : role === 'FARMER'
                  ? (farmerDesign ? 'FARMER ACCOUNT' : '🧑‍🌾 VERIFIED GROWER')
                  : role === 'DRIVER'
                  ? '🚛 LOGISTICS PARTNER'
                  : '🛒 VERIFIED BUYER'}
              </Text>
            </View>
          </View>
        </View>

        {/* PERSONAL DETAILS CARD */}
        <View style={styles.cardBox}>
          <Text style={styles.cardHeaderTitle}>Personal information</Text>

          {/* FULL NAME INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInputField}
                accessibilityLabel="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* PHONE NUMBER INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInputField}
                accessibilityLabel="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="077 123 4567"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* EMAIL ADDRESS INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInputField}
                accessibilityLabel="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@govilink.lk"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

        </View>
        <View style={styles.cardBox}>
          <Text style={styles.cardHeaderTitle}>{role === 'FARMER' ? 'Farm details' : 'Location & business'}</Text>
          {/* DISTRICT SELECTOR */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>District & Hub Location</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowDistrictPicker(!showDistrictPicker)}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={18} color="#006837" style={{ marginRight: 8 }} />
              <Text style={styles.districtSelectorText}>{district}</Text>
              <Ionicons
                name={showDistrictPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* DISTRICT DROPDOWN EXPAND */}
          {showDistrictPicker && (
            <View style={styles.districtPickerBox}>
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {DISTRICTS_LIST.map((dist) => (
                  <TouchableOpacity
                    key={dist}
                    style={[
                      styles.districtItem,
                      district === dist && styles.districtItemActive,
                    ]}
                    onPress={() => {
                      setDistrict(dist);
                      setShowDistrictPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        district === dist && styles.districtItemTextActive,
                      ]}
                    >
                      📍 {dist}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* FARM OR BUSINESS NAME */}
          {(role === 'FARMER' || role === 'BUYER') && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {role === 'FARMER' ? 'Farm / Cultivation Plot Name' : 'Business / Outlet Name'}
              </Text>
              <View style={styles.inputBox}>
                <Ionicons
                  name={role === 'FARMER' ? 'leaf-outline' : 'storefront-outline'}
                  size={18}
                  color="#64748B"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.textInputField}
                  accessibilityLabel="Farm or business name"
                value={farmOrBusinessName}
                  onChangeText={setFarmOrBusinessName}
                  placeholder={role === 'FARMER' ? 'e.g. Green Valley Organic Plot' : 'e.g. Manning Market Outlet 4'}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          )}
        </View>

        {/* APP PREFERENCES CARD */}
        <View style={styles.cardBox}>
          <Text style={styles.cardHeaderTitle}>Preferences</Text>

          {/* LANGUAGE SWITCHER */}
          <View style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Language / භාෂාව / மொழி</Text>
              <Text style={styles.prefSub}>
                {lang === 'en' ? 'English (Current)' : lang === 'si' ? 'සිංහල' : 'தமிழ்'}
              </Text>
            </View>

            {onChangeLanguage && (
              <TouchableOpacity
                style={styles.langPillBtn}
                onPress={() => {
                  const nextLang = lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en';
                  onChangeLanguage(nextLang);
                }}
              >
                <Text style={styles.langPillBtnText}>
                  {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'තමි'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.prefDivider} />

          {/* NOTIFICATION TOGGLE */}
          <View style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Push Notifications</Text>
              <Text style={styles.prefSub}>Alerts for orders, dispatches & route updates</Text>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
              thumbColor={notificationsEnabled ? '#006837' : '#94A3B8'}
            />
          </View>

          {/* REPLAY APP TOUR */}
          {Boolean(onReplayTour) && (
            <>
              <View style={styles.prefDivider} />
              <TouchableOpacity
                style={styles.replayTourRow}
                onPress={onReplayTour}
                accessibilityRole="button"
                accessibilityLabel={tourTexts.replayTour}
                activeOpacity={0.75}
              >
                <View style={styles.replayTourLeft}>
                  <View style={styles.replayTourIconCircle}>
                    <Ionicons name="compass-outline" size={20} color="#006837" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prefTitle}>{tourTexts.replayTour}</Text>
                    <Text style={styles.prefSub}>{tourTexts.replayTourSub}</Text>
                  </View>
                </View>
                <Ionicons name="play-circle-outline" size={24} color="#006837" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {!!saveMessage && <View accessibilityRole="alert" style={{ backgroundColor: saveMessage.error ? C.redBg : C.mint, padding: 16, borderRadius: 14, marginBottom: 14 }}><Text style={{ color: saveMessage.error ? C.red : C.greenDark, fontSize: 13, lineHeight: 20 }}>{saveMessage.text}</Text></View>}
        {/* ACTION BUTTONS */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving, busy: isSaving }}
          onPress={handleSaveProfile}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" style={styles.logoutOutlineBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutOutlineBtnText}>Log Out of GoviLink Account</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const baseStyles = StyleSheet.create({
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
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandCaption: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  logoutHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* BANNER CARD */
  profileBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#006837',
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#006837',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  profilePhoneText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  roleBadgeContainer: {
    marginTop: 10,
  },
  roleBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* CARDS */
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },

  /* INPUTS */
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 48,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  districtSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  districtPickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: -8,
    marginBottom: 14,
    padding: 6,
  },
  districtItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  districtItemActive: {
    backgroundColor: '#E6F4EA',
  },
  districtItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  districtItemTextActive: {
    color: '#006837',
    fontWeight: '700',
  },

  /* PREFERENCES */
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  prefSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  prefDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  langPillBtn: {
    backgroundColor: '#006837',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  langPillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  replayTourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  replayTourLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 10,
  },
  replayTourIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* BUTTONS */
  saveBtn: {
    backgroundColor: '#006837',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#006837',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  logoutOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

// Farmer styling is scoped so the other account types keep their existing layout.
const farmerStyles = {
  ...baseStyles,
  safeArea: { flex: 1, backgroundColor: C.canvas },
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
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.green,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 38,
    height: 38,
    marginRight: 10,
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
  logoutHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.redBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  profileBannerCard: { backgroundColor: C.mint, borderRadius: 24, padding: 26, alignItems: 'center', marginBottom: 22, borderWidth: 1, borderColor: C.border },
  avatarImage: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#D4E7D9', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  profileNameText: { fontSize: 24, fontWeight: '700', color: C.ink, textAlign: 'center' },
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, marginBottom: 18, borderWidth: 1, borderColor: C.border },
  cardHeaderTitle: { fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 22 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFCFA', borderRadius: 13, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, minHeight: 52, paddingVertical: 12 },
  textInputField: { flex: 1, minWidth: 0, fontSize: 14, color: C.ink, paddingVertical: 0 },
  saveBtn: { ...baseStyles.saveBtn, backgroundColor: C.green, elevation: 0, shadowOpacity: 0, minHeight: 52, height: undefined, paddingVertical: 15 },
  logoutOutlineBtn: { ...baseStyles.logoutOutlineBtn, backgroundColor: C.redBg, borderColor: C.redBg, minHeight: 48, height: undefined, paddingVertical: 14 },
  cameraBadgeBtn: { ...baseStyles.cameraBadgeBtn, width: 36, height: 36, borderRadius: 18, backgroundColor: C.green },
};

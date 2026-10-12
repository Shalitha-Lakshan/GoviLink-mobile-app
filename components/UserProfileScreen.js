import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfileInFirestore, uploadProduceImage } from '../services/firebaseDatabase';

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
}) {
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
    userProfile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const role = userProfile?.role || 'FARMER'; // 'ADMIN' | 'FARMER' | 'DRIVER' | 'BUYER'

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
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);

    let finalPhotoUrl = photoURL;
    const targetUid = userProfile?.uid || userProfile?.id || `user_${Date.now()}`;

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

    if (targetUid) {
      try {
        await updateUserProfileInFirestore(targetUid, updatedData);
      } catch (err) {
        console.warn('Profile save warning:', err);
      }
    }

    setIsSaving(false);

    if (onProfileUpdated) {
      onProfileUpdated(updatedData);
    }

    Alert.alert('Profile Updated! ✨', 'Your profile photo and details have been saved successfully.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>User Profile</Text>

        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={onLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* AVATAR & COVER BANNER CARD */}
        <View style={styles.profileBannerCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            <TouchableOpacity style={styles.cameraBadgeBtn} onPress={handlePickAvatar} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileNameText}>{fullName || 'GoviLink User'}</Text>
          <Text style={styles.profilePhoneText}>📞 {phoneNumber || 'No phone number added'}</Text>

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
                  ? '🧑‍🌾 VERIFIED GROWER'
                  : role === 'DRIVER'
                  ? '🚛 LOGISTICS PARTNER'
                  : '🛒 VERIFIED BUYER'}
              </Text>
            </View>
          </View>
        </View>

        {/* PERSONAL DETAILS CARD */}
        <View style={styles.cardBox}>
          <Text style={styles.cardHeaderTitle}>Personal Information</Text>

          {/* FULL NAME INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInputField}
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
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@govilink.lk"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

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
          <Text style={styles.cardHeaderTitle}>App Preferences & Settings</Text>

          {/* LANGUAGE SWITCHER */}
          <View style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Language / ඡාෂාව / மொழி</Text>
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
        </View>

        {/* ACTION BUTTONS */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
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

        <TouchableOpacity style={styles.logoutOutlineBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutOutlineBtnText}>Log Out of GoviLink Account</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
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

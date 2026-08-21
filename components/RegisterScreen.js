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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// ----------------------------------------------------
// MODERN MINIMAL FINTECH DESIGN TOKENS
// ----------------------------------------------------
const THEME = {
  primary: '#16A34A',         // Emerald 600
  primaryHover: '#15803D',    // Emerald 700
  primaryLight: '#F0FDF4',    // Emerald 50
  bg: '#F8FAFC',              // Slate 50 Neutral Background
  cardBg: '#FFFFFF',          // Crisp White Surface
  textDark: '#0F172A',        // Slate 900 Title
  textBody: '#334155',        // Slate 700 Body
  textMuted: '#64748B',       // Slate 500 Subtitle
  border: '#E2E8F0',          // Slate 200 Border
  borderActive: '#16A34A',    // Active Focus Border
  danger: '#EF4444',          // Red 500 Error
};

// ----------------------------------------------------
// ALL 25 SRI LANKAN DISTRICTS
// ----------------------------------------------------
const DISTRICTS = [
  { id: 'colombo', nameEn: 'Colombo', nameSi: 'කොළඹ', nameTa: 'கொழும்பு' },
  { id: 'gampaha', nameEn: 'Gampaha', nameSi: 'ගම්පහ', nameTa: 'கம்பஹா' },
  { id: 'kalutara', nameEn: 'Kalutara', nameSi: 'කළුතර', nameTa: 'களுத்துறை' },
  { id: 'kandy', nameEn: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' },
  { id: 'matale', nameEn: 'Matale', nameSi: 'මාතලේ', nameTa: 'மாத்தளை' },
  { id: 'nuwara_eliya', nameEn: 'Nuwara Eliya', nameSi: 'නුවරඑළිය', nameTa: 'நுவரෙலியா' },
  { id: 'galle', nameEn: 'Galle', nameSi: 'ගාල්ල', nameTa: 'காலி' },
  { id: 'matara', nameEn: 'Matara', nameSi: 'මාතර', nameTa: 'மாத்தறை' },
  { id: 'hambantota', nameEn: 'Hambantota', nameSi: 'හම්බන්තොට', nameTa: 'ஹம்பாந்தோட்டை' },
  { id: 'jaffna', nameEn: 'Jaffna', nameSi: 'යාපනය', nameTa: 'யாழ்ப்பாணம்' },
  { id: 'kilinochchi', nameEn: 'Kilinochchi', nameSi: 'කිලිනොච්චිය', nameTa: 'கிளிநොச்சி' },
  { id: 'mannar', nameEn: 'Mannar', nameSi: 'මන්නාරම', nameTa: 'மன்னார்' },
  { id: 'vavuniya', nameEn: 'Vavuniya', nameSi: 'වවුනියාව', nameTa: 'வவுனியா' },
  { id: 'mullaitivu', nameEn: 'Mullaitivu', nameSi: 'මුලතිව්', nameTa: 'முல்லைத்தීவு' },
  { id: 'batticaloa', nameEn: 'Batticaloa', nameSi: 'මඩකලපුව', nameTa: 'மட்டக்களப்பு' },
  { id: 'ampara', nameEn: 'Ampara', nameSi: 'අම්පාර', nameTa: 'அம்பாறை' },
  { id: 'trincomalee', nameEn: 'Trincomalee', nameSi: 'ත්‍රිකුණාමලය', nameTa: 'திருகோணமலை' },
  { id: 'kurunegala', nameEn: 'Kurunegala', nameSi: 'කුරුණෑගල', nameTa: 'குருநாகல்' },
  { id: 'puttalam', nameEn: 'Puttalam', nameSi: 'පුත්තලම', nameTa: 'புத்தளம்' },
  { id: 'anuradhapura', nameEn: 'Anuradhapura', nameSi: 'අනුරාධපුරය', nameTa: 'அනුராதபுரம்' },
  { id: 'polonnaruwa', nameEn: 'Polonnaruwa', nameSi: 'පොළොන්නරුව', nameTa: 'பொலன்னறுவை' },
  { id: 'badulla', nameEn: 'Badulla', nameSi: 'බදුල්ල', nameTa: 'பதுளை' },
  { id: 'monaragala', nameEn: 'Monaragala', nameSi: 'මොනරාගල', nameTa: 'மொணராகலை' },
  { id: 'ratnapura', nameEn: 'Ratnapura', nameSi: 'රත්නපුරය', nameTa: 'இரத்தினபுரி' },
  { id: 'kegalle', nameEn: 'Kegalle', nameSi: 'කෑගල්ල', nameTa: 'கேகாலை' },
];

// ----------------------------------------------------
// LOCALIZATION DICTIONARY
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    title: 'Create Account',
    subtitle: 'Sign up to access GoviLink marketplace & logistics',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Sunil Perera',
    phoneLabel: 'Mobile Number',
    phonePlaceholder: '77 123 4567',
    districtLabel: 'District',
    districtPlaceholder: 'Select your district',
    searchDistrictPlaceholder: 'Search district...',
    roleLabel: 'Select Your Role',
    roles: [
      { id: 'farmer', icon: '🌾', label: 'Farmer', sub: 'Grow & Sell Harvest' },
      { id: 'buyer', icon: '🛒', label: 'Buyer', sub: 'Buy Produce Direct' },
      { id: 'driver', icon: '🚚', label: 'Driver', sub: 'Transport & Deliver' },
    ],
    submitBtn: 'Create Account',
    errors: {
      nameRequired: 'Please enter your full name',
      phoneInvalid: 'Enter a valid 9 or 10-digit mobile number',
      districtRequired: 'Please select your district',
      roleRequired: 'Please select a role',
    },
  },
  si: {
    title: 'ගිණුමක් සාදන්න',
    subtitle: 'ගොවි ලින්ක් වෙළඳපොළ සහ ප්‍රවාහන සේවයට පිවිසීමට ලියාපදිංචි වන්න',
    nameLabel: 'සම්පූර්ණ නම',
    namePlaceholder: 'උදා: සුනිල් පෙරේරා',
    phoneLabel: 'දුරකථන අංකය',
    phonePlaceholder: '77 123 4567',
    districtLabel: 'දිස්ත්‍රික්කය',
    districtPlaceholder: 'ඔබේ දිස්ත්‍රික්කය තෝරන්න',
    searchDistrictPlaceholder: 'දිස්ත්‍රික්කය සොයන්න...',
    roleLabel: 'ඔබේ කාර්යභාරය (Role) තෝරන්න',
    roles: [
      { id: 'farmer', icon: '🌾', label: 'ගොවියා', sub: 'අස්වැන්න අලෙවිය' },
      { id: 'buyer', icon: '🛒', label: 'ගණුදෙනුකරු', sub: 'කෙළින්ම මිලදී ගන්න' },
      { id: 'driver', icon: '🚚', label: 'රියදුරු', sub: 'ප්‍රවාහනය සහ බෙදාහැරීම' },
    ],
    submitBtn: 'ගිණුම සාදන්න',
    errors: {
      nameRequired: 'කරුණාකර ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න',
      phoneInvalid: 'කරුණාකර නිවැරදි දුරකථන අංකයක් ඇතුළත් කරන්න',
      districtRequired: 'කරුණාකර ඔබේ දිස්ත්‍රික්කය තෝරන්න',
      roleRequired: 'කරුණාකර කාර්යභාරයක් තෝරන්න',
    },
  },
  ta: {
    title: 'கணக்கை உருவாக்கவும்',
    subtitle: 'கொவி லிங்க் சந்தையை அணுக உங்கள் விவரங்களை உள்ளிடவும்',
    nameLabel: 'முழு பெயர்',
    namePlaceholder: 'எ.கா. சுனில் பெரேரா',
    phoneLabel: 'தொடர்பு எண்',
    phonePlaceholder: '77 123 4567',
    districtLabel: 'மாவட்டம்',
    districtPlaceholder: 'உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
    searchDistrictPlaceholder: 'மாவட்டத்தைத் தேடுங்கள்...',
    roleLabel: 'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்',
    roles: [
      { id: 'farmer', icon: '🌾', label: 'விவசாயி', sub: 'விளைச்சல் விற்பனை' },
      { id: 'buyer', icon: '🛒', label: 'கொள்முதல் செய்பவர்', sub: 'நேரடி கொள்முதல்' },
      { id: 'driver', icon: '🚚', label: 'ஓட்டுநர்', sub: 'போக்குவரத்து & விநியோகம்' },
    ],
    submitBtn: 'கணக்கை உருவாக்கவும்',
    errors: {
      nameRequired: 'தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்',
      phoneInvalid: 'செல்லுபடியாகும் மொபைல் எண்ணை உள்ளிடவும்',
      districtRequired: 'தயவுசெய்து உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
      roleRequired: 'தயவுசெய்து ஒரு பாத்திரத்தைத் தேர்ந்தெடுக்கவும்',
    },
  },
};

export default function RegisterScreen({ lang = 'en', onBack, onRegisterComplete }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const getDistrictName = (d) => {
    if (!d) return '';
    if (lang === 'si') return d.nameSi;
    if (lang === 'ta') return d.nameTa;
    return d.nameEn;
  };

  const filteredDistricts = DISTRICTS.filter((d) => {
    const q = districtSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      d.nameEn.toLowerCase().includes(q) ||
      d.nameSi.toLowerCase().includes(q) ||
      d.nameTa.toLowerCase().includes(q)
    );
  });

  const validateForm = () => {
    let newErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = t.errors.nameRequired;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      newErrors.phone = t.errors.phoneInvalid;
    }
    if (!selectedDistrict) {
      newErrors.district = t.errors.districtRequired;
    }
    if (!selectedRole) {
      newErrors.role = t.errors.roleRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const profile = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          district: selectedDistrict,
          role: selectedRole,
        };
        if (onRegisterComplete) {
          onRegisterComplete(profile);
        }
      }, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* TOP NAVBAR WITH MINIMAL BACK BUTTON */}
        <View style={styles.navBar}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <Text style={styles.backBtnArrow}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.navBrandText}>GoviLink</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER TYPOGRAPHY */}
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>{t.title}</Text>
            <Text style={styles.subtitleText}>{t.subtitle}</Text>
          </View>

          {/* FORM INPUTS - FLAT UNIFIED LAYOUT */}
          <View style={styles.formSection}>
            {/* FULL NAME INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.nameLabel}</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'fullName' && styles.inputContainerFocused,
                  errors.fullName && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder={t.namePlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  value={fullName}
                  onFocus={() => setFocusedInput('fullName')}
                  onBlur={() => setFocusedInput(null)}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) setErrors({ ...errors, fullName: null });
                  }}
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* PHONE NUMBER INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.phoneLabel}</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'phone' && styles.inputContainerFocused,
                  errors.phone && styles.inputContainerError,
                ]}
              >
                <Text style={styles.countryCodeText}>🇱🇰 +94</Text>
                <View style={styles.dividerLine} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t.phonePlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* DISTRICT SELECTION TRIGGER */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.districtLabel}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.inputContainer, errors.district && styles.inputContainerError]}
                onPress={() => setShowDistrictModal(true)}
              >
                <Text
                  style={[
                    styles.textInput,
                    !selectedDistrict && { color: THEME.textMuted },
                  ]}
                >
                  {selectedDistrict ? getDistrictName(selectedDistrict) : t.districtPlaceholder}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            {/* VISUAL ROLE SELECTOR (3 GRID CARDS / PILLS) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.roleLabel}</Text>
              <View style={styles.rolesGridContainer}>
                {t.roles.map((item) => {
                  const isSelected = selectedRole === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      style={[
                        styles.roleGridCard,
                        isSelected && styles.roleGridCardActive,
                      ]}
                      onPress={() => {
                        setSelectedRole(item.id);
                        if (errors.role) setErrors({ ...errors, role: null });
                      }}
                    >
                      <Text style={styles.roleIconText}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.roleLabelText,
                          isSelected && styles.roleLabelTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.roleSubText,
                          isSelected && styles.roleSubTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
            </View>

            {/* MODERN CTA BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              style={[styles.ctaButton, isSubmitting && styles.ctaButtonDisabled]}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.ctaButtonText}>{t.submitBtn}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------------------------------------------------- */}
      {/* MINIMAL DISTRICT SEARCH MODAL SHEET                  */}
      {/* ---------------------------------------------------- */}
      <Modal visible={showDistrictModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.districtLabel}</Text>
              <TouchableOpacity
                onPress={() => setShowDistrictModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH INPUT */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t.searchDistrictPlaceholder}
                placeholderTextColor={THEME.textMuted}
                value={districtSearch}
                onChangeText={setDistrictSearch}
              />
              {districtSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDistrictSearch('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {filteredDistricts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.districtRow,
                    selectedDistrict?.id === item.id && styles.districtRowActive,
                  ]}
                  onPress={() => {
                    setSelectedDistrict(item);
                    setShowDistrictModal(false);
                    setDistrictSearch('');
                    if (errors.district) setErrors({ ...errors, district: null });
                  }}
                >
                  <Text
                    style={[
                      styles.districtRowText,
                      selectedDistrict?.id === item.id && styles.districtRowTextActive,
                    ]}
                  >
                    {getDistrictName(item)}
                    {lang !== 'en' && ` (${item.nameEn})`}
                  </Text>
                  {selectedDistrict?.id === item.id && (
                    <Text style={styles.checkIconText}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: THEME.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnArrow: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.textDark,
    marginTop: -2,
  },
  navBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: THEME.textMuted,
    lineHeight: 20,
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: THEME.borderActive,
  },
  inputContainerError: {
    borderColor: THEME.danger,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.textDark,
    fontWeight: '500',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
    marginRight: 8,
  },
  dividerLine: {
    width: 1,
    height: 22,
    backgroundColor: THEME.border,
    marginRight: 12,
  },
  dropdownChevron: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  errorText: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },

  /* VISUAL ROLE SELECTOR GRID (3 CARDS) */
  rolesGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  roleGridCard: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  roleGridCardActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
  },
  roleIconText: {
    fontSize: 24,
    marginBottom: 6,
  },
  roleLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 2,
  },
  roleLabelTextActive: {
    color: THEME.primary,
    fontWeight: '800',
  },
  roleSubText: {
    fontSize: 10,
    color: THEME.textMuted,
    textAlign: 'center',
  },
  roleSubTextActive: {
    color: THEME.primary,
  },

  /* MODERN CTA BUTTON */
  ctaButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* MODAL SHEET STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.textDark,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.textDark,
  },
  clearIcon: {
    fontSize: 12,
    color: THEME.textMuted,
    paddingHorizontal: 4,
  },
  districtRow: {
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  districtRowActive: {
    backgroundColor: THEME.primaryLight,
  },
  districtRowText: {
    fontSize: 15,
    color: THEME.textDark,
    fontWeight: '500',
  },
  districtRowTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  checkIconText: {
    color: THEME.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

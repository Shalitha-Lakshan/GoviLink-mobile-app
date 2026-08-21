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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { registerWithFirebase } from '../services/firebaseDatabase';

// ----------------------------------------------------
// MODERN FINTECH DESIGN TOKENS & COLOR PALETTE
// ----------------------------------------------------
const THEME = {
  primary: '#16A34A',         // Emerald 600
  primaryHover: '#15803D',    // Emerald 700
  primaryLight: '#F0FDF4',    // Emerald 50
  navy: '#0B2545',            // Brand Deep Navy
  bg: '#F8FAFC',              // Slate 50 Neutral Background
  cardBg: '#FFFFFF',          // Crisp White Surface
  textDark: '#0F172A',        // Slate 900 Title
  textBody: '#334155',        // Slate 700 Body
  textMuted: '#64748B',       // Slate 500 Subtitle
  border: '#E2E8F0',          // Slate 200 Border
  borderActive: '#16A34A',    // Active Focus Border (Emerald)
  danger: '#EF4444',          // Red 500 Error
};

// ----------------------------------------------------
// TOP-LEVEL PURE VECTOR ICONS (DEFINED OUTSIDE COMPONENT TO PREVENT REMOUNTS)
// ----------------------------------------------------
const EyeIcon = ({ visible }) => (
  <View style={styles.eyeVectorOuter} pointerEvents="none">
    {visible ? (
      <View style={styles.eyeVectorPupil} />
    ) : (
      <>
        <View style={styles.eyeVectorPupilOff} />
        <View style={styles.eyeVectorSlash} />
      </>
    )}
  </View>
);

const FarmerIcon = ({ color = THEME.primary }) => (
  <View style={styles.roleIconBox} pointerEvents="none">
    <View style={[styles.sproutStem, { backgroundColor: color }]} />
    <View style={[styles.leafLeft, { borderColor: color }]} />
    <View style={[styles.leafRight, { borderColor: color }]} />
  </View>
);

const BuyerIcon = ({ color = THEME.primary }) => (
  <View style={styles.roleIconBox} pointerEvents="none">
    <View style={[styles.basketHandle, { borderColor: color }]} />
    <View style={[styles.basketBody, { borderColor: color }]} />
  </View>
);

const AdminIcon = ({ color = THEME.primary }) => (
  <View style={styles.roleIconBox} pointerEvents="none">
    <View style={[styles.adminHead, { backgroundColor: color }]} />
    <View style={[styles.adminBody, { borderColor: color }]} />
  </View>
);

const DriverIcon = ({ color = THEME.primary }) => (
  <View style={styles.roleIconBox} pointerEvents="none">
    <View style={[styles.truckCabin, { borderColor: color }]} />
    <View style={[styles.truckWheelLeft, { backgroundColor: color }]} />
    <View style={[styles.truckWheelRight, { backgroundColor: color }]} />
  </View>
);

const ChevronDownIcon = ({ color = THEME.textMuted }) => (
  <View style={styles.chevronBox} pointerEvents="none">
    <View style={[styles.chevronLeft, { backgroundColor: color }]} />
    <View style={[styles.chevronRight, { backgroundColor: color }]} />
  </View>
);

const SearchIcon = ({ color = THEME.textMuted }) => (
  <View style={styles.searchIconBox} pointerEvents="none">
    <View style={[styles.searchRing, { borderColor: color }]} />
    <View style={[styles.searchHandle, { backgroundColor: color }]} />
  </View>
);

const CheckIcon = ({ color = THEME.primary }) => (
  <View style={styles.checkIconBox} pointerEvents="none">
    <View style={[styles.checkStem, { backgroundColor: color }]} />
    <View style={[styles.checkBase, { backgroundColor: color }]} />
  </View>
);

const CloseIcon = ({ color = THEME.textMuted }) => (
  <View style={styles.closeIconBox} pointerEvents="none">
    <View style={[styles.closeLine1, { backgroundColor: color }]} />
    <View style={[styles.closeLine2, { backgroundColor: color }]} />
  </View>
);

const BackArrowIcon = ({ color = THEME.textDark }) => (
  <View style={styles.backArrowBox} pointerEvents="none">
    <View style={[styles.arrowShaft, { backgroundColor: color }]} />
    <View style={[styles.arrowHead, { borderColor: color }]} />
  </View>
);

// ----------------------------------------------------
// ALL 25 SRI LANKAN DISTRICTS
// ----------------------------------------------------
const DISTRICTS = [
  { id: 'colombo', nameEn: 'Colombo', nameSi: 'කොළඹ', nameTa: 'கொழும்பு' },
  { id: 'gampaha', nameEn: 'Gampaha', nameSi: 'ගම්පහ', nameTa: 'கம்பஹா' },
  { id: 'kalutara', nameEn: 'Kalutara', nameSi: 'කළුතර', nameTa: 'களுத்துறை' },
  { id: 'kandy', nameEn: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' },
  { id: 'matale', nameEn: 'Matale', nameSi: 'මාතලේ', nameTa: 'மாத்தளை' },
  { id: 'nuwara_eliya', nameEn: 'Nuwara Eliya', nameSi: 'නුවරඑළිය', nameTa: 'நுவரெலியா' },
  { id: 'galle', nameEn: 'Galle', nameSi: 'ගාල්ල', nameTa: 'காலி' },
  { id: 'matara', nameEn: 'Matara', nameSi: 'මාතර', nameTa: 'மாத்தறை' },
  { id: 'hambantota', nameEn: 'Hambantota', nameSi: 'හම්බන්තොට', nameTa: 'ஹம்பாந்தோட்டை' },
  { id: 'jaffna', nameEn: 'Jaffna', nameSi: 'යාපනය', nameTa: 'யாழ்ப்பாணம்' },
  { id: 'kilinochchi', nameEn: 'Kilinochchi', nameSi: 'කිලිනොච්චිය', nameTa: 'கிளிநோச்சி' },
  { id: 'mannar', nameEn: 'Mannar', nameSi: 'මන්නාරම', nameTa: 'மன்னார்' },
  { id: 'vavuniya', nameEn: 'Vavuniya', nameSi: 'වවුනියාව', nameTa: 'வவுனியா' },
  { id: 'mullaitivu', nameEn: 'Mullaitivu', nameSi: 'මුලතිව්', nameTa: 'முல்லைத்தீவு' },
  { id: 'batticaloa', nameEn: 'Batticaloa', nameSi: 'මඩකලපුව', nameTa: 'மட்டக்களப்பு' },
  { id: 'ampara', nameEn: 'Ampara', nameSi: 'අම්පාර', nameTa: 'அம்பாறை' },
  { id: 'trincomalee', nameEn: 'Trincomalee', nameSi: 'ත්‍රිකුණාමලය', nameTa: 'திருகோணமலை' },
  { id: 'kurunegala', nameEn: 'Kurunegala', nameSi: 'කුරුණෑගල', nameTa: 'குருநாகல்' },
  { id: 'puttalam', nameEn: 'Puttalam', nameSi: 'පුත්තලම', nameTa: 'புத்தளம்' },
  { id: 'anuradhapura', nameEn: 'Anuradhapura', nameSi: 'අනුරාධපුරය', nameTa: 'அனுராதபுரம்' },
  { id: 'polonnaruwa', nameEn: 'Polonnaruwa', nameSi: 'පොළොන්නරුව', nameTa: 'பொலன்னறுவை' },
  { id: 'badulla', nameEn: 'Badulla', nameSi: 'බදුල්ල', nameTa: 'பதுளை' },
  { id: 'monaragala', nameEn: 'Monaragala', nameSi: 'මොනරාගල', nameTa: 'மொணராகல' },
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
    namePlaceholder: 'Sunil Perera',
    emailLabel: 'Email Address',
    emailPlaceholder: 'user@govilink.lk',
    phoneLabel: 'Mobile Number',
    phonePlaceholder: '771234567',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Min 8 chars, 1 number & 1 symbol',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter password',
    districtLabel: 'District',
    districtPlaceholder: 'Select your district',
    searchDistrictPlaceholder: 'Search district...',
    roleLabel: 'Select Your Role',
    roles: [
      { id: 'farmer', iconComponent: FarmerIcon, label: 'Farmer' },
      { id: 'buyer', iconComponent: BuyerIcon, label: 'Buyer' },
      { id: 'cooperative_admin', iconComponent: AdminIcon, label: 'Co-op Admin' },
      { id: 'driver', iconComponent: DriverIcon, label: 'Driver' },
    ],
    submitBtn: 'Create Account',
    alreadyHaveAccountText: 'Already have an account?',
    loginLink: 'Log In',
    errors: {
      nameRequired: 'Please enter your full name',
      emailRequired: 'Please enter your email address',
      emailInvalid: 'Enter a valid email address',
      phoneInvalid: 'Enter a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567)',
      passwordRequired: 'Please enter a password',
      passwordStrength: 'Password must be at least 8 characters with 1 number & 1 symbol (e.g. Pass123!)',
      confirmPasswordRequired: 'Please confirm your password',
      passwordsDoNotMatch: 'Passwords do not match',
      districtRequired: 'Please select your district',
      roleRequired: 'Please select a role',
    },
  },
  si: {
    title: 'ගිණුමක් සාදන්න',
    subtitle: 'ගොවි ලින්ක් වෙළඳපොළ සහ ප්‍රවාහන සේවයට පිවිසීමට ලියාපදිංචි වන්න',
    nameLabel: 'සම්පූර්ණ නම',
    namePlaceholder: 'සුනිල් පෙරේරා',
    emailLabel: 'විද්‍යුත් තැපෑල',
    emailPlaceholder: 'user@govilink.lk',
    phoneLabel: 'දුරකථන අංකය',
    phonePlaceholder: '0771234567',
    passwordLabel: 'මුරපදය',
    passwordPlaceholder: 'අවම 8 අක්ෂර, 1 අංකයක් සහ 1 සංකේතයක්',
    confirmPasswordLabel: 'මුරපදය තහවුරු කරන්න',
    confirmPasswordPlaceholder: 'මුරපදය නැවත ඇතුළත් කරන්න',
    districtLabel: 'දිස්ත්‍රික්කය',
    districtPlaceholder: 'ඔබේ දිස්ත්‍රික්කය තෝරන්න',
    searchDistrictPlaceholder: 'දිස්ත්‍රික්කය සොයන්න...',
    roleLabel: 'ඔබේ කාර්යභාරය තෝරන්න',
    roles: [
      { id: 'farmer', iconComponent: FarmerIcon, label: 'ගොවියා' },
      { id: 'buyer', iconComponent: BuyerIcon, label: 'ගණුදෙනුකරු' },
      { id: 'cooperative_admin', iconComponent: AdminIcon, label: 'සමිති පරිපාලක' },
      { id: 'driver', iconComponent: DriverIcon, label: 'රියදුරු' },
    ],
    submitBtn: 'ගිණුම සාදන්න',
    alreadyHaveAccountText: 'දැනටමත් ගිණුමක් තිබේද?',
    loginLink: 'ඇතුළු වන්න',
    errors: {
      nameRequired: 'කරුණාකර ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න',
      emailRequired: 'කරුණාකර ඔබේ විද්‍යුත් තැපෑල ඇතුළත් කරන්න',
      emailInvalid: 'නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න',
      phoneInvalid: 'නිවැරදි ශ්‍රී ලංකා දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: 0771234567)',
      passwordRequired: 'කරුණාකර මුරපදයක් ඇතුළත් කරන්න',
      passwordStrength: 'මුරපදය අවම වශයෙන් අක්ෂර 8ක්, අංක 1ක් සහ සංකේත 1ක් විය යුතුය',
      confirmPasswordRequired: 'කරුණාකර මුරපදය තහවුරු කරන්න',
      passwordsDoNotMatch: 'මුරපද ගැලපෙන්නේ නැත',
      districtRequired: 'කරුණාකර ඔබේ දිස්ත්‍රික්කය තෝරන්න',
      roleRequired: 'කරුණාකර කාර්යභාරයක් තෝරන්න',
    },
  },
  ta: {
    title: 'கணக்கை உருவாக்கவும்',
    subtitle: 'கொவி லிங்க் சந்தையை அணுக உங்கள் விவரங்களை உள்ளிடவும்',
    nameLabel: 'முழு பெயர்',
    namePlaceholder: 'சுனில் பெரேரா',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'user@govilink.lk',
    phoneLabel: 'தொடர்பு எண்',
    phonePlaceholder: '0771234567',
    passwordLabel: 'கடவுச்சொல்',
    passwordPlaceholder: 'குறைந்தது 8 எழுத்துக்கள், 1 எண் & 1 குறியீடு',
    confirmPasswordLabel: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    confirmPasswordPlaceholder: 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
    districtLabel: 'மாவட்டம்',
    districtPlaceholder: 'உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
    searchDistrictPlaceholder: 'மாவட்டத்தைத் தேடுங்கள்...',
    roleLabel: 'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்',
    roles: [
      { id: 'farmer', iconComponent: FarmerIcon, label: 'விவசாயி' },
      { id: 'buyer', iconComponent: BuyerIcon, label: 'கொள்முதல் செய்பவர்' },
      { id: 'cooperative_admin', iconComponent: AdminIcon, label: 'கூட்டுறவு நிர்வாகி' },
      { id: 'driver', iconComponent: DriverIcon, label: 'ஓட்டுநர்' },
    ],
    submitBtn: 'கணக்கை உருவாக்கவும்',
    alreadyHaveAccountText: 'ஏற்கனவே கணக்கு உள்ளதா?',
    loginLink: 'உள்நுழையவும்',
    errors: {
      nameRequired: 'தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்',
      emailRequired: 'தயவுசெய்து உங்கள் மின்னஞ்சலை உள்ளிடவும்',
      emailInvalid: 'செல்லுபடியாகும் மின்னஞ்சலை உள்ளிடவும்',
      phoneInvalid: 'செல்லுபடியாகும் இலங்கை மொபைல் எண்ணை உள்ளிடவும் (எ.கா. 0771234567)',
      passwordRequired: 'தயவுசெய்து கடவுச்சொல்லை உள்ளிடவும்',
      passwordStrength: 'கடவுச்சொல் குறைந்தபட்சம் 8 எழுத்துக்கள், 1 எண் மற்றும் 1 குறியீட்டைக் கொண்டிருக்க வேண்டும்',
      confirmPasswordRequired: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
      passwordsDoNotMatch: 'கடவுச்சொற்கள் பொருந்தவில்லை',
      districtRequired: 'தயவுசெய்து உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
      roleRequired: 'தயவுசெய்து ஒரு பாத்திரத்தைத் தேர்ந்தெடுக்கவும்',
    },
  },
};

// Helper: map Firebase error codes to user-friendly messages
const getFriendlyError = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'Registration failed. Please try again.';
  }
};

export default function RegisterScreen({ lang = 'en', onBack, onNavigateToLogin, onRegisterComplete }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // SRI LANKAN MOBILE NUMBER REGEX (+9477xxxxxxx, 077xxxxxxx, 77xxxxxxx)
  const SL_PHONE_REGEX = /^(?:\+94|0)?7[0-9]{8}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // PASSWORD STRENGTH REGEX (min 8 chars, 1 number, 1 symbol)
  const PASSWORD_STRENGTH_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

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

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      newErrors.email = t.errors.emailRequired;
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      newErrors.email = t.errors.emailInvalid;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || !SL_PHONE_REGEX.test(cleanPhone)) {
      newErrors.phone = t.errors.phoneInvalid;
    }

    if (!password) {
      newErrors.password = t.errors.passwordRequired;
    } else if (!PASSWORD_STRENGTH_REGEX.test(password)) {
      newErrors.password = t.errors.passwordStrength;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t.errors.confirmPasswordRequired;
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = t.errors.passwordsDoNotMatch;
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

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await registerWithFirebase({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone.trim(),
        password,
        role: selectedRole,
        district: selectedDistrict,
      });

      if (result.success) {
        if (onRegisterComplete) {
          onRegisterComplete(result.profile);
        }
      } else {
        const friendlyMsg = getFriendlyError(result.error);
        Alert.alert('Registration Failed', friendlyMsg);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TOP NAVBAR */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handleBackPress} activeOpacity={0.7} style={styles.backBtn}>
              <BackArrowIcon color={THEME.textDark} />
            </TouchableOpacity>
            <Text style={styles.navBrandText}>GoviLink</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* HEADER TYPOGRAPHY */}
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>{t.title}</Text>
            <Text style={styles.subtitleText}>{t.subtitle}</Text>
          </View>

          {/* FORM INPUTS */}
          <View style={styles.formSection}>
            {/* FULL NAME INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.nameLabel}</Text>
              <View style={[styles.inputContainer, errors.fullName && styles.inputContainerError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.namePlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  selectionColor={THEME.primary}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                  }}
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.emailLabel}</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.emailPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  selectionColor={THEME.primary}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* PHONE NUMBER INPUT (WITH SRI LANKA COUNTRY CODE BADGE) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.phoneLabel}</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputContainerError]}>
                <View style={styles.countryBadge}>
                  <Text style={styles.countryCodeText}>LK +94</Text>
                </View>
                <View style={styles.dividerLine} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t.phonePlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  selectionColor={THEME.primary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                  }}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* PASSWORD INPUT WITH VECTOR EYE TOGGLE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.passwordLabel}</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  selectionColor={THEME.primary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* CONFIRM PASSWORD INPUT WITH VECTOR EYE TOGGLE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.confirmPasswordLabel}</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputContainerError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.confirmPasswordPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  selectionColor={THEME.primary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
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
                    styles.districtSelectText,
                    !selectedDistrict && { color: THEME.textMuted },
                  ]}
                >
                  {selectedDistrict ? getDistrictName(selectedDistrict) : t.districtPlaceholder}
                </Text>
                <ChevronDownIcon color={THEME.textMuted} />
              </TouchableOpacity>
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            {/* VISUAL ROLE SELECTOR (4 ROLES) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.roleLabel}</Text>
              <View style={styles.rolesGridContainer}>
                {t.roles.map((item) => {
                  const isSelected = selectedRole === item.id;
                  const IconComponent = item.iconComponent;
                  const iconColor = isSelected ? THEME.primary : THEME.textMuted;
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
                        if (errors.role) setErrors((prev) => ({ ...prev, role: null }));
                      }}
                    >
                      <View style={styles.roleIconWrapper}>
                        <IconComponent color={iconColor} />
                      </View>
                      <Text
                        style={[
                          styles.roleLabelText,
                          isSelected && styles.roleLabelTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
            </View>

            {/* CTA BUTTON WITH DYNAMIC LOADING SPINNER */}
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

          {/* BOTTOM LOGIN PROMPT LINK */}
          <View style={styles.bottomLinkContainer}>
            <Text style={styles.bottomPromptText}>{t.alreadyHaveAccountText} </Text>
            <TouchableOpacity onPress={handleBackPress} activeOpacity={0.7}>
              <Text style={styles.loginLinkText}>{t.loginLink}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MINIMAL DISTRICT SEARCH MODAL SHEET */}
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
                <CloseIcon color={THEME.textMuted} />
              </TouchableOpacity>
            </View>

            {/* SEARCH INPUT */}
            <View style={styles.searchBox}>
              <SearchIcon color={THEME.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t.searchDistrictPlaceholder}
                placeholderTextColor={THEME.textMuted}
                selectionColor={THEME.primary}
                value={districtSearch}
                onChangeText={setDistrictSearch}
              />
              {districtSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDistrictSearch('')}>
                  <CloseIcon color={THEME.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                    if (errors.district) setErrors((prev) => ({ ...prev, district: null }));
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
                    <CheckIcon color={THEME.primary} />
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
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 24) + 12,
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    backgroundColor: THEME.bg,
    marginBottom: 12,
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
  backArrowBox: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowShaft: {
    width: 12,
    height: 2,
    position: 'absolute',
  },
  arrowHead: {
    width: 7,
    height: 7,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    left: 0,
  },
  navBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
    flexGrow: 1,
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
  inputContainerError: {
    borderColor: THEME.danger,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.textDark,
    fontWeight: '500',
    height: 52,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  districtSelectText: {
    flex: 1,
    fontSize: 15,
    color: THEME.textDark,
    fontWeight: '500',
  },
  countryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: THEME.bg,
    borderRadius: 4,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textDark,
  },
  dividerLine: {
    width: 1,
    height: 22,
    backgroundColor: THEME.border,
    marginRight: 12,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeVectorOuter: {
    width: 22,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: THEME.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  eyeVectorPupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.textMuted,
  },
  eyeVectorPupilOff: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.textMuted,
    opacity: 0.5,
  },
  eyeVectorSlash: {
    position: 'absolute',
    width: 24,
    height: 1.8,
    backgroundColor: THEME.textMuted,
    transform: [{ rotate: '-45deg' }],
  },
  chevronBox: {
    width: 12,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronLeft: {
    width: 6,
    height: 1.8,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    left: 1,
  },
  chevronRight: {
    width: 6,
    height: 1.8,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    right: 1,
  },
  errorText: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },

  /* VISUAL ROLE SELECTOR GRID — 4 ROLES in 2×2 */
  rolesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleGridCard: {
    width: '47%',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
  },
  roleGridCardActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
  },
  roleIconWrapper: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBox: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sproutStem: {
    width: 2.2,
    height: 14,
    borderRadius: 1,
    position: 'absolute',
    bottom: 2,
  },
  leafLeft: {
    width: 10,
    height: 12,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 2,
    position: 'absolute',
    left: 2,
    top: 2,
  },
  leafRight: {
    width: 10,
    height: 12,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 2,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  basketHandle: {
    width: 12,
    height: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderBottomWidth: 0,
    position: 'absolute',
    top: 2,
  },
  basketBody: {
    width: 20,
    height: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 2,
    position: 'absolute',
    bottom: 2,
  },
  // Admin icon (person with clipboard)
  adminHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 1,
  },
  adminBody: {
    width: 16,
    height: 10,
    borderRadius: 4,
    borderWidth: 2,
    position: 'absolute',
    bottom: 1,
  },
  truckCabin: {
    width: 22,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
    position: 'absolute',
    top: 2,
  },
  truckWheelLeft: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 2,
    left: 5,
  },
  truckWheelRight: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 2,
    right: 5,
  },
  roleLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textDark,
    textAlign: 'center',
  },
  roleLabelTextActive: {
    color: THEME.primary,
    fontWeight: '800',
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

  bottomLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  bottomPromptText: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  loginLinkText: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '800',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchIconBox: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.6,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchHandle: {
    width: 5,
    height: 1.6,
    position: 'absolute',
    bottom: 1,
    right: 0,
    transform: [{ rotate: '45deg' }],
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.textDark,
    height: 42,
  },
  closeIconBox: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine1: {
    width: 12,
    height: 1.6,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  closeLine2: {
    width: 12,
    height: 1.6,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
  },
  checkIconBox: {
    width: 14,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkStem: {
    width: 2,
    height: 9,
    transform: [{ rotate: '35deg' }],
    position: 'absolute',
    right: 3,
  },
  checkBase: {
    width: 5,
    height: 2,
    transform: [{ rotate: '35deg' }],
    position: 'absolute',
    left: 2,
    bottom: 2,
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
});

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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

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
// PURE VECTOR ICONS (NO EMOJIS)
// ----------------------------------------------------
const EyeIcon = ({ visible }) => (
  <View style={styles.eyeVectorOuter}>
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

const UserIcon = ({ color = THEME.textMuted }) => (
  <View style={styles.iconBox}>
    <View style={[styles.userHead, { backgroundColor: color }]} />
    <View style={[styles.userBody, { backgroundColor: color }]} />
  </View>
);

const LockIcon = ({ color = THEME.textMuted }) => (
  <View style={styles.iconBox}>
    <View style={[styles.lockArch, { borderColor: color }]} />
    <View style={[styles.lockBody, { backgroundColor: color }]} />
  </View>
);

const BackArrowIcon = ({ color = THEME.textDark }) => (
  <View style={styles.backArrowBox}>
    <View style={[styles.arrowShaft, { backgroundColor: color }]} />
    <View style={[styles.arrowHead, { borderColor: color }]} />
  </View>
);

// ----------------------------------------------------
// LOCALIZATION DICTIONARY
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    title: 'Welcome Back',
    subtitle: 'Log in to your GoviLink account to continue',
    identifierLabel: 'Email or Mobile Number',
    identifierPlaceholder: '771234567 or user@govilink.lk',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot Password?',
    submitBtn: 'Log In',
    noAccountText: "Don't have an account?",
    registerLink: 'Register',
    errors: {
      identifierRequired: 'Please enter your email or mobile number',
      phoneInvalid: 'Enter a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567)',
      emailInvalid: 'Enter a valid email address',
      passwordRequired: 'Please enter your password',
    },
  },
  si: {
    title: 'ආයුබෝවන්',
    subtitle: 'කරුණාකර ඔබේ ගොවි ලින්ක් ගිණුමට ඇතුළු වන්න',
    identifierLabel: 'විද්‍යුත් තැපෑල හෝ දුරකථන අංකය',
    identifierPlaceholder: '0771234567 හෝ user@govilink.lk',
    passwordLabel: 'මුරපදය',
    passwordPlaceholder: 'ඔබේ මුරපදය ඇතුළත් කරන්න',
    forgotPassword: 'මුරපදය අමතක වුනාද?',
    submitBtn: 'ඇතුළු වන්න',
    noAccountText: 'තවම ගිණුමක් නැද්ද?',
    registerLink: 'ලියාපදිංචි වන්න',
    errors: {
      identifierRequired: 'කරුණාකර විද්‍යුත් තැපෑල හෝ දුරකථන අංකය ඇතුළත් කරන්න',
      phoneInvalid: 'නිවැරදි ශ්‍රී ලංකා දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: 0771234567)',
      emailInvalid: 'නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න',
      passwordRequired: 'කරුණාකර මුරපදය ඇතුළත් කරන්න',
    },
  },
  ta: {
    title: 'மீண்டும் வருக',
    subtitle: 'தொடர உங்கள் கொவி லிங்க் கணக்கில் உள்நுழையவும்',
    identifierLabel: 'மின்னஞ்சல் அல்லது தொடர்பு எண்',
    identifierPlaceholder: '0771234567 அல்லது user@govilink.lk',
    passwordLabel: 'கடவுச்சොல்',
    passwordPlaceholder: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
    forgotPassword: 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?',
    submitBtn: 'உள்நுழையவும்',
    noAccountText: 'கணக்கு இல்லையா?',
    registerLink: 'பதிவு செய்யவும்',
    errors: {
      identifierRequired: 'தயவுசெய்து உங்கள் மின்னஞ்சல் அல்லது தொடர்பு எண்ணை உள்ளிடவும்',
      phoneInvalid: 'செல்லுபடியாகும் இலங்கை மொபைல் எண்ணை உள்ளிடவும் (எ.கா. 0771234567)',
      emailInvalid: 'செல்லுபடியாகும் மின்னஞ்சலை உள்ளிடவும்',
      passwordRequired: 'தயவுசெய்து உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
    },
  },
};

export default function LoginScreen({ lang = 'en', onBackToLang, onNavigateToRegister, onLoginSuccess }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // SRI LANKAN MOBILE NUMBER REGEX (+9477xxxxxxx, 077xxxxxxx, 77xxxxxxx)
  const SL_PHONE_REGEX = /^(?:\+94|0)?7[0-9]{8}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = () => {
    let newErrors = {};
    const cleanId = identifier.trim();

    if (!cleanId) {
      newErrors.identifier = t.errors.identifierRequired;
    } else {
      const isDigitsOnly = /^[0-9+]+$/.test(cleanId);
      if (isDigitsOnly) {
        if (!SL_PHONE_REGEX.test(cleanId)) {
          newErrors.identifier = t.errors.phoneInvalid;
        }
      } else if (!EMAIL_REGEX.test(cleanId)) {
        newErrors.identifier = t.errors.emailInvalid;
      }
    }

    if (!password) {
      newErrors.password = t.errors.passwordRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    Keyboard.dismiss();
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const userProfile = {
          fullName: 'GoviLink User',
          phone: identifier.trim(),
          role: 'buyer',
        };
        if (onLoginSuccess) {
          onLoginSuccess(userProfile);
        }
      }, 800);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* TOP NAVBAR */}
          <View style={styles.navBar}>
            {onBackToLang ? (
              <TouchableOpacity onPress={onBackToLang} activeOpacity={0.7} style={styles.backBtn}>
                <BackArrowIcon color={THEME.textDark} />
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
            keyboardShouldPersistTaps="handled"
          >
            {/* BRAND EMBLEM & HEADER */}
            <View style={styles.headerSection}>
              <Image
                source={require('../assets/splash-icon.png')}
                style={styles.logoBadge}
                resizeMode="contain"
              />
              <Text style={styles.titleText}>{t.title}</Text>
              <Text style={styles.subtitleText}>{t.subtitle}</Text>
            </View>

            {/* FORM FIELDS */}
            <View style={styles.formSection}>
              {/* EMAIL / PHONE INPUT */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.identifierLabel}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === 'identifier' && styles.inputContainerFocused,
                    errors.identifier && styles.inputContainerError,
                  ]}
                >
                  <UserIcon color={focusedInput === 'identifier' ? THEME.primary : THEME.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t.identifierPlaceholder}
                    placeholderTextColor={THEME.textMuted}
                    value={identifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedInput('identifier')}
                    onBlur={() => setFocusedInput(null)}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      if (errors.identifier) setErrors({ ...errors, identifier: null });
                    }}
                  />
                </View>
                {errors.identifier && <Text style={styles.errorText}>{errors.identifier}</Text>}
              </View>

              {/* PASSWORD INPUT */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.passwordLabel}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === 'password' && styles.inputContainerFocused,
                    errors.password && styles.inputContainerError,
                  ]}
                >
                  <LockIcon color={focusedInput === 'password' ? THEME.primary : THEME.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t.passwordPlaceholder}
                    placeholderTextColor={THEME.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: null });
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

              {/* FORGOT PASSWORD LINK */}
              <TouchableOpacity style={styles.forgotPassBtn} activeOpacity={0.7}>
                <Text style={styles.forgotPassText}>{t.forgotPassword}</Text>
              </TouchableOpacity>

              {/* LOGIN BUTTON WITH LOADING SPINNER */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isSubmitting}
                style={[styles.ctaButton, isSubmitting && styles.ctaButtonDisabled]}
                onPress={handleLogin}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.ctaButtonText}>{t.submitBtn}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* BOTTOM REGISTRATION PROMPT */}
            <View style={styles.bottomLinkContainer}>
              <Text style={styles.bottomPromptText}>{t.noAccountText} </Text>
              <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
                <Text style={styles.registerLinkText}>{t.registerLink}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 50,
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    marginBottom: 14,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: THEME.textMuted,
    textAlign: 'center',
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
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: THEME.danger,
  },
  iconBox: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  userHead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 1,
  },
  userBody: {
    width: 12,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  lockArch: {
    width: 8,
    height: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    marginBottom: 1,
  },
  lockBody: {
    width: 12,
    height: 7,
    borderRadius: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.textDark,
    fontWeight: '500',
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
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary,
  },
  errorText: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 32,
  },
  bottomPromptText: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  registerLinkText: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '800',
  },
});

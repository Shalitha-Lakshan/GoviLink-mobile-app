import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

// ----------------------------------------------------
// UNIFIED GOVILINK BRAND COLOR SYSTEM
// ----------------------------------------------------
const BRAND = {
  navy: '#0B2545',          // "Govi" Primary Navy
  emerald: '#1E824C',       // "Link" Primary Emerald Green
  emeraldLight: '#E8F5E9',  // Light Green Soft Surface
  accentLeaf: '#2ECC71',    // Vibrant Leaf Accent
  background: '#F4F7F6',    // Clean Neutral Background
  cardBg: '#FFFFFF',        // Crisp White Cards
  textPrimary: '#0A2540',   // Main Typography
  textSecondary: '#627D98', // Secondary Subtitles
  border: '#C8E6C9',        // Soft Emerald Border
};

const LANGUAGES = [
  { id: 'si', label: 'සිංහල', sub: 'Sinhala' },
  { id: 'en', label: 'English', sub: 'English' },
  { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
];

export default function LanguageSelectionScreen({ onSelectLanguage }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.background} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* ---------------------------------------------------- */}
        {/* PURE TRANSPARENT BRAND EMBLEM & DUAL-TONE TITLE     */}
        {/* ---------------------------------------------------- */}
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.topLogoEmblem}
          resizeMode="contain"
        />

        <View style={styles.brandTitleRow}>
          <Text style={styles.brandTitleNavy}>Govi</Text>
          <Text style={styles.brandTitleGreen}>Link</Text>
        </View>

        <Text style={styles.brandTitleSinhala}>ගොවි ලින්ක්</Text>
        <View style={styles.titleDivider} />

        {/* ---------------------------------------------------- */}
        {/* MULTI-LINGUAL WELCOME GREETINGS                      */}
        {/* ---------------------------------------------------- */}
        <View style={styles.greetingContainer}>
          {/* Sinhala */}
          <Text style={styles.welcomeSi}>
            ගොවි ලින්ක් සමග එක් වූ ඔබ සාදරයෙන් පිළිගනිමු.
          </Text>
          <Text style={styles.instructionSi}>කරුණාකර ඔබේ භාෂාව තෝරන්න</Text>

          {/* English */}
          <Text style={styles.welcomeEn}>Welcome to GoviLink Marketplace</Text>
          <Text style={styles.instructionEn}>Please select your preferred language</Text>

          {/* Tamil */}
          <Text style={styles.welcomeTa}>
            கொவி லிங்க் உடன் இணைந்திருக்கும் உங்களை அன்புடன் வரவேற்கின்றோம்.
          </Text>
          <Text style={styles.instructionTa}>தயவுசெய்து ඔබේ மொழியைத் தேர்ந்தெடுக்கவும்</Text>
        </View>

        {/* ---------------------------------------------------- */}
        {/* LANGUAGE SELECTION BUTTON CARDS                      */}
        {/* ---------------------------------------------------- */}
        <View style={styles.buttonsContainer}>
          {LANGUAGES.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={styles.langCard}
              onPress={() => onSelectLanguage(item.id)}
            >
              <View style={styles.cardLeft}>
                <View style={styles.bulletDot} />
                <View>
                  <Text style={styles.langLabelText}>{item.label}</Text>
                  <Text style={styles.langSubText}>{item.sub}</Text>
                </View>
              </View>

              <View style={styles.arrowBadge}>
                <Text style={styles.arrowText}>➔</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ---------------------------------------------------- */}
      {/* BRANDED DEEP NAVY BOTTOM ARC FOOTER                   */}
      {/* ---------------------------------------------------- */}
      <View style={styles.footerArcContainer}>
        <View style={styles.footerArcCurve} />
        <View style={styles.footerContent}>
          <View style={styles.footerBrandRow}>
            <View style={styles.footerLogoBadge}>
              <Image
                source={require('../assets/splash-icon.png')}
                style={styles.footerLogoIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.footerBrandName}>GoviLink Sri Lanka</Text>
          </View>
          <Text style={styles.footerTagline}>
            Smart Agricultural Marketplace & Logistics Platform
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.background,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 45,
    alignItems: 'center',
  },
  topLogoEmblem: {
    width: 76,
    height: 76,
    marginBottom: 8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleNavy: {
    fontSize: 28,
    fontWeight: '900',
    color: BRAND.navy,
  },
  brandTitleGreen: {
    fontSize: 28,
    fontWeight: '900',
    color: BRAND.accentLeaf,
  },
  brandTitleSinhala: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.emerald,
    marginTop: 2,
    marginBottom: 8,
  },
  titleDivider: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.emerald,
    marginBottom: 16,
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeSi: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  instructionSi: {
    fontSize: 13,
    color: BRAND.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeEn: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  instructionEn: {
    fontSize: 13,
    color: BRAND.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeTa: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  instructionTa: {
    fontSize: 12,
    color: BRAND.textSecondary,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 340,
  },
  langCard: {
    backgroundColor: BRAND.cardBg,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.emerald,
    marginRight: 14,
  },
  langLabelText: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.navy,
  },
  langSubText: {
    fontSize: 11,
    color: BRAND.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  arrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.emeraldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: BRAND.emerald,
    fontWeight: '900',
    fontSize: 14,
  },
  footerArcContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  footerArcCurve: {
    width: width * 1.35,
    height: 90,
    backgroundColor: BRAND.navy,
    borderTopLeftRadius: width * 0.68,
    borderTopRightRadius: width * 0.68,
    position: 'absolute',
    top: -30,
  },
  footerContent: {
    width: '100%',
    backgroundColor: BRAND.navy,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
    zIndex: 2,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerLogoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3.5,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  footerLogoIcon: {
    width: '100%',
    height: '100%',
  },
  footerBrandName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footerTagline: {
    fontSize: 11,
    color: '#B0BEC5',
    fontWeight: '500',
  },
});

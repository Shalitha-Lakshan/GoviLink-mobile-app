import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

// ----------------------------------------------------
// GOVILINK BRANDING PALETTE FOR SPLASH
// ----------------------------------------------------
const BRAND = {
  navy: '#0B2545',          // Deep Navy
  navyDark: '#06172E',      // Darker Gradient Accent
  emerald: '#1E824C',       // Primary Emerald
  emeraldGlow: 'rgba(30, 130, 76, 0.4)',
  accentLeaf: '#2ECC71',    // Vibrant Leaf Accent
  accentGlow: 'rgba(46, 204, 113, 0.25)',
  cardBg: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#90A4AE',
  textMuted: '#627D98',
};

const INIT_STEPS = [
  'Connecting to GoviLink Network...',
  'Synchronizing Crop Market Rates...',
  'Initializing Logistics Dispatch Engine...',
  'App Ready 🌾',
];

export default function SplashScreen({ onFinish }) {
  // Animation Values
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const pulseRingScale = useRef(new Animated.Value(1)).current;
  const pulseRingOpacity = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Status message state
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    // 1. Entrance Animations Sequence
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Glowing Pulse Ring Animation around Logo Badge
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseRingScale, {
          toValue: 1.6,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseRingOpacity, {
          toValue: 0,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Progress Bar Fill & Status Step Cycling
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const stepInterval = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev < INIT_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 550);

    // 4. Smooth Exit Transition Sequence
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(() => {
        clearInterval(stepInterval);
        if (onFinish) onFinish();
      });
    }, 2500);

    return () => {
      pulseLoop.stop();
      clearInterval(stepInterval);
      clearTimeout(timer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.navyDark} />

      {/* BACKGROUND DECORATIVE GLOWS */}
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.centerContent}>
        {/* EMBLEM BADGE WITH PULSE RINGS */}
        <View style={styles.logoWrapper}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseRingScale }],
                opacity: pulseRingOpacity,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.emblemBadge,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../assets/splash-icon.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* BRAND TITLE & TRILINGUAL TAGLINE */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <View style={styles.brandNameRow}>
            <Text style={styles.brandGovi}>Govi</Text>
            <Text style={styles.brandLink}>Link</Text>
          </View>
          <View style={styles.dividerLine} />

          <Text style={styles.primaryTagline}>
            Smart Agricultural Marketplace & Logistics
          </Text>
          <Text style={styles.localizedTagline}>
            ස්මාර්ට් කෘෂිකාර්මික වෙළඳපොළ • ஸ்மார்ட் விவசாய சந்தை
          </Text>
        </Animated.View>
      </View>

      {/* FOOTER PROGRESS & STATUS INDICATOR */}
      <View style={styles.footerContainer}>
        {/* Progress Bar Container */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>

        {/* Loading Status Text */}
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{INIT_STEPS[statusIndex]}</Text>
        </View>

        <Text style={styles.versionText}>GoviLink Sri Lanka v1.0 • Enterprise Edition</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.navy,
    zIndex: 99999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  topGlow: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width * 0.48,
    backgroundColor: BRAND.emeraldGlow,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width * 0.48,
    backgroundColor: BRAND.accentGlow,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: BRAND.accentLeaf,
    backgroundColor: BRAND.emeraldGlow,
  },
  emblemBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.accentLeaf,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    padding: 12,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandGovi: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandLink: {
    fontSize: 40,
    fontWeight: '900',
    color: BRAND.accentLeaf,
    letterSpacing: 0.5,
  },
  dividerLine: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.accentLeaf,
    marginVertical: 12,
  },
  primaryTagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E6ED',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  localizedTagline: {
    fontSize: 12,
    color: BRAND.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  footerContainer: {
    width: width * 0.82,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: BRAND.accentLeaf,
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.accentLeaf,
    marginRight: 8,
  },
  statusText: {
    color: '#B0BEC5',
    fontSize: 13,
    fontWeight: '500',
  },
  versionText: {
    color: BRAND.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});

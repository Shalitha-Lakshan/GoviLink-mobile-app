import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  useWindowDimensions,
  Easing,
  StatusBar,
  Image,
  Platform,
} from 'react-native';

// ─────────────────────────────────────────────
// BRAND PALETTE
// ─────────────────────────────────────────────
const C = {
  bg:           '#07192F',   // deep ink navy
  bgMid:        '#0B2545',   // primary navy
  emerald:      '#1A7A45',
  leaf:         '#27AE60',
  leafBright:   '#2ECC71',
  leafGlow:     'rgba(46,204,113,0.18)',
  leafGlowMid:  'rgba(46,204,113,0.08)',
  ring:         'rgba(46,204,113,0.22)',
  white:        '#FFFFFF',
  textPrimary:  '#EAF0F6',
  textSub:      '#8FA3B4',
  textMuted:    '#4F6478',
  shimmer:      'rgba(255,255,255,0.06)',
};

const STEPS = [
  'Connecting to GoviLink Network',
  'Synchronizing Crop Market Rates',
  'Initializing Logistics Engine',
  'Launching App',
];

const SEGMENTS = 20; // progress bar segments

export default function SplashScreen({ onFinish, onLayout }) {
  const { width, height } = useWindowDimensions();

  // ── Animated values ──────────────────────────────────
  const containerOpacity  = useRef(new Animated.Value(1)).current;

  // logo entrance
  const logoScale         = useRef(new Animated.Value(0.3)).current;
  const logoOpacity       = useRef(new Animated.Value(0)).current;
  const logoTranslateY    = useRef(new Animated.Value(30)).current;

  // title entrance
  const titleOpacity      = useRef(new Animated.Value(0)).current;
  const titleTranslateY   = useRef(new Animated.Value(24)).current;

  // tagline entrance
  const taglineOpacity    = useRef(new Animated.Value(0)).current;

  // outer ring pulse
  const outerRing1Scale   = useRef(new Animated.Value(1)).current;
  const outerRing1Opacity = useRef(new Animated.Value(0.6)).current;
  const outerRing2Scale   = useRef(new Animated.Value(1)).current;
  const outerRing2Opacity = useRef(new Animated.Value(0.4)).current;

  // shimmer sweep
  const shimmerX          = useRef(new Animated.Value(-width)).current;

  // footer entrance
  const footerOpacity     = useRef(new Animated.Value(0)).current;
  const footerTranslateY  = useRef(new Animated.Value(20)).current;

  // progress
  const progressAnim      = useRef(new Animated.Value(0)).current;

  // particle opacities (6 dots scattered around logo)
  const particles = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;

  const [stepIndex, setStepIndex] = useState(0);
  const [activeSegments, setActiveSegments] = useState(0);

  // ── Effects ──────────────────────────────────────────
  useEffect(() => {
    // ── 1. Logo entrance (scale + fade + rise)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // ── 2. Title stagger
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── 3. Tagline stagger
    Animated.sequence([
      Animated.delay(650),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // ── 4. Particle dots: sequential sparkle
    particles.forEach((p, i) => {
      Animated.sequence([
        Animated.delay(400 + i * 120),
        Animated.loop(
          Animated.sequence([
            Animated.timing(p, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(p, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          ])
        ),
      ]).start();
    });

    // ── 5. Double pulse rings
    const pulse = (scaleRef, opacityRef, delay, duration) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.parallel([
            Animated.timing(scaleRef, {
              toValue: 2.0,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(opacityRef, {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    pulse(outerRing1Scale, outerRing1Opacity, 0, 2000).start();
    pulse(outerRing2Scale, outerRing2Opacity, 900, 2000).start();

    // ── 6. Shimmer sweep across the whole screen
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: width * 2,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    ).start();

    // ── 7. Footer entrance
    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(footerTranslateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── 8. Progress bar + step cycling
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const stepTimer = setInterval(() => {
      setStepIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    const segTimer = setInterval(() => {
      setActiveSegments(prev => (prev < SEGMENTS ? prev + 1 : prev));
    }, 2400 / SEGMENTS);

    // ── 9. Exit fade
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        clearInterval(stepTimer);
        clearInterval(segTimer);
        if (onFinish) onFinish();
      });
    }, 3000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(segTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  // Particle positions (orbit around logo)
  const particlePositions = [
    { top: -70, left:  10 },
    { top: -55, right: -20 },
    { top:  10, right: -75 },
    { bottom: -60, right: 5 },
    { bottom: -50, left: -25 },
    { top:  20, left: -70 },
  ];

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
      onLayout={onLayout}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── BACKGROUND LAYERED GLOWS ────────────────────── */}
      <View
        style={[
          styles.glowTopRight,
          {
            top: -height * 0.18,
            right: -width * 0.35,
            width: width * 1.1,
            height: width * 1.1,
            borderRadius: width * 0.55,
          },
        ]}
      />
      <View
        style={[
          styles.glowBottomLeft,
          {
            bottom: -height * 0.2,
            left: -width * 0.4,
            width: width * 1.1,
            height: width * 1.1,
            borderRadius: width * 0.55,
          },
        ]}
      />
      <View
        style={[
          styles.glowCenter,
          {
            top: height * 0.3,
            left: width * 0.1,
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width * 0.4,
          },
        ]}
      />

      {/* ── SHIMMER SWEEP ───────────────────────────────── */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: width * 0.6,
            height: height * 1.2,
            transform: [{ translateX: shimmerX }, { skewX: '-20deg' }],
          },
        ]}
        pointerEvents="none"
      />

      {/* ── TOP BRAND BADGE ─────────────────────────────── */}
      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>SRI LANKA</Text>
        <View style={styles.topBadgeDot} />
        <Text style={styles.topBadgeText}>ENTERPRISE</Text>
      </View>

      {/* ── CENTER SECTION ──────────────────────────────── */}
      <View style={styles.centerSection}>

        {/* Logo with pulse rings + particles */}
        <View style={styles.logoWrap}>
          {/* Outer pulse rings */}
          <Animated.View style={[
            styles.pulseRing,
            { transform: [{ scale: outerRing1Scale }], opacity: outerRing1Opacity },
          ]} />
          <Animated.View style={[
            styles.pulseRing, styles.pulseRing2,
            { transform: [{ scale: outerRing2Scale }], opacity: outerRing2Opacity },
          ]} />

          {/* Particle sparkle dots */}
          {particlePositions.map((pos, i) => (
            <Animated.View
              key={i}
              style={[styles.particle, pos, { opacity: particles[i] }]}
            />
          ))}

          {/* Logo badge */}
          <Animated.View style={[
            styles.logoBadge,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}>
            <View style={styles.logoBadgeInner}>
              <Image
                source={require('../assets/splash-icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </View>

        {/* Brand name */}
        <Animated.View style={[
          styles.brandRow,
          { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
        ]}>
          <Text style={styles.brandGovi}>Govi</Text>
          <Text style={styles.brandLink}>Link</Text>
        </Animated.View>

        {/* Accent rule */}
        <Animated.View style={[styles.accentRule, { opacity: titleOpacity }]}>
          <View style={styles.ruleLine} />
          <View style={styles.ruleDiamond} />
          <View style={styles.ruleLine} />
        </Animated.View>

        {/* Taglines */}
        <Animated.View style={[styles.taglineWrap, { opacity: taglineOpacity }]}>
          <Text style={styles.taglinePrimary}>
            Smart Agricultural Marketplace & Logistics
          </Text>
          <Text style={styles.taglineLocal}>
            ස්මාර්ට් කෘෂිකාර්මික වෙළඳපොළ  •  ஸ்மார்ட் விவசாய சந்தை
          </Text>
        </Animated.View>
      </View>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <Animated.View style={[
        styles.footer,
        {
          width: Math.min(width * 0.85, 340),
          opacity: footerOpacity,
          transform: [{ translateY: footerTranslateY }],
        },
      ]}>
        {/* Segmented progress bar */}
        <View style={styles.segmentRow}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i < activeSegments ? styles.segmentActive : styles.segmentInactive,
                i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
                i === SEGMENTS - 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
              ]}
            />
          ))}
        </View>

        {/* Step label */}
        <View style={styles.statusRow}>
          <View style={styles.statusPulse} />
          <Text style={styles.statusText}>{STEPS[stepIndex]}</Text>
          <Text style={styles.statusEllipsis}>...</Text>
        </View>

        {/* Version chip */}
        <View style={styles.versionChip}>
          <Text style={styles.versionText}>GoviLink v1.0  ·  Enterprise Edition</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const LOGO_SIZE = 120;
const RING_SIZE = LOGO_SIZE + 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: C.bg,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },

  // ── Background glows
  glowTopRight: {
    position: 'absolute',
    backgroundColor: 'rgba(26,122,69,0.28)',
  },
  glowBottomLeft: {
    position: 'absolute',
    backgroundColor: 'rgba(46,204,113,0.12)',
  },
  glowCenter: {
    position: 'absolute',
    backgroundColor: 'rgba(11,37,69,0.6)',
  },

  // ── Shimmer
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: C.shimmer,
  },

  // ── Top badge
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(46,204,113,0.07)',
  },
  topBadgeText: {
    color: C.leaf,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  topBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.leafBright,
    marginHorizontal: 8,
  },

  // ── Center
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },

  // ── Logo
  logoWrap: {
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: C.leafBright,
    backgroundColor: 'transparent',
  },
  pulseRing2: {
    borderColor: C.leaf,
    borderWidth: 1,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.leafBright,
    shadowColor: C.leafBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  logoBadge: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: C.bgMid,
    borderWidth: 2,
    borderColor: 'rgba(46,204,113,0.5)',
    shadowColor: C.leafBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  logoBadgeInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: LOGO_SIZE / 2,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '85%',
    height: '85%',
  },

  // ── Brand name
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  brandGovi: {
    fontSize: 44,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -0.5,
  },
  brandLink: {
    fontSize: 44,
    fontWeight: '900',
    color: C.leafBright,
    letterSpacing: -0.5,
  },

  // ── Accent rule
  accentRule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ruleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(46,204,113,0.4)',
    maxWidth: 52,
  },
  ruleDiamond: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: C.leafBright,
    marginHorizontal: 8,
    transform: [{ rotate: '45deg' }],
  },

  // ── Taglines
  taglineWrap: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  taglinePrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 22,
    marginBottom: 8,
  },
  taglineLocal: {
    fontSize: 11.5,
    color: C.textSub,
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 18,
    fontWeight: '400',
  },

  // ── Footer
  footer: {
    alignItems: 'center',
  },

  // Segmented bar
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 14,
    width: '100%',
  },
  segment: {
    flex: 1,
    height: 3,
  },
  segmentActive: {
    backgroundColor: C.leafBright,
    shadowColor: C.leafBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.leafBright,
    marginRight: 8,
    shadowColor: C.leafBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },
  statusText: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statusEllipsis: {
    color: C.leafBright,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 1,
  },

  // Version chip
  versionChip: {
    borderWidth: 1,
    borderColor: 'rgba(79,100,120,0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  versionText: {
    color: C.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
});

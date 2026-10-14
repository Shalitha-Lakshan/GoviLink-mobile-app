import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOUR_TRANSLATIONS } from '../../translations/tourTranslations';

const THEME = {
  primaryGreen: '#006837',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  mintBg: '#E8F5E9',
  lightGray: '#F1F5F9',
};

export default function TourTooltip({
  role = 'buyer',
  step,
  stepIndex = 0,
  totalSteps = 1,
  lang = 'en',
  onNext,
  onPrev,
  onSkip,
  onFinish,
}) {
  const tLang = TOUR_TRANSLATIONS[lang] || TOUR_TRANSLATIONS.en;
  const tRole = tLang[role] || tLang.buyer;
  const tCommon = tLang.common || TOUR_TRANSLATIONS.en.common;

  const stepData = tRole[step?.key] || {
    title: 'GoviLink Feature',
    content: 'Learn how to use this feature.',
  };

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  // Format progress text "Step X of Y"
  const progressText = tCommon.stepProgress
    ? tCommon.stepProgress
        .replace('{current}', String(stepIndex + 1))
        .replace('{total}', String(totalSteps))
    : `${stepIndex + 1} of ${totalSteps}`;

  // Role Badge text
  const roleBadgeKey = `${role}RoleBadge`;
  const roleBadgeLabel = tCommon[roleBadgeKey] || 'GoviLink Tour';

  return (
    <View style={styles.cardContainer}>
      {/* 1. TOUR LABEL & STEP PROGRESS */}
      <View style={styles.headerRow}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{roleBadgeLabel}</Text>
        </View>
        <Text style={styles.stepProgressText}>{progressText}</Text>
      </View>

      {/* 2. ICON + SHORT TITLE */}
      <View style={styles.titleRow}>
        {step?.icon && (
          <View style={styles.iconCircle}>
            <Ionicons
              name={step.icon}
              size={14}
              color={THEME.primaryGreen}
            />
          </View>
        )}
        <Text style={styles.titleText} numberOfLines={1}>
          {stepData.title}
        </Text>
      </View>

      {/* 3. SHORT DESCRIPTION (MAX 2-3 LINES, ACTION-FOCUSED) */}
      <Text style={styles.contentText} numberOfLines={3}>
        {stepData.content}
      </Text>

      {/* 4. PROGRESS DOTS */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === stepIndex
                ? styles.dotActive
                : idx < stepIndex
                ? styles.dotCompleted
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* 5. BUTTONS: SKIP TOUR (TEXT) | BACK (SECONDARY) | NEXT/FINISH (PRIMARY GREEN) */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={tCommon.skip}
          onPress={onSkip}
          style={styles.skipBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipBtnText}>{tCommon.skip}</Text>
        </TouchableOpacity>

        <View style={styles.navGroup}>
          {!isFirstStep && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={tCommon.back}
              onPress={onPrev}
              style={styles.backBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="chevron-back"
                size={13}
                color={THEME.textDark}
                style={{ marginRight: 2 }}
              />
              <Text style={styles.backBtnText}>{tCommon.back}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? tCommon.finish : tCommon.next}
            onPress={isLastStep ? onFinish : onNext}
            style={styles.nextBtn}
            activeOpacity={0.85}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.nextBtnText}>
              {isLastStep ? tCommon.finish : tCommon.next}
            </Text>
            <Ionicons
              name={isLastStep ? 'checkmark' : 'chevron-forward'}
              size={13}
              color="#FFFFFF"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 20px rgba(11, 37, 69, 0.18)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: THEME.mintBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.primaryGreen,
  },
  stepProgressText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: THEME.primaryGreen,
    letterSpacing: -0.2,
  },
  contentText: {
    fontSize: 12,
    lineHeight: 16.5,
    color: '#334155',
    marginBottom: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  dot: {
    height: 3,
    borderRadius: 2,
  },
  dotActive: {
    width: 14,
    backgroundColor: THEME.primaryGreen,
  },
  dotCompleted: {
    width: 6,
    backgroundColor: '#86EFAC',
  },
  dotInactive: {
    width: 4,
    backgroundColor: '#E2E8F0',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  skipBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4.5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: THEME.lightGray,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.textDark,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryGreen,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  nextBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

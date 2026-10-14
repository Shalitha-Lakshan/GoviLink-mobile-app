import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '../../context/TourContext';
import TourTooltip from './TourTooltip';

// Subtle dim background so the underlying screen remains readable (Requirement 8)
const OVERLAY_BG = 'rgba(11, 37, 69, 0.48)';
const HIGHLIGHT_BORDER = '#2ECC71';
const PADDING = 4; // Small, precise padding around the target (Requirement 2)
const ESTIMATED_CARD_HEIGHT = 138;

export default function GuidedTourOverlay() {
  const {
    isActive,
    activeRole,
    currentStepIndex,
    currentStep,
    totalSteps,
    activeTargetLayout,
    lang,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
  } = useTour();

  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  // Handle hardware Back button on Android while tour is active
  useEffect(() => {
    if (!isActive) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStepIndex > 0) {
        prevStep();
      } else {
        skipTour();
      }
      return true;
    });

    return () => sub.remove();
  }, [isActive, currentStepIndex, prevStep, skipTour]);

  if (!isActive) {
    return null;
  }

  const { width: winW, height: winH } = dimensions;
  const topSafe = Math.max(insets.top || 0, 10);
  const bottomSafe = Math.max(insets.bottom || 0, 10);

  // Calculate target spotlight geometry using actual measured bounds
  let targetRect = null;
  if (
    activeTargetLayout &&
    activeTargetLayout.width > 0 &&
    activeTargetLayout.height > 0
  ) {
    const rawX = activeTargetLayout.x - PADDING;
    const rawY = activeTargetLayout.y - PADDING;
    const rawW = activeTargetLayout.width + PADDING * 2;
    const rawH = activeTargetLayout.height + PADDING * 2;

    const clampedX = Math.max(0, Math.min(rawX, winW - 10));
    const clampedY = Math.max(0, Math.min(rawY, winH - 10));
    const clampedW = Math.max(10, Math.min(rawW, winW - clampedX));
    const clampedH = Math.max(10, Math.min(rawH, winH - clampedY));

    targetRect = {
      x: clampedX,
      y: clampedY,
      width: clampedW,
      height: clampedH,
      bottom: clampedY + clampedH,
      centerY: clampedY + clampedH / 2,
    };
  }

  // -------------------------------------------------------------
  // PRECISE POSITIONING & COLLISION AVOIDANCE (Requirement 1 & 9)
  // The card MUST NOT cover the highlighted target.
  // -------------------------------------------------------------
  let tooltipStyle = {};

  if (!targetRect) {
    // If layout is still measuring, place card safely at bottom
    tooltipStyle = {
      position: 'absolute',
      bottom: bottomSafe + 12,
      left: 16,
      right: 16,
      maxWidth: 420,
      alignSelf: 'center',
    };
  } else {
    const spaceAbove = targetRect.y - topSafe;
    const spaceBelow = winH - targetRect.bottom - bottomSafe;
    const isTargetInLowerHalf = targetRect.centerY > winH / 2;

    if (isTargetInLowerHalf) {
      // Preferred: Place ABOVE the target
      if (spaceAbove >= ESTIMATED_CARD_HEIGHT + 10) {
        // Comfortably fits above target
        tooltipStyle = {
          position: 'absolute',
          bottom: winH - targetRect.y + 8,
          left: 16,
          right: 16,
          maxWidth: 420,
          alignSelf: 'center',
        };
      } else if (spaceBelow >= ESTIMATED_CARD_HEIGHT + 10) {
        // Fallback: place below target
        tooltipStyle = {
          position: 'absolute',
          top: targetRect.bottom + 8,
          left: 16,
          right: 16,
          maxWidth: 420,
          alignSelf: 'center',
        };
      } else {
        // Screen is very small or target is huge: dock at top safe area
        tooltipStyle = {
          position: 'absolute',
          top: topSafe + 6,
          left: 16,
          right: 16,
          maxWidth: 420,
          alignSelf: 'center',
        };
      }
    } else {
      // Preferred: Place BELOW the target
      if (spaceBelow >= ESTIMATED_CARD_HEIGHT + 10) {
        // Comfortably fits below target
        tooltipStyle = {
          position: 'absolute',
          top: targetRect.bottom + 8,
          left: 16,
          right: 16,
          maxWidth: 420,
          alignSelf: 'center',
        };
      } else if (spaceAbove >= ESTIMATED_CARD_HEIGHT + 10) {
        // Fallback: place above target
        tooltipStyle = {
          position: 'absolute',
          bottom: winH - targetRect.y + 8,
          left: 16,
          right: 16,
          maxWidth: 420,
          alignSelf: 'center',
        };
      } else {
        // Screen is very small: dock at bottom safe area
        tooltipStyle = {
          position: 'absolute',
          bottom: bottomSafe + 6,
          left: 16,
          right: 16,
          maxWidth: 420,
          alignSelf: 'center',
        };
      }
    }
  }

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* 4-MASK RECTANGULAR CUTOUT SPOTLIGHT */}
      {targetRect ? (
        <>
          {/* Top mask */}
          <View
            style={[
              styles.mask,
              { top: 0, left: 0, right: 0, height: targetRect.y },
            ]}
          />
          {/* Bottom mask */}
          <View
            style={[
              styles.mask,
              {
                top: targetRect.bottom,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />
          {/* Left mask */}
          <View
            style={[
              styles.mask,
              {
                top: targetRect.y,
                left: 0,
                width: targetRect.x,
                height: targetRect.height,
              },
            ]}
          />
          {/* Right mask */}
          <View
            style={[
              styles.mask,
              {
                top: targetRect.y,
                left: targetRect.x + targetRect.width,
                right: 0,
                height: targetRect.height,
              },
            ]}
          />

          {/* EXACT HIGHLIGHT BORDER AROUND REAL TARGET */}
          <View
            pointerEvents="none"
            style={[
              styles.highlightBorder,
              {
                top: targetRect.y,
                left: targetRect.x,
                width: targetRect.width,
                height: targetRect.height,
              },
            ]}
          />
        </>
      ) : (
        <View style={[styles.mask, StyleSheet.absoluteFill]} />
      )}

      {/* COMPACT TOUR TOOLTIP CARD */}
      <View style={[styles.tooltipWrapper, tooltipStyle]}>
        <TourTooltip
          role={activeRole}
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          lang={lang}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          onFinish={finishTour}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  mask: {
    position: 'absolute',
    backgroundColor: OVERLAY_BG,
  },
  highlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: HIGHLIGHT_BORDER,
    borderRadius: 12,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: HIGHLIGHT_BORDER,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 0 10px rgba(46, 204, 113, 0.7)',
      },
    }),
  },
  tooltipWrapper: {
    zIndex: 100000,
    elevation: 100000,
  },
});

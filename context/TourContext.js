import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserProfileInFirestore } from '../services/firebaseDatabase';
import { TOUR_STEPS } from '../config/tourSteps';

const STORAGE_KEY_PREFIX = '@govilink_tour_completed_';

const TourContext = createContext(null);

export function TourProvider({
  children,
  userProfile,
  currentRole = 'buyer',
  lang = 'en',
  onProfileUpdated,
  isAuthenticated = false,
}) {
  const [isActive, setIsActive] = useState(false);
  const [activeRole, setActiveRole] = useState(currentRole);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isReplay, setIsReplay] = useState(false);
  const [targets, setTargets] = useState({});

  const tabChangeHandlerRef = useRef(null);
  const autoStartCheckRef = useRef({});

  // Ensure activeRole updates when currentRole changes while inactive
  useEffect(() => {
    if (!isActive) {
      setActiveRole(currentRole);
    }
  }, [currentRole, isActive]);

  const currentSteps = TOUR_STEPS[activeRole] || TOUR_STEPS.buyer;
  const currentStep = currentSteps[currentStepIndex] || currentSteps[0];
  const totalSteps = currentSteps.length;
  const activeTargetId = currentStep?.targetId;
  const activeTargetLayout = targets[activeTargetId] || null;

  // Register target element coordinates
  const registerTarget = useCallback((id, layout) => {
    if (!id || !layout) return;
    setTargets((prev) => {
      const existing = prev[id];
      if (
        existing &&
        Math.abs(existing.x - layout.x) < 1 &&
        Math.abs(existing.y - layout.y) < 1 &&
        Math.abs(existing.width - layout.width) < 1 &&
        Math.abs(existing.height - layout.height) < 1
      ) {
        return prev;
      }
      return { ...prev, [id]: layout };
    });
  }, []);

  const unregisterTarget = useCallback((id) => {
    if (!id) return;
    setTargets((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Set handler to change screen tabs when tour step requires it
  const setTabChangeHandler = useCallback((handler) => {
    tabChangeHandlerRef.current = handler;
  }, []);

  // Save tour completion to Firestore and AsyncStorage
  const saveTourCompletion = useCallback(async () => {
    const uid = userProfile?.uid;
    if (!uid) return;

    try {
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, 'true');
    } catch (e) {
      console.warn('Could not save tour completion to AsyncStorage:', e);
    }

    try {
      await updateUserProfileInFirestore(uid, {
        onboardingTourCompleted: true,
      });
      if (onProfileUpdated) {
        onProfileUpdated({ onboardingTourCompleted: true });
      }
    } catch (e) {
      console.warn('Could not save tour completion to Firestore:', e);
    }
  }, [userProfile?.uid, onProfileUpdated]);

  // Start tour explicitly
  const startTour = useCallback(
    (roleToUse, options = {}) => {
      const targetRole = roleToUse || currentRole || 'buyer';
      setActiveRole(targetRole);
      setCurrentStepIndex(0);
      setIsReplay(Boolean(options.isReplay));
      setIsActive(true);

      const steps = TOUR_STEPS[targetRole] || TOUR_STEPS.buyer;
      if (steps[0]?.tabHint && tabChangeHandlerRef.current) {
        try {
          tabChangeHandlerRef.current(steps[0].tabHint);
        } catch (_e) {}
      }
    },
    [currentRole]
  );

  // Replay tour
  const replayTour = useCallback(
    (roleToUse) => {
      startTour(roleToUse || currentRole, { isReplay: true });
    },
    [startTour, currentRole]
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);

      const nextStepObj = currentSteps[nextIdx];
      if (nextStepObj?.tabHint && tabChangeHandlerRef.current) {
        try {
          tabChangeHandlerRef.current(nextStepObj.tabHint);
        } catch (_e) {}
      }
    } else {
      // Last step reached -> finish
      setIsActive(false);
      if (!isReplay) {
        saveTourCompletion();
      }
    }
  }, [currentStepIndex, totalSteps, currentSteps, isReplay, saveTourCompletion]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);

      const prevStepObj = currentSteps[prevIdx];
      if (prevStepObj?.tabHint && tabChangeHandlerRef.current) {
        try {
          tabChangeHandlerRef.current(prevStepObj.tabHint);
        } catch (_e) {}
      }
    }
  }, [currentStepIndex, currentSteps]);

  // Skip tour
  const skipTour = useCallback(() => {
    setIsActive(false);
    if (!isReplay) {
      saveTourCompletion();
    }
  }, [isReplay, saveTourCompletion]);

  // Finish tour
  const finishTour = useCallback(() => {
    setIsActive(false);
    if (!isReplay) {
      saveTourCompletion();
    }
  }, [isReplay, saveTourCompletion]);

  // -------------------------------------------------------------------
  // FIRST-TIME USER DETECTION & AUTOMATIC TOUR TRIGGER
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.uid) {
      return;
    }

    const uid = userProfile.uid;
    if (autoStartCheckRef.current[uid]) {
      return;
    }

    autoStartCheckRef.current[uid] = true;

    const checkFirstTimeStatus = async () => {
      try {
        const localStatus = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
        const profileStatus = userProfile?.onboardingTourCompleted;

        // If completed either locally or on remote profile, do NOT show tour
        if (localStatus === 'true' || profileStatus === true) {
          return;
        }

        // Wait briefly for screens and components to mount cleanly before presenting tour
        const timer = setTimeout(() => {
          startTour(currentRole, { isReplay: false });
        }, 900);

        return () => clearTimeout(timer);
      } catch (err) {
        console.warn('Error checking tour first time status:', err);
      }
    };

    checkFirstTimeStatus();
  }, [isAuthenticated, userProfile?.uid, userProfile?.onboardingTourCompleted, currentRole, startTour]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        activeRole,
        currentStepIndex,
        currentStep,
        currentSteps,
        totalSteps,
        activeTargetId,
        activeTargetLayout,
        isReplay,
        lang,
        startTour,
        replayTour,
        nextStep,
        prevStep,
        skipTour,
        finishTour,
        registerTarget,
        unregisterTarget,
        setTabChangeHandler,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

export default TourContext;

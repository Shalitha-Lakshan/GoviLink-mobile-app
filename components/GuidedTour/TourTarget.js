import React, { useRef, useEffect, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useTour } from '../../context/TourContext';

export default function TourTarget({ id, children, style, ...props }) {
  const viewRef = useRef(null);
  const { registerTarget, unregisterTarget, activeTargetId } = useTour();

  const measure = useCallback(() => {
    if (!viewRef.current) return;

    if (Platform.OS === 'web' && viewRef.current.getBoundingClientRect) {
      try {
        const rect = viewRef.current.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          registerTarget(id, {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
          return;
        }
      } catch (_e) {}
    }

    if (viewRef.current.measureInWindow) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerTarget(id, { x, y, width, height });
        }
      });
    }
  }, [id, registerTarget]);

  useEffect(() => {
    // Initial layout measurement pass
    const t = setTimeout(measure, 100);
    return () => {
      clearTimeout(t);
      unregisterTarget(id);
    };
  }, [id, measure, unregisterTarget]);

  useEffect(() => {
    // Multi-pass measurement when this target is active to ensure exact layout
    if (activeTargetId === id) {
      measure();
      const t1 = setTimeout(measure, 80);
      const t2 = setTimeout(measure, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeTargetId, id, measure]);

  return (
    <View
      ref={viewRef}
      onLayout={measure}
      style={style}
      collapsable={false}
      {...props}
    >
      {children}
    </View>
  );
}

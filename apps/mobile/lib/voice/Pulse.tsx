import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { ViewProps } from 'react-native';

interface PulseProps extends ViewProps {
  children?: React.ReactNode;
  /**
   * Duration of one full opacity cycle (low → high → low).
   * Defaults to 4000ms per spec.
   */
  duration?: number;
}

/**
 * Pulse — soft breathing opacity animation.
 * 0.6 ↔ 1.0 over 4 seconds, ease-in-out. No springs.
 * Wraps any child in a gently breathing container.
 */
export function Pulse({ children, duration = 4000, style, ...props }: PulseProps) {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1.0, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,   // infinite
      true, // reverse: oscillates back to 0.6
    );
  }, [duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

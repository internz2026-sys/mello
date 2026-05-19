import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, spacing, maxWidth } from './tokens';

interface SanctuaryProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Sanctuary — the root container for mellō screens.
 * Generous padding, centered, max-width contained.
 * Provides the vellum background and centers content.
 */
export function Sanctuary({ children, style, ...props }: SanctuaryProps) {
  return (
    <View style={[styles.outer, style]} {...props}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.vellum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});

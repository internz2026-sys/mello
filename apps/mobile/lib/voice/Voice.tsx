import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, fonts, fontSizes, lineHeights } from './tokens';

interface VoiceProps extends TextProps {
  children: React.ReactNode;
  size?: 'lg' | 'xl' | '2xl';
}

/**
 * Voice — mellō's primary text voice.
 * Fraunces serif, generous leading. Used for all AI-generated copy.
 */
export function Voice({ children, size = 'lg', style, ...props }: VoiceProps) {
  return (
    <Text style={[styles.base, styles[size], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.serif,
    color: colors.deepInk,
    textAlign: 'center',
  },
  lg: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.relaxed,
  },
  xl: {
    fontSize: fontSizes.xl,
    lineHeight: 36,
  },
  '2xl': {
    fontSize: fontSizes['2xl'],
    lineHeight: 44,
  },
});

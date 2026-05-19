import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, fonts, fontSizes, lineHeights } from './tokens';

interface WhisperProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Whisper — supporting text. Small, italic, restrained.
 * Used for asides, notes, and secondary context.
 */
export function Whisper({ children, style, ...props }: WhisperProps) {
  return (
    <Text style={[styles.base, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    color: colors.deepInk + '99',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

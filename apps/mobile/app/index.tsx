import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Sanctuary } from '../lib/voice/Sanctuary';
import { Voice } from '../lib/voice/Voice';
import { Whisper } from '../lib/voice/Whisper';
import { Pulse } from '../lib/voice/Pulse';
import { colors, spacing, fontSizes, lineHeights } from '../lib/voice/tokens';
import { Text } from 'react-native';

/**
 * Welcome screen — the Pre-room from the onboarding script.
 *
 * "A nearly-blank screen. Center, soft serif."
 * No marketing copy. No tour. The product begins.
 */
export default function WelcomeScreen() {
  return (
    <Sanctuary>
      {/* Title — mellō breathes gently while the user arrives */}
      <Pulse duration={4000} style={styles.titleWrap}>
        <Voice size="2xl" style={styles.title}>
          mell&#x14D;
        </Voice>
      </Pulse>

      <View style={styles.spacerSm} />

      {/* Subtitle */}
      <Whisper style={styles.subtitle}>
        future self — a place to think slowly
      </Whisper>

      <View style={styles.spacerLg} />

      {/* Note */}
      <Whisper style={styles.note}>
        Take as long as you&apos;d like. Pause anytime.
      </Whisper>

      <View style={styles.spacerLg} />

      {/* Begin button — single, quiet */}
      <Pressable
        style={({ pressed }) => [styles.begin, pressed && styles.beginPressed]}
        onPress={() => router.push('/(rituals)/morning')}
        accessibilityRole="button"
        accessibilityLabel="Begin"
      >
        <Text style={styles.beginLabel}>Begin</Text>
      </Pressable>
    </Sanctuary>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    letterSpacing: 0.8,
  },
  note: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    paddingHorizontal: spacing.md,
    opacity: 0.7,
  },
  spacerSm: {
    height: spacing.sm,
  },
  spacerLg: {
    height: spacing.lg,
  },
  begin: {
    borderWidth: 1,
    borderColor: colors.dawn,
    borderRadius: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  beginPressed: {
    opacity: 0.5,
  },
  beginLabel: {
    fontFamily: undefined, // system grotesque
    fontSize: fontSizes.sm,
    letterSpacing: 2,
    color: colors.deepInk,
    textTransform: 'uppercase',
  },
});

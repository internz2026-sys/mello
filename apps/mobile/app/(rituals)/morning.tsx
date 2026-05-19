import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Sanctuary } from '../../lib/voice/Sanctuary';
import { Voice } from '../../lib/voice/Voice';
import { Whisper } from '../../lib/voice/Whisper';
import {
  colors,
  spacing,
  fontSizes,
  lineHeights,
  radius,
} from '../../lib/voice/tokens';

type Mood = 'heavy' | 'steady' | 'open' | null;

const MOODS: { id: Mood; label: string }[] = [
  { id: 'heavy', label: 'heavy' },
  { id: 'steady', label: 'steady' },
  { id: 'open', label: 'open' },
];

/**
 * Morning ritual screen.
 *
 * - One question
 * - Three-tap mood pulse (heavy / steady / open)
 * - Optional one-line intention
 * - Save → quiet exit
 */
export default function MorningScreen() {
  const [mood, setMood] = useState<Mood>(null);
  const [intention, setIntention] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    // Single soft haptic — the only haptic in the app (Phase 0)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(true);
  }

  if (saved) {
    return <ExitScreen />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Sanctuary style={styles.sanctuary}>

        {/* Question */}
        <View style={styles.questionWrap}>
          <Voice size="lg" style={styles.question}>
            How are you arriving to today?
          </Voice>
        </View>

        {/* Mood pulse — three soft circles */}
        <View style={styles.moodRow}>
          {MOODS.map(({ id, label }) => (
            <Pressable
              key={id}
              style={[
                styles.moodCircle,
                mood === id && styles.moodCircleActive,
              ]}
              onPress={() => setMood(id === mood ? null : id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: mood === id }}
              accessibilityLabel={label}
            >
              <Text
                style={[
                  styles.moodLabel,
                  mood === id && styles.moodLabelActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Intention — optional one-line */}
        <View style={styles.intentionWrap}>
          <Whisper style={styles.intentionHint}>
            one intention, if anything comes (optional)
          </Whisper>
          <TextInput
            style={styles.intentionInput}
            value={intention}
            onChangeText={setIntention}
            placeholder="..."
            placeholderTextColor={colors.oat}
            maxLength={120}
            returnKeyType="done"
            autoCorrect={false}
            accessibilityLabel="Intention for today"
          />
        </View>

        {/* Save */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <Text style={styles.saveLabel}>save</Text>
        </Pressable>

      </Sanctuary>
    </ScrollView>
  );
}

/**
 * Quiet exit screen shown after save.
 * No celebration. No prompt to do more. Just presence.
 */
function ExitScreen() {
  return (
    <Sanctuary>
      <Voice size="lg" style={styles.exitText}>
        Good.
      </Voice>
      <View style={{ height: spacing.md }} />
      <Whisper>carry it lightly today</Whisper>
      <View style={{ height: spacing['2xl'] }} />
      <Pressable
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        accessibilityLabel="Return home"
      >
        <Text style={styles.homeLink}>&#x2190;</Text>
      </Pressable>
    </Sanctuary>
  );
}

const CIRCLE_SIZE = 80;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  sanctuary: {
    justifyContent: 'center',
  },
  questionWrap: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  question: {
    textAlign: 'center',
    lineHeight: lineHeights.relaxed,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  moodCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  moodCircleActive: {
    borderColor: colors.dawn,
    backgroundColor: colors.bone,
  },
  moodLabel: {
    fontFamily: undefined, // system grotesque
    fontSize: fontSizes.xs,
    letterSpacing: 0.8,
    color: colors.oat,
    textTransform: 'lowercase',
  },
  moodLabelActive: {
    color: colors.dawn,
  },
  intentionWrap: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  intentionHint: {
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  intentionInput: {
    fontFamily: undefined,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    color: colors.deepInk,
    borderBottomWidth: 1,
    borderBottomColor: colors.oat,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  saveButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  saveButtonPressed: {
    opacity: 0.4,
  },
  saveLabel: {
    fontFamily: undefined,
    fontSize: fontSizes.xs,
    letterSpacing: 2,
    color: colors.dawn,
    textTransform: 'lowercase',
  },
  exitText: {
    textAlign: 'center',
  },
  homeLink: {
    fontSize: fontSizes.lg,
    color: colors.oat,
    letterSpacing: 1,
  },
});

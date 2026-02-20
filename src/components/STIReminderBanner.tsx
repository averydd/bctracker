import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface STIReminderBannerProps {
  count: number;
  onPress: () => void;
}

export function STIReminderBanner({ count, onPress }: STIReminderBannerProps) {
  if (count === 0) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.icon}>🩺</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>STI Test Reminder</Text>
        <Text style={styles.subtitle}>
          {count} pending test{count > 1 ? 's' : ''} - Tap to manage
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D1B1B',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  arrow: {
    color: colors.textMuted,
    fontSize: 24,
  },
});

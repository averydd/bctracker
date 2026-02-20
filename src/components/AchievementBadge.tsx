import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { ACHIEVEMENT_DEFINITIONS } from '../db/achievements';

interface AchievementBadgeProps {
  type: string;
  unlocked: boolean;
  small?: boolean;
}

export function AchievementBadge({ type, unlocked, small }: AchievementBadgeProps) {
  const def = ACHIEVEMENT_DEFINITIONS.find(d => d.type === type);
  if (!def) return null;

  return (
    <View style={[styles.container, small && styles.small, !unlocked && styles.locked]}>
      <Text style={[styles.icon, small && styles.smallIcon]}>{unlocked ? def.icon : '🔒'}</Text>
      {!small && <Text style={[styles.label, !unlocked && styles.lockedText]}>{def.label}</Text>}
      {!small && <Text style={styles.description}>{def.description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: 100,
  },
  small: {
    padding: spacing.sm,
    width: 56,
  },
  locked: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  smallIcon: {
    fontSize: 22,
    marginBottom: 0,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  lockedText: {
    color: colors.textMuted,
  },
  description: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

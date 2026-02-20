import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  small?: boolean;
}

export function StatCard({ label, value, icon, color = colors.primary, small }: StatCardProps) {
  return (
    <View style={[styles.container, small && styles.small]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.value, { color }, small && styles.smallValue]}>{value}</Text>
      <Text style={[styles.label, small && styles.smallLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    minWidth: 80,
  },
  small: {
    padding: spacing.sm,
  },
  icon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  smallValue: {
    fontSize: fontSize.lg,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  smallLabel: {
    fontSize: 10,
  },
});

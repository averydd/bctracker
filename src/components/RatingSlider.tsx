import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface RatingSliderProps {
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
}

export function RatingSlider({ label, icon, value, onChange }: RatingSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, value > 0 && styles.valueActive]}>
          {value > 0 ? value : '-'}
        </Text>
      </View>
      <View style={styles.dots}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity
            key={n}
            style={[
              styles.dot,
              n <= value && styles.dotActive,
              n <= value && n >= 8 && styles.dotHigh,
              n <= value && n <= 3 && styles.dotLow,
            ]}
            onPress={() => onChange(n === value ? 0 : n)}
          >
            <Text style={[styles.dotText, n <= value && styles.dotTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    width: 24,
    textAlign: 'right',
  },
  valueActive: {
    color: colors.primary,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotHigh: {
    backgroundColor: colors.success,
  },
  dotLow: {
    backgroundColor: colors.danger,
  },
  dotText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  dotTextActive: {
    color: colors.white,
  },
});

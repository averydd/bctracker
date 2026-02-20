import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface ChipOption {
  key: string;
  label: string;
  icon: string;
}

interface ChipPickerProps {
  options: readonly ChipOption[];
  selected: string | null;
  onChange: (key: string | null) => void;
  label?: string;
  scrollable?: boolean;
}

export function ChipPicker({ options, selected, onChange, label, scrollable }: ChipPickerProps) {
  const chips = options.map(opt => {
    const isActive = selected === opt.key;
    return (
      <TouchableOpacity
        key={opt.key}
        style={[styles.chip, isActive && styles.chipActive]}
        onPress={() => onChange(isActive ? null : opt.key)}
      >
        <Text style={styles.chipIcon}>{opt.icon}</Text>
        <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{opt.label}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.wrap}>{chips}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipLabelActive: {
    color: colors.primary,
  },
});

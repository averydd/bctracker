import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { HOLE_TYPES } from '../utils/constants';

interface HoleSelectorProps {
  selected: string[];
  onChange: (holes: string[]) => void;
}

export function HoleSelector({ selected, onChange }: HoleSelectorProps) {
  function toggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter(h => h !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  return (
    <View style={styles.container}>
      {HOLE_TYPES.map(hole => {
        const isActive = selected.includes(hole.key);
        return (
          <TouchableOpacity
            key={hole.key}
            style={[styles.button, isActive && styles.active]}
            onPress={() => toggle(hole.key)}
          >
            <Text style={styles.icon}>{hole.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{hole.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  active: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(244,114,182,0.15)',
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  activeLabel: {
    color: colors.accent,
  },
});

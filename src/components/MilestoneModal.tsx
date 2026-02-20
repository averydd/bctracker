import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface MilestoneModalProps {
  visible: boolean;
  count: number;
  type: 'encounter' | 'bodycount';
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

const MILESTONE_MESSAGES: Record<number, string> = {
  1: 'And so it begins...',
  5: 'Getting started!',
  10: 'Double digits!',
  25: 'Quarter century!',
  50: 'Half century!',
  69: 'Nice.',
  100: 'Welcome to the Century Club!',
  150: 'Unstoppable!',
  200: 'Legendary status!',
  250: 'Hall of fame!',
  500: 'Absolute legend!',
};

export function MilestoneModal({ visible, count, type, onDismiss }: MilestoneModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      numberAnim.setValue(0);
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(numberAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const message = MILESTONE_MESSAGES[count] || `${count} and counting!`;
  const label = type === 'bodycount' ? 'Body Count' : 'Encounters';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{count === 69 ? '😏' : '🎉'}</Text>
          <Animated.Text style={[styles.number, {
            opacity: numberAnim,
            transform: [{
              scale: numberAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 1.2, 1],
              }),
            }],
          }]}>
            {count}
          </Animated.Text>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Let's Go!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: width * 0.8,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  emoji: {
    fontSize: 50,
    marginBottom: spacing.sm,
  },
  number: {
    fontSize: 80,
    fontWeight: fontWeight.heavy,
    color: colors.accent,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getFlag } from '../utils/nationalities';

interface CelebrationModalProps {
  visible: boolean;
  nationality: string;
  nationalityCount: number;
  onDismiss: () => void;
}

const { width, height } = Dimensions.get('window');

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: 2500 + Math.random() * 1500,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);
    animation.start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: color,
        transform: [
          { translateY },
          { translateX: Animated.subtract(translateX, new Animated.Value(0)) },
          { rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
        ],
        opacity,
      }}
    />
  );
}

export function CelebrationModal({ visible, nationality, nationalityCount, onDismiss }: CelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const flag = getFlag(nationality);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const confettiColors = ['#8B5CF6', '#F472B6', '#34D399', '#FBBF24', '#38BDF8', '#FB923C', '#EF4444'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {visible && Array.from({ length: 40 }).map((_, i) => (
          <ConfettiPiece
            key={i}
            delay={i * 50}
            color={confettiColors[i % confettiColors.length]}
          />
        ))}
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.title}>New Nationality Unlocked!</Text>
          <Text style={styles.nationality}>{nationality}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{nationalityCount} nationalities</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Nice!</Text>
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
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  flag: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  nationality: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    marginBottom: spacing.md,
  },
  countBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  countText: {
    color: colors.primaryLight,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  button: {
    backgroundColor: colors.primary,
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

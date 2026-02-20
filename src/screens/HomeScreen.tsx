import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getBodyCount, getRecentEncounters, getThisMonthCount, getThisMonthPartners, getProtectionRate, getTotalEncounterCount, getSoloCount, EncounterWithPartner } from '../db/encounters';
import { getNationalityCount } from '../db/partners';
import { getPendingReminders } from '../db/sti-tests';
import { getUnlockedAchievements, Achievement } from '../db/achievements';
import { StatCard } from '../components/StatCard';
import { EncounterCard } from '../components/EncounterCard';
import { AchievementBadge } from '../components/AchievementBadge';
import { STIReminderBanner } from '../components/STIReminderBanner';

export function HomeScreen({ navigation }: any) {
  const { refreshKey } = useDatabase();
  const [bodyCount, setBodyCount] = useState(0);
  const [totalEncounters, setTotalEncounters] = useState(0);
  const [soloCount, setSoloCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [monthPartners, setMonthPartners] = useState(0);
  const [protectionRate, setProtectionRate] = useState(0);
  const [nationalityCount, setNationalityCount] = useState(0);
  const [recentEncounters, setRecentEncounters] = useState<EncounterWithPartner[]>([]);
  const [pendingTests, setPendingTests] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  async function loadData() {
    const [bc, total, solo, mc, mp, pr, nc, recent, pending, ach] = await Promise.all([
      getBodyCount(),
      getTotalEncounterCount(),
      getSoloCount(),
      getThisMonthCount(),
      getThisMonthPartners(),
      getProtectionRate(),
      getNationalityCount(),
      getRecentEncounters(5),
      getPendingReminders(),
      getUnlockedAchievements(),
    ]);
    setBodyCount(bc);
    setTotalEncounters(total);
    setSoloCount(solo);
    setMonthCount(mc);
    setMonthPartners(mp);
    setProtectionRate(pr);
    setNationalityCount(nc);
    setRecentEncounters(recent);
    setPendingTests(pending.length);
    setAchievements(ach);

    countAnim.setValue(0);
    Animated.spring(countAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>Body Count</Text>
        <Animated.Text style={[styles.heroNumber, {
          transform: [{ scale: countAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          opacity: countAnim,
        }]}>
          {bodyCount}
        </Animated.Text>
        <Text style={styles.heroSub}>{totalEncounters} encounters · {soloCount} solo</Text>
      </View>

      {pendingTests > 0 && (
        <STIReminderBanner
          count={pendingTests}
          onPress={() => navigation.navigate('Profile')}
        />
      )}

      <View style={styles.statsRow}>
        <StatCard label="This Month" value={monthCount} icon="📅" color={colors.primary} small />
        <StatCard label="Partners" value={monthPartners} icon="👤" color={colors.accent} small />
        <StatCard label="Protected" value={`${Math.round(protectionRate * 100)}%`} icon="🛡️" color={colors.success} small />
        <StatCard label="Nations" value={nationalityCount} icon="🌍" color={colors.warning} small />
      </View>

      {achievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementRow}>
            {achievements.slice(0, 6).map(a => (
              <AchievementBadge key={a.id} type={a.type} unlocked small />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentEncounters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💜</Text>
            <Text style={styles.emptyText}>No encounters logged yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Log')}
            >
              <Text style={styles.emptyButtonText}>Log your first</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentEncounters.map(e => (
            <EncounterCard
              key={e.id}
              encounter={e}
              onPress={() => navigation.navigate('EncounterDetail', { encounterId: e.id, encounterDate: e.date })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroNumber: {
    color: colors.primary,
    fontSize: fontSize.mega,
    fontWeight: fontWeight.heavy,
    marginVertical: spacing.xs,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  seeAll: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  achievementRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});

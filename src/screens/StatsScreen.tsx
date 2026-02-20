import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import {
  getBodyCount, getTotalEncounterCount, getMonthlyStats, getDayOfWeekStats,
  getProtectionRate, getOrgasmRate, getPartnerLeaderboard, getNationalityBreakdown,
  getYearlyStats,
} from '../db/encounters';
import { getNationalityCount, getAlphabetCompletion } from '../db/partners';
import { StatCard } from '../components/StatCard';
import { getFlag } from '../utils/nationalities';
import { DAY_NAMES } from '../utils/constants';

const { width } = Dimensions.get('window');
const BAR_MAX_WIDTH = width - spacing.md * 4 - 100;

function ProgressBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number | string }) {
  const pct = max > 0 ? value / max : 0;
  return (
    <View style={barStyles.container}>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
        <Text style={barStyles.count}>{count}</Text>
      </View>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.max(pct * 100, 2)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function GaugeCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const pct = Math.round(value * 100);
  return (
    <View style={gaugeStyles.container}>
      <Text style={gaugeStyles.icon}>{icon}</Text>
      <Text style={[gaugeStyles.value, { color }]}>{pct}%</Text>
      <Text style={gaugeStyles.label}>{label}</Text>
      <View style={gaugeStyles.track}>
        <View style={[gaugeStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function StatsScreen() {
  const { refreshKey } = useDatabase();
  const [bodyCount, setBodyCount] = useState(0);
  const [totalEncounters, setTotalEncounters] = useState(0);
  const [nationalityCount, setNationalityCount] = useState(0);
  const [alphabetCount, setAlphabetCount] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState<{ month: string; count: number }[]>([]);
  const [dowStats, setDowStats] = useState<{ day: number; count: number }[]>([]);
  const [protectionRate, setProtectionRate] = useState(0);
  const [orgasmRate, setOrgasmRate] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ partner_id: string; partner_name: string; partner_nationality: string; count: number }[]>([]);
  const [nationalityBreakdown, setNationalityBreakdown] = useState<{ nationality: string; count: number }[]>([]);
  const [yearlyStats, setYearlyStats] = useState<{ year: string; total: number; partners: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  async function loadData() {
    const [bc, te, nc, ac, ms, ds, pr, or, lb, nb, ys] = await Promise.all([
      getBodyCount(),
      getTotalEncounterCount(),
      getNationalityCount(),
      getAlphabetCompletion(),
      getMonthlyStats(12),
      getDayOfWeekStats(),
      getProtectionRate(),
      getOrgasmRate(),
      getPartnerLeaderboard(10),
      getNationalityBreakdown(),
      getYearlyStats(),
    ]);
    setBodyCount(bc);
    setTotalEncounters(te);
    setNationalityCount(nc);
    setAlphabetCount(ac.count);
    setMonthlyStats(ms.reverse());
    setDowStats(ds);
    setProtectionRate(pr);
    setOrgasmRate(or);
    setLeaderboard(lb);
    setNationalityBreakdown(nb);
    setYearlyStats(ys);
  }

  const maxMonthly = Math.max(...monthlyStats.map(m => m.count), 1);
  const maxDow = Math.max(...dowStats.map(d => d.count), 1);
  const maxLeaderboard = leaderboard.length > 0 ? leaderboard[0].count : 1;
  const maxNationality = nationalityBreakdown.length > 0 ? nationalityBreakdown[0].count : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics</Text>

      {/* Hero Stats */}
      <View style={styles.heroRow}>
        <StatCard label="Body Count" value={bodyCount} icon="🔥" color={colors.accent} />
        <StatCard label="Encounters" value={totalEncounters} icon="💜" color={colors.primary} />
      </View>
      <View style={styles.heroRow}>
        <StatCard label="Nations" value={nationalityCount} icon="🌍" color={colors.warning} />
        <StatCard label="Alphabet" value={`${alphabetCount}/26`} icon="🔤" color={colors.success} />
      </View>

      {/* Rates */}
      <View style={styles.ratesRow}>
        <GaugeCard label="Protection" value={protectionRate} color={colors.success} icon="🛡️" />
        <GaugeCard label="Orgasm" value={orgasmRate} color={colors.accent} icon="💦" />
      </View>

      {/* Yearly Stats */}
      {yearlyStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yearly Breakdown</Text>
          <View style={styles.card}>
            {yearlyStats.map(y => (
              <View key={y.year} style={styles.yearRow}>
                <Text style={styles.yearLabel}>{y.year}</Text>
                <View style={styles.yearStats}>
                  <Text style={styles.yearStat}>{y.total} encounters</Text>
                  <Text style={styles.yearStatSub}>{y.partners} partners</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Monthly Frequency */}
      {monthlyStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Activity</Text>
          <View style={styles.card}>
            {monthlyStats.map(m => (
              <ProgressBar
                key={m.month}
                value={m.count}
                max={maxMonthly}
                color={colors.primary}
                label={m.month}
                count={m.count}
              />
            ))}
          </View>
        </View>
      )}

      {/* Day of Week */}
      {dowStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Day of Week</Text>
          <View style={styles.card}>
            {[0, 1, 2, 3, 4, 5, 6].map(day => {
              const stat = dowStats.find(d => d.day === day);
              return (
                <ProgressBar
                  key={day}
                  value={stat?.count ?? 0}
                  max={maxDow}
                  color={day === 0 || day === 6 ? colors.accent : colors.primary}
                  label={DAY_NAMES[day]}
                  count={stat?.count ?? 0}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Partner Leaderboard */}
      {leaderboard.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner Leaderboard</Text>
          <View style={styles.card}>
            {leaderboard.map((p, i) => (
              <ProgressBar
                key={p.partner_id}
                value={p.count}
                max={maxLeaderboard}
                color={i === 0 ? colors.warning : i === 1 ? colors.textSecondary : colors.primaryDark}
                label={`${getFlag(p.partner_nationality)} ${p.partner_name}`}
                count={`${p.count}x`}
              />
            ))}
          </View>
        </View>
      )}

      {/* Nationality Breakdown */}
      {nationalityBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nationalities ({nationalityCount})</Text>
          <View style={styles.card}>
            {nationalityBreakdown.map(n => (
              <ProgressBar
                key={n.nationality}
                value={n.count}
                max={maxNationality}
                color={colors.accent}
                label={`${getFlag(n.nationality)} ${n.nationality}`}
                count={n.count}
              />
            ))}
          </View>
        </View>
      )}
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
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  yearLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  yearStats: {
    alignItems: 'flex-end',
  },
  yearStat: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  yearStatSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});

const barStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  count: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

const gaugeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  track: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

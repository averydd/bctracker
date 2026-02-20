import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getPartnerRatings, PartnerRating } from '../db/encounter-partners';
import { getFlag } from '../utils/nationalities';

const SORT_OPTIONS = [
  { key: 'avg_overall', label: 'Overall' },
  { key: 'avg_oral', label: 'Oral' },
  { key: 'avg_attractiveness', label: 'Looks' },
  { key: 'avg_chemistry', label: 'Chemistry' },
  { key: 'encounter_count', label: 'Count' },
] as const;

function RatingBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function PartnerRankingsScreen({ navigation }: any) {
  const { refreshKey } = useDatabase();
  const [rankings, setRankings] = useState<PartnerRating[]>([]);
  const [sortBy, setSortBy] = useState('avg_overall');

  useEffect(() => {
    loadRankings();
  }, [refreshKey, sortBy]);

  async function loadRankings() {
    const data = await getPartnerRatings(sortBy);
    setRankings(data);
  }

  function getMedal(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text style={[styles.sortText, sortBy === opt.key && styles.sortTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rankings}
        keyExtractor={item => item.partner_id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('PartnerDetail', { partnerId: item.partner_id })}
          >
            <Text style={styles.rank}>{getMedal(index)}</Text>
            <View style={[styles.avatar, { backgroundColor: item.partner_sex === 'F' ? colors.female : colors.male }]}>
              <Text style={styles.avatarText}>{item.partner_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.partner_name}</Text>
                <Text style={styles.flag}>{getFlag(item.partner_nationality)}</Text>
                <Text style={styles.count}>{item.encounter_count}x</Text>
              </View>
              <View style={styles.ratingsRow}>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>👄</Text>
                  <RatingBar value={item.avg_oral || 0} color={colors.accent} />
                  <Text style={styles.ratingValue}>{item.avg_oral?.toFixed(1) || '-'}</Text>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>🔥</Text>
                  <RatingBar value={item.avg_attractiveness || 0} color={colors.warning} />
                  <Text style={styles.ratingValue}>{item.avg_attractiveness?.toFixed(1) || '-'}</Text>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>⚡</Text>
                  <RatingBar value={item.avg_chemistry || 0} color={colors.primary} />
                  <Text style={styles.ratingValue}>{item.avg_chemistry?.toFixed(1) || '-'}</Text>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>⭐</Text>
                  <RatingBar value={item.avg_overall || 0} color={colors.success} />
                  <Text style={styles.ratingValue}>{item.avg_overall?.toFixed(1) || '-'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No ratings yet. Rate partners when logging encounters.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sortRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.xs },
  sortChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight },
  sortChipActive: { backgroundColor: colors.primary },
  sortText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  sortTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  rank: { fontSize: 18, width: 30, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  flag: { fontSize: 13 },
  count: { color: colors.textMuted, fontSize: fontSize.xs, marginLeft: 'auto' },
  ratingsRow: { gap: 3 },
  ratingItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingLabel: { fontSize: 11, width: 18 },
  ratingValue: { color: colors.textSecondary, fontSize: 10, width: 24, textAlign: 'right' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl, fontSize: fontSize.md, paddingHorizontal: spacing.lg },
});

const barStyles = StyleSheet.create({
  track: { flex: 1, height: 5, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

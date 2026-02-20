import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { EncounterWithPartner } from '../db/encounters';
import { getFlag } from '../utils/nationalities';
import { VENUE_TYPES, EMOTION_TYPES } from '../utils/constants';

interface EncounterCardProps {
  encounter: EncounterWithPartner;
  onPress?: () => void;
}

export function EncounterCard({ encounter, onPress }: EncounterCardProps) {
  const flag = getFlag(encounter.partner_nationality);
  const date = new Date(encounter.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isSolo = encounter.is_solo === 1;
  const venue = VENUE_TYPES.find(v => v.key === encounter.venue_type);
  const emotionObj = EMOTION_TYPES.find(e => e.key === encounter.emotion);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {isSolo ? (
        <View style={[styles.avatar, { backgroundColor: colors.surfaceLight }]}>
          <Text style={styles.avatarText}>🫶</Text>
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: encounter.partner_sex === 'F' ? colors.female : colors.male }]}>
          <Text style={styles.avatarText}>{encounter.partner_name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{isSolo ? 'Solo' : encounter.partner_name}</Text>
          {!isSolo && <Text style={styles.flag}>{flag}</Text>}
          {(encounter.partner_count ?? 0) > 1 && (
            <View style={styles.multiTag}>
              <Text style={styles.multiTagText}>+{(encounter.partner_count ?? 1) - 1}</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{dateStr}</Text>
          {venue && <Text style={styles.meta}> · {venue.icon}</Text>}
          {emotionObj && <Text style={styles.meta}> {emotionObj.icon}</Text>}
          {encounter.on_period === 1 && <Text style={styles.meta}> 🩸</Text>}
        </View>
      </View>
      <View style={styles.badges}>
        {encounter.penetration === 1 && <View style={[styles.badge, styles.penetrationBadge]}><Text style={styles.badgeText}>P</Text></View>}
        {encounter.orgasm === 1 && <View style={[styles.badge, styles.orgasmBadge]}><Text style={styles.badgeText}>O</Text></View>}
        {encounter.protection === 1 && <View style={[styles.badge, styles.protectionBadge]}><Text style={styles.badgeText}>S</Text></View>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  flag: { fontSize: 14 },
  multiTag: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  multiTagText: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  date: { color: colors.textSecondary, fontSize: fontSize.sm },
  meta: { color: colors.textMuted, fontSize: fontSize.sm },
  badges: { flexDirection: 'row', gap: 4 },
  badge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: fontWeight.bold },
  penetrationBadge: { backgroundColor: colors.primary },
  orgasmBadge: { backgroundColor: colors.accent },
  protectionBadge: { backgroundColor: colors.success },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getAllPartners, PartnerWithStats } from '../db/partners';
import { getFlag } from '../utils/nationalities';

export function PartnersListScreen({ navigation }: any) {
  const { refreshKey } = useDatabase();
  const [partners, setPartners] = useState<PartnerWithStats[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPartners();
  }, [refreshKey]);

  async function loadPartners() {
    const all = await getAllPartners();
    setPartners(all);
  }

  const filtered = search
    ? partners.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nationality.toLowerCase().includes(search.toLowerCase())
      )
    : partners;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search partners..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.partnerRow}
            onPress={() => navigation.navigate('PartnerDetail', { partnerId: item.id })}
          >
            <View style={[styles.avatar, { backgroundColor: item.sex === 'F' ? colors.female : colors.male }]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.flag}>{getFlag(item.nationality)}</Text>
              </View>
              <Text style={styles.detail}>
                {item.nationality} · {item.encounter_count} encounter{item.encounter_count !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.count}>{item.encounter_count}x</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No partners found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchInput: {
    backgroundColor: colors.surfaceLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    color: colors.text,
    fontSize: fontSize.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  flag: {
    fontSize: 14,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  count: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: fontSize.md,
  },
});

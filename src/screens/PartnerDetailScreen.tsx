import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getPartnerById, PartnerWithStats, deletePartner, updatePartner } from '../db/partners';
import { getEncountersByPartner, Encounter } from '../db/encounters';
import { getPartnerHoleStats } from '../db/encounter-partners';
import { getFlag } from '../utils/nationalities';
import { getDatabase } from '../db/database';

export function PartnerDetailScreen({ route, navigation }: any) {
  const { partnerId } = route.params;
  const { refreshKey, refresh } = useDatabase();
  const [partner, setPartner] = useState<PartnerWithStats | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [holeStats, setHoleStats] = useState<Record<string, number>>({ mouth: 0, ass: 0, pussy: 0 });
  const [avgRatings, setAvgRatings] = useState({ oral: 0, attractiveness: 0, chemistry: 0, overall: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedSex, setEditedSex] = useState('');
  const [editedNationality, setEditedNationality] = useState('');
  const [editedEthnicity, setEditedEthnicity] = useState('');

  useEffect(() => { loadData(); }, [partnerId, refreshKey]);

  async function loadData() {
    const [p, e, hs] = await Promise.all([
      getPartnerById(partnerId),
      getEncountersByPartner(partnerId),
      getPartnerHoleStats(partnerId),
    ]);
    setPartner(p);
    setEncounters(e);
    setHoleStats(hs);

    if (p) {
      setEditedName(p.name);
      setEditedSex(p.sex);
      setEditedNationality(p.nationality);
      setEditedEthnicity(p.ethnicity);
    }

    const db = await getDatabase();
    const ratings = await db.getFirstAsync<any>(`
      SELECT
        ROUND(AVG(CASE WHEN oral_rating > 0 THEN oral_rating END), 1) as oral,
        ROUND(AVG(CASE WHEN attractiveness_rating > 0 THEN attractiveness_rating END), 1) as attractiveness,
        ROUND(AVG(CASE WHEN chemistry_rating > 0 THEN chemistry_rating END), 1) as chemistry,
        ROUND(AVG(CASE WHEN overall_rating > 0 THEN overall_rating END), 1) as overall
      FROM encounter_partners WHERE partner_id = ?
    `, [partnerId]);
    if (ratings) setAvgRatings({ oral: ratings.oral || 0, attractiveness: ratings.attractiveness || 0, chemistry: ratings.chemistry || 0, overall: ratings.overall || 0 });
  }

  if (!partner) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  const protectionRate = encounters.length > 0 ? Math.round((encounters.filter(e => e.protection).length / encounters.length) * 100) : 0;
  const orgasmRate = encounters.length > 0 ? Math.round((encounters.filter(e => e.orgasm).length / encounters.length) * 100) : 0;
  const totalHoles = holeStats.mouth + holeStats.ass + holeStats.pussy;

  async function handleSave() {
    await updatePartner(partnerId, {
      name: editedName,
      sex: editedSex,
      nationality: editedNationality,
      ethnicity: editedEthnicity,
    });
    setIsEditing(false);
    loadData();
    refresh();
  }

  function handleCancel() {
    setIsEditing(false);
    if (partner) {
      setEditedName(partner.name);
      setEditedSex(partner.sex);
      setEditedNationality(partner.nationality);
      setEditedEthnicity(partner.ethnicity);
    }
  }

  function handleDelete() {
    Alert.alert('Delete Partner', `Delete ${partner!.name} and all records? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePartner(partnerId); refresh(); navigation.goBack(); } },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Edit/Save/Cancel Buttons */}
      <View style={styles.editButtonRow}>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: editedSex === 'F' ? colors.female : colors.male }]}>
          <Text style={styles.avatarText}>{editedName.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        {isEditing ? (
          <>
            <TextInput
              style={styles.nameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.sexToggleRow}>
              <TouchableOpacity
                style={[styles.sexButton, editedSex === 'M' && styles.sexButtonActive]}
                onPress={() => setEditedSex('M')}
              >
                <Text style={[styles.sexButtonText, editedSex === 'M' && styles.sexButtonTextActive]}>M</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sexButton, editedSex === 'F' && styles.sexButtonActive]}
                onPress={() => setEditedSex('F')}
              >
                <Text style={[styles.sexButtonText, editedSex === 'F' && styles.sexButtonTextActive]}>F</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.nationalityInput}
              value={editedNationality}
              onChangeText={setEditedNationality}
              placeholder="Nationality"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.ethnicityInput}
              value={editedEthnicity}
              onChangeText={setEditedEthnicity}
              placeholder="Ethnicity"
              placeholderTextColor={colors.textMuted}
            />
          </>
        ) : (
          <>
            <Text style={styles.name}>{partner.name}</Text>
            <Text style={styles.nationality}>{getFlag(partner.nationality)} {partner.nationality}</Text>
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statValue}>{partner.encounter_count}</Text><Text style={styles.statLabel}>Times</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}><Text style={styles.statValue}>{protectionRate}%</Text><Text style={styles.statLabel}>Protected</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.accent }]}>{orgasmRate}%</Text><Text style={styles.statLabel}>Orgasm</Text></View>
      </View>

      {/* Ratings */}
      {(avgRatings.overall > 0 || avgRatings.oral > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Average Ratings</Text>
          <View style={styles.ratingsCard}>
            {[
              { label: '👄 Oral', value: avgRatings.oral },
              { label: '🔥 Looks', value: avgRatings.attractiveness },
              { label: '⚡ Chemistry', value: avgRatings.chemistry },
              { label: '⭐ Overall', value: avgRatings.overall },
            ].map(r => (
              <View key={r.label} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{r.label}</Text>
                <View style={styles.ratingBarTrack}>
                  <View style={[styles.ratingBarFill, { width: `${(r.value / 10) * 100}%`, backgroundColor: r.value >= 8 ? colors.success : r.value >= 5 ? colors.primary : colors.danger }]} />
                </View>
                <Text style={styles.ratingValue}>{r.value > 0 ? r.value.toFixed(1) : '-'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Holes */}
      {totalHoles > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.holesRow}>
            <View style={styles.holeItem}><Text style={styles.holeIcon}>👄</Text><Text style={styles.holeCount}>{holeStats.mouth}</Text><Text style={styles.holeLabel}>Mouth</Text></View>
            <View style={styles.holeItem}><Text style={styles.holeIcon}>🍑</Text><Text style={styles.holeCount}>{holeStats.ass}</Text><Text style={styles.holeLabel}>Ass</Text></View>
            <View style={styles.holeItem}><Text style={styles.holeIcon}>🐱</Text><Text style={styles.holeCount}>{holeStats.pussy}</Text><Text style={styles.holeLabel}>Pussy</Text></View>
          </View>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        {encounters.map((e, i) => (
          <TouchableOpacity
            key={e.id}
            style={styles.timelineItem}
            onPress={() => navigation.navigate('EncounterDetail', { encounterId: e.id, encounterDate: e.date })}
          >
            <View style={styles.timelineDot} />
            {i < encounters.length - 1 && <View style={styles.timelineLine} />}
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>
                {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <View style={styles.timelineBadges}>
                {e.penetration === 1 && <Text style={styles.timelineBadge}>🍆</Text>}
                {e.orgasm === 1 && <Text style={styles.timelineBadge}>💦</Text>}
                {e.protection === 1 && <Text style={styles.timelineBadge}>🛡️</Text>}
                {e.on_period === 1 && <Text style={styles.timelineBadge}>🩸</Text>}
                {e.emotion && <Text style={styles.timelineBadge}>{e.emotion === 'amazing' ? '🤩' : e.emotion === 'great' ? '😊' : e.emotion === 'good' ? '😐' : e.emotion === 'meh' ? '😕' : '😣'}</Text>}
              </View>
              {e.notes && <Text style={styles.timelineNotes}>{e.notes}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Partner</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 100 },
  editButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  editButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  editButtonText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  cancelButton: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  cancelButtonText: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  saveButton: { backgroundColor: colors.success, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  saveButtonText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: fontWeight.bold },
  name: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  nationality: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.xs },
  nameInput: { backgroundColor: colors.card, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.xs, textAlign: 'center', width: '100%' },
  sexToggleRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  sexButton: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minWidth: 50 },
  sexButtonActive: { backgroundColor: colors.primary },
  sexButtonText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: 'center' },
  sexButtonTextActive: { color: colors.white },
  nationalityInput: { backgroundColor: colors.card, color: colors.text, fontSize: fontSize.md, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.xs, textAlign: 'center', width: '100%' },
  ethnicityInput: { backgroundColor: colors.card, color: colors.text, fontSize: fontSize.md, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.xs, textAlign: 'center', width: '100%' },
  birthdateInput: { backgroundColor: colors.card, color: colors.text, fontSize: fontSize.sm, borderRadius: borderRadius.md, padding: spacing.sm, textAlign: 'center', width: '100%' },
  birthdate: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { color: colors.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  ratingsCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  ratingLabel: { color: colors.textSecondary, fontSize: fontSize.sm, width: 90 },
  ratingBarTrack: { flex: 1, height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: 'hidden', marginHorizontal: spacing.sm },
  ratingBarFill: { height: '100%', borderRadius: 3 },
  ratingValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.bold, width: 30, textAlign: 'right' },
  holesRow: { flexDirection: 'row', gap: spacing.sm },
  holeItem: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  holeIcon: { fontSize: 24, marginBottom: spacing.xs },
  holeCount: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  holeLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  timelineItem: { flexDirection: 'row', paddingLeft: spacing.sm, marginBottom: spacing.sm, position: 'relative' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6, marginRight: spacing.md, zIndex: 1 },
  timelineLine: { position: 'absolute', left: spacing.sm + 4, top: 16, bottom: -spacing.sm, width: 2, backgroundColor: colors.border },
  timelineContent: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.sm, padding: spacing.sm },
  timelineDate: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  timelineBadges: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  timelineBadge: { fontSize: 14 },
  timelineNotes: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4, fontStyle: 'italic' },
  deleteButton: { alignItems: 'center', padding: spacing.md, marginTop: spacing.lg },
  deleteText: { color: colors.danger, fontSize: fontSize.md, fontWeight: fontWeight.medium },
});

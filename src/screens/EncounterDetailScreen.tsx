import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getEncounterById, deleteEncounter, updateEncounter, EncounterWithPartner } from '../db/encounters';
import { getEncounterPartners } from '../db/encounter-partners';
import { getFlag } from '../utils/nationalities';
import { VENUE_TYPES, EMOTION_TYPES, DURATION_PRESETS } from '../utils/constants';

export function EncounterDetailScreen({ route, navigation }: any) {
  const { encounterId, encounterDate } = route.params;
  const { refresh } = useDatabase();
  const [encounter, setEncounter] = useState<EncounterWithPartner | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedTime, setEditedTime] = useState('');
  const [editedPenetration, setEditedPenetration] = useState(false);
  const [editedOrgasm, setEditedOrgasm] = useState(false);
  const [editedProtection, setEditedProtection] = useState(false);

  useEffect(() => { loadData(); }, [encounterId]);

  async function loadData() {
    const found = await getEncounterById(encounterId);
    setEncounter(found || null);

    if (found) {
      setEditedNotes(found.notes || '');
      setEditedDate(found.date || '');
      setEditedTime(found.time || '');
      setEditedPenetration(found.penetration === 1);
      setEditedOrgasm(found.orgasm === 1);
      setEditedProtection(found.protection === 1);
    }

    if (found && !found.is_solo) {
      const partnerData = await getEncounterPartners(encounterId);
      setPartners(partnerData);
    }
  }

  async function handleSave() {
    await updateEncounter(encounterId, {
      date: editedDate || null,
      notes: editedNotes || null,
      time: editedTime || null,
      penetration: editedPenetration ? 1 : 0,
      orgasm: editedOrgasm ? 1 : 0,
      protection: editedProtection ? 1 : 0,
    });
    setIsEditing(false);
    loadData();
    refresh();
  }

  function handleDelete() {
    Alert.alert(
      'Delete Encounter',
      'Delete this encounter? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEncounter(encounterId);
            refresh();
            navigation.goBack();
          },
        },
      ]
    );
  }

  if (!encounter) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const date = new Date(encounter.date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const isSolo = encounter.is_solo === 1;
  const venue = VENUE_TYPES.find(v => v.key === encounter.venue_type);
  const emotion = EMOTION_TYPES.find(e => e.key === encounter.emotion);
  const duration = DURATION_PRESETS.find(d => d.minutes === encounter.duration_minutes);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{dateStr}</Text>
      {encounter.time && <Text style={styles.time}>{encounter.time}</Text>}

      {/* Partners */}
      {isSolo ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solo Session</Text>
          <View style={styles.card}>
            <Text style={styles.soloIcon}>🫶</Text>
            {encounter.solo_method && (
              <Text style={styles.detail}>Method: {encounter.solo_method}</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {partners.length > 1 ? `Partners (${partners.length})` : 'Partner'}
          </Text>
          {partners.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.partnerCard}
              onPress={() => navigation.navigate('PartnerDetail', { partnerId: p.partner_id })}
            >
              <View style={[styles.avatar, { backgroundColor: p.partner_sex === 'F' ? colors.female : colors.male }]}>
                <Text style={styles.avatarText}>{p.partner_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{p.partner_name}</Text>
                <Text style={styles.partnerNat}>
                  {getFlag(p.partner_nationality)} {p.partner_nationality}
                  {p.age_at_encounter && ` · ${p.age_at_encounter} years old`}
                </Text>
                {p.holes && JSON.parse(p.holes).length > 0 && (
                  <Text style={styles.holes}>
                    {JSON.parse(p.holes).map((h: string) =>
                      h === 'mouth' ? '👄' : h === 'ass' ? '🍑' : '🐱'
                    ).join(' ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          {venue && <Text style={styles.detail}>{venue.icon} {venue.label}</Text>}
          {encounter.location_city && <Text style={styles.detail}>📍 {encounter.location_city}</Text>}
          {duration && <Text style={styles.detail}>⏱️ {duration.label}</Text>}
          {emotion && <Text style={styles.detail}>{emotion.icon} {emotion.label}</Text>}
          {encounter.on_period === 1 && <Text style={styles.detail}>🩸 On period</Text>}
        </View>
      </View>

      {/* Flags */}
      {isEditing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Details</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.timeInput}
                value={editedDate}
                onChangeText={setEditedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Time (optional)</Text>
              <TextInput
                style={styles.timeInput}
                value={editedTime}
                onChangeText={setEditedTime}
                placeholder="e.g. 10:30 PM"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Penetration</Text>
              <Switch value={editedPenetration} onValueChange={setEditedPenetration} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Orgasm</Text>
              <Switch value={editedOrgasm} onValueChange={setEditedOrgasm} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Protection</Text>
              <Switch value={editedProtection} onValueChange={setEditedProtection} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.flagsRow}>
          <View style={[styles.flagCard, encounter.penetration ? styles.flagActive : styles.flagInactive]}>
            <Text style={styles.flagText}>Penetration</Text>
          </View>
          <View style={[styles.flagCard, encounter.orgasm ? styles.flagActive : styles.flagInactive]}>
            <Text style={styles.flagText}>Orgasm</Text>
          </View>
          <View style={[styles.flagCard, encounter.protection ? styles.flagActive : styles.flagInactive]}>
            <Text style={styles.flagText}>Protection</Text>
          </View>
        </View>
      )}

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.card}>
          {isEditing ? (
            <TextInput
              style={styles.notesInput}
              value={editedNotes}
              onChangeText={setEditedNotes}
              multiline
              placeholder="Add notes..."
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            encounter.notes ? (
              <Text style={styles.notes}>{encounter.notes}</Text>
            ) : (
              <Text style={styles.emptyNotes}>No notes</Text>
            )
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {isEditing ? (
          <>
            <TouchableOpacity style={styles.editButton} onPress={handleSave}>
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                loadData();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  loading: { color: colors.text, fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.xxl },
  date: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center', marginBottom: spacing.xs },
  time: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md },
  soloIcon: { fontSize: 48, textAlign: 'center', marginVertical: spacing.md },
  detail: { color: colors.text, fontSize: fontSize.md, marginBottom: spacing.xs },
  partnerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: colors.white, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  partnerInfo: { flex: 1 },
  partnerName: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  partnerNat: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  holes: { fontSize: fontSize.md, marginTop: spacing.xs },
  flagsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  flagCard: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  flagActive: { backgroundColor: colors.success },
  flagInactive: { backgroundColor: colors.surfaceLight },
  flagText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  notes: { color: colors.text, fontSize: fontSize.md, lineHeight: 22 },
  emptyNotes: { color: colors.textMuted, fontSize: fontSize.md, fontStyle: 'italic' },
  notesInput: { color: colors.text, fontSize: fontSize.md, lineHeight: 22, minHeight: 80, textAlignVertical: 'top' },
  inputRow: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  timeInput: { color: colors.text, fontSize: fontSize.md, padding: spacing.sm, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  switchLabel: { color: colors.text, fontSize: fontSize.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  editButton: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  editButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  cancelButton: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  deleteButton: { flex: 1, backgroundColor: colors.danger, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  deleteButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { Partner } from '../db/partners';
import { getUniqueNationalities, getNationalityCount } from '../db/partners';
import { createEncounter, getBodyCount } from '../db/encounters';
import { createEncounterPartner, checkAirtight } from '../db/encounter-partners';
import { createSTIReminder } from '../db/sti-tests';
import { checkAndUnlockAchievements, unlockAchievement } from '../db/achievements';
import { PartnerSelector } from '../components/PartnerSelector';
import { CelebrationModal } from '../components/CelebrationModal';
import { MilestoneModal } from '../components/MilestoneModal';
import { HoleSelector } from '../components/HoleSelector';
import { RatingSlider } from '../components/RatingSlider';
import { ChipPicker } from '../components/ChipPicker';
import { getFlag } from '../utils/nationalities';
import { BODY_COUNT_MILESTONES, VENUE_TYPES, EMOTION_TYPES, DURATION_PRESETS, SOLO_METHODS, RATING_CATEGORIES } from '../utils/constants';

interface PartnerEntry {
  partner: Partner;
  isNew: boolean;
  holes: string[];
  oral_rating: number;
  attractiveness_rating: number;
  chemistry_rating: number;
  overall_rating: number;
  age: number | null;
}

export function LogEncounterScreen({ navigation, route }: any) {
  const { refresh } = useDatabase();
  const presetDate = route?.params?.presetDate;
  const [date, setDate] = useState(() => {
    if (presetDate) {
      return new Date(presetDate + 'T12:00:00');
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  });

  const [isSolo, setIsSolo] = useState(false);
  const [soloMethod, setSoloMethod] = useState<string | null>(null);

  // Update date when preset date changes
  useEffect(() => {
    if (presetDate) {
      setDate(new Date(presetDate + 'T12:00:00'));
    }
  }, [presetDate]);

  const [partners, setPartners] = useState<PartnerEntry[]>([]);
  const [showPartnerSelector, setShowPartnerSelector] = useState(false);
  const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(null);

  const [penetration, setPenetration] = useState(true);
  const [orgasm, setOrgasm] = useState(false);
  const [protection, setProtection] = useState(false);
  const [onPeriod, setOnPeriod] = useState(false);
  const [notes, setNotes] = useState('');

  const [locationCity, setLocationCity] = useState('');
  const [venueType, setVenueType] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationNationality, setCelebrationNationality] = useState('');
  const [celebrationNatCount, setCelebrationNatCount] = useState(0);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [milestoneType, setMilestoneType] = useState<'encounter' | 'bodycount'>('encounter');

  function addPartner(partner: Partner) {
    const isNew = !partner.created_at || (Date.now() - new Date(partner.created_at).getTime()) < 5000;
    setPartners(prev => [...prev, {
      partner, isNew, holes: [],
      oral_rating: 0, attractiveness_rating: 0, chemistry_rating: 0, overall_rating: 0,
      age: null,
    }]);
    setShowPartnerSelector(false);
  }

  function removePartner(index: number) {
    setPartners(prev => prev.filter((_, i) => i !== index));
    if (editingPartnerIndex === index) setEditingPartnerIndex(null);
  }

  function updatePartnerField(index: number, field: string, value: any) {
    setPartners(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    if (!isSolo && partners.length === 0) {
      Alert.alert('Add Partner', 'Select at least one partner or switch to Solo mode.');
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const durationMinutes = duration ? DURATION_PRESETS.find(d => d.key === duration)?.minutes ?? null : null;

    const existingNationalities = isSolo ? [] : await getUniqueNationalities();
    const newNationalities = partners
      .filter(p => p.isNew && p.partner.nationality && !existingNationalities.includes(p.partner.nationality))
      .map(p => p.partner.nationality);

    const prevBodyCount = isSolo ? 0 : await getBodyCount();

    const encounter = await createEncounter({
      date: dateStr,
      time: time || null,
      partner_id: partners.length === 1 ? partners[0].partner.id : null,
      penetration: penetration ? 1 : 0,
      orgasm: orgasm ? 1 : 0,
      protection: protection ? 1 : 0,
      notes: notes || null,
      location_city: locationCity || null,
      venue_type: venueType,
      duration_minutes: durationMinutes,
      emotion,
      is_solo: isSolo ? 1 : 0,
      solo_method: isSolo ? soloMethod : null,
      on_period: onPeriod ? 1 : 0,
    });

    if (!isSolo) {
      for (const pe of partners) {
        await createEncounterPartner({
          encounter_id: encounter.id,
          partner_id: pe.partner.id,
          holes: pe.holes,
          oral_rating: pe.oral_rating || undefined,
          attractiveness_rating: pe.attractiveness_rating || undefined,
          chemistry_rating: pe.chemistry_rating || undefined,
          overall_rating: pe.overall_rating || undefined,
          age_at_encounter: pe.age ?? undefined,
        });
      }

      for (const pe of partners) {
        if (pe.isNew && !protection) {
          await createSTIReminder(dateStr, encounter.id);
          break;
        }
      }

      const isAirtight = await checkAirtight(encounter.id);
      if (isAirtight) {
        await unlockAchievement('airtight', 'Unsinkable');
      }
    }

    await checkAndUnlockAchievements();

    if (newNationalities.length > 0) {
      const natCount = await getNationalityCount();
      setCelebrationNationality(newNationalities[0]);
      setCelebrationNatCount(natCount);
      setShowCelebration(true);
    }

    if (!isSolo) {
      const newBodyCount = await getBodyCount();
      if (BODY_COUNT_MILESTONES.includes(newBodyCount) && newBodyCount > prevBodyCount) {
        setMilestoneCount(newBodyCount);
        setMilestoneType('bodycount');
        if (newNationalities.length === 0) setShowMilestone(true);
      }
    }

    refresh();

    if (newNationalities.length === 0 && milestoneCount === 0) {
      handlePostSave();
      if (!presetDate) {
        Alert.alert('Logged!', isSolo ? 'Solo session saved.' : 'Encounter saved.');
      }
    }
  }

  function resetForm() {
    setPartners([]); setPenetration(true); setOrgasm(false); setProtection(false);
    setOnPeriod(false); setNotes(''); setDate(new Date()); setIsSolo(false);
    setSoloMethod(null); setLocationCity(''); setVenueType(null); setEmotion(null);
    setDuration(null); setEditingPartnerIndex(null); setMilestoneCount(0);
    const now = new Date();
    setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
  }

  function handlePostSave() {
    if (presetDate) {
      // User came from calendar, navigate back to Calendar tab
      navigation.navigate('Calendar');
    } else {
      resetForm();
    }
  }

  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const hasNewUnprotected = partners.some(p => p.isNew) && !protection;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Entry</Text>

      {/* Solo / Partner Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity style={[styles.modeButton, !isSolo && styles.modeButtonActive]} onPress={() => setIsSolo(false)}>
          <Text style={[styles.modeText, !isSolo && styles.modeTextActive]}>With Partner(s)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, isSolo && styles.modeButtonActive]} onPress={() => setIsSolo(true)}>
          <Text style={[styles.modeText, isSolo && styles.modeTextActive]}>Solo</Text>
        </TouchableOpacity>
      </View>

      {/* Date */}
      <TouchableOpacity style={styles.field} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.fieldLabel}>Date</Text>
        <Text style={styles.fieldValue}>{dateStr}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setDate(d); }}
          maximumDate={new Date()} themeVariant="dark" />
      )}

      {/* Time */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Time</Text>
        <TextInput
          style={styles.fieldValue}
          value={time}
          onChangeText={setTime}
          placeholder="e.g. 10:30 PM"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Solo Method */}
      {isSolo && (
        <View style={styles.field}>
          <ChipPicker options={SOLO_METHODS} selected={soloMethod} onChange={setSoloMethod} label="Method" />
        </View>
      )}

      {/* Partners */}
      {!isSolo && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Partners</Text>
          {partners.map((pe, i) => (
            <View key={`${pe.partner.id}-${i}`} style={styles.partnerCard}>
              <TouchableOpacity style={styles.partnerHeader}
                onPress={() => setEditingPartnerIndex(editingPartnerIndex === i ? null : i)}>
                <View style={[styles.avatar, { backgroundColor: pe.partner.sex === 'F' ? colors.female : colors.male }]}>
                  <Text style={styles.avatarText}>{pe.partner.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>
                    {pe.partner.name} {getFlag(pe.partner.nationality)}{pe.isNew ? ' (NEW)' : ''}
                  </Text>
                  <Text style={styles.partnerSub}>
                    {pe.holes.length > 0 ? pe.holes.map(h => h === 'mouth' ? '👄' : h === 'ass' ? '🍑' : '🐱').join(' ') : 'Tap to set details'}
                    {pe.overall_rating > 0 ? ` · ${pe.overall_rating}/10` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removePartner(i)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              {editingPartnerIndex === i && (
                <View style={styles.partnerDetails}>
                  <Text style={styles.subLabel}>Holes</Text>
                  <HoleSelector selected={pe.holes} onChange={(holes) => updatePartnerField(i, 'holes', holes)} />
                  <View style={{ height: spacing.md }} />
                  <Text style={styles.subLabel}>Ratings</Text>
                  {RATING_CATEGORIES.map(cat => (
                    <RatingSlider key={cat.key} label={cat.label} icon={cat.icon}
                      value={(pe as any)[cat.key]}
                      onChange={(v) => updatePartnerField(i, cat.key, v)} />
                  ))}
                  <View style={{ height: spacing.md }} />
                  <Text style={styles.subLabel}>Age (optional)</Text>
                  <TextInput
                    style={styles.ageInput}
                    placeholder="How old were they?"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={pe.age?.toString() || ''}
                    onChangeText={(text) => updatePartnerField(i, 'age', text ? parseInt(text) : null)}
                  />
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addPartnerBtn} onPress={() => setShowPartnerSelector(true)}>
            <Text style={styles.addPartnerBtnText}>+ Add Partner</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toggles */}
      <View style={styles.toggleSection}>
        {!isSolo && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}><Text style={styles.toggleEmoji}>🍆</Text><Text style={styles.toggleLabel}>Penetration</Text></View>
            <Switch value={penetration} onValueChange={setPenetration} trackColor={{ false: colors.surfaceLight, true: colors.primaryDark }} thumbColor={penetration ? colors.primary : colors.textMuted} />
          </View>
        )}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}><Text style={styles.toggleEmoji}>💦</Text><Text style={styles.toggleLabel}>Orgasm</Text></View>
          <Switch value={orgasm} onValueChange={setOrgasm} trackColor={{ false: colors.surfaceLight, true: colors.accentLight }} thumbColor={orgasm ? colors.accent : colors.textMuted} />
        </View>
        {!isSolo && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}><Text style={styles.toggleEmoji}>🛡️</Text><Text style={styles.toggleLabel}>Protection</Text></View>
            <Switch value={protection} onValueChange={setProtection} trackColor={{ false: colors.surfaceLight, true: colors.success }} thumbColor={protection ? colors.success : colors.textMuted} />
          </View>
        )}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}><Text style={styles.toggleEmoji}>🩸</Text><Text style={styles.toggleLabel}>On Period</Text></View>
          <Switch value={onPeriod} onValueChange={setOnPeriod} trackColor={{ false: colors.surfaceLight, true: colors.danger }} thumbColor={onPeriod ? colors.danger : colors.textMuted} />
        </View>
      </View>

      {!isSolo && hasNewUnprotected && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠️ New partner without protection - STI test reminder will be set for 2 weeks</Text>
        </View>
      )}

      {/* Emotion, Duration, Venue */}
      <View style={styles.field}><ChipPicker options={EMOTION_TYPES} selected={emotion} onChange={setEmotion} label="How was it?" /></View>
      <View style={styles.field}><ChipPicker options={DURATION_PRESETS} selected={duration} onChange={setDuration} label="Duration" scrollable /></View>
      <View style={styles.field}><ChipPicker options={VENUE_TYPES} selected={venueType} onChange={setVenueType} label="Venue" scrollable /></View>

      <TextInput style={styles.textInput} placeholder="City / Location (optional)" placeholderTextColor={colors.textMuted} value={locationCity} onChangeText={setLocationCity} />
      <TextInput style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]} placeholder="Notes (optional)" placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{isSolo ? 'Log Solo Session' : 'Log Encounter'}</Text>
      </TouchableOpacity>

      <PartnerSelector visible={showPartnerSelector} onSelect={addPartner} onClose={() => setShowPartnerSelector(false)} />
      <CelebrationModal visible={showCelebration} nationality={celebrationNationality} nationalityCount={celebrationNatCount}
        onDismiss={() => { setShowCelebration(false); if (milestoneCount > 0) setShowMilestone(true); else handlePostSave(); }} />
      <MilestoneModal visible={showMilestone} count={milestoneCount} type={milestoneType}
        onDismiss={() => { setShowMilestone(false); setMilestoneCount(0); handlePostSave(); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.xxl + spacing.lg, paddingBottom: 120 },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.md },
  modeButton: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  modeButtonActive: { backgroundColor: colors.primary },
  modeText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  modeTextActive: { color: colors.white },
  field: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
  fieldValue: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.medium },
  section: { marginBottom: spacing.sm },
  partnerCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  partnerName: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  partnerSub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  removeBtn: { padding: spacing.sm },
  removeBtnText: { color: colors.textMuted, fontSize: fontSize.md },
  partnerDetails: { padding: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  subLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.xs },
  addPartnerBtn: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed' },
  addPartnerBtnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  toggleSection: { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleEmoji: { fontSize: 20 },
  toggleLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.medium },
  warningBox: { backgroundColor: '#2D2B1B', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.warning },
  warningText: { color: colors.warning, fontSize: fontSize.sm },
  textInput: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.sm },
  ageInput: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.text, fontSize: fontSize.md },
  saveButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  saveButtonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});

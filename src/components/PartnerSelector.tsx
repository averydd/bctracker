import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { Partner, searchPartners, getAllPartners, createPartner } from '../db/partners';
import { getFlag, getAllNationalities } from '../utils/nationalities';

interface PartnerSelectorProps {
  visible: boolean;
  onSelect: (partner: Partner) => void;
  onClose: () => void;
}

export function PartnerSelector({ visible, onSelect, onClose }: PartnerSelectorProps) {
  const [query, setQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSex, setNewSex] = useState('M');
  const [newNationality, setNewNationality] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPartners();
      setShowNewForm(false);
      setQuery('');
    }
  }, [visible]);

  async function loadPartners() {
    const all = query ? await searchPartners(query) : await getAllPartners();
    setPartners(all);
  }

  useEffect(() => {
    if (visible) loadPartners();
  }, [query]);

  async function handleCreatePartner() {
    if (!newName.trim()) return;
    const partner = await createPartner({
      name: newName.trim(),
      sex: newSex,
      nationality: newNationality,
      ethnicity: '',
    });
    onSelect(partner);
    resetForm();
  }

  function resetForm() {
    setNewName('');
    setNewSex('M');
    setNewNationality('');
    setShowNewForm(false);
  }

  const allNationalities = getAllNationalities();
  const filteredNationalities = nationalitySearch
    ? allNationalities.filter(n => n.toLowerCase().includes(nationalitySearch.toLowerCase()))
    : allNationalities;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Partner</Text>
          <TouchableOpacity onPress={() => setShowNewForm(!showNewForm)}>
            <Text style={styles.addNew}>{showNewForm ? 'Search' : '+ New'}</Text>
          </TouchableOpacity>
        </View>

        {showNewForm ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.sexRow}>
              <Text style={styles.fieldLabel}>Sex:</Text>
              {['M', 'F'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sexButton, newSex === s && styles.sexButtonActive]}
                  onPress={() => setNewSex(s)}
                >
                  <Text style={[styles.sexText, newSex === s && styles.sexTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowNationalityPicker(true)}
            >
              <Text style={newNationality ? styles.inputText : styles.placeholder}>
                {newNationality ? `${getFlag(newNationality)} ${newNationality}` : 'Nationality'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePartner}>
              <Text style={styles.createButtonText}>Add & Select</Text>
            </TouchableOpacity>

            <Modal visible={showNationalityPicker} animationType="slide" presentationStyle="pageSheet">
              <View style={styles.container}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setShowNationalityPicker(false)}>
                    <Text style={styles.cancel}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>Nationality</Text>
                  <View style={{ width: 60 }} />
                </View>
                <TextInput
                  style={[styles.input, { marginHorizontal: spacing.md }]}
                  placeholder="Search nationality..."
                  placeholderTextColor={colors.textMuted}
                  value={nationalitySearch}
                  onChangeText={setNationalitySearch}
                  autoFocus
                />
                <FlatList
                  data={filteredNationalities}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.partnerRow}
                      onPress={() => {
                        setNewNationality(item);
                        setShowNationalityPicker(false);
                        setNationalitySearch('');
                      }}
                    >
                      <Text style={styles.flag}>{getFlag(item)}</Text>
                      <Text style={styles.partnerName}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </Modal>
          </View>
        ) : (
          <>
            <TextInput
              style={[styles.input, { marginHorizontal: spacing.md }]}
              placeholder="Search partners..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <FlatList
              data={partners}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.partnerRow}
                  onPress={() => onSelect(item)}
                >
                  <View style={[styles.avatar, { backgroundColor: item.sex === 'F' ? colors.female : colors.male }]}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{item.name}</Text>
                    <Text style={styles.partnerDetail}>
                      {getFlag(item.nationality)} {item.nationality}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No partners found</Text>
                  <TouchableOpacity onPress={() => setShowNewForm(true)}>
                    <Text style={styles.addNewLink}>+ Add new partner</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  cancel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  addNew: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  inputText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  form: {
    padding: spacing.md,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  sexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sexButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  sexButtonActive: {
    backgroundColor: colors.primary,
  },
  sexText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sexTextActive: {
    color: colors.white,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  createButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  partnerDetail: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  addNewLink: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getUnlockedAchievements, ACHIEVEMENT_DEFINITIONS, Achievement } from '../db/achievements';
import { getAllSTITests, completeSTITest, STITestWithDetails } from '../db/sti-tests';
import { AchievementBadge } from '../components/AchievementBadge';
import { importFromFile, importRowsToDatabase } from '../utils/excel-import';
import { clearAllData } from '../db/database';

export function ProfileScreen({ navigation }: any) {
  const { refreshKey, refresh } = useDatabase();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stiTests, setStiTests] = useState<STITestWithDetails[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  async function loadData() {
    const [ach, tests] = await Promise.all([
      getUnlockedAchievements(),
      getAllSTITests(),
    ]);
    setAchievements(ach);
    setStiTests(tests);
  }

  async function handleQuickImport() {
    try {
      setImporting(true);
      const { importFromDocuments } = await import('../utils/excel-import');
      const rows = await importFromDocuments();

      if (rows.length === 0) {
        setImporting(false);
        Alert.alert('No Data', 'Body Count.csv not found in Documents folder');
        return;
      }

      Alert.alert(
        'Import Preview',
        `Found ${rows.length} entries to import. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setImporting(false) },
          {
            text: 'Import',
            onPress: async () => {
              const result = await importRowsToDatabase(rows);
              setImporting(false);
              refresh();
              Alert.alert(
                'Import Complete',
                `Imported ${result.partners} partners and ${result.encounters} encounters.`
              );
            },
          },
        ]
      );
    } catch (error: any) {
      setImporting(false);
      Alert.alert('Import Error', error.message);
    }
  }

  async function handleImport() {
    try {
      setImporting(true);
      const rows = await importFromFile();
      if (rows.length === 0) {
        setImporting(false);
        return;
      }

      Alert.alert(
        'Import Preview',
        `Found ${rows.length} entries to import. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setImporting(false) },
          {
            text: 'Import',
            onPress: async () => {
              const result = await importRowsToDatabase(rows);
              setImporting(false);
              refresh();
              Alert.alert(
                'Import Complete',
                `Imported ${result.partners} partners and ${result.encounters} encounters.`
              );
            },
          },
        ]
      );
    } catch (error: any) {
      setImporting(false);
      Alert.alert('Import Error', error.message);
    }
  }

  async function handleCompleteTest(test: STITestWithDetails) {
    Alert.alert(
      'Log Test Result',
      'What was the result?',
      [
        {
          text: 'All Clear',
          onPress: async () => {
            await completeSTITest(test.id, new Date().toISOString().split('T')[0], 'clear');
            refresh();
          },
        },
        {
          text: 'Positive',
          style: 'destructive',
          onPress: async () => {
            await completeSTITest(test.id, new Date().toISOString().split('T')[0], 'positive');
            refresh();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  async function handleClearAllData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all partners, encounters, achievements, and STI tests. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            refresh();
            Alert.alert('Data Cleared', 'All data has been deleted. You can now re-import your CSV.');
          },
        },
      ]
    );
  }

  const unlockedTypes = new Set(achievements.map(a => a.type));
  const pendingTests = stiTests.filter(t => !t.completed);
  const completedTests = stiTests.filter(t => t.completed);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {/* STI Tests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STI Test Tracker</Text>

        {pendingTests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pending Reminders</Text>
            {pendingTests.map(test => (
              <TouchableOpacity
                key={test.id}
                style={styles.testRow}
                onPress={() => handleCompleteTest(test)}
              >
                <View>
                  <Text style={styles.testPartner}>
                    After: {test.partner_name || 'Unknown'}
                  </Text>
                  <Text style={styles.testDate}>
                    Due: {new Date(test.reminder_date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.testAction}>Log Result</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {completedTests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Test History</Text>
            {completedTests.slice(0, 5).map(test => (
              <View key={test.id} style={styles.testRow}>
                <View>
                  <Text style={styles.testPartner}>{test.partner_name || 'General'}</Text>
                  <Text style={styles.testDate}>
                    Tested: {test.test_date ? new Date(test.test_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={[
                  styles.resultBadge,
                  { backgroundColor: test.result === 'clear' ? colors.success : colors.danger }
                ]}>
                  <Text style={styles.resultText}>
                    {test.result === 'clear' ? 'Clear' : test.result === 'positive' ? 'Positive' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {stiTests.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No STI test reminders yet. They'll appear when you log an unprotected encounter with a new partner.</Text>
          </View>
        )}
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Achievements ({achievements.length}/{ACHIEVEMENT_DEFINITIONS.length})
        </Text>
        <View style={styles.achievementGrid}>
          {ACHIEVEMENT_DEFINITIONS.map(def => (
            <AchievementBadge
              key={def.type}
              type={def.type}
              unlocked={unlockedTypes.has(def.type)}
            />
          ))}
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PartnerRankings')}
        >
          <Text style={styles.actionIcon}>🏆</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionLabel}>Partner Rankings</Text>
            <Text style={styles.actionDesc}>Sortable leaderboard with ratings</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleQuickImport}
          disabled={importing}
        >
          <Text style={styles.actionIcon}>⚡</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionLabel}>
              {importing ? 'Importing...' : 'Quick Import'}
            </Text>
            <Text style={styles.actionDesc}>Import Body Count.csv from app folder</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleImport}
          disabled={importing}
        >
          <Text style={styles.actionIcon}>📥</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionLabel}>
              {importing ? 'Importing...' : 'Import from Excel/CSV'}
            </Text>
            <Text style={styles.actionDesc}>Import your existing spreadsheet data</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PartnersList')}
        >
          <Text style={styles.actionIcon}>👥</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionLabel}>View All Partners</Text>
            <Text style={styles.actionDesc}>Browse and manage your partner list</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearAllData}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionLabel, styles.dangerText]}>Clear All Data</Text>
            <Text style={styles.actionDesc}>Delete everything and start fresh</Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
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
    marginBottom: spacing.sm,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  testPartner: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  testDate: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  testAction: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  resultBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  resultText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  actionDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerText: {
    color: colors.danger,
  },
});

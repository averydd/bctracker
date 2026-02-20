import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useDatabase } from '../hooks/useDatabase';
import { getEncounterDatesForMonth, getEncountersByDate, EncounterWithPartner } from '../db/encounters';
import { EncounterCard } from '../components/EncounterCard';

export function CalendarScreen({ navigation }: any) {
  const { refreshKey } = useDatabase();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [dayEncounters, setDayEncounters] = useState<EncounterWithPartner[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  useEffect(() => {
    loadMonth(currentMonth);
  }, [currentMonth, refreshKey]);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, refreshKey]);

  useFocusEffect(
    React.useCallback(() => {
      loadMonth(currentMonth);
      loadDay(selectedDate);
    }, [currentMonth, selectedDate])
  );

  async function loadMonth(yearMonth: string) {
    const encounters = await getEncounterDatesForMonth(yearMonth);
    const marks: any = {};
    const partnerColors = new Map<string, string>();
    let colorIdx = 0;

    for (const e of encounters) {
      if (!partnerColors.has(e.partner_id)) {
        partnerColors.set(e.partner_id, colors.dots[colorIdx % colors.dots.length]);
        colorIdx++;
      }
      const color = partnerColors.get(e.partner_id)!;

      if (!marks[e.date]) {
        marks[e.date] = { dots: [] };
      }
      const existing = marks[e.date].dots;
      if (!existing.find((d: any) => d.color === color)) {
        existing.push({ key: e.partner_id, color });
      }
    }

    // Add selected date marking
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary, dots: [] };
    }

    setMarkedDates(marks);
  }

  async function loadDay(date: string) {
    const encounters = await getEncountersByDate(date);
    setDayEncounters(encounters);
  }

  function handleDayPress(day: any) {
    setSelectedDate(day.dateString);
    const dateObj = new Date(day.dateString + 'T00:00:00');
    const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(yearMonth);
  }

  function handleMonthChange(month: any) {
    setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
  }

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.background,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textMuted,
            monthTextColor: colors.text,
            arrowColor: colors.primary,
            textMonthFontWeight: fontWeight.bold,
            textDayFontSize: 14,
            textMonthFontSize: 16,
          }}
        />
      </View>

      <View style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Log', { presetDate: selectedDate })}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {dayEncounters.length === 0 ? (
          <Text style={styles.noEncounters}>No encounters on this day</Text>
        ) : (
          <>
            <Text style={styles.encounterCount}>
              {dayEncounters.length} encounter{dayEncounters.length > 1 ? 's' : ''}
            </Text>
            {dayEncounters.map(e => (
              <EncounterCard
                key={e.id}
                encounter={e}
                onPress={() => navigation.navigate('EncounterDetail', { encounterId: e.id, encounterDate: e.date })}
              />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  calendarContainer: {
    marginBottom: spacing.md,
  },
  daySection: {
    padding: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  encounterCount: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  noEncounters: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});

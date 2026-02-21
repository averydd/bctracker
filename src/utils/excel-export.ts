import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../db/database';

interface ExportEncounter {
  penetration: boolean;
  sex: string;
  name: string;
  initial: string;
  nationality: string;
  age: string;
  date: string;
}

export async function exportDataToCSV(): Promise<void> {
  const db = await getDatabase();

  // Get all encounters with partner info
  const encounters = await db.getAllAsync<any>(`
    SELECT
      e.penetration,
      p.sex,
      p.name,
      p.initial,
      p.nationality,
      ep.age_at_encounter,
      e.date
    FROM encounters e
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    WHERE e.is_solo = 0
    ORDER BY e.date ASC
  `);

  // Convert to CSV format matching the import format
  const headers = ['Penetration', 'Sex', 'Name', 'Initial', 'Nationality', 'Age when fuck', 'Time'];
  const rows = encounters.map(e => {
    const date = new Date(e.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return [
      e.penetration ? 'TRUE' : 'FALSE',
      e.sex || 'M',
      e.name || '',
      e.initial || '',
      e.nationality || '',
      e.age_at_encounter || '',
      monthYear
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells that contain commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Save to file
  const filename = `Body_Count_Export_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Body Count Data',
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export async function exportStatsToJSON(): Promise<void> {
  const db = await getDatabase();

  // Export everything as JSON for backup
  const [partners, encounters, encounterPartners, stiTests, achievements] = await Promise.all([
    db.getAllAsync('SELECT * FROM partners'),
    db.getAllAsync('SELECT * FROM encounters'),
    db.getAllAsync('SELECT * FROM encounter_partners'),
    db.getAllAsync('SELECT * FROM sti_tests'),
    db.getAllAsync('SELECT * FROM achievements'),
  ]);

  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      partners,
      encounters,
      encounterPartners,
      stiTests,
      achievements,
    },
  };

  const filename = `Body_Count_Backup_${new Date().toISOString().split('T')[0]}.json`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Full Backup',
    });
  }
}

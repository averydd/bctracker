import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { read, utils } from 'xlsx';
import { createPartner } from '../db/partners';
import { createEncounter } from '../db/encounters';
import { getDatabase } from '../db/database';
import { checkAndUnlockAchievements } from '../db/achievements';

export interface ImportRow {
  penetration: boolean;
  sex: string;
  name: string;
  initial: string;
  nationality: string;
  ageRange: string;
  date: string;
}

function parseMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 2) return dateStr;

  const monthMap: Record<string, string> = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12',
  };

  const month = monthMap[parts[0]] || '01';
  const year = parts[1];
  return `${year}-${month}-15`; // default to 15th of month
}

export function parseCSVRows(data: any[]): ImportRow[] {
  return data
    .filter(row => row['Name'] || row['name'])
    .map(row => ({
      penetration: String(row['Penetration'] || row['penetration'] || '').toUpperCase() === 'TRUE',
      sex: String(row['Sex'] || row['Sex M/F'] || row['sex'] || 'M').trim(),
      name: String(row['Name'] || row['name'] || '').trim(),
      initial: String(row['Initial'] || row['initial'] || '').trim(),
      nationality: String(row['Nationality'] || row['nationality'] || '').trim(),
      ageRange: String(row['Age when fuck'] || row['age'] || '').trim(),
      date: parseMonthYear(String(row['Time'] || row['Date'] || row['date'] || '').trim()),
    }));
}

export async function importFromFile(): Promise<ImportRow[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return [];
  }

  const file = result.assets[0];
  const fileContent = await FileSystem.readAsStringAsync(file.uri, {
    encoding: 'base64',
  });

  const workbook = read(fileContent, { type: 'base64' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = utils.sheet_to_json(sheet);

  return parseCSVRows(jsonData);
}

export async function importFromDocuments(): Promise<ImportRow[]> {
  try {
    const filePath = `${FileSystem.documentDirectory}Body Count.csv`;
    const fileContent = await FileSystem.readAsStringAsync(filePath, {
      encoding: 'base64',
    });

    const workbook = read(fileContent, { type: 'base64' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = utils.sheet_to_json(sheet);

    return parseCSVRows(jsonData);
  } catch (error) {
    console.error('Import from documents failed:', error);
    return [];
  }
}

export async function importRowsToDatabase(rows: ImportRow[]): Promise<{ partners: number; encounters: number }> {
  const db = await getDatabase();
  const partnerMap = new Map<string, string>(); // name+nationality -> id
  let partnerCount = 0;
  let encounterCount = 0;

  for (const row of rows) {
    if (!row.name) continue;

    const partnerKey = `${row.name}|${row.nationality}`; // Unique by name + nationality
    let partnerId = partnerMap.get(partnerKey);
    if (!partnerId) {
      // Check if partner already exists in DB
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM partners WHERE name = ? AND nationality = ?',
        [row.name, row.nationality]
      );

      if (existing) {
        partnerId = existing.id;
      } else {
        const partner = await createPartner({
          name: row.name,
          sex: row.sex,
          nationality: row.nationality,
          ethnicity: '',
        });
        partnerId = partner.id;
        partnerCount++;
      }
      partnerMap.set(partnerKey, partnerId);
    }

    if (row.date) {
      // Check for duplicate encounter by checking if encounter exists with same partner and date
      const existingLink = await db.getFirstAsync<{ encounter_id: string }>(
        `SELECT ep.encounter_id FROM encounter_partners ep
         JOIN encounters e ON e.id = ep.encounter_id
         WHERE ep.partner_id = ? AND e.date = ?`,
        [partnerId, row.date]
      );

      if (!existingLink) {
        const encounter = await createEncounter({
          date: row.date,
          time: null,
          penetration: row.penetration ? 1 : 0,
          orgasm: 0,
          protection: 0,
          notes: row.ageRange ? `Age: ${row.ageRange}` : null,
        });

        // Link partner to encounter
        const { generateId } = await import('../db/database');
        const linkId = generateId();
        await db.runAsync(
          'INSERT INTO encounter_partners (id, encounter_id, partner_id) VALUES (?, ?, ?)',
          [linkId, encounter.id, partnerId]
        );
        encounterCount++;
      }
    }
  }

  // Check and unlock achievements after import
  await checkAndUnlockAchievements();

  return { partners: partnerCount, encounters: encounterCount };
}

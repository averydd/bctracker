import * as FileSystem from 'expo-file-system';
import { getDatabase, generateId } from '../src/db/database';

interface CSVRow {
  penetration: string;
  sex: string;
  name: string;
  initial: string;
  nationality: string;
  age: string;
  ethnicityCount: string;
  time: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(timeStr: string): string {
  if (!timeStr) return new Date().toISOString().split('T')[0];

  // Parse "March 2018" format to "2018-03-01"
  const months: { [key: string]: string } = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };

  const parts = timeStr.toLowerCase().split(' ');
  if (parts.length === 2) {
    const month = months[parts[0]];
    const year = parts[1];
    if (month && year) {
      return `${year}-${month}-01`;
    }
  }

  return new Date().toISOString().split('T')[0];
}

export async function importCSVData(csvPath: string): Promise<{ partners: number; encounters: number }> {
  try {
    const csvContent = await FileSystem.readAsStringAsync(csvPath);
    const lines = csvContent.split('\n').filter(line => line.trim());

    const db = await getDatabase();
    let partnersCreated = 0;
    let encountersCreated = 0;

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 8) continue;

      const row: CSVRow = {
        penetration: fields[0],
        sex: fields[1],
        name: fields[2],
        initial: fields[3],
        nationality: fields[4],
        age: fields[5],
        ethnicityCount: fields[6],
        time: fields[7],
      };

      // Skip empty rows
      if (!row.name || row.name === '?') continue;

      // Check if partner exists
      let partner = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM partners WHERE name = ? AND nationality = ?',
        [row.name, row.nationality]
      );

      // Create partner if doesn't exist
      if (!partner) {
        const partnerId = generateId();
        await db.runAsync(
          `INSERT INTO partners (id, name, initial, sex, nationality, age_range)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [partnerId, row.name, row.initial, row.sex, row.nationality, row.age || '']
        );
        partner = { id: partnerId };
        partnersCreated++;
      }

      // Create encounter
      const encounterId = generateId();
      const date = parseDate(row.time);
      const penetration = row.penetration.toUpperCase() === 'TRUE' ? 1 : 0;

      await db.runAsync(
        `INSERT INTO encounters (id, date, penetration, is_solo)
         VALUES (?, ?, ?, 0)`,
        [encounterId, date, penetration]
      );

      // Link partner to encounter
      const linkId = generateId();
      await db.runAsync(
        `INSERT INTO encounter_partners (id, encounter_id, partner_id)
         VALUES (?, ?, ?)`,
        [linkId, encounterId, partner.id]
      );

      encountersCreated++;
    }

    return { partners: partnersCreated, encounters: encountersCreated };
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

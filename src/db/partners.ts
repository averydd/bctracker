import { getDatabase, generateId } from './database';

export interface Partner {
  id: string;
  name: string;
  sex: string;
  nationality: string;
  ethnicity: string;
  created_at: string;
}

export interface PartnerWithStats extends Partner {
  encounter_count: number;
  last_encounter_date: string | null;
  first_encounter_date: string | null;
}

export async function createPartner(data: Omit<Partner, 'id' | 'created_at'>): Promise<Partner> {
  const db = await getDatabase();
  const id = generateId();
  const initial = data.name.charAt(0).toUpperCase();
  await db.runAsync(
    'INSERT INTO partners (id, name, initial, sex, nationality, ethnicity) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.name, initial, data.sex, data.nationality, data.ethnicity]
  );
  return { id, ...data, created_at: new Date().toISOString() };
}

export async function updatePartner(id: string, data: Partial<Omit<Partner, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE partners SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function getAllPartners(): Promise<PartnerWithStats[]> {
  const db = await getDatabase();
  return db.getAllAsync<PartnerWithStats>(`
    SELECT p.*,
      COUNT(DISTINCT e.id) as encounter_count,
      MAX(e.date) as last_encounter_date,
      MIN(e.date) as first_encounter_date
    FROM partners p
    LEFT JOIN encounter_partners ep ON ep.partner_id = p.id
    LEFT JOIN encounters e ON e.id = ep.encounter_id
    GROUP BY p.id
    ORDER BY last_encounter_date DESC
  `);
}

export async function getPartnerById(id: string): Promise<PartnerWithStats | null> {
  const db = await getDatabase();
  return db.getFirstAsync<PartnerWithStats>(`
    SELECT p.*,
      COUNT(DISTINCT e.id) as encounter_count,
      MAX(e.date) as last_encounter_date,
      MIN(e.date) as first_encounter_date
    FROM partners p
    LEFT JOIN encounter_partners ep ON ep.partner_id = p.id
    LEFT JOIN encounters e ON e.id = ep.encounter_id
    WHERE p.id = ?
    GROUP BY p.id
  `, [id]);
}

export async function searchPartners(query: string): Promise<Partner[]> {
  const db = await getDatabase();
  return db.getAllAsync<Partner>(
    'SELECT * FROM partners WHERE name LIKE ? ORDER BY name',
    [`%${query}%`]
  );
}

export async function deletePartner(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM partners WHERE id = ?', [id]);
}

export async function getUniqueNationalities(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ nationality: string }>(
    "SELECT DISTINCT nationality FROM partners WHERE nationality != '' ORDER BY nationality"
  );
  return rows.map(r => r.nationality);
}

export async function getNationalityCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(DISTINCT nationality) as count FROM partners WHERE nationality != ''"
  );
  return row?.count ?? 0;
}

export async function getAlphabetCompletion(): Promise<{ count: number; letters: string[] }> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ initial: string }>(
    "SELECT DISTINCT UPPER(SUBSTR(name, 1, 1)) as initial FROM partners WHERE name != '' ORDER BY initial"
  );
  const letters = rows.map(r => r.initial).filter(l => /[A-Z]/.test(l));
  return { count: letters.length, letters };
}


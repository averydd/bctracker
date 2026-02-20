import { getDatabase, generateId } from './database';

export interface Encounter {
  id: string;
  partner_id: string | null;
  date: string;
  time: string | null;
  penetration: number;
  orgasm: number;
  protection: number;
  notes: string | null;
  location_city: string | null;
  venue_type: string | null;
  duration_minutes: number | null;
  emotion: string | null;
  is_solo: number;
  solo_method: string | null;
  on_period: number;
  created_at: string;
}

export interface EncounterWithPartner extends Encounter {
  partner_name: string;
  partner_initial: string;
  partner_sex: string;
  partner_nationality: string;
  partner_count: number;
}

export interface CreateEncounterData {
  date: string;
  time?: string | null;
  penetration?: number;
  orgasm?: number;
  protection?: number;
  notes?: string | null;
  location_city?: string | null;
  venue_type?: string | null;
  duration_minutes?: number | null;
  emotion?: string | null;
  is_solo?: number;
  solo_method?: string | null;
  on_period?: number;
  partner_id?: string | null;
}

export async function createEncounter(data: CreateEncounterData): Promise<Encounter> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO encounters (id, partner_id, date, time, penetration, orgasm, protection, notes, location_city, venue_type, duration_minutes, emotion, is_solo, solo_method, on_period)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.partner_id ?? null, data.date, data.time ?? null,
      data.penetration ?? 0, data.orgasm ?? 0, data.protection ?? 0,
      data.notes ?? null, data.location_city ?? null, data.venue_type ?? null,
      data.duration_minutes ?? null, data.emotion ?? null,
      data.is_solo ?? 0, data.solo_method ?? null, data.on_period ?? 0,
    ]
  );
  return {
    id, partner_id: data.partner_id ?? null, date: data.date, time: data.time ?? null,
    penetration: data.penetration ?? 0, orgasm: data.orgasm ?? 0, protection: data.protection ?? 0,
    notes: data.notes ?? null, location_city: data.location_city ?? null, venue_type: data.venue_type ?? null,
    duration_minutes: data.duration_minutes ?? null, emotion: data.emotion ?? null,
    is_solo: data.is_solo ?? 0, solo_method: data.solo_method ?? null, on_period: data.on_period ?? 0,
    created_at: new Date().toISOString(),
  };
}

// Non-solo encounters only
export async function getRecentEncounters(limit: number = 10): Promise<EncounterWithPartner[]> {
  const db = await getDatabase();
  return db.getAllAsync<EncounterWithPartner>(`
    SELECT e.*,
      COALESCE(p.name, 'Solo') as partner_name,
      COALESCE(p.initial, '🫶') as partner_initial,
      COALESCE(p.sex, '') as partner_sex,
      COALESCE(p.nationality, '') as partner_nationality,
      (SELECT COUNT(*) FROM encounter_partners ep2 WHERE ep2.encounter_id = e.id) as partner_count,
      ep.partner_id as partner_id
    FROM encounters e
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    WHERE e.is_solo = 0
    GROUP BY e.id
    ORDER BY e.date DESC, e.created_at DESC
    LIMIT ?
  `, [limit]);
}

// All entries for calendar (including solo)
export async function getEncounterById(id: string): Promise<EncounterWithPartner | null> {
  const db = await getDatabase();
  return db.getFirstAsync<EncounterWithPartner>(`
    SELECT e.*,
      COALESCE(p.name, 'Solo') as partner_name,
      COALESCE(p.initial, '🫶') as partner_initial,
      COALESCE(p.sex, '') as partner_sex,
      COALESCE(p.nationality, '') as partner_nationality,
      (SELECT COUNT(*) FROM encounter_partners ep2 WHERE ep2.encounter_id = e.id) as partner_count,
      ep.partner_id as partner_id
    FROM encounters e
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    WHERE e.id = ?
    LIMIT 1
  `, [id]);
}

export async function getAllEntriesForDate(date: string): Promise<EncounterWithPartner[]> {
  const db = await getDatabase();
  return db.getAllAsync<EncounterWithPartner>(`
    SELECT e.*,
      COALESCE(p.name, 'Solo') as partner_name,
      COALESCE(p.initial, '🫶') as partner_initial,
      COALESCE(p.sex, '') as partner_sex,
      COALESCE(p.nationality, '') as partner_nationality,
      (SELECT COUNT(*) FROM encounter_partners ep2 WHERE ep2.encounter_id = e.id) as partner_count,
      ep.partner_id as partner_id
    FROM encounters e
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    WHERE e.date = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `, [date]);
}

export async function getEncountersByDate(date: string): Promise<EncounterWithPartner[]> {
  return getAllEntriesForDate(date);
}

export async function getEncountersByPartner(partnerId: string): Promise<Encounter[]> {
  const db = await getDatabase();
  return db.getAllAsync<Encounter>(`
    SELECT e.* FROM encounters e
    JOIN encounter_partners ep ON ep.encounter_id = e.id
    WHERE ep.partner_id = ?
    ORDER BY e.date DESC
  `, [partnerId]);
}

export async function getEncounterDatesForMonth(yearMonth: string): Promise<{ date: string; partner_id: string; partner_name: string; is_solo: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT e.date, COALESCE(ep.partner_id, 'solo') as partner_id, COALESCE(p.name, 'Solo') as partner_name, e.is_solo
    FROM encounters e
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    WHERE e.date LIKE ?
    ORDER BY e.date
  `, [`${yearMonth}%`]);
}

// Exclude solo from encounter/body count stats
export async function getTotalEncounterCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM encounters WHERE is_solo = 0');
  return row?.count ?? 0;
}

export async function getBodyCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(DISTINCT ep.partner_id) as count
    FROM encounter_partners ep
    JOIN encounters e ON e.id = ep.encounter_id
    WHERE e.is_solo = 0
  `);
  return row?.count ?? 0;
}

export async function getSoloCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM encounters WHERE is_solo = 1');
  return row?.count ?? 0;
}

export async function getMonthlyStats(months: number = 12): Promise<{ month: string; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
    FROM encounters WHERE is_solo = 0
    GROUP BY month
    ORDER BY month DESC
    LIMIT ?
  `, [months]);
}

export async function getDayOfWeekStats(): Promise<{ day: number; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT CAST(strftime('%w', date) AS INTEGER) as day, COUNT(*) as count
    FROM encounters WHERE is_solo = 0
    GROUP BY day ORDER BY day
  `);
}

export async function getProtectionRate(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ rate: number }>(`
    SELECT CAST(SUM(protection) AS FLOAT) / COUNT(*) as rate FROM encounters WHERE is_solo = 0
  `);
  return row?.rate ?? 0;
}

export async function getOrgasmRate(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ rate: number }>(`
    SELECT CAST(SUM(orgasm) AS FLOAT) / COUNT(*) as rate FROM encounters WHERE is_solo = 0
  `);
  return row?.rate ?? 0;
}

export async function getPartnerLeaderboard(limit: number = 10): Promise<{ partner_id: string; partner_name: string; partner_nationality: string; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT ep.partner_id, p.name as partner_name, p.nationality as partner_nationality, COUNT(DISTINCT ep.encounter_id) as count
    FROM encounter_partners ep
    JOIN partners p ON p.id = ep.partner_id
    JOIN encounters e ON e.id = ep.encounter_id AND e.is_solo = 0
    GROUP BY ep.partner_id
    ORDER BY count DESC
    LIMIT ?
  `, [limit]);
}

export async function getNationalityBreakdown(): Promise<{ nationality: string; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT p.nationality, COUNT(DISTINCT p.id) as count
    FROM partners p WHERE p.nationality != ''
    GROUP BY p.nationality ORDER BY count DESC
  `);
}

export async function getYearlyStats(): Promise<{ year: string; total: number; partners: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT strftime('%Y', e.date) as year,
           COUNT(*) as total,
           COUNT(DISTINCT ep.partner_id) as partners
    FROM encounters e
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    WHERE e.is_solo = 0 AND e.date IS NOT NULL
    GROUP BY year
    HAVING year IS NOT NULL
    ORDER BY year
  `);
}

export async function getThisMonthCount(): Promise<number> {
  const db = await getDatabase();
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM encounters WHERE date LIKE ? AND is_solo = 0",
    [`${yearMonth}%`]
  );
  return row?.count ?? 0;
}

export async function getThisMonthPartners(): Promise<number> {
  const db = await getDatabase();
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const row = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(DISTINCT ep.partner_id) as count
    FROM encounters e
    JOIN encounter_partners ep ON ep.encounter_id = e.id
    WHERE e.date LIKE ? AND e.is_solo = 0
  `, [`${yearMonth}%`]);
  return row?.count ?? 0;
}

export async function getVenueBreakdown(): Promise<{ venue_type: string; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT venue_type, COUNT(*) as count FROM encounters
    WHERE venue_type IS NOT NULL AND is_solo = 0
    GROUP BY venue_type ORDER BY count DESC
  `);
}

export async function getEmotionBreakdown(): Promise<{ emotion: string; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT emotion, COUNT(*) as count FROM encounters
    WHERE emotion IS NOT NULL AND is_solo = 0
    GROUP BY emotion ORDER BY count DESC
  `);
}

export async function getAvgDuration(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ avg: number }>(`
    SELECT AVG(duration_minutes) as avg FROM encounters
    WHERE duration_minutes IS NOT NULL AND is_solo = 0
  `);
  return row?.avg ?? 0;
}

export async function getPeriodEncounterCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM encounters WHERE on_period = 1 AND is_solo = 0'
  );
  return row?.count ?? 0;
}

export async function getSoloMethodBreakdown(): Promise<{ solo_method: string; count: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT solo_method, COUNT(*) as count FROM encounters
    WHERE is_solo = 1 AND solo_method IS NOT NULL
    GROUP BY solo_method ORDER BY count DESC
  `);
}

export async function updateEncounter(id: string, data: Partial<CreateEncounterData>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
  if (data.time !== undefined) { fields.push('time = ?'); values.push(data.time); }
  if (data.penetration !== undefined) { fields.push('penetration = ?'); values.push(data.penetration); }
  if (data.orgasm !== undefined) { fields.push('orgasm = ?'); values.push(data.orgasm); }
  if (data.protection !== undefined) { fields.push('protection = ?'); values.push(data.protection); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  if (data.location_city !== undefined) { fields.push('location_city = ?'); values.push(data.location_city); }
  if (data.venue_type !== undefined) { fields.push('venue_type = ?'); values.push(data.venue_type); }
  if (data.duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(data.duration_minutes); }
  if (data.emotion !== undefined) { fields.push('emotion = ?'); values.push(data.emotion); }
  if (data.on_period !== undefined) { fields.push('on_period = ?'); values.push(data.on_period); }

  if (fields.length > 0) {
    values.push(id);
    await db.runAsync(`UPDATE encounters SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteEncounter(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM encounters WHERE id = ?', [id]);
}

import { getDatabase, generateId } from './database';

export interface EncounterPartner {
  id: string;
  encounter_id: string;
  partner_id: string;
  holes: string | null;
  oral_rating: number | null;
  attractiveness_rating: number | null;
  chemistry_rating: number | null;
  overall_rating: number | null;
  age_at_encounter: number | null;
}

export interface EncounterPartnerWithName extends EncounterPartner {
  partner_name: string;
  partner_initial: string;
  partner_sex: string;
  partner_nationality: string;
}

export interface PartnerRating {
  partner_id: string;
  partner_name: string;
  partner_initial: string;
  partner_sex: string;
  partner_nationality: string;
  encounter_count: number;
  avg_oral: number;
  avg_attractiveness: number;
  avg_chemistry: number;
  avg_overall: number;
}

export async function createEncounterPartner(data: {
  encounter_id: string;
  partner_id: string;
  holes?: string[];
  oral_rating?: number;
  attractiveness_rating?: number;
  chemistry_rating?: number;
  overall_rating?: number;
  age_at_encounter?: number | null;
}): Promise<EncounterPartner> {
  const db = await getDatabase();
  const id = generateId();
  const holesJson = data.holes && data.holes.length > 0 ? JSON.stringify(data.holes) : null;

  await db.runAsync(
    `INSERT INTO encounter_partners (id, encounter_id, partner_id, holes, oral_rating, attractiveness_rating, chemistry_rating, overall_rating, age_at_encounter)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.encounter_id, data.partner_id, holesJson,
     data.oral_rating ?? null, data.attractiveness_rating ?? null,
     data.chemistry_rating ?? null, data.overall_rating ?? null,
     data.age_at_encounter ?? null]
  );

  return {
    id, encounter_id: data.encounter_id, partner_id: data.partner_id,
    holes: holesJson,
    oral_rating: data.oral_rating ?? null,
    attractiveness_rating: data.attractiveness_rating ?? null,
    chemistry_rating: data.chemistry_rating ?? null,
    overall_rating: data.overall_rating ?? null,
    age_at_encounter: data.age_at_encounter ?? null,
  };
}

export async function getEncounterPartners(encounterId: string): Promise<EncounterPartnerWithName[]> {
  const db = await getDatabase();
  return db.getAllAsync<EncounterPartnerWithName>(`
    SELECT ep.*, p.name as partner_name, p.initial as partner_initial, p.sex as partner_sex, p.nationality as partner_nationality
    FROM encounter_partners ep
    JOIN partners p ON p.id = ep.partner_id
    WHERE ep.encounter_id = ?
  `, [encounterId]);
}

export async function getPartnerRatings(sortBy: string = 'avg_overall'): Promise<PartnerRating[]> {
  const db = await getDatabase();
  const validSorts = ['avg_oral', 'avg_attractiveness', 'avg_chemistry', 'avg_overall', 'encounter_count'];
  const sort = validSorts.includes(sortBy) ? sortBy : 'avg_overall';

  return db.getAllAsync<PartnerRating>(`
    SELECT
      ep.partner_id,
      p.name as partner_name,
      p.initial as partner_initial,
      p.sex as partner_sex,
      p.nationality as partner_nationality,
      COUNT(DISTINCT ep.encounter_id) as encounter_count,
      ROUND(AVG(CASE WHEN ep.oral_rating > 0 THEN ep.oral_rating END), 1) as avg_oral,
      ROUND(AVG(CASE WHEN ep.attractiveness_rating > 0 THEN ep.attractiveness_rating END), 1) as avg_attractiveness,
      ROUND(AVG(CASE WHEN ep.chemistry_rating > 0 THEN ep.chemistry_rating END), 1) as avg_chemistry,
      ROUND(AVG(CASE WHEN ep.overall_rating > 0 THEN ep.overall_rating END), 1) as avg_overall
    FROM encounter_partners ep
    JOIN partners p ON p.id = ep.partner_id
    GROUP BY ep.partner_id
    ORDER BY ${sort} DESC NULLS LAST
  `);
}

export async function getPartnerHoleStats(partnerId: string): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ holes: string }>(
    'SELECT holes FROM encounter_partners WHERE partner_id = ? AND holes IS NOT NULL',
    [partnerId]
  );

  const counts: Record<string, number> = { mouth: 0, ass: 0, pussy: 0 };
  for (const row of rows) {
    try {
      const holes: string[] = JSON.parse(row.holes);
      for (const h of holes) {
        if (h in counts) counts[h]++;
      }
    } catch {}
  }
  return counts;
}

export async function getHoleStats(): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ holes: string }>(
    'SELECT holes FROM encounter_partners WHERE holes IS NOT NULL'
  );

  const counts: Record<string, number> = { mouth: 0, ass: 0, pussy: 0 };
  for (const row of rows) {
    try {
      const holes: string[] = JSON.parse(row.holes);
      for (const h of holes) {
        if (h in counts) counts[h]++;
      }
    } catch {}
  }
  return counts;
}

export async function checkAirtight(encounterId: string): Promise<boolean> {
  const partners = await getEncounterPartners(encounterId);
  const allHoles = new Set<string>();
  for (const ep of partners) {
    if (ep.holes) {
      try {
        const holes: string[] = JSON.parse(ep.holes);
        holes.forEach(h => allHoles.add(h));
      } catch {}
    }
  }
  return allHoles.has('mouth') && allHoles.has('ass') && allHoles.has('pussy');
}

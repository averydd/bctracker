import { getDatabase, generateId } from './database';

export interface Achievement {
  id: string;
  type: string;
  label: string;
  unlocked_at: string;
  metadata: string | null;
}

export interface AchievementDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalEncounters: number;
  totalPartners: number;
  totalNationalities: number;
  maxWithSamePartner: number;
  consecutiveProtected: number;
  encountersThisWeek: number;
  soloCount: number;
  maxDuration: number;
  encountersToday: number;
  maxOverallRating: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { type: 'first_timer', label: 'First Timer', description: 'Log your first encounter', icon: '🌟', check: (s) => s.totalEncounters >= 1 },
  { type: 'double_digits', label: 'Double Digits', description: '10 total encounters', icon: '🔟', check: (s) => s.totalEncounters >= 10 },
  { type: 'quarter_century', label: 'Quarter Century', description: '25 encounters', icon: '🏅', check: (s) => s.totalEncounters >= 25 },
  { type: 'half_century', label: 'Half Century', description: '50 encounters', icon: '🥇', check: (s) => s.totalEncounters >= 50 },
  { type: 'nice', label: 'Nice.', description: '69 encounters', icon: '😏', check: (s) => s.totalEncounters >= 69 },
  { type: 'century_club', label: 'Century Club', description: '100 encounters', icon: '💯', check: (s) => s.totalEncounters >= 100 },
  { type: 'body_count_10', label: 'Player', description: '10 different partners', icon: '🃏', check: (s) => s.totalPartners >= 10 },
  { type: 'body_count_25', label: 'Casanova', description: '25 different partners', icon: '💋', check: (s) => s.totalPartners >= 25 },
  { type: 'body_count_50', label: 'Legend', description: '50 different partners', icon: '👑', check: (s) => s.totalPartners >= 50 },
  { type: 'globe_trotter', label: 'Globe Trotter', description: '5 nationalities', icon: '✈️', check: (s) => s.totalNationalities >= 5 },
  { type: 'world_traveler', label: 'World Traveler', description: '10 nationalities', icon: '🌍', check: (s) => s.totalNationalities >= 10 },
  { type: 'united_nations', label: 'United Nations', description: '20 nationalities', icon: '🇺🇳', check: (s) => s.totalNationalities >= 20 },
  { type: 'globe_trotter_plus', label: 'Globe Trotter+', description: '25 nationalities', icon: '🗺️', check: (s) => s.totalNationalities >= 25 },
  { type: 'loyal_customer', label: 'Loyal Customer', description: '10+ times with same partner', icon: '🔄', check: (s) => s.maxWithSamePartner >= 10 },
  { type: 'safety_first', label: 'Safety First', description: '10 consecutive protected', icon: '🛡️', check: (s) => s.consecutiveProtected >= 10 },
  { type: 'weekly_warrior', label: 'Weekly Warrior', description: '5+ encounters in one week', icon: '⚔️', check: (s) => s.encountersThisWeek >= 5 },
  { type: 'airtight', label: 'Unsinkable', description: 'All 3 holes in one encounter', icon: '🔱', check: () => false }, // checked manually
  { type: 'self_love', label: 'Self Love', description: '10 solo sessions', icon: '🫶', check: (s) => s.soloCount >= 10 },
  { type: 'marathon_runner', label: 'Marathon Runner', description: 'Encounter lasting 2h+', icon: '🏃', check: (s) => s.maxDuration >= 120 },
  { type: 'frequent_flyer', label: 'Frequent Flyer', description: '3+ encounters in one day', icon: '🛫', check: (s) => s.encountersToday >= 3 },
  { type: 'perfect_10', label: 'Perfect 10', description: 'Rate someone 10/10 overall', icon: '💎', check: (s) => s.maxOverallRating >= 10 },
];

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const db = await getDatabase();
  return db.getAllAsync<Achievement>('SELECT * FROM achievements ORDER BY unlocked_at DESC');
}

export async function unlockAchievement(type: string, label: string, metadata?: any): Promise<Achievement | null> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<Achievement>('SELECT * FROM achievements WHERE type = ?', [type]);
  if (existing) return null;

  const id = generateId();
  const metadataStr = metadata ? JSON.stringify(metadata) : null;
  await db.runAsync(
    'INSERT INTO achievements (id, type, label, metadata) VALUES (?, ?, ?, ?)',
    [id, type, label, metadataStr]
  );
  return { id, type, label, unlocked_at: new Date().toISOString(), metadata: metadataStr };
}

export async function getAchievementStats(): Promise<AchievementStats> {
  const db = await getDatabase();

  const encounters = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM encounters WHERE is_solo = 0');
  const partners = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(DISTINCT ep.partner_id) as count FROM encounter_partners ep
    JOIN encounters e ON e.id = ep.encounter_id WHERE e.is_solo = 0
  `);
  const nationalities = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(DISTINCT nationality) as count FROM partners WHERE nationality != ''"
  );
  const maxPartner = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(DISTINCT ep.encounter_id) as count FROM encounter_partners ep
    JOIN encounters e ON e.id = ep.encounter_id WHERE e.is_solo = 0
    GROUP BY ep.partner_id ORDER BY count DESC LIMIT 1
  `);

  const recentEncounters = await db.getAllAsync<{ protection: number }>(
    'SELECT protection FROM encounters WHERE is_solo = 0 ORDER BY date DESC, created_at DESC'
  );
  let consecutiveProtected = 0;
  for (const e of recentEncounters) {
    if (e.protection) consecutiveProtected++;
    else break;
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM encounters WHERE date >= ? AND is_solo = 0',
    [weekAgo.toISOString().split('T')[0]]
  );

  const soloCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM encounters WHERE is_solo = 1');

  const maxDuration = await db.getFirstAsync<{ max: number }>('SELECT MAX(duration_minutes) as max FROM encounters WHERE is_solo = 0');

  const today = new Date().toISOString().split('T')[0];
  const todayCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM encounters WHERE date = ? AND is_solo = 0',
    [today]
  );

  const maxRating = await db.getFirstAsync<{ max: number }>('SELECT MAX(overall_rating) as max FROM encounter_partners');

  return {
    totalEncounters: encounters?.count ?? 0,
    totalPartners: partners?.count ?? 0,
    totalNationalities: nationalities?.count ?? 0,
    maxWithSamePartner: maxPartner?.count ?? 0,
    consecutiveProtected,
    encountersThisWeek: thisWeek?.count ?? 0,
    soloCount: soloCount?.count ?? 0,
    maxDuration: maxDuration?.max ?? 0,
    encountersToday: todayCount?.count ?? 0,
    maxOverallRating: maxRating?.max ?? 0,
  };
}

export async function checkAndUnlockAchievements(): Promise<Achievement[]> {
  const stats = await getAchievementStats();
  const unlocked: Achievement[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (def.check(stats)) {
      const result = await unlockAchievement(def.type, def.label, { ...stats });
      if (result) unlocked.push(result);
    }
  }

  return unlocked;
}

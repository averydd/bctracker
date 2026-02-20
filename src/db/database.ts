import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('bodycount.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      initial TEXT NOT NULL,
      sex TEXT NOT NULL DEFAULT 'M',
      nationality TEXT NOT NULL DEFAULT '',
      ethnicity TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS encounters (
      id TEXT PRIMARY KEY,
      partner_id TEXT,
      date TEXT NOT NULL,
      time TEXT,
      penetration INTEGER NOT NULL DEFAULT 0,
      orgasm INTEGER NOT NULL DEFAULT 0,
      protection INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      location_city TEXT,
      venue_type TEXT,
      duration_minutes INTEGER,
      emotion TEXT,
      is_solo INTEGER NOT NULL DEFAULT 0,
      solo_method TEXT,
      on_period INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS encounter_partners (
      id TEXT PRIMARY KEY,
      encounter_id TEXT NOT NULL,
      partner_id TEXT NOT NULL,
      holes TEXT,
      oral_rating INTEGER,
      attractiveness_rating INTEGER,
      chemistry_rating INTEGER,
      overall_rating INTEGER,
      FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sti_tests (
      id TEXT PRIMARY KEY,
      reminder_date TEXT NOT NULL,
      triggered_by_encounter_id TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      test_date TEXT,
      result TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (triggered_by_encounter_id) REFERENCES encounters(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(date);
    CREATE INDEX IF NOT EXISTS idx_encounters_partner ON encounters(partner_id);
    CREATE INDEX IF NOT EXISTS idx_encounters_solo ON encounters(is_solo);
    CREATE INDEX IF NOT EXISTS idx_partners_nationality ON partners(nationality);
    CREATE INDEX IF NOT EXISTS idx_encounter_partners_encounter ON encounter_partners(encounter_id);
    CREATE INDEX IF NOT EXISTS idx_encounter_partners_partner ON encounter_partners(partner_id);
  `);

  // Add missing columns if they don't exist
  try {
    await database.execAsync(`ALTER TABLE partners ADD COLUMN birthdate TEXT;`);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    await database.execAsync(`ALTER TABLE encounter_partners ADD COLUMN age_at_encounter INTEGER;`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Migrate existing data: copy partner_id from encounters to encounter_partners
  await database.execAsync(`
    INSERT OR IGNORE INTO encounter_partners (id, encounter_id, partner_id)
    SELECT id || '_ep', id, partner_id FROM encounters
    WHERE partner_id IS NOT NULL AND partner_id != ''
    AND NOT EXISTS (SELECT 1 FROM encounter_partners WHERE encounter_id = encounters.id AND partner_id = encounters.partner_id);
  `);
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM encounter_partners;
    DELETE FROM encounters;
    DELETE FROM partners;
    DELETE FROM sti_tests;
    DELETE FROM achievements;
  `);
}

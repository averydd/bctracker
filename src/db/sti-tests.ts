import { getDatabase, generateId } from './database';

export interface STITest {
  id: string;
  reminder_date: string;
  triggered_by_encounter_id: string | null;
  completed: number;
  test_date: string | null;
  result: string | null;
  created_at: string;
}

export interface STITestWithDetails extends STITest {
  partner_name?: string;
}

export async function createSTIReminder(encounterDate: string, encounterId: string): Promise<STITest> {
  const db = await getDatabase();
  const id = generateId();
  const reminderDate = new Date(encounterDate);
  reminderDate.setDate(reminderDate.getDate() + 14);
  const reminderDateStr = reminderDate.toISOString().split('T')[0];

  await db.runAsync(
    'INSERT INTO sti_tests (id, reminder_date, triggered_by_encounter_id) VALUES (?, ?, ?)',
    [id, reminderDateStr, encounterId]
  );

  return {
    id,
    reminder_date: reminderDateStr,
    triggered_by_encounter_id: encounterId,
    completed: 0,
    test_date: null,
    result: null,
    created_at: new Date().toISOString(),
  };
}

export async function getPendingReminders(): Promise<STITestWithDetails[]> {
  const db = await getDatabase();
  return db.getAllAsync<STITestWithDetails>(`
    SELECT st.*, p.name as partner_name
    FROM sti_tests st
    LEFT JOIN encounters e ON e.id = st.triggered_by_encounter_id
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    WHERE st.completed = 0
    ORDER BY st.reminder_date ASC
  `);
}

export async function getAllSTITests(): Promise<STITestWithDetails[]> {
  const db = await getDatabase();
  return db.getAllAsync<STITestWithDetails>(`
    SELECT st.*, p.name as partner_name
    FROM sti_tests st
    LEFT JOIN encounters e ON e.id = st.triggered_by_encounter_id
    LEFT JOIN encounter_partners ep ON ep.encounter_id = e.id
    LEFT JOIN partners p ON p.id = ep.partner_id
    ORDER BY st.created_at DESC
  `);
}

export async function completeSTITest(id: string, testDate: string, result: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sti_tests SET completed = 1, test_date = ?, result = ? WHERE id = ?',
    [testDate, result, id]
  );
}

export async function deleteSTITest(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sti_tests WHERE id = ?', [id]);
}

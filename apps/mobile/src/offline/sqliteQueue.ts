/**
 * SQLite offline queue persistence using expo-sqlite.
 */

import * as SQLite from "expo-sqlite";
import type { OfflineIntake } from "./types";

const DB_NAME = "tsotsa_offline_intakes.db";
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initSchema(dbInstance);
  }
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_intakes (
      id TEXT PRIMARY KEY NOT NULL,
      person_id TEXT NOT NULL,
      person_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity TEXT NOT NULL,
      unit TEXT NOT NULL,
      taken_at TEXT NOT NULL,
      consumption TEXT NOT NULL,
      origin TEXT NOT NULL,
      schedule_time_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
}

export async function enqueueIntake(intake: OfflineIntake): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO offline_intakes (
      id, person_id, person_name, item_type, item_id,
      product_name, quantity, unit, taken_at, consumption,
      origin, schedule_time_id, notes, created_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      intake.id,
      intake.person_id,
      intake.person_name,
      intake.item_type,
      intake.item_id,
      intake.product_name,
      String(intake.quantity),
      intake.unit,
      intake.taken_at,
      intake.consumption,
      intake.origin,
      intake.schedule_time_id ?? null,
      intake.notes ?? null,
      intake.created_at,
      intake.status,
    ]
  );
}

export async function getPendingIntakes(): Promise<OfflineIntake[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OfflineIntake>(
    "SELECT * FROM offline_intakes WHERE status = 'pending' ORDER BY taken_at ASC;"
  );
  return rows;
}

export async function getPendingCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_intakes WHERE status = 'pending';"
  );
  return row?.count ?? 0;
}

export async function removeIntakes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(
    `DELETE FROM offline_intakes WHERE id IN (${placeholders});`,
    ids
  );
}

export async function clearQueue(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM offline_intakes;");
}


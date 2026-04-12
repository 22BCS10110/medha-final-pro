import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db;

export function initDB() {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'medha.db');

  db = new Database(dbPath);

  console.log("✅ DB INITIALIZED AT:", dbPath);

  db.prepare(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT,
      nfc_uid TEXT
    )
  `).run();

  return db;
}

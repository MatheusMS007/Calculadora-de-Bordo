import type { SQLiteDatabase } from 'expo-sqlite'

const DATABASE_VERSION = 1

export async function initializeDatabase(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  if (result && result.user_version >= DATABASE_VERSION) return

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS ganhos_cache (
      server_id INTEGER PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      plataforma TEXT NOT NULL,
      valor REAL NOT NULL,
      horas REAL,
      km REAL,
      cached_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ganhos_cache_data ON ganhos_cache(data DESC);
    PRAGMA user_version = ${DATABASE_VERSION};
  `)
}

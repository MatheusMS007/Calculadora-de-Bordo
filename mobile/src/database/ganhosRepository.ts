import type { SQLiteDatabase } from 'expo-sqlite'

export type Ganho = {
  id: number
  data: string
  plataforma: string
  valor: number
  horas: number | null
  km: number | null
}

type CachedGanho = Omit<Ganho, 'id'> & { server_id: number }

export async function getCachedGanhos(db: SQLiteDatabase): Promise<Ganho[]> {
  const rows = await db.getAllAsync<CachedGanho>(
    'SELECT server_id, data, plataforma, valor, horas, km FROM ganhos_cache ORDER BY data DESC, server_id DESC'
  )
  return rows.map(({ server_id, ...ganho }) => ({ id: server_id, ...ganho }))
}

export async function replaceCachedGanhos(db: SQLiteDatabase, ganhos: Ganho[]) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ganhos_cache')
    const cachedAt = new Date().toISOString()
    for (const ganho of ganhos) {
      await db.runAsync(
        `INSERT INTO ganhos_cache (server_id, data, plataforma, valor, horas, km, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ganho.id, ganho.data, ganho.plataforma, ganho.valor, ganho.horas, ganho.km, cachedAt]
      )
    }
  })
}

export async function cacheGanho(db: SQLiteDatabase, ganho: Ganho) {
  await db.runAsync(
    `INSERT OR REPLACE INTO ganhos_cache (server_id, data, plataforma, valor, horas, km, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ganho.id, ganho.data, ganho.plataforma, ganho.valor, ganho.horas, ganho.km, new Date().toISOString()]
  )
}

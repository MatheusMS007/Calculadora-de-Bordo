export async function getCachedGanhos(db) {
  const rows = await db.getAllAsync(
    'SELECT server_id, data, plataforma, valor, horas, km FROM ganhos_cache ORDER BY data DESC, server_id DESC'
  )
  return rows.map(({ server_id, ...ganho }) => ({ id: server_id, ...ganho }))
}

export async function replaceCachedGanhos(db, ganhos) {
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

export async function cacheGanho(db, ganho) {
  await db.runAsync(
    `INSERT OR REPLACE INTO ganhos_cache (server_id, data, plataforma, valor, horas, km, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ganho.id, ganho.data, ganho.plataforma, ganho.valor, ganho.horas, ganho.km, new Date().toISOString()]
  )
}

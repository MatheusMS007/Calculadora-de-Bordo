import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useAuth } from '@/src/contexts/AuthContext'
import { getCachedGanhos, replaceCachedGanhos, type Ganho } from '@/src/database/ganhosRepository'
import { apiRequest } from '@/src/services/api'

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export default function GanhosScreen() {
  const db = useSQLiteContext()
  const { token, signOut } = useAuth()
  const [ganhos, setGanhos] = useState<Ganho[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)

  const loadGanhos = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    setOffline(false)
    let cached: Ganho[] = []
    try {
      cached = await getCachedGanhos(db)
      setGanhos(cached)
    } catch (cacheError) {
      console.warn('Não foi possível ler o cache local de ganhos:', cacheError)
    }

    try {
      const result = await apiRequest<{ ganhos: Ganho[] }>('/ganhos', token)
      setGanhos(result.ganhos)
      try {
        await replaceCachedGanhos(db, result.ganhos)
      } catch (cacheError) {
        console.warn('Não foi possível atualizar o cache local de ganhos:', cacheError)
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Não foi possível buscar os ganhos.'
      if (message.includes('Token inválido') || message.includes('Token de autenticação')) {
        await signOut()
      } else if (cached.length > 0) {
        setOffline(true)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [db, signOut, token])

  useFocusEffect(useCallback(() => {
    void Promise.resolve().then(loadGanhos)
  }, [loadGanhos]))

  if (loading && ganhos.length === 0) return <ActivityIndicator style={styles.loading} size="large" color="#0e7c66" />

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={ganhos.length ? styles.content : styles.emptyContent}
      data={ganhos}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <Text style={styles.intro}>Seus registros de ganhos</Text>
          <Link href="/novo-ganho" asChild>
            <Pressable style={styles.addButton}><Text style={styles.addButtonText}>+ Registrar ganho</Text></Pressable>
          </Link>
          {offline && <Text style={styles.notice}>Sem conexão com o servidor. Exibindo os últimos dados salvos neste aparelho.</Text>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {!!error && <Pressable onPress={() => void loadGanhos()} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable>}
          {loading && ganhos.length > 0 && <ActivityIndicator size="small" color="#0e7c66" />}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{error ? 'Não foi possível carregar os registros.' : 'Ainda não há ganhos registrados.'}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View><Text style={styles.platform}>{item.plataforma}</Text><Text style={styles.date}>{formatDate(item.data)}</Text></View>
            <Text style={styles.value}>{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          </View>
          {(item.horas !== null || item.km !== null) && (
            <Text style={styles.details}>
              {item.horas !== null ? `${item.horas} h` : ''}{item.horas !== null && item.km !== null ? '  ·  ' : ''}{item.km !== null ? `${item.km} km` : ''}
            </Text>
          )}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f5f7f6' },
  content: { padding: 18, gap: 12 },
  emptyContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  listHeader: { gap: 14, marginBottom: 4 },
  intro: { color: '#65736c', fontSize: 15 },
  addButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#0e7c66' },
  addButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  card: { padding: 18, borderRadius: 16, backgroundColor: '#ffffff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  platform: { color: '#18231f', fontSize: 16, fontWeight: '700' },
  date: { marginTop: 5, color: '#718078', fontSize: 13 },
  value: { color: '#0e7c66', fontSize: 16, fontWeight: '800' },
  details: { marginTop: 12, color: '#65736c', fontSize: 13 },
  empty: { color: '#65736c', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  notice: { color: '#805b10', fontSize: 13, lineHeight: 19 },
  loading: { flex: 1 },
  error: { color: '#a72e32', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retry: { alignSelf: 'center', padding: 12 },
  retryText: { color: '#0e7c66', fontSize: 15, fontWeight: '700' },
})

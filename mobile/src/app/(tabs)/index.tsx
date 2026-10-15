import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '@/src/contexts/AuthContext'
import { apiRequest } from '@/src/services/api'

type DashboardData = {
  usuario: { username: string }
  resumo: { totalRegistros: number; totalGanhos: number }
}

export default function DashboardScreen() {
  const { token, signOut } = useAuth()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      setDashboard(await apiRequest<DashboardData>('/dashboard', token))
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Não foi possível carregar o resumo.'
      setError(message)
      if (message.includes('Token inválido') || message.includes('Token de autenticação')) await signOut()
    } finally {
      setLoading(false)
    }
  }, [signOut, token])

  useEffect(() => { void Promise.resolve().then(loadDashboard) }, [loadDashboard])

  const total = Number(dashboard?.resumo.totalGanhos ?? 0)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CALCULADORA DE BORDO</Text>
      <Text style={styles.heading}>Olá{dashboard?.usuario.username ? `, ${dashboard.usuario.username}` : ''}.</Text>
      <Text style={styles.subtitle}>Acompanhe seus ganhos em um só lugar.</Text>
      {loading ? <ActivityIndicator style={styles.loader} size="large" color="#0e7c66" /> : error ? (
        <View style={styles.card}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void loadDashboard()} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Tentar novamente</Text></Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total registrado</Text>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.records}>{dashboard?.resumo.totalRegistros ?? 0} registros de ganhos</Text>
        </View>
      )}
      <Link href="/(tabs)/ganhos" asChild>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Ver meus ganhos</Text></Pressable>
      </Link>
      <Pressable onPress={() => void signOut()} style={styles.logoutButton}><Text style={styles.logoutText}>Sair da conta</Text></Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 32, backgroundColor: '#f5f7f6' },
  eyebrow: { color: '#0e7c66', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  heading: { marginTop: 14, color: '#18231f', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 8, color: '#65736c', fontSize: 16 },
  loader: { marginTop: 52 },
  card: { marginTop: 32, padding: 24, borderRadius: 20, backgroundColor: '#ffffff' },
  cardLabel: { color: '#65736c', fontSize: 14, fontWeight: '600' },
  total: { marginTop: 12, color: '#0e7c66', fontSize: 32, fontWeight: '800' },
  records: { marginTop: 10, color: '#65736c', fontSize: 14 },
  error: { color: '#a72e32', fontSize: 15, lineHeight: 22 },
  primaryButton: { minHeight: 54, marginTop: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#0e7c66' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  outlineButton: { marginTop: 16, paddingVertical: 10 },
  outlineButtonText: { color: '#0e7c66', fontSize: 15, fontWeight: '700' },
  logoutButton: { marginTop: 18, padding: 14, alignItems: 'center' },
  logoutText: { color: '#65736c', fontSize: 15, fontWeight: '600' },
})

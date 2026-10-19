import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link, useFocusEffect } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { apiRequest } from '../../services/api'
import { colors } from '../../constants/theme'

export default function DashboardScreen() {
  const { token, signOut } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/dashboard', token)
      setDashboard(result)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Não foi possível carregar o resumo dos ganhos.'
      setError(message)
      if (message.includes('Token inválido') || message.includes('Token de autenticação')) await signOut()
    } finally {
      setLoading(false)
    }
  }, [signOut, token])

  useFocusEffect(useCallback(() => {
    void Promise.resolve().then(loadDashboard)
  }, [loadDashboard]))

  const totalGanhos = Number(dashboard?.resumo.totalGanhos ?? 0)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>CALCULADORA DE BORDO</Text>
      <Text style={styles.heading}>Olá{dashboard?.usuario.nome || dashboard?.usuario.username ? `, ${dashboard.usuario.nome || dashboard.usuario.username}` : ''}.</Text>
      <Text style={styles.subtitle}>Acompanhe seus ganhos em um só lugar.</Text>
      {loading && <ActivityIndicator style={styles.loader} size="large" color={colors.text} />}
      {!loading && !error && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total dos ganhos</Text>
          <Text style={styles.total}>{totalGanhos}</Text>
          <Text style={styles.records}>{dashboard?.resumo.totalRegistros ?? 0} ganhos registrados</Text>
        </View>
      )}
      {!!error && (
        <View style={styles.accountError}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void loadDashboard()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
      <Link href="/(tabs)/ganhos" asChild>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Ver meus ganhos</Text></Pressable>
      </Link>
      <Pressable onPress={() => void signOut()} style={styles.logoutButton}><Text style={styles.logoutText}>Sair da conta</Text></Pressable>
      <View style={styles.footer}>
        <Link href="/dispositivo" asChild>
          <Pressable style={styles.deviceButton}><Text style={styles.deviceButtonText}>Informações do dispositivo</Text></Pressable>
        </Link>
        <Text style={styles.footerText}>Calculadora de Bordo</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24, paddingTop: 32, backgroundColor: colors.background },
  eyebrow: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  heading: { marginTop: 14, color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 8, color: colors.textSecondary, fontSize: 16 },
  loader: { marginTop: 32 },
  summaryCard: { marginTop: 28, padding: 24, borderRadius: 20, backgroundColor: colors.surface },
  summaryLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  total: { marginTop: 12, color: colors.text, fontSize: 32, fontWeight: '800' },
  records: { marginTop: 10, color: colors.textSecondary, fontSize: 14 },
  accountError: { marginTop: 24, padding: 18, borderRadius: 16, backgroundColor: colors.surface },
  error: { color: colors.danger, fontSize: 15, lineHeight: 22 },
  retryButton: { marginTop: 12, paddingVertical: 8 },
  retryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  primaryButton: { minHeight: 54, marginTop: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  deviceButton: { minHeight: 48, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  deviceButtonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  logoutButton: { marginTop: 18, padding: 14, alignItems: 'center' },
  logoutText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  footer: { marginTop: 'auto', paddingTop: 24 },
  footerText: { marginTop: 12, color: colors.textMuted, fontSize: 12, textAlign: 'center' },
})

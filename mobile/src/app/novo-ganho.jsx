import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from 'react-native'
import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useAuth } from '../contexts/AuthContext'
import { cacheGanho } from '../database/ganhosRepository'
import { apiRequest } from '../services/api'
import { colors } from '../constants/theme'

function todayAsIsoDate() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function optionalNumber(value) {
  if (!value.trim()) return null
  return Number(value.trim().replace(',', '.'))
}

export default function NovoGanhoScreen() {
  const db = useSQLiteContext()
  const { token } = useAuth()
  const [data, setData] = useState(todayAsIsoDate())
  const [plataforma, setPlataforma] = useState('')
  const [valor, setValor] = useState('')
  const [horas, setHoras] = useState('')
  const [km, setKm] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!token || isSaving) return
    setError('')
    setIsSaving(true)
    try {
      const ganho = {
        data: data.trim(),
        plataforma: plataforma.trim(),
        valor: Number(valor.trim().replace(',', '.')),
        horas: optionalNumber(horas),
        km: optionalNumber(km),
      }
      const result = await apiRequest('/ganhos', token, {
        method: 'POST',
        body: JSON.stringify(ganho),
      })
      try {
        await cacheGanho(db, { id: result.id, ...ganho })
      } catch (cacheError) {
        console.warn('O ganho foi salvo no servidor, mas não foi possível atualizar o cache local:', cacheError)
      }
      Vibration.vibrate(250)
      router.back()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar o ganho.')
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = !!data.trim() && !!plataforma.trim() && !!valor.trim() && !isSaving

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Registre o que você ganhou</Text>
        <Text style={styles.subtitle}>Os campos marcados com * são obrigatórios.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Data * <Text style={styles.hint}>(AAAA-MM-DD)</Text></Text>
          <TextInput
            accessibilityLabel="Data do ganho, ano-mês-dia"
            style={styles.input}
            value={data}
            onChangeText={setData}
            placeholder="2026-10-15"
            placeholderTextColor={colors.placeholder}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Plataforma * </Text>
          <TextInput
            style={styles.input}
            value={plataforma}
            onChangeText={setPlataforma}
            placeholder="Uber, 99..."
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Valor recebido (R$) *</Text>
          <TextInput
            style={styles.input}
            value={valor}
            onChangeText={setValor}
            placeholder="Ex.: 185,50"
            placeholderTextColor={colors.placeholder}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Horas</Text>
            <TextInput
              style={styles.input}
              value={horas}
              onChangeText={setHoras}
              placeholder="Ex.: 6,5"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Quilômetros</Text>
            <TextInput
              style={styles.input}
              value={km}
              onChangeText={setKm}
              placeholder="Ex.: 120"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={() => void handleSave()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, !canSave && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Salvando…' : 'Salvar ganho'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24, paddingBottom: 40, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { marginTop: 8, marginBottom: 24, color: colors.textSecondary, fontSize: 14 },
  field: { marginBottom: 18 },
  label: { marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 12, fontWeight: '400' },
  input: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, color: colors.text, backgroundColor: colors.surface, fontSize: 16 },
  row: { flexDirection: 'row', gap: 14 },
  halfField: { flex: 1 },
  error: { marginBottom: 16, color: colors.danger, fontSize: 14, lineHeight: 20 },
  button: { minHeight: 56, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primary },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
})

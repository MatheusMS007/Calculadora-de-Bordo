import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@/src/contexts/AuthContext'
import { apiRequest } from '@/src/services/api'
import { getExpoPushToken } from '@/src/services/notifications'
import { colors } from '@/src/constants/theme'

type AccountResponse = { usuario: { nome: string; username: string; perfil: string } }
const PUSH_TOKEN_KEY = 'calculadora-de-bordo.expo-push-token'

export default function AccountScreen() {
  const { token, signOut } = useAuth()
  const [nome, setNome] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [username, setUsername] = useState('')
  const [perfil, setPerfil] = useState('')
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeBody, setNoticeBody] = useState('')
  const [sendingNotice, setSendingNotice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadAccount = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest<AccountResponse>('/auth/me', token)
      setNome(result.usuario.nome ?? '')
      setUsername(result.usuario.username)
      setPerfil(result.usuario.perfil)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Não foi possível carregar a conta.'
      setError(message)
      if (message.includes('Token inválido') || message.includes('Token de autenticação')) await signOut()
    } finally {
      setLoading(false)
    }
  }, [signOut, token])

  useEffect(() => { void Promise.resolve().then(loadAccount) }, [loadAccount])

  useEffect(() => {
    void SecureStore.getItemAsync(PUSH_TOKEN_KEY).then((savedToken) => setPushEnabled(!!savedToken))
  }, [])

  async function enablePush() {
    if (!token || pushBusy) return
    setError('')
    setSuccess('')
    setPushBusy(true)
    try {
      const expoPushToken = await getExpoPushToken()
      await apiRequest('/notifications/device', token, {
        method: 'POST',
        body: JSON.stringify({ token: expoPushToken, platform: Platform.OS, deviceName: `${Platform.OS} device` }),
      })
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, expoPushToken)
      setPushEnabled(true)
      setSuccess('Notificações push ativadas neste aparelho.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível ativar notificações push.')
    } finally {
      setPushBusy(false)
    }
  }

  async function disablePush() {
    if (!token || pushBusy) return
    setError('')
    setSuccess('')
    setPushBusy(true)
    try {
      const expoPushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY)
      if (expoPushToken) {
        await apiRequest('/notifications/device', token, {
          method: 'DELETE',
          body: JSON.stringify({ token: expoPushToken }),
        })
        await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY)
      }
      setPushEnabled(false)
      setSuccess('Notificações push desativadas neste aparelho.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível desativar notificações push.')
    } finally {
      setPushBusy(false)
    }
  }

  async function sendTestPush() {
    if (!token || pushBusy) return
    setError('')
    setSuccess('')
    setPushBusy(true)
    try {
      const result = await apiRequest<{ mensagem: string }>('/notifications/test', token, { method: 'POST' })
      setSuccess(result.mensagem)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar a notificação de teste.')
    } finally {
      setPushBusy(false)
    }
  }

  async function sendAdminNotice() {
    if (!token || sendingNotice || !noticeTitle.trim() || !noticeBody.trim()) return
    setError('')
    setSuccess('')
    setSendingNotice(true)
    try {
      const result = await apiRequest<{ mensagem: string }>('/notifications/admin', token, {
        method: 'POST',
        body: JSON.stringify({ title: noticeTitle.trim(), body: noticeBody.trim() }),
      })
      setSuccess(result.mensagem)
      setNoticeTitle('')
      setNoticeBody('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar o aviso.')
    } finally {
      setSendingNotice(false)
    }
  }

  function confirmSendAdminNotice() {
    Alert.alert(
      'Enviar aviso para todos?',
      'O aviso será enviado aos aparelhos que ativaram notificações push.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => void sendAdminNotice() },
      ]
    )
  }

  async function saveName() {
    if (!token || !nome.trim() || savingName) return
    setError('')
    setSuccess('')
    setSavingName(true)
    try {
      await apiRequest('/auth/profile', token, { method: 'PATCH', body: JSON.stringify({ nome: nome.trim() }) })
      setNome(nome.trim())
      setSuccess('Nome atualizado com sucesso.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível atualizar o nome.')
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword() {
    if (!token || savingPassword) return
    setError('')
    setSuccess('')
    if (!senhaAtual) return setError('Informe sua senha atual.')
    if (novaSenha.length < 8 || novaSenha.length > 128) return setError('A nova senha deve ter de 8 a 128 caracteres.')
    setSavingPassword(true)
    try {
      const result = await apiRequest<{ mensagem: string }>('/auth/password', token, {
        method: 'PATCH', body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      setSenhaAtual('')
      setNovaSenha('')
      setSuccess(result.mensagem)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível atualizar a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator size="large" color={colors.text} /> : <>
          <Text style={styles.subtitle}>Atualize os dados da sua conta.</Text>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.username}>{username}</Text>
          {perfil === 'admin' && <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enviar aviso push</Text>
            <Text style={styles.notificationDescription}>O aviso será enviado a todos os aparelhos inscritos.</Text>
            <TextInput style={[styles.input, styles.noticeTitleInput]} value={noticeTitle} onChangeText={setNoticeTitle} placeholder="Título do aviso" placeholderTextColor={colors.placeholder} maxLength={80} />
            <TextInput style={[styles.input, styles.noticeBodyInput]} value={noticeBody} onChangeText={setNoticeBody} placeholder="Mensagem" placeholderTextColor={colors.placeholder} multiline maxLength={500} />
            <Pressable accessibilityRole="button" disabled={sendingNotice || !noticeTitle.trim() || !noticeBody.trim()} onPress={confirmSendAdminNotice} style={[styles.button, (sendingNotice || !noticeTitle.trim() || !noticeBody.trim()) && styles.disabled]}>
              <Text style={styles.buttonText}>{sendingNotice ? 'Enviando…' : 'Revisar e enviar'}</Text>
            </Pressable>
          </View>}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificações push</Text>
            <Text style={styles.notificationDescription}>Receba avisos enviados pelo servidor neste aparelho.</Text>
            {!pushEnabled ? (
              <Pressable accessibilityRole="button" disabled={pushBusy} onPress={() => void enablePush()} style={[styles.button, pushBusy && styles.disabled]}>
                <Text style={styles.buttonText}>{pushBusy ? 'Ativando…' : 'Ativar notificações'}</Text>
              </Pressable>
            ) : <>
              <Pressable accessibilityRole="button" disabled={pushBusy} onPress={() => void sendTestPush()} style={[styles.button, pushBusy && styles.disabled]}>
                <Text style={styles.buttonText}>{pushBusy ? 'Enviando…' : 'Enviar push de teste'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={pushBusy} onPress={() => void disablePush()} style={styles.secondaryButton}>
                <Text style={styles.buttonText}>Desativar notificações</Text>
              </Pressable>
            </>}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alterar nome</Text>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor={colors.placeholder} autoCapitalize="words" maxLength={100} />
            <Pressable accessibilityRole="button" disabled={savingName || !nome.trim()} onPress={() => void saveName()} style={[styles.button, (!nome.trim() || savingName) && styles.disabled]}>
              <Text style={styles.buttonText}>{savingName ? 'Salvando…' : 'Salvar nome'}</Text>
            </Pressable>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alterar senha</Text>
            <Text style={styles.label}>Senha atual</Text>
            <TextInput style={styles.input} value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry textContentType="password" placeholder="Sua senha atual" placeholderTextColor={colors.placeholder} />
            <Text style={[styles.label, styles.spaced]}>Nova senha</Text>
            <TextInput style={styles.input} value={novaSenha} onChangeText={setNovaSenha} secureTextEntry textContentType="newPassword" placeholder="Mínimo de 8 caracteres" placeholderTextColor={colors.placeholder} />
            <Pressable accessibilityRole="button" disabled={savingPassword || !senhaAtual || !novaSenha} onPress={() => void savePassword()} style={[styles.button, (!senhaAtual || !novaSenha || savingPassword) && styles.disabled]}>
              <Text style={styles.buttonText}>{savingPassword ? 'Salvando…' : 'Salvar senha'}</Text>
            </Pressable>
          </View>
        </>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!!success && <Text accessibilityRole="alert" style={styles.success}>{success}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36 },
  subtitle: { marginBottom: 22, color: colors.textSecondary, fontSize: 15 },
  username: { paddingVertical: 14, color: colors.textSecondary, fontSize: 16 },
  section: { marginTop: 24, padding: 18, borderRadius: 16, backgroundColor: colors.surface },
  sectionTitle: { marginBottom: 18, color: colors.text, fontSize: 18, fontWeight: '800' },
  notificationDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  label: { marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: '700' },
  spaced: { marginTop: 16 },
  input: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, color: colors.text, backgroundColor: colors.background, fontSize: 16 },
  noticeTitleInput: { marginTop: 16 },
  noticeBodyInput: { minHeight: 110, marginTop: 12, paddingTop: 14, textAlignVertical: 'top' },
  button: { minHeight: 50, marginTop: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 48, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  disabled: { opacity: 0.5 },
  error: { marginTop: 16, color: colors.danger, fontSize: 14, lineHeight: 20 },
  success: { marginTop: 16, color: colors.text, fontSize: 14, lineHeight: 20 },
})

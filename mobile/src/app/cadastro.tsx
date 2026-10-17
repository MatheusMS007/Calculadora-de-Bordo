import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { registerRequest } from '@/src/services/api'
import { colors } from '@/src/constants/theme'

export default function CadastroScreen() {
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (isSubmitting) return
    setError('')

    const nomeTrimmed = nome.trim()
    const usernameTrimmed = username.trim()
    if (!nomeTrimmed) return setError('Informe seu nome.')
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(usernameTrimmed)) {
      return setError('O username deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.')
    }
    if (senha.length < 8 || senha.length > 128) return setError('A senha deve ter de 8 a 128 caracteres.')
    if (senha !== confirmarSenha) return setError('As senhas não coincidem.')

    setIsSubmitting(true)
    try {
      const result = await registerRequest(nomeTrimmed, usernameTrimmed, senha)
      Alert.alert('Conta criada', result.mensagem, [
        { text: 'Ir para login', onPress: () => router.replace('/sign-in') },
      ])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível criar a conta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandLetter}>B</Text></View>
          <Text style={styles.eyebrow}>CALCULADORA DE BORDO</Text>
          <Text style={styles.heading}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Preencha os dados para começar a acompanhar seus ganhos.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              returnKeyType="next"
              maxLength={100}
            />

            <Text style={[styles.label, styles.spacedLabel]}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Escolha um username"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
              maxLength={30}
            />

            <Text style={[styles.label, styles.spacedLabel]}>Senha</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Mínimo de 8 caracteres"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="next"
            />

            <Text style={[styles.label, styles.spacedLabel]}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Digite a senha novamente"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
            />

            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting || !nome.trim() || !username.trim() || !senha || !confirmarSenha}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (isSubmitting || !nome.trim() || !username.trim() || !senha || !confirmarSenha) && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{isSubmitting ? 'Criando conta…' : 'Criar conta'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <Link href="/sign-in" style={styles.footerLink}>Entrar</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 28 },
  brandMark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.primary },
  brandLetter: { color: colors.text, fontSize: 28, fontWeight: '800' },
  eyebrow: { marginTop: 22, color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  heading: { marginTop: 10, color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 8, color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  form: { marginTop: 26 },
  label: { marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: '700' },
  spacedLabel: { marginTop: 16 },
  input: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 13, color: colors.text, backgroundColor: colors.surface, fontSize: 16 },
  error: { marginTop: 14, color: colors.danger, fontSize: 14, lineHeight: 20 },
  button: { minHeight: 56, marginTop: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primary },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 20 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.text, fontSize: 14, fontWeight: '800' },
})

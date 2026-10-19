import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../constants/theme'

export default function SignInScreen() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setError('')
    setIsSubmitting(true)
    try {
      await signIn(username, senha)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.brandMark}><Text style={styles.brandLetter}>9U</Text></View>
          <Text style={styles.eyebrow}>CALCULADORA DE BORDO</Text>
          <Text style={styles.heading}>Seu trabalho,{ '\n' }suas contas no controle.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Seu usuário"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
            />
            <Text style={[styles.label, styles.passwordLabel]}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={senha}
                onChangeText={setSenha}
                placeholder="Sua senha"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!passwordVisible}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                accessibilityState={{ selected: passwordVisible }}
                onPress={() => setPasswordVisible((visible) => !visible)}
                hitSlop={8}
                style={styles.visibilityButton}
              >
                <Text style={styles.visibilityText}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
              </Pressable>
            </View>
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting || !username.trim() || !senha}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (!username.trim() || !senha) && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{isSubmitting ? 'Entrando…' : 'Entrar'}</Text>
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta?</Text>
            <Link href="/cadastro" style={styles.footerLink}>Cadastre-se</Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 28 },
  brandMark: { width: 62, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.primary },
  brandLetter: { color: colors.text, fontSize: 22, fontWeight: '800' },
  eyebrow: { marginTop: 26, color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  heading: { marginTop: 12, color: colors.text, fontSize: 32, fontWeight: '800', lineHeight: 38 },
  form: { marginTop: 26 },
  label: { marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: '700' },
  passwordLabel: { marginTop: 18 },
  input: { minHeight: 54, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 13, color: colors.text, backgroundColor: colors.surface, fontSize: 16 },
  passwordContainer: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface },
  passwordInput: { flex: 1, minHeight: 52, paddingHorizontal: 16, color: colors.text, fontSize: 16 },
  visibilityButton: { paddingHorizontal: 14, paddingVertical: 10 },
  visibilityText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  error: { marginTop: 14, color: colors.danger, fontSize: 14, lineHeight: 20 },
  button: { minHeight: 56, marginTop: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primary },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 20 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.text, fontSize: 14, fontWeight: '800' },
})

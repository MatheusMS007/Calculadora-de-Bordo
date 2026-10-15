import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/src/contexts/AuthContext'

export default function SignInScreen() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
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
          <View style={styles.brandMark}><Text style={styles.brandLetter}>B</Text></View>
          <Text style={styles.eyebrow}>CALCULADORA DE BORDO</Text>
          <Text style={styles.heading}>Seu trabalho,{ '\n' }suas contas no controle.</Text>
          <Text style={styles.subtitle}>Entre com a mesma conta que você usa no sistema.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Seu usuário"
              placeholderTextColor="#98a39d"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
            />
            <Text style={[styles.label, styles.passwordLabel]}>Senha</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Sua senha"
              placeholderTextColor="#98a39d"
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
            />
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7f6' },
  keyboard: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 28 },
  brandMark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#0e7c66' },
  brandLetter: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  eyebrow: { marginTop: 26, color: '#0e7c66', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  heading: { marginTop: 12, color: '#18231f', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { marginTop: 12, color: '#65736c', fontSize: 16, lineHeight: 23 },
  form: { marginTop: 34 },
  label: { marginBottom: 8, color: '#34423a', fontSize: 14, fontWeight: '700' },
  passwordLabel: { marginTop: 18 },
  input: { minHeight: 54, paddingHorizontal: 16, borderWidth: 1, borderColor: '#dce4df', borderRadius: 13, color: '#18231f', backgroundColor: '#ffffff', fontSize: 16 },
  error: { marginTop: 14, color: '#a72e32', fontSize: 14, lineHeight: 20 },
  button: { minHeight: 56, marginTop: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#0e7c66' },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
})

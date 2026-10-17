import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useSQLiteContext } from 'expo-sqlite'
import { apiRequest, loginRequest } from '@/src/services/api'

const TOKEN_KEY = 'calculadora-de-bordo.api-token'
const PUSH_TOKEN_KEY = 'calculadora-de-bordo.expo-push-token'

type AuthContextValue = {
  token: string | null
  isLoading: boolean
  signIn: (username: string, senha: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((savedToken) => { if (isMounted) setToken(savedToken) })
      .catch(() => { if (isMounted) setToken(null) })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [])

  const signIn = useCallback(async (username: string, senha: string) => {
    const session = await loginRequest(username, senha)
    await SecureStore.setItemAsync(TOKEN_KEY, session.token)
    setToken(session.token)
  }, [])

  const signOut = useCallback(async () => {
    const currentToken = token
    setToken(null)
    const savedPushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null)
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    if (currentToken && savedPushToken) {
      try {
        await apiRequest<void>('/notifications/device', currentToken, {
          method: 'DELETE', body: JSON.stringify({ token: savedPushToken }),
        })
      } catch {
        // O logout local continua mesmo se o servidor estiver indisponível.
      }
    }
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY)
    await db.runAsync('DELETE FROM ganhos_cache').catch((error: unknown) => {
      console.warn('Não foi possível limpar o cache local de ganhos:', error)
    })
    if (currentToken) {
      try {
        await apiRequest<void>('/auth/logout', currentToken, { method: 'POST' })
      } catch {
        // O token local já foi removido; a expiração do servidor encerra a sessão restante.
      }
    }
  }, [db, token])

  const value = useMemo(() => ({ token, isLoading, signIn, signOut }), [token, isLoading, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa ser usado dentro de AuthProvider.')
  return context
}

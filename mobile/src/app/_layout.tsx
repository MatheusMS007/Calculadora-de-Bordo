import { Stack } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SQLiteProvider } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext'
import { initializeDatabase } from '@/src/database/database'
import { colors } from '@/src/constants/theme'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function RootNavigator() {
  const { isLoading, token } = useAuth()

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.text} /></View>
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token} redirectTo="/(tabs)">
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="cadastro" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!token} redirectTo="/sign-in">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="conta"
          options={{
            headerShown: true,
            title: 'Minha conta',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="dispositivo"
          options={{
            headerShown: true,
            title: 'Informações do dispositivo',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="novo-ganho"
          options={{
            headerShown: true,
            title: 'Novo ganho',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerTintColor: colors.text,
          }}
        />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="calculadora-de-bordo.db" onInit={initializeDatabase}>
      <><StatusBar style="light" /><AuthProvider><RootNavigator /></AuthProvider></>
    </SQLiteProvider>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
})

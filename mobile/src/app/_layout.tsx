import { Stack } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SQLiteProvider } from 'expo-sqlite'
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext'
import { initializeDatabase } from '@/src/database/database'

function RootNavigator() {
  const { isLoading, token } = useAuth()

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#0e7c66" /></View>
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token} redirectTo="/(tabs)">
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={!!token} redirectTo="/sign-in">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="novo-ganho"
          options={{
            headerShown: true,
            title: 'Novo ganho',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTitleStyle: { color: '#18231f', fontWeight: '700' },
            headerTintColor: '#0e7c66',
          }}
        />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="calculadora-de-bordo.db" onInit={initializeDatabase}>
      <AuthProvider><RootNavigator /></AuthProvider>
    </SQLiteProvider>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f6' },
})

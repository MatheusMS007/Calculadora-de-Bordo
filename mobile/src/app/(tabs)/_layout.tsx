import { Tabs, Link } from 'expo-router'
import { Pressable, Text } from 'react-native'
import { colors } from '@/src/constants/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        headerRight: () => (
          <Link href="/conta" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu da conta" hitSlop={10}>
              <Text style={{ color: colors.text, fontWeight: '700', paddingHorizontal: 12 }}>Conta</Text>
            </Pressable>
          </Link>
        ),
      }}>
      <Tabs.Screen name="index" options={{ title: '', headerTitle: '', tabBarLabel: 'Início' }} />
      <Tabs.Screen name="ganhos" options={{ title: 'Meus ganhos', tabBarLabel: 'Ganhos' }} />
    </Tabs>
  );
}

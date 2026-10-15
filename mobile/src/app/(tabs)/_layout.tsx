import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#18231f', fontWeight: '700' },
        tabBarActiveTintColor: '#0e7c66',
        tabBarInactiveTintColor: '#718078',
        tabBarStyle: { backgroundColor: '#ffffff' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Resumo', tabBarLabel: 'Início' }} />
      <Tabs.Screen name="ganhos" options={{ title: 'Meus ganhos', tabBarLabel: 'Ganhos' }} />
    </Tabs>
  );
}

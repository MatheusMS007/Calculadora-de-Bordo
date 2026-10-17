import * as Device from 'expo-device'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '@/src/constants/theme'

function deviceTypeLabel(type: Device.DeviceType | null) {
  switch (type) {
    case Device.DeviceType.PHONE: return 'Celular'
    case Device.DeviceType.TABLET: return 'Tablet'
    case Device.DeviceType.TV: return 'TV'
    case Device.DeviceType.DESKTOP: return 'Computador'
    default: return 'Não identificado'
  }
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value === null || value === undefined || value === '' ? 'Indisponível' : String(value)}</Text>
    </View>
  )
}

export default function DeviceInfoScreen() {
  const operatingSystem = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sobre este aparelho</Text>
      <Text style={styles.subtitle}>Informações técnicas disponíveis para o aplicativo neste dispositivo.</Text>

      <View style={styles.card}>
        <InfoRow label="Sistema operacional" value={operatingSystem} />
        <InfoRow label="Versão do sistema" value={Device.osVersion ?? Platform.Version} />
        <InfoRow label="Tipo de dispositivo" value={deviceTypeLabel(Device.deviceType)} />
        <InfoRow label="Fabricante" value={Device.manufacturer} />
        <InfoRow label="Marca" value={Device.brand} />
        <InfoRow label="Modelo" value={Device.modelName} />
        <InfoRow label="Ambiente" value={Device.isDevice ? 'Dispositivo físico' : 'Emulador ou simulador'} />
        {Platform.OS === 'android' && <InfoRow label="Nível da API Android" value={Device.platformApiLevel} />}
      </View>
      <Text style={styles.note}>Esses dados são exibidos somente nesta tela e não são enviados ao servidor.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { marginTop: 8, marginBottom: 20, color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  card: { paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.surface },
  row: { minHeight: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  value: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  note: { marginTop: 16, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
})

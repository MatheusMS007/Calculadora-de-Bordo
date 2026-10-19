import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { AndroidImportance } from 'expo-notifications'
import { Platform } from 'react-native'

export async function getExpoPushToken() {
  if (!Device.isDevice) {
    throw new Error('Notificações push precisam ser testadas em um aparelho físico ou em uma build de desenvolvimento.')
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificações',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
  }

  const currentPermissions = await Notifications.getPermissionsAsync()
  let status = currentPermissions.status
  if (status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync()
    status = requestedPermissions.status
  }
  if (status !== 'granted') {
    throw new Error('Permissão de notificações negada. Ative-a nas configurações do aparelho.')
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    throw new Error('O projeto ainda não está vinculado ao EAS. Configure o projectId para ativar push.')
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data
}

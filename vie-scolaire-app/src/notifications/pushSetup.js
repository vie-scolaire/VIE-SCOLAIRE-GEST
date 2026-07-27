import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Demande la permission et retourne le token Expo Push, ou null si refusé/indisponible. */
export async function enregistrerPourNotifications() {
  if (!Device.isDevice) {
    // Les notifications push ne fonctionnent pas dans le simulateur iOS.
    return null;
  }

  const { status: statutExistant } = await Notifications.getPermissionsAsync();
  let statutFinal = statutExistant;

  if (statutExistant !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    statutFinal = status;
  }

  if (statutFinal !== 'granted') return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
}

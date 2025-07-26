import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

// Solicita permissão e retorna o push token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Permissão para notificações não concedida!');
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Deve ser executado em um dispositivo físico para receber push.');
    return null;
  }
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return token;
}

// Salva o token no Firestore no documento do usuário
export async function savePushTokenToFirestore(userId: string, token: string) {
  const db = getFirestore();
  await updateDoc(doc(db, 'usuarios', userId), { pushToken: token });
}

// Envia push notification via Expo
export async function sendPushNotification(token: string, title: string, body: string, data?: any) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }),
  });
} 
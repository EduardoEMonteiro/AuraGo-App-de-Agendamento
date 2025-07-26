import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NotificationToast from '../components/NotificationToast';
import { PlanoVerification } from '../components/PlanoVerification';
import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';
import { useAuthListener, useAuthStore } from '../contexts/useAuthStore';
import CadastroSalaoScreen from '../screens/CadastroSalaoScreen';
import LoginScreen from '../screens/LoginScreen';
import { registerForPushNotificationsAsync, savePushTokenToFirestore } from '../services/pushNotifications';
import { initializeStripe } from '../services/stripe';

SplashScreen.preventAutoHideAsync();
SplashScreen.hideAsync();

// Inicializar Stripe
initializeStripe();

function NotificationsRoot({ children }: { children: React.ReactNode }) {
  const { addNotification } = useNotifications();
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.id) {
      (async () => {
        const token = await registerForPushNotificationsAsync();
        if (token) await savePushTokenToFirestore(user.id, token);
      })();
    }
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      addNotification({
        tipo: 'push',
        titulo: notification.request.content.title || '',
        mensagem: notification.request.content.body || '',
      });
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const tela = response.notification.request.content.data?.tela;
      if (tela) {
        if (tela === 'agenda') router.replace('/(tabs)/agenda');
        if (tela === 'produtos') router.replace('/(tabs)/produtos');
      }
    });
    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [user]);

  return (
    <>
      <NotificationToast />
      {children}
    </>
  );
}

export default function RootLayout() {
  useAuthListener(); // Substituído useAutoLogout por useAuthListener
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    console.log('Usuário atual:', user);
  }, [user]);

  useEffect(() => {
    // Forçar barra de navegação preta no Android (ícones ficam brancos automaticamente)
    SystemUI.setBackgroundColorAsync('#000000');
  }, []);

  // Mostra loading enquanto verifica o estado de autenticação
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (user && !user.idSalao) {
    return <CadastroSalaoScreen />;
  }

  return (
    <NotificationsProvider>
      <NotificationsRoot>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <PlanoVerification>
              <Stack 
                screenOptions={{
                  headerTitleAlign: 'left',
                  headerStyle: {
                    backgroundColor: '#fff',
                    elevation: 0,
                    shadowOpacity: 0,
                  },
                  headerTitleStyle: {
                    paddingTop: 20,
                  },
                }}>
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Todas as telas agora não terão header padrão do expo-router */}
              </Stack>
            </PlanoVerification>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </NotificationsRoot>
    </NotificationsProvider>
  );
}

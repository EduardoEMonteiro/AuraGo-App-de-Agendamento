import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationToast } from '../components/NotificationToast';
import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';
import { useAuthListener, useAuthStore } from '../contexts/useAuthStore';
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
  const isMounted = useRef(false);
  const notificationSetupDone = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Aguarda um pouco para garantir que o layout está montado
    const timer = setTimeout(() => {
      isMounted.current = true;
      console.log('NotificationsRoot mounted');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Evitar configuração múltipla de notificações para o mesmo usuário
    if (notificationSetupDone.current && lastUserId.current === user?.id) return;
    
    if (user && user.id) {
      notificationSetupDone.current = true;
      lastUserId.current = user.id;
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
      if (tela && isMounted.current) {
        // Usar setTimeout para evitar navegação durante montagem
        setTimeout(() => {
          try {
            console.log('Tentando navegar para:', tela);
            if (tela === 'agenda') (router as any).replace('/(tabs)/agenda');
            if (tela === 'produtos') (router as any).replace('/(tabs)/produtos');
          } catch (error) {
            console.log('Erro na navegação por notificação:', error);
          }
        }, 200);
      } else {
        console.log('Navegação por notificação ignorada - não montado ou sem tela');
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
  useAuthListener();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    console.log('RootLayout - Usuário atual:', user);
  }, [user]);

  useEffect(() => {
    // Forçar barra de navegação preta no Android (ícones ficam brancos automaticamente)
    SystemUI.setBackgroundColorAsync('#000000');
  }, []);

  // Tratamento global de erros do Firestore
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      // Filtrar warnings específicos do Firestore
      const message = args.join(' ');
      if (message.includes('WebChannelConnection') || message.includes('transport errored')) {
        // Log silencioso para esses warnings específicos
        console.log('Firestore connection warning (normal):', message);
      } else {
        originalConsoleWarn(...args);
      }
    };

    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Mostra loading enquanto verifica o estado de autenticação
  if (isLoading) {
    console.log('RootLayout - Mostrando loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  console.log('RootLayout - Renderizando Stack Navigator');
  return (
    <NotificationsProvider>
      <NotificationsRoot>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <Stack 
              screenOptions={{
                headerShown: false,
                headerTitleAlign: 'left',
                headerStyle: {
                  backgroundColor: '#fff',
                },
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '600',
                },
              }}>
              
              {/* Index - rota principal para redirecionamento */}
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              
              {/* Tela de login - sempre disponível */}
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                }}
              />
              
              {/* Tela de cadastro de salão */}
              <Stack.Screen
                name="cadastro-salao"
                options={{
                  headerShown: false,
                }}
              />
              
              {/* Tela de boas-vindas */}
              <Stack.Screen
                name="boas-vindas"
                options={{
                  headerShown: false,
                }}
              />
              
              {/* Tabs principais */}
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              
              {/* Telas de cadastro */}
              <Stack.Screen
                name="clientes"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="servicos"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="produtos"
                options={{
                  headerShown: false,
                }}
              />
              
              {/* Telas com header oculto */}
              <Stack.Screen
                name="historico-receitas"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="horariofuncionamento"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="mensagens"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="equipe-editar"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="pagamentos"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="stripe-checkout"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="gerenciar-assinatura"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="equipe"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="HorarioFuncionamentoScreen"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="ContaScreen"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="selecao-plano"
                options={{
                  headerShown: false,
                }}
              />
              {/* Todas as telas agora não terão header padrão do expo-router */}
            </Stack>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </NotificationsRoot>
    </NotificationsProvider>
  );
}

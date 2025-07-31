import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { useAuthListener, useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
// Adicione outros providers que você usa, como o de Notificações
// import { NotificationsProvider, NotificationsRoot } from '../contexts/NotificationsContext';

// Função wrapper para os Providers
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {children}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { user, isLoading, refreshUser } = useAuthStore();
  const { salaoInfo, loading: isSalaoLoading } = useSalaoInfo();
  const segments = useSegments();
  const router = useRouter();
  const [showEmailBanner, setShowEmailBanner] = useState(false);

  // Listener para quando o app voltar do background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && !user.emailVerified) {
        console.log('App voltou do background, verificando status do e-mail...');
        refreshUser();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, refreshUser]);

  useEffect(() => {
    console.log("=== ROTEAMENTO CENTRALIZADO INICIOU ===");
    console.log("Estado atual:", { 
      user: user ? 'logado' : 'não logado', 
      emailVerified: user?.emailVerified,
      idSalao: user?.idSalao,
      salaoInfo: salaoInfo ? 'carregado' : 'não carregado',
      plano: salaoInfo?.plano,
      statusAssinatura: salaoInfo?.statusAssinatura,
      isLoading, 
      isSalaoLoading 
    });

    // Guarda de segurança: não faz nada enquanto os dados essenciais estão carregando.
    if (isLoading || isSalaoLoading) {
      console.log("Aguardando carregamento de dados...", { isLoading, isSalaoLoading });
      return;
    }

    // ================================================================
    // LÓGICA DE ROTEAMENTO CENTRALIZADA - FLUXO CORRIGIDO
    // ================================================================

    // 1. Se NÃO há usuário, o destino é sempre a tela de login.
    if (!user) {
      if (!segments.some(segment => segment === 'login' as any)) {
        console.log("Usuário não logado, redirecionando para /login");
        router.replace('/login');
      }
      return;
    }

    // A partir daqui, o 'user' existe.

    // 2. VERIFICAÇÃO DE E-MAIL - FLUXO CORRIGIDO PARA USUÁRIOS ANTIGOS
    // Só exige verificação de e-mail se o usuário não tem salão (novo usuário)
    if (!user.emailVerified && !user.idSalao) {
      console.log("Novo usuário com e-mail não verificado, redirecionando para /login");
      router.replace('/login');
      return;
    }

    // Se o usuário tem e-mail não verificado mas já tem salão (usuário antigo),
    // permite o acesso mas mostra um aviso discreto
    if (!user.emailVerified && user.idSalao) {
      console.log("Usuário antigo com e-mail não verificado, permitindo acesso");
      setShowEmailBanner(true);
    } else {
      setShowEmailBanner(false);
    }

    // A partir daqui, o usuário pode acessar o app (novo ou antigo).

    // 3. Se o usuário NÃO tem salão, o destino é o cadastro de salão.
    if (!user.idSalao) {
      if (!segments.some(segment => segment === 'cadastro-salao' as any)) {
        console.log("Usuário sem salão, redirecionando para /cadastro-salao");
        router.replace('/cadastro-salao');
      }
      return;
    }

    // A partir daqui, 'user.idSalao' existe.

    // 4. Se o salão NÃO tem uma assinatura ativa, o destino é a seleção de plano.
    if (!salaoInfo?.plano || salaoInfo?.statusAssinatura !== 'ativa') {
      // Se ele já não estiver em alguma parte do fluxo de pagamento, mande-o para lá.
      const inOnboardingFlow = segments.some(segment => 
        segment === 'selecao-plano' || 
        segment === '(checkout)' || 
        segment === 'aguardando-confirmacao' ||
        segment === 'stripe-checkout' as any
      );
      
      if (!inOnboardingFlow) {
        console.log("Salão sem assinatura ativa, redirecionando para /selecao-plano");
        router.replace('/selecao-plano');
      }
      return;
    }

    // 5. Se o usuário está 100% autorizado e AINDA está em uma tela de onboarding,
    //    significa que ele acabou de completar o fluxo. Mande-o para o app.
    const inOnboardingFlow = segments.some(segment => 
      segment === 'cadastro-salao' || 
      segment === 'selecao-plano' || 
      segment === '(checkout)' || 
      segment === 'aguardando-confirmacao' ||
      segment === 'stripe-checkout' as any
    );
    
    if (inOnboardingFlow) {
      console.log("Usuário 100% autorizado, saindo do fluxo de onboarding para a agenda.");
      router.replace('/(tabs)/agenda');
    }

    // Se nenhuma das condições acima for atendida, o roteador não faz NADA,
    // permitindo que o usuário navegue livremente entre as telas internas.

  }, [user, user?.emailVerified, user?.idSalao, salaoInfo, isLoading, isSalaoLoading, segments, router]);
  
  // Enquanto carrega, mostra uma tela de loading para evitar "flashes" de conteúdo
  if (isLoading || isSalaoLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro-salao" />
        <Stack.Screen name="selecao-plano" />
        <Stack.Screen name="(checkout)" />
        <Stack.Screen name="aguardando-confirmacao" />
        <Stack.Screen name="stripe-checkout" />
        <Stack.Screen name="boas-vindas" />
        <Stack.Screen name="salao" />
        <Stack.Screen name="clientes" />
        <Stack.Screen name="servicos" />
        <Stack.Screen name="produtos" />
        <Stack.Screen name="mensagens" />
        <Stack.Screen name="equipe" />
        <Stack.Screen name="equipe-editar" />
        <Stack.Screen name="pagamentos" />
        <Stack.Screen name="gerenciar-assinatura" />
        <Stack.Screen name="historico-receitas" />
        <Stack.Screen name="horariofuncionamento" />
        <Stack.Screen name="ContaScreen" />
        <Stack.Screen name="HorarioFuncionamentoScreen" />
      </Stack>
      
      <EmailVerificationBanner 
        visible={showEmailBanner} 
        onDismiss={() => setShowEmailBanner(false)} 
      />
    </>
  );
}

export default function RootLayout() {
  // Hooks que monitoram o estado devem ficar aqui fora
  useAuthListener();
  
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}

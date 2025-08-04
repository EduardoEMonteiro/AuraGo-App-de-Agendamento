import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { useAuthListener, useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import { isTrialExpired } from '../utils/trialUtils';
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
  const [showSplash, setShowSplash] = useState(true);
  const lastNavigationRef = useRef<string | null>(null);
  const navigationAttemptsRef = useRef(0);

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

  // Controla o splash screen
  useEffect(() => {
    if (!isLoading && !isSalaoLoading) {
      // Aguarda um pouco para mostrar o splash
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000); // 2 segundos de splash para garantir carregamento completo

      return () => clearTimeout(timer);
    }
  }, [isLoading, isSalaoLoading]);

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
      isSalaoLoading,
      showSplash
    });

    // Se ainda está mostrando splash, não faz roteamento
    if (showSplash) {
      console.log("Ainda mostrando splash, aguardando...");
      return;
    }

    // Guarda de segurança: não faz nada enquanto os dados essenciais estão carregando.
    if (isLoading || isSalaoLoading) {
      console.log("Aguardando carregamento de dados...", { isLoading, isSalaoLoading });
      return;
    }

    // Prevenir loops infinitos de navegação
    const currentPath = segments.join('/');
    if (lastNavigationRef.current === currentPath) {
      navigationAttemptsRef.current++;
      if (navigationAttemptsRef.current > 3) {
        console.log("Muitas tentativas de navegação para o mesmo caminho, parando...");
        return;
      }
    } else {
      navigationAttemptsRef.current = 0;
    }
    lastNavigationRef.current = currentPath;

    // ================================================================
    // LÓGICA DE ROTEAMENTO CENTRALIZADA - FLUXO CORRIGIDO
    // ================================================================

    // 1. Se NÃO há usuário, verificar se está em telas permitidas
    if (!user) {
      // Telas que podem ser acessadas sem login
      const publicScreens = ['login', 'termos-uso', 'politica-privacidade', 'termos-privacidade'];
      const isOnPublicScreen = segments.some(segment => publicScreens.includes(segment as any));
      
      if (!isOnPublicScreen) {
        console.log("Usuário não logado, redirecionando para /login");
        router.replace('/login');
      }
      return;
    }

    // A partir daqui, o 'user' existe.

    // 2. VERIFICAÇÃO DE E-MAIL - FLUXO CORRIGIDO
    if (!user.emailVerified && !user.idSalao) {
      console.log("Novo usuário com e-mail não verificado, redirecionando para /email-verificacao");
      router.replace('/email-verificacao' as any);
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

    // 4. VERIFICAÇÃO DE TRIAL - PRIORIDADE ALTA
    console.log("Verificando trial - user.plano:", user.plano, "user.freeTrialExpiresAt:", user.freeTrialExpiresAt);
    
    // Se o salaoInfo já foi carregado e tem assinatura ativa, não redirecionar para upgrade
    if (salaoInfo && salaoInfo.plano && salaoInfo.statusAssinatura === 'ativa') {
      console.log("Usuário com assinatura ativa detectada, pulando verificação de trial");
    } else {
      // Verifica se o usuário está no trial e se expirou
      if (user.plano === 'trial' && user.freeTrialExpiresAt) {
        const trialExpired = isTrialExpired(user.freeTrialExpiresAt);
        console.log("Trial expirado?", trialExpired);
        
        if (trialExpired) {
          // Trial expirado, redirecionar para tela de upgrade (CORRIGIDO)
          // Mas permitir navegação para seleção de plano se já estiver em upgrade
          const isOnUpgradeScreen = segments.some(segment => segment === 'upgrade' as any);
          const isOnSelecaoPlano = segments.some(segment => segment === 'selecao-plano' as any);
          const isOnStripeCheckout = segments.some(segment => segment === 'stripe-checkout' as any);
          
          if (!isOnUpgradeScreen && !isOnSelecaoPlano && !isOnStripeCheckout) {
            console.log("Trial expirado, redirecionando para /upgrade");
            router.replace('/upgrade');
            return;
          }
        } else {
          // Trial ativo, mostrar tela de boas-vindas ou agenda
          const isOnTrialScreen = segments.some(segment => 
            segment === 'trial-welcome' || 
            segment === '(tabs)' as any
          );
          
          if (!isOnTrialScreen) {
            console.log("Trial ativo, redirecionando para /trial-welcome");
            router.replace('/trial-welcome' as any);
            return;
          }
        }
      } else if (user.plano === null || user.plano === 'expired') {
        // Usuário com plano null ou expired (trial expirado), redirecionar para upgrade
        // Mas permitir navegação para seleção de plano se já estiver em upgrade
        const isOnUpgradeScreen = segments.some(segment => segment === 'upgrade' as any);
        const isOnSelecaoPlano = segments.some(segment => segment === 'selecao-plano' as any);
        const isOnStripeCheckout = segments.some(segment => segment === 'stripe-checkout' as any);
        
        if (!isOnUpgradeScreen && !isOnSelecaoPlano && !isOnStripeCheckout) {
          console.log("Usuário com plano null/expired, redirecionando para /upgrade");
          router.replace('/upgrade');
          return;
        }
      } else {
        console.log("Usuário não está no trial ou não tem data de expiração");
      }
    }

    // 5. Se o salão NÃO tem uma assinatura ativa, o destino é a seleção de plano.
    // IMPORTANTE: Só verificar se salaoInfo já foi carregado para evitar flash da tela de planos
    console.log("Verificando assinatura - salaoInfo:", salaoInfo ? "carregado" : "carregando", "plano:", salaoInfo?.plano, "status:", salaoInfo?.statusAssinatura);
    
    // Se salaoInfo ainda está carregando, não fazer nenhuma verificação de assinatura
    if (!salaoInfo) {
      console.log("SalaoInfo ainda carregando, aguardando...");
      return;
    }
    
    // Só verificar assinatura se o usuário NÃO está no trial E NÃO tem trial expirado
    if (user.plano !== 'trial' && user.plano !== null && user.plano !== 'expired' && (!salaoInfo.plano || salaoInfo.statusAssinatura !== 'ativa')) {
      console.log("Salão sem assinatura ativa - plano:", salaoInfo.plano, "status:", salaoInfo.statusAssinatura);
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
    
    // CORREÇÃO: Verificar se o trial está expirado mesmo quando plano é 'trial'
    const trialExpired = user.plano === 'trial' && user.freeTrialExpiresAt && isTrialExpired(user.freeTrialExpiresAt);
    const hasActiveSubscription = salaoInfo.plano && salaoInfo.statusAssinatura === 'ativa';
    
    // Se o trial está expirado OU não tem assinatura ativa, não considerar como autorizado
    if (trialExpired || (!hasActiveSubscription && user.plano !== 'trial')) {
      console.log("Trial expirado ou sem assinatura ativa - não autorizado");
      return;
    }
    
    console.log("Usuário autorizado - trial ativo ou assinatura ativa");

    // 6. Se o usuário está 100% autorizado e AINDA está em uma tela de onboarding,
    //    significa que ele acabou de completar o fluxo. Mande-o para o app.
    const inOnboardingFlow = segments.some(segment => 
      segment === 'cadastro-salao' || 
      segment === 'selecao-plano' || 
      segment === '(checkout)' || 
      segment === 'aguardando-confirmacao' ||
      segment === 'stripe-checkout' ||
      segment === 'upgrade' as any
    );
    
    if (inOnboardingFlow) {
      console.log("Usuário 100% autorizado, saindo do fluxo de onboarding para a agenda.");
      router.replace('/(tabs)/agenda');
      return;
    }

    // 7. Se o usuário está logado e autorizado mas está na tela de login, redirecionar para agenda
    console.log("Verificando redirecionamento - segments:", segments, "user logado:", !!user, "salaoInfo carregado:", !!salaoInfo);
    
    // Telas que não devem redirecionar mesmo com usuário logado
    const allowedScreensForLoggedUser = ['termos-uso', 'politica-privacidade', 'termos-privacidade'];
    const isOnAllowedScreen = segments.some(segment => allowedScreensForLoggedUser.includes(segment as any));
    
    if (isOnAllowedScreen) {
      console.log("Usuário logado em tela permitida, não redirecionando");
      return;
    }
    
    if (segments.some(segment => segment === 'login' as any)) {
      console.log("Usuário já logado na tela de login, redirecionando para agenda.");
      router.replace('/(tabs)/agenda');
      return;
    }

    // Se nenhuma das condições acima for atendida, o roteador não faz NADA,
    // permitindo que o usuário navegue livremente entre as telas internas.

  }, [user, user?.emailVerified, user?.idSalao, user?.plano, user?.freeTrialExpiresAt, salaoInfo, isLoading, isSalaoLoading, segments, router, showSplash]);
  
  // Splash screen profissional
  if (showSplash) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <Image 
          source={require('../assets/images/logo_aura.png')} 
          style={{ width: 200, height: 200, resizeMode: 'contain' }} 
        />
      </View>
    );
  }

    // Enquanto carrega, mostra uma tela de loading para evitar "flashes" de conteúdo
    if (isLoading || isSalaoLoading) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <Image
            source={require('../assets/images/logo_aura.png')}
            style={{ width: 150, height: 150, resizeMode: 'contain', marginBottom: 20 }}
          />
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
            Carregando...
          </Text>
        </View>
      );
    }

    // Se o usuário tem assinatura ativa e está carregando dados, mostra logo
    if (user && salaoInfo && salaoInfo.plano && salaoInfo.statusAssinatura === 'ativa' && isSalaoLoading) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <Image
            source={require('../assets/images/logo_aura.png')}
            style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
        </View>
      );
    }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="email-verificacao" />
        <Stack.Screen name="cadastro-salao" />
        <Stack.Screen name="selecao-plano" />
        <Stack.Screen name="(checkout)" />
        <Stack.Screen name="aguardando-confirmacao" />
        <Stack.Screen name="stripe-checkout" />
        <Stack.Screen name="boas-vindas" />
        <Stack.Screen name="trial-welcome" />
        <Stack.Screen name="upgrade" />
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
        <Stack.Screen name="termos-uso" />
        <Stack.Screen name="politica-privacidade" />
        <Stack.Screen name="termos-privacidade" />
      </Stack>
      {showEmailBanner && (
        <EmailVerificationBanner 
          visible={showEmailBanner} 
          onDismiss={() => setShowEmailBanner(false)} 
        />
      )}
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

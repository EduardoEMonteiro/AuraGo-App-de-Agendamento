import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';

export default function StripeCheckoutScreen() {
  const router = useRouter();
  const { checkoutUrl } = useLocalSearchParams<{ checkoutUrl: string }>();
  const { setNavigatingToCheckout } = useAuthStore();

  // Timeout de segurança para resetar o estado se o usuário sair sem completar
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Timeout de segurança: resetando estado de navegação...');
      setNavigatingToCheckout(false);
    }, 300000); // 5 minutos

    return () => {
      clearTimeout(timeout);
    };
  }, [setNavigatingToCheckout]);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('URL de navegação:', url);
    
    // Verificar URLs de sucesso e cancelamento
    if (url.includes('aura://checkout/sucesso') || url.includes('checkout/sucesso')) {
      console.log('Pagamento concluído com sucesso!');
      handleSuccess();
    }
    if (url.includes('aura://checkout/cancelado') || url.includes('checkout/cancelado')) {
      console.log('Pagamento cancelado!');
      handleCancel();
    }
    // Verificar URLs do Stripe que indicam sucesso
    if (url.includes('checkout.stripe.com') && url.includes('success')) {
      console.log('Pagamento Stripe concluído com sucesso!');
      handleSuccess();
    }
  };

  const handleSuccess = () => {
    console.log('Pagamento bem-sucedido, resetando estado de navegação...');
    setNavigatingToCheckout(false); // ✅ RESETAR O ESTADO
    console.log('Redirecionando para tela de boas-vindas...');
    // Aguardar um pouco para garantir que o Stripe terminou
    setTimeout(() => {
      router.replace('/boas-vindas' as any);
    }, 1000);
  };

  const handleCancel = () => {
    console.log('Cancelamento detectado, resetando estado de navegação...');
    setNavigatingToCheckout(false); // ✅ RESETAR O ESTADO
    Alert.alert('Pagamento Cancelado', 'Seu pagamento foi cancelado.');
    // Usar setTimeout para evitar navegação durante montagem
    setTimeout(() => {
      router.back();
    }, 100);
  };

  // Função para renderizar a tela de carregamento do WebView
  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007aff" />
      <Text>Carregando pagamento...</Text>
    </View>
  );

  // Se a URL não for encontrada, mostra uma mensagem de erro
  if (!checkoutUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Pagamento" showBackButton={false} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>URL de Checkout Não Encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderiza o WebView se a URL existir
  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Pagamento" showBackButton={false} />
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          startInLoadingState={true}
          onNavigationStateChange={handleNavigationStateChange}
          renderLoading={renderLoadingView}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error: ', nativeEvent);
          }}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
  },
});
// app/stripe-checkout.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function StripeCheckoutScreen() {
  const router = useRouter();
  // Pegamos a URL passada como parâmetro pela tela de seleção de plano
  const { checkoutUrl } = useLocalSearchParams<{ checkoutUrl: string }>();

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('URL de navegação:', url);

    // Verificar URLs de sucesso
    if (url.includes('aura://checkout/sucesso') || url.includes('checkout/sucesso')) {
      console.log('Pagamento concluído com sucesso!');
      handleSuccess();
    }
    // Verificar URLs de cancelamento
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
    console.log('Pagamento concluído! Redirecionando para tela de aguardando confirmação...');
    // Redireciona para a tela de aguardando confirmação em vez de ir direto para o app
    router.replace('aguardando-confirmacao' as any);
  };

  const handleCancel = () => {
    Alert.alert(
      'Pagamento Cancelado', 
      'Você pode tentar novamente a qualquer momento.'
    );
    // Apenas volta para a tela anterior (seleção de plano)
    router.back();
  };
  
  // Função para renderizar a tela de carregamento do WebView
  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007aff" />
      <Text style={styles.loadingText}>Carregando checkout...</Text>
    </View>
  );

  // Se, por algum motivo, a tela for aberta sem a URL, mostra um erro.
  if (!checkoutUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>URL de Checkout Inválida</Text>
        <Text style={styles.errorSubtitle}>Por favor, volte e tente novamente.</Text>
      </View>
    );
  }

  // Renderiza o WebView com a URL do Stripe
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        startInLoadingState={true}
        onNavigationStateChange={handleNavigationStateChange}
        renderLoading={renderLoadingView}
        {...(Platform.OS === 'ios' && {
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          allowsBackForwardNavigationGestures: true,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  webview: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20 
  },
  errorTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#d9534f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
}); 
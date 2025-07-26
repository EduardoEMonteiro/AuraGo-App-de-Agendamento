import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function StripeCheckoutScreen() {
  const router = useRouter();
  // << MUDANÇA IMPORTANTE: Pegamos a URL real dos parâmetros de navegação
  const { checkoutUrl } = useLocalSearchParams<{ checkoutUrl: string }>();

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log("WebView navegando para:", url);

    // << MUDANÇA IMPORTANTE: Usamos as URLs do nosso backend
    if (url.includes('meuapp://checkout/sucesso')) {
      handleSuccess();
    }
    if (url.includes('meuapp://checkout/cancelado')) {
      handleCancel();
    }
  };

  const handleSuccess = () => {
    Alert.alert('Pagamento Concluído!', 'Seu plano foi ativado com sucesso. Você será redirecionado.');
    // O webhook já atualizou o status no backend. Apenas navegamos.
    router.replace('/(tabs)/agenda'); 
  };

  const handleCancel = () => {
    Alert.alert('Pagamento Cancelado', 'Seu pagamento foi cancelado.');
    router.back();
  };

  if (!checkoutUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>URL de Checkout Não Encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        startInLoadingState={true}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#f44336' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  webview: { flex: 1 },
});

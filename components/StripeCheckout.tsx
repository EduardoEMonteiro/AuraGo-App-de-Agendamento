import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface StripeCheckoutProps {
  checkoutUrl: string;
  onSuccess: (sessionId: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export function StripeCheckout({ checkoutUrl, onSuccess, onCancel, onError }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Verificar se é uma URL de sucesso
    if (url.includes('payment-success')) {
      const urlParams = new URL(url).searchParams;
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        onSuccess(sessionId);
      }
    }
    
    // Verificar se é uma URL de cancelamento
    if (url.includes('payment-cancel')) {
      onCancel();
    }
  };

  const handleError = (error: any) => {
    console.error('Erro no WebView:', error);
    onError('Erro ao carregar o checkout');
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Carregando checkout...</Text>
        </View>
      )}
      
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
}); 
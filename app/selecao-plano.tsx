import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../contexts/useAuthStore';
import { createRealCheckoutSession } from '../services/stripe';

const PLANO_AURA = {
  id: 'essencial',
  preco: 'R$ 19,90',
  recorrencia: '/mês',
  recursos: [
    'Agendamento ilimitado',
    'Gestão de clientes',
    'Relatórios financeiros',
    'Notificações automáticas',
    'Suporte prioritário'
  ]
};

const CheckIcon = ({ color = "#48BB78" }) => (
  <View style={{ width: 20, height: 20, marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
    </View>
  </View>
);

export default function SelecaoPlanoScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAssinar = async () => {
    if (!user || !user.idSalao) {
      Alert.alert(
        'Erro de Autenticação',
        'Não foi possível encontrar os dados do seu negócio. Por favor, faça login novamente.'
      );
      return;
    }

    setLoading(true);
    try {
      const sessionData = await createRealCheckoutSession(PLANO_AURA.id as 'essencial', user.idSalao);
      
      if (sessionData && sessionData.url) {
        console.log('SelecaoPlanoScreen - URL de checkout recebida. Navegando...');
        
        // Navegação direta e segura
        router.push({
          pathname: '/stripe-checkout',
          params: { checkoutUrl: sessionData.url }
        });

      } else {
        throw new Error('A resposta do servidor não continha uma URL de checkout.');
      }
    } catch (error: any) {
      console.error('SelecaoPlanoScreen - Erro na assinatura:', error);
      Alert.alert('Erro na Assinatura', error.message || 'Não foi possível processar sua assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo_aura.png')} style={styles.logo} />
        <Text style={styles.title}>A confiança de ser digital.</Text>
        <Text style={styles.subtitle}>Acesso completo a todas as ferramentas para organizar e impulsionar seu negócio.</Text>
      </View>
      <View style={styles.ofertaCard}>
        <View style={styles.precoContainer}>
          <Text style={styles.planoPreco}>{PLANO_AURA.preco}</Text>
          <Text style={styles.planoRecorrencia}>{PLANO_AURA.recorrencia}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.recursosContainer}>
          <Text style={styles.recursosTitle}>Tudo o que você precisa:</Text>
          {PLANO_AURA.recursos.map((recurso, index) => (
            <View key={index} style={styles.recursoItem}>
              <CheckIcon />
              <Text style={styles.recursoTexto}>{recurso}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.assinarButton, loading && styles.buttonDisabled]}
          onPress={handleAssinar}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.assinarButtonText}>Assinar por {PLANO_AURA.preco}{PLANO_AURA.recorrencia}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerText}>Cancele a qualquer momento, sem burocracia.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#F7FAFC',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#F7FAFC',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 24,
  },
  ofertaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  precoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planoPreco: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  planoRecorrencia: {
    fontSize: 18,
    color: '#718096',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 24,
  },
  recursosContainer: {
    marginBottom: 24,
  },
  recursosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  recursoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recursoTexto: {
    fontSize: 16,
    color: '#4A5568',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
  },
  assinarButton: {
    backgroundColor: '#48BB78',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  assinarButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
}); 
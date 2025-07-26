import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../contexts/useAuthStore';
import { createRealCheckoutSession } from '../services/stripe';

// Ícone de check para recursos
const CheckIcon = ({ color = "#48BB78" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={color} />
  </Svg>
);

// Dados do plano único
const PLANO_AURA = {
  id: 'essencial',
  nome: 'Aura Essencial',
  preco: 'R$ 19,90',
  recorrencia: '/mês',
  recursos: [
    'Agenda e Clientes Ilimitados',
    'Confirmações via WhatsApp com 1 clique',
    'Controle Financeiro com Lucro Real',
    'Cadastro de Serviços e Produtos',
    'Suporte via Chat',
  ],
};

export default function AssinaturaScreen() {
  const { user, setNavigatingToCheckout } = useAuthStore();
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
    setNavigatingToCheckout(true);
    try {
      const sessionData = await createRealCheckoutSession(PLANO_AURA.id as 'essencial', user.idSalao);
      if (sessionData && sessionData.url) {
        router.push({
          pathname: '/stripe-checkout',
          params: { checkoutUrl: sessionData.url }
        });
      } else {
        setNavigatingToCheckout(false);
        throw new Error('A resposta do servidor não continha uma URL de checkout.');
      }
    } catch (error: any) {
      Alert.alert('Erro na Assinatura', error.message || 'Não foi possível processar sua assinatura. Tente novamente.');
      setNavigatingToCheckout(false);
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
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#4A5568",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  precoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  planoPreco: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  planoRecorrencia: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginVertical: 16,
  },
  recursosContainer: {
    gap: 16,
  },
  recursosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  recursoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recursoTexto: {
    fontSize: 15,
    color: '#2D3748',
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  assinarButton: {
    backgroundColor: '#48BB78',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: "#38A169",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
    elevation: 0,
    shadowOpacity: 0,
  },
  assinarButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 16,
    fontSize: 13,
    color: '#718096',
  },
});
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { trackUpgradeButtonClicked, trackUpgradeScreenViewed } from '../utils/trialAnalytics';
import { getDaysRemaining } from '../utils/trialUtils';

export default function UpgradeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Registra visualização da tela
  useEffect(() => {
    if (user?.id) {
      const daysRemaining = getDaysRemaining(user?.freeTrialExpiresAt);
      trackUpgradeScreenViewed(user.id, daysRemaining);
    }
  }, [user]);

  const handleAssinarAgora = async () => {
    if (!user || !user.idSalao) {
      Alert.alert(
        'Erro',
        'Não foi possível identificar seu salão. Por favor, faça login novamente.'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('Redirecionando para seleção de plano...');
      
      // Registra clique no botão (não crítico)
      try {
        const daysRemaining = getDaysRemaining(user?.freeTrialExpiresAt);
        await trackUpgradeButtonClicked(user.id, daysRemaining);
      } catch (analyticsError) {
        console.log('Analytics não registrado (não crítico):', analyticsError);
      }
      
      // Redireciona para a tela de seleção de plano
      console.log('Navegando para /selecao-plano...');
      router.replace('/selecao-plano');
      
    } catch (error: any) {
      console.error('Erro ao redirecionar:', error);
      Alert.alert(
        'Erro',
        'Não foi possível prosseguir. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Período Gratuito" showBackButton={false} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo_aura.png')} 
              style={styles.logo} 
            />
          </View>
          <Text style={styles.title}>Seu período de teste gratuito terminou 💜</Text>
          <Text style={styles.subtitle}>
            Para continuar usando o Aura e manter seus dados salvos, assine o plano Essencial.
          </Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.contentSection}>
          <View style={styles.card}>
            <Feather name="heart" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>O Aura foi feito para você</Text>
            <Text style={styles.cardDescription}>
              O Aura foi feito para quem trabalha sozinho e quer organizar sua agenda e seus ganhos de um jeito simples e elegante.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="calendar" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Agenda Organizada</Text>
            <Text style={styles.cardDescription}>
              Gerencie seus agendamentos de forma simples e eficiente, sem perder nenhum cliente.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="dollar-sign" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Controle Financeiro</Text>
            <Text style={styles.cardDescription}>
              Acompanhe suas receitas, despesas e lucro real do seu negócio de forma clara.
            </Text>
          </View>
        </View>

        {/* Botão de ação */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleAssinarAgora}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Assinar agora</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Clique abaixo para escolher seu plano e continuar:
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  contentSection: {
    flex: 1,
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 
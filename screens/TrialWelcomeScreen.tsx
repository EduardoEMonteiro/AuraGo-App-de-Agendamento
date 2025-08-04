import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { formatExpirationDate } from '../utils/trialUtils';

export default function TrialWelcomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Verificar se a tela de boas-vindas já foi mostrada para este usuário
    const checkWelcomeShown = async () => {
      try {
        const welcomeShown = await AsyncStorage.getItem(`welcome_shown_${user?.uid}`);
        if (welcomeShown === 'true') {
          console.log('Tela de boas-vindas já mostrada, redirecionando para agenda');
          router.replace('/(tabs)/agenda');
        }
      } catch (error) {
        console.log('Erro ao verificar se tela de boas-vindas foi mostrada:', error);
      }
    };

    if (user?.uid) {
      checkWelcomeShown();
    }
  }, [user?.uid, router]);

  const handleComecarAgora = async () => {
    try {
      // Marcar que a tela de boas-vindas foi mostrada
      await AsyncStorage.setItem(`welcome_shown_${user?.uid}`, 'true');
      console.log('Tela de boas-vindas marcada como mostrada');
      router.replace('/(tabs)/agenda');
    } catch (error) {
      console.log('Erro ao salvar status da tela de boas-vindas:', error);
      router.replace('/(tabs)/agenda');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Bem-vindo" showBackButton={false} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo_aura.png')} 
              style={styles.logo} 
            />
          </View>
          <Text style={styles.title}>Você está no seu período de teste gratuito 💜</Text>
          <Text style={styles.subtitle}>
            Nos próximos 30 dias, você poderá usar o Aura sem custo para testar todos os recursos.
          </Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.contentSection}>
          <View style={styles.card}>
            <Feather name="shield" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Sem cartão de crédito</Text>
            <Text style={styles.cardDescription}>
              Não se preocupe: você não precisará informar cartão de crédito agora.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="calendar" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Teste completo</Text>
            <Text style={styles.cardDescription}>
              Experimente todos os recursos do Aura durante 30 dias gratuitamente.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="bell" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Lembrete automático</Text>
            <Text style={styles.cardDescription}>
              Ao final do período, você será convidado a assinar para continuar.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="heart" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Aproveite!</Text>
            <Text style={styles.cardDescription}>
              Veja como o Aura pode facilitar sua rotina e organizar seu negócio.
            </Text>
          </View>
        </View>

        {/* Informações do trial */}
        {user?.freeTrialExpiresAt && (
          <View style={styles.trialInfo}>
            <Text style={styles.trialInfoTitle}>Seu período gratuito termina em:</Text>
            <Text style={styles.trialInfoDate}>
              {formatExpirationDate(user.freeTrialExpiresAt)}
            </Text>
          </View>
        )}

        {/* Botão de ação */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleComecarAgora}>
            <Text style={styles.primaryButtonText}>Começar agora</Text>
          </TouchableOpacity>
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
  trialInfo: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  trialInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
  },
  trialInfoDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  actionContainer: {
    paddingVertical: 24,
  },
  primaryButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
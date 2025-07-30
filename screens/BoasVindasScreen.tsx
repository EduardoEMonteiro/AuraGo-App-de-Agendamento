import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';

export default function BoasVindasScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isMounted = useRef(false);

  useEffect(() => {
    console.log('BoasVindasScreen - Componente montado');
    // Aguarda um pouco para garantir que o layout está montado
    const timer = setTimeout(() => {
      isMounted.current = true;
      console.log('BoasVindasScreen - Componente pronto para navegação');
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  function handleIniciar() {
    console.log('BoasVindasScreen - Botão iniciar pressionado');
    // Marcar que o usuário já viu a tela de boas-vindas
    // Aqui você pode adicionar lógica para salvar no AsyncStorage se necessário
    if (isMounted.current) {
      setTimeout(() => {
        try {
          console.log('BoasVindasScreen - Tentando navegar para agenda');
          // Agora que estamos dentro do sistema de rotas, podemos navegar normalmente
          router.replace('/(tabs)/agenda');
        } catch (error) {
          console.log('Erro na navegação do botão iniciar:', error);
        }
      }, 100);
    } else {
      console.log('BoasVindasScreen - Navegação ignorada, componente não montado');
    }
  }

  function handlePular() {
    console.log('BoasVindasScreen - Botão pular pressionado');
    // Pular a tela de boas-vindas e ir direto para as tabs
    if (isMounted.current) {
      setTimeout(() => {
        try {
          console.log('BoasVindasScreen - Tentando navegar para agenda (pular)');
          // Agora que estamos dentro do sistema de rotas, podemos navegar normalmente
          router.replace('/(tabs)/agenda');
        } catch (error) {
          console.log('Erro na navegação do botão pular:', error);
        }
      }, 100);
    } else {
      console.log('BoasVindasScreen - Navegação ignorada, componente não montado');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Bem-vindo" showBackButton={false} />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Feather name="check-circle" size={48} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Bem-vindo ao Aura!</Text>
          <Text style={styles.subtitle}>Seu plano foi ativado com sucesso</Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <View style={styles.card}>
            <Feather name="calendar" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Agenda Completa</Text>
            <Text style={styles.cardDescription}>
              Gerencie seus agendamentos, clientes e serviços de forma simples e eficiente.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="message-circle" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>WhatsApp Integrado</Text>
            <Text style={styles.cardDescription}>
              Envie confirmações e lembretes automaticamente para seus clientes.
            </Text>
          </View>

          <View style={styles.card}>
            <Feather name="bar-chart-2" size={32} color="#1976d2" />
            <Text style={styles.cardTitle}>Controle Financeiro</Text>
            <Text style={styles.cardDescription}>
              Acompanhe receitas, despesas e lucro real do seu negócio.
            </Text>
          </View>
        </View>

        {/* Botão de ação */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleIniciar}>
            <Text style={styles.primaryButtonText}>Começar a Usar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePular}>
            <Text style={styles.secondaryButtonText}>Pular Introdução</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
  },
  primaryButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
}); 
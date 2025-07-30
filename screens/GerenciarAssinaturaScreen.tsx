  import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import { createCustomerPortalSession } from '../services/stripe';

  export const GerenciarAssinaturaScreen = memo(() => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { salaoInfo } = useSalaoInfo();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      // Removido a chamada para getCustomerInfo que estava causando erro
      // O portal do Stripe está funcionando corretamente
    }, []);

    const handleAcessarPortal = useCallback(async () => {
      if (!salaoInfo?.stripeCustomerId) {
        Alert.alert('Erro', 'As informações da sua assinatura não foram encontradas. Verifique se você possui uma assinatura ativa.');
        return;
      }

      setLoading(true); // Ativa o loading no início
      try {
        // Chama a função de serviço que chama a Cloud Function
        const data = await createCustomerPortalSession(salaoInfo.stripeCustomerId);
        
        if (data && data.url) {
          // Abre o link dinâmico retornado pelo backend
          await Linking.openURL(data.url);
        } else {
          throw new Error('A URL do portal não foi retornada pelo servidor.');
        }
      } catch (error: any) {
        console.error("❌ Debug: Erro ao criar ou acessar o portal Stripe:", error);
        console.error("❌ Debug: Detalhes do erro:", error.message);
        console.error("❌ Debug: Stack trace:", error.stack);
        
        Alert.alert(
          'Erro ao Acessar', 
          error.message || 'Não foi possível acessar o portal de gerenciamento. Verifique sua conexão e tente novamente.'
        );
      } finally {
        setLoading(false); // Desativa o loading em qualquer cenário (sucesso ou erro)
      }
    }, [salaoInfo?.stripeCustomerId]);

    const handleBackPress = useCallback(() => {
      router.back();
    }, [router]);

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Feather name="arrow-left" size={hp('3%')} color="#1976d2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gerenciar Assinatura</Text>
          <View style={{ width: wp('8%') }} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          {/* Informações do Plano Atual */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plano Atual</Text>
            <View style={styles.planCard}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>
                  {salaoInfo?.plano || 'N/A'}
                </Text>
                <Text style={styles.planStatus}>
                  Status: {salaoInfo?.statusAssinatura || 'Ativo'}
                </Text>
                <Text style={styles.planDate}>
                  Plano: {salaoInfo?.plano || 'N/A'}
                </Text>
              </View>
              <Feather name="credit-card" size={hp('3%')} color="#1976d2" />
            </View>
          </View>

          {/* Ações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações</Text>
            
            <Text style={styles.actionDescription}>
              Acesse o portal do Stripe para:
            </Text>
            <View style={styles.actionList}>
              <Text style={styles.actionItem}>• Verificar status da assinatura</Text>
              <Text style={styles.actionItem}>• Cancelar assinatura</Text>
              <Text style={styles.actionItem}>• Baixar faturas</Text>
              <Text style={styles.actionItem}>• Atualizar informações de cobrança</Text>
            </View>
          </View>

          {/* Informações de Suporte */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precisa de Ajuda?</Text>
            <View style={styles.supportCard}>
              <Text style={styles.supportText}>
                Se você tiver problemas com sua assinatura ou precisar de suporte, entre em contato conosco:
              </Text>
              <TouchableOpacity style={styles.supportButton}>
                <Feather name="message-circle" size={hp('2.5%')} color="#1976d2" />
                <Text style={styles.supportButtonText}>Falar com Suporte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Botão Principal Fora do ScrollView */}
        <View style={{ padding: wp('4%'), backgroundColor: '#f5f5f5' }}>
          <Pressable 
            style={[
              styles.actionButton,
              { 
                backgroundColor: '#1976d2',
                minHeight: hp('6%'),
                zIndex: 1000
              }
            ]} 
            onPress={() => {
              if (!salaoInfo?.stripeCustomerId) {
                Alert.alert('Erro', 'As informações da sua assinatura não foram encontradas. Verifique se você possui uma assinatura ativa.');
                return;
              }
              
              handleAcessarPortal();
            }}
            onPressIn={() => {
              // Log removido
            }}
            onPressOut={() => {
              // Log removido
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="settings" size={hp('2.5%')} color="#fff" />
                <Text style={styles.actionButtonText}>Gerenciar Assinatura</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  });

  GerenciarAssinaturaScreen.displayName = 'GerenciarAssinaturaScreen';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('1.5%'),
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    backButton: {
      padding: wp('2%'),
    },
    headerTitle: {
      fontSize: hp('2.25%'),
      fontWeight: 'bold',
      color: '#333',
    },
    content: {
      flex: 1,
      padding: wp('4%'),
    },
    section: {
      marginBottom: hp('3%'),
    },
    sectionTitle: {
      fontSize: hp('2%'),
      fontWeight: 'bold',
      color: '#333',
      marginBottom: hp('1.5%'),
    },
    planCard: {
      backgroundColor: '#fff',
      borderRadius: wp('3%'),
      padding: wp('4%'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: hp('2.25%'),
      fontWeight: 'bold',
      color: '#333',
      marginBottom: hp('0.5%'),
    },
    planStatus: {
      fontSize: hp('1.75%'),
      color: '#666',
      marginBottom: hp('0.25%'),
    },
    planDate: {
      fontSize: hp('1.5%'),
      color: '#999',
    },
    infoCard: {
      backgroundColor: '#fff',
      borderRadius: wp('3%'),
      padding: wp('4%'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    infoLabel: {
      fontSize: hp('1.75%'),
      fontWeight: 'bold',
      color: '#666',
      marginBottom: hp('0.5%'),
    },
    infoValue: {
      fontSize: hp('1.75%'),
      color: '#333',
      marginBottom: hp('1.5%'),
      fontFamily: 'monospace',
    },
    actionButton: {
      backgroundColor: '#1976d2',
      borderRadius: wp('3%'),
      padding: wp('4%'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp('2%'),
    },
    actionButtonText: {
      color: '#fff',
      fontSize: hp('2%'),
      fontWeight: 'bold',
      marginLeft: wp('2%'),
    },
    actionDescription: {
      fontSize: hp('1.75%'),
      color: '#666',
      marginBottom: hp('1.5%'),
    },
    actionList: {
      backgroundColor: '#fff',
      borderRadius: wp('3%'),
      padding: wp('4%'),
    },
    actionItem: {
      fontSize: hp('1.75%'),
      color: '#333',
      marginBottom: hp('1%'),
    },
    supportCard: {
      backgroundColor: '#fff',
      borderRadius: wp('3%'),
      padding: wp('4%'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    supportText: {
      fontSize: hp('1.75%'),
      color: '#666',
      marginBottom: hp('2%'),
      lineHeight: hp('2.5%'),
    },
    supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: hp('1.5%'),
      borderWidth: 1,
      borderColor: '#1976d2',
      borderRadius: wp('2%'),
    },
    supportButtonText: {
      color: '#1976d2',
      fontSize: hp('1.75%'),
      fontWeight: 'bold',
      marginLeft: wp('2%'),
    },
  }); 
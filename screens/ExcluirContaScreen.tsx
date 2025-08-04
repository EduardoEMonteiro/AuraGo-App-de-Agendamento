import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { excluirContaUsuario } from '../services/privacidade';

export const ExcluirContaScreen = React.memo(() => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const [confirmacoes, setConfirmacoes] = useState({
    entendi: false,
    irreversivel: false,
    backup: false,
    final: false,
  });

  const handleConfirmacaoChange = useCallback((key: keyof typeof confirmacoes) => {
    setConfirmacoes(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const todasConfirmacoesMarcadas = Object.values(confirmacoes).every(Boolean);

  const handleExcluirConta = useCallback(async () => {
    if (!user?.id) return;

    Alert.alert(
      'Confirmação Final',
      'Tem certeza absoluta que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir Conta',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Passar o usuário atual do Authentication para exclusão completa
              const currentUser = auth.currentUser;
              await excluirContaUsuario(user.id, currentUser);
              
              Alert.alert(
                'Conta Excluída',
                'Sua conta foi excluída com sucesso. Todos os seus dados foram removidos permanentemente.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await logout();
                      router.replace('/login');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Erro ao excluir conta:', error);
              Alert.alert('Erro', 'Não foi possível excluir sua conta. Tente novamente.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [user?.id, logout, router]);

  const renderConfirmacao = useCallback(({ 
    key, 
    title, 
    description, 
    icon, 
    iconColor 
  }: any) => (
    <TouchableOpacity
      style={styles.confirmacaoCard}
      onPress={() => handleConfirmacaoChange(key)}
    >
      <View style={styles.confirmacaoHeader}>
        <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
          <Feather name={icon} size={hp('2.5%')} color={iconColor} />
        </View>
        <View style={styles.confirmacaoContent}>
          <Text style={styles.confirmacaoTitle}>{title}</Text>
          <Text style={styles.confirmacaoDescription}>{description}</Text>
        </View>
        <View style={[
          styles.checkbox,
          confirmacoes[key as keyof typeof confirmacoes] && styles.checkboxChecked
        ]}>
          {confirmacoes[key as keyof typeof confirmacoes] && (
            <Feather name="check" size={hp('2%')} color="#fff" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [confirmacoes, handleConfirmacaoChange]);

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Excluir Conta" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Aviso Principal */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Feather name="alert-triangle" size={hp('4%')} color="#f44336" />
            <Text style={styles.warningTitle}>Atenção: Exclusão Permanente</Text>
          </View>
                     <Text style={styles.warningText}>
             Esta ação irá <Text style={{fontWeight: 'bold'}}>EXCLUIR PERMANENTEMENTE</Text> sua conta, 
             todos os dados associados e o salão vinculado. 
             Esta operação é <Text style={{fontWeight: 'bold'}}>IRREVERSÍVEL</Text> e não pode ser desfeita.
           </Text>
        </View>

        {/* O que será excluído */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que será excluído:</Text>
          
          <View style={styles.dataList}>
            <View style={styles.dataItem}>
              <Feather name="user" size={hp('2%')} color="#f44336" />
              <Text style={styles.dataItemText}>Seus dados pessoais</Text>
            </View>
                       <View style={styles.dataItem}>
             <Feather name="shopping-bag" size={hp('2%')} color="#f44336" />
             <Text style={styles.dataItemText}>Salão completo (EXCLUSÃO TOTAL)</Text>
           </View>
            <View style={styles.dataItem}>
              <Feather name="calendar" size={hp('2%')} color="#f44336" />
              <Text style={styles.dataItemText}>Histórico de agendamentos</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="users" size={hp('2%')} color="#f44336" />
              <Text style={styles.dataItemText}>Lista de clientes</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="scissors" size={hp('2%')} color="#f44336" />
              <Text style={styles.dataItemText}>Serviços e produtos</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="credit-card" size={hp('2%')} color="#f44336" />
              <Text style={styles.dataItemText}>Configurações de pagamento</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="settings" size={hp('2%')} color="#f44336" />
              <Text style={styles.dataItemText}>Todas as configurações</Text>
            </View>
          </View>
        </View>

        {/* Confirmações necessárias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirmações necessárias:</Text>
          
                     {renderConfirmacao({
             key: 'entendi',
             title: 'Entendo as consequências',
             description: 'Compreendo que esta ação é irreversível e resultará na EXCLUSÃO PERMANENTE de todos os meus dados e do salão vinculado.',
             icon: 'alert-circle',
             iconColor: '#f44336',
           })}

          {renderConfirmacao({
            key: 'irreversivel',
            title: 'Ação irreversível',
            description: 'Entendo que não será possível recuperar meus dados após a exclusão da conta.',
            icon: 'x-circle',
            iconColor: '#f44336',
          })}

          {renderConfirmacao({
            key: 'backup',
            title: 'Fiz backup dos dados importantes',
            description: 'Confirmei que exportei ou fiz backup de quaisquer dados que preciso preservar.',
            icon: 'download',
            iconColor: '#ff9800',
          })}

          {renderConfirmacao({
            key: 'final',
            title: 'Confirmação final',
            description: 'Tenho certeza absoluta de que desejo excluir minha conta permanentemente.',
            icon: 'check-circle',
            iconColor: '#f44336',
          })}
        </View>

        {/* Alternativas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternativas à exclusão:</Text>
          
          <View style={styles.alternativeCard}>
            <Feather name="pause" size={hp('2.5%')} color="#1976d2" />
            <View style={styles.alternativeContent}>
              <Text style={styles.alternativeTitle}>Pausar conta</Text>
              <Text style={styles.alternativeText}>
                Você pode pausar sua conta temporariamente sem perder dados.
              </Text>
            </View>
          </View>

          <View style={styles.alternativeCard}>
            <Feather name="download" size={hp('2.5%')} color="#4caf50" />
            <View style={styles.alternativeContent}>
              <Text style={styles.alternativeTitle}>Exportar dados</Text>
              <Text style={styles.alternativeText}>
                Faça backup dos seus dados antes de excluir a conta.
              </Text>
            </View>
          </View>

          <View style={styles.alternativeCard}>
            <Feather name="settings" size={hp('2.5%')} color="#ff9800" />
            <View style={styles.alternativeContent}>
              <Text style={styles.alternativeTitle}>Configurar privacidade</Text>
              <Text style={styles.alternativeText}>
                Ajuste as configurações de privacidade em vez de excluir a conta.
              </Text>
            </View>
          </View>
        </View>

        {/* Botão de exclusão */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.excluirButton,
              !todasConfirmacoesMarcadas && styles.excluirButtonDisabled,
              loading && styles.excluirButtonLoading,
            ]}
            onPress={handleExcluirConta}
            disabled={!todasConfirmacoesMarcadas || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="trash-2" size={hp('2.5%')} color="#fff" />
            )}
                         <Text style={styles.excluirButtonText}>
               {loading ? 'Excluindo...' : 'EXCLUIR CONTA E SALÃO PERMANENTEMENTE'}
             </Text>
          </TouchableOpacity>
        </View>

        {/* Informações de suporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Precisa de ajuda?</Text>
          
          <View style={styles.supportCard}>
            <Feather name="help-circle" size={hp('2.5%')} color="#1976d2" />
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Suporte</Text>
              <Text style={styles.supportText}>
                Se você tem dúvidas ou precisa de assistência, entre em contato conosco antes de excluir sua conta.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

ExcluirContaScreen.displayName = 'ExcluirContaScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  warningSection: {
    backgroundColor: '#ffebee',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  warningTitle: {
    fontSize: hp('2.25%'),
    fontWeight: 'bold',
    color: '#d32f2f',
    marginLeft: wp('2%'),
  },
  warningText: {
    fontSize: hp('1.75%'),
    color: '#d32f2f',
    lineHeight: hp('2.5%'),
  },
  section: {
    marginBottom: hp('3%'),
  },
  sectionTitle: {
    fontSize: hp('2.25%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1.5%'),
  },
  dataList: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  dataItemText: {
    fontSize: hp('1.75%'),
    color: '#333',
    marginLeft: wp('2%'),
  },
  confirmacaoCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  confirmacaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  confirmacaoContent: {
    flex: 1,
  },
  confirmacaoTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  confirmacaoDescription: {
    fontSize: hp('1.625%'),
    color: '#666',
    lineHeight: hp('2.25%'),
  },
  checkbox: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('1%'),
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  alternativeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  alternativeContent: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  alternativeTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  alternativeText: {
    fontSize: hp('1.625%'),
    color: '#666',
    lineHeight: hp('2.25%'),
  },
  excluirButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('4%'),
  },
  excluirButtonDisabled: {
    backgroundColor: '#ccc',
  },
  excluirButtonLoading: {
    opacity: 0.7,
  },
  excluirButtonText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  supportCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    elevation: 1,
  },
  supportContent: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  supportTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  supportText: {
    fontSize: hp('1.625%'),
    color: '#666',
    lineHeight: hp('2.25%'),
  },
}); 
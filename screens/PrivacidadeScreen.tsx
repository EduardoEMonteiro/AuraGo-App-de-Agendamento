import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { buscarConsentimentos, buscarStatusExportacao, buscarStatusPortabilidade } from '../services/privacidade';

export const PrivacidadeScreen = React.memo(() => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [consentimentos, setConsentimentos] = useState<any[]>([]);
  const [exportacoes, setExportacoes] = useState<any[]>([]);
  const [portabilidades, setPortabilidades] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, [user?.id]);

  const carregarDados = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [consentimentosData, exportacoesData, portabilidadesData] = await Promise.all([
        buscarConsentimentos(user.id),
        buscarStatusExportacao(user.id),
        buscarStatusPortabilidade(user.id),
      ]);
      
      setConsentimentos(consentimentosData);
      setExportacoes(exportacoesData);
      setPortabilidades(portabilidadesData);
    } catch (error) {
      console.error('Erro ao carregar dados de privacidade:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados de privacidade.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleExportarDados = useCallback(() => {
    router.push('/exportar-dados');
  }, [router]);

  const handlePortabilidade = useCallback(() => {
    // Implementar quando a tela de portabilidade for criada
    Alert.alert('Em Desenvolvimento', 'A funcionalidade de portabilidade será implementada em breve.');
  }, [router]);

  const handleExcluirConta = useCallback(() => {
    router.push('/excluir-conta');
  }, [router]);

  const handleTermosPrivacidade = useCallback(() => {
    router.push('/termos-privacidade');
  }, [router]);

  const handleGerenciarConsentimentos = useCallback(() => {
    // Implementar quando a tela de gerenciamento de consentimentos for criada
    Alert.alert('Em Desenvolvimento', 'A funcionalidade de gerenciamento de consentimentos será implementada em breve.');
  }, [router]);

  const renderCard = useCallback(({ 
    key, 
    icon, 
    title, 
    description, 
    onPress, 
    backgroundColor = '#f9f9f9', 
    iconColor = '#1976d2', 
    chevronColor = '#888',
    badge,
    badgeText
  }: any) => (
    <TouchableOpacity
      key={key}
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <View style={[styles.iconWrapper, { backgroundColor: backgroundColor === '#fff3cd' ? '#fff3cd' : '#e3eaff' }]}>
        <Feather name={icon} size={hp('3%')} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge === 'warning' ? '#ff9800' : '#4caf50' }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={hp('2.75%')} color={chevronColor} />
    </TouchableOpacity>
  ), []);

  const renderStatusCard = useCallback(({ 
    title, 
    status, 
    data, 
    onPress 
  }: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'concluido': return '#4caf50';
        case 'processando': return '#ff9800';
        case 'erro': return '#f44336';
        default: return '#9e9e9e';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'concluido': return 'Concluído';
        case 'processando': return 'Processando';
        case 'erro': return 'Erro';
        default: return 'Pendente';
      }
    };

    return (
      <TouchableOpacity style={styles.statusCard} onPress={onPress}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>{title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(status)}</Text>
          </View>
        </View>
        <Text style={styles.statusDate}>{new Date(data).toLocaleDateString('pt-BR')}</Text>
      </TouchableOpacity>
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Privacidade e Dados" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Privacidade e Dados" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção: Direitos LGPD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus Direitos LGPD</Text>
          <Text style={styles.sectionDescription}>
            Conforme a Lei Geral de Proteção de Dados, você tem direito a:
          </Text>
          
          {renderCard({
            key: 'exportar',
            icon: 'download',
            title: 'Exportar Dados',
            description: 'Baixar todos os seus dados pessoais em formato JSON',
            onPress: handleExportarDados,
            backgroundColor: '#e8f5e8',
            iconColor: '#4caf50',
          })}

          {renderCard({
            key: 'portabilidade',
            icon: 'share-2',
            title: 'Portabilidade de Dados',
            description: 'Solicitar transferência dos seus dados para outro serviço',
            onPress: handlePortabilidade,
            backgroundColor: '#fff3e0',
            iconColor: '#ff9800',
          })}

          {renderCard({
            key: 'excluir',
            icon: 'trash-2',
            title: 'Excluir Conta',
            description: 'Solicitar exclusão permanente de todos os seus dados',
            onPress: handleExcluirConta,
            backgroundColor: '#ffebee',
            iconColor: '#f44336',
          })}
        </View>

        {/* Seção: Termos e Consentimentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termos e Consentimentos</Text>
          
          {renderCard({
            key: 'termos',
            icon: 'file-text',
            title: 'Termos de Uso e Política de Privacidade',
            description: 'Visualizar e gerenciar seus consentimentos',
            onPress: handleTermosPrivacidade,
          })}

          {renderCard({
            key: 'consentimentos',
            icon: 'check-circle',
            title: 'Gerenciar Consentimentos',
            description: 'Revogar ou modificar seus consentimentos',
            onPress: handleGerenciarConsentimentos,
            badge: consentimentos.length > 0 ? 'info' : null,
            badgeText: `${consentimentos.length} ativo${consentimentos.length !== 1 ? 's' : ''}`,
          })}
        </View>

        {/* Seção: Status das Solicitações */}
        {(exportacoes.length > 0 || portabilidades.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status das Solicitações</Text>
            
            {exportacoes.slice(0, 3).map((exportacao, index) => (
              renderStatusCard({
                key: `export-${index}`,
                title: 'Exportação de Dados',
                status: exportacao.status,
                data: exportacao.dataCriacao,
                onPress: () => router.push('/exportar-dados'),
              })
            ))}

                         {portabilidades.slice(0, 3).map((portabilidade, index) => (
               renderStatusCard({
                 key: `port-${index}`,
                 title: 'Portabilidade de Dados',
                 status: portabilidade.status,
                 data: portabilidade.dataSolicitacao,
                 onPress: () => handlePortabilidade(),
               })
             ))}
          </View>
        )}

        {/* Seção: Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Importantes</Text>
          
          <View style={styles.infoCard}>
            <Feather name="info" size={hp('2.5%')} color="#1976d2" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Proteção de Dados</Text>
              <Text style={styles.infoText}>
                Seus dados são protegidos conforme a LGPD. Todas as solicitações são processadas de forma segura e auditável.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Feather name="clock" size={hp('2.5%')} color="#ff9800" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Prazo de Processamento</Text>
              <Text style={styles.infoText}>
                Exportações e portabilidades são processadas em até 48 horas. Você será notificado quando estiverem prontas.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Feather name="shield" size={hp('2.5%')} color="#4caf50" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Segurança</Text>
              <Text style={styles.infoText}>
                Todas as operações são registradas para auditoria e conformidade com a LGPD.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

PrivacidadeScreen.displayName = 'PrivacidadeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: hp('2%'),
    color: '#666',
  },
  section: {
    marginBottom: hp('3%'),
  },
  sectionTitle: {
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  sectionDescription: {
    fontSize: hp('1.875%'),
    color: '#666',
    marginBottom: hp('2%'),
    lineHeight: hp('2.5%'),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  iconWrapper: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#e3eaff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('4%'),
  },
  cardTitle: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: '#222',
  },
  cardDesc: {
    fontSize: hp('1.625%'),
    color: '#666',
    marginTop: hp('0.25%'),
  },
  badge: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
  },
  badgeText: {
    color: '#fff',
    fontSize: hp('1.5%'),
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1%'),
    elevation: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  statusTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: hp('1.5%'),
    fontWeight: 'bold',
  },
  statusDate: {
    fontSize: hp('1.625%'),
    color: '#666',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  infoTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  infoText: {
    fontSize: hp('1.625%'),
    color: '#666',
    lineHeight: hp('2.25%'),
  },
}); 
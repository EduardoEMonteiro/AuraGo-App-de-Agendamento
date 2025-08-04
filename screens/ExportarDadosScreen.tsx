import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { buscarStatusExportacao, exportarDadosUsuario, StatusExportacao } from '../services/privacidade';

export const ExportarDadosScreen = React.memo(() => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [exportacoes, setExportacoes] = useState<StatusExportacao[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarExportacoes();
  }, [user?.id]);

  const carregarExportacoes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      const data = await buscarStatusExportacao(user.id);
      setExportacoes(data.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()));
    } catch (error) {
      console.error('Erro ao carregar exportações:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de exportações.');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const handleNovaExportacao = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      await exportarDadosUsuario(user.id);
      Alert.alert('Sucesso', 'Sua solicitação de exportação foi iniciada. Você será notificado quando estiver pronta.');
      carregarExportacoes();
    } catch (error) {
      console.error('Erro ao iniciar exportação:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a exportação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, carregarExportacoes]);

  const handleDownload = useCallback((exportacao: StatusExportacao) => {
    if (exportacao.urlDownload) {
      // Em um app real, você usaria uma biblioteca como react-native-fs
      // ou react-native-share para baixar o arquivo
      Alert.alert(
        'Download',
        'O arquivo está pronto para download. Em um app real, o download seria iniciado automaticamente.',
        [
          { text: 'OK' },
          { 
            text: 'Copiar Link', 
            onPress: () => {
              // Aqui você copiaria o link para a área de transferência
              Alert.alert('Link copiado!');
            }
          }
        ]
      );
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'concluido': return '#4caf50';
      case 'processando': return '#ff9800';
      case 'erro': return '#f44336';
      default: return '#9e9e9e';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'processando': return 'Processando';
      case 'erro': return 'Erro';
      default: return 'Pendente';
    }
  }, []);

  const renderExportacao = useCallback((exportacao: StatusExportacao) => (
    <View key={exportacao.id} style={styles.exportacaoCard}>
      <View style={styles.exportacaoHeader}>
        <View style={styles.exportacaoInfo}>
          <Text style={styles.exportacaoTitle}>
            Exportação #{exportacao.id.slice(-8)}
          </Text>
          <Text style={styles.exportacaoDate}>
            {new Date(exportacao.dataCriacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exportacao.status) }]}>
          <Text style={styles.statusBadgeText}>{getStatusText(exportacao.status)}</Text>
        </View>
      </View>
      
      {exportacao.status === 'erro' && exportacao.erro && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={hp('2%')} color="#f44336" />
          <Text style={styles.errorText}>{exportacao.erro}</Text>
        </View>
      )}
      
      {exportacao.status === 'concluido' && exportacao.dataConclusao && (
        <View style={styles.successContainer}>
          <Feather name="check-circle" size={hp('2%')} color="#4caf50" />
          <Text style={styles.successText}>
            Concluído em {new Date(exportacao.dataConclusao).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      )}
      
      {exportacao.status === 'concluido' && exportacao.urlDownload && (
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => handleDownload(exportacao)}
        >
          <Feather name="download" size={hp('2%')} color="#1976d2" />
          <Text style={styles.downloadButtonText}>Baixar Arquivo</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [getStatusColor, getStatusText, handleDownload]);

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Exportar Dados" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção: Nova Exportação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nova Exportação</Text>
          <Text style={styles.sectionDescription}>
            Solicite uma nova exportação dos seus dados pessoais. O arquivo incluirá todos os seus dados:
          </Text>
          
          <View style={styles.dataList}>
            <View style={styles.dataItem}>
              <Feather name="user" size={hp('2%')} color="#1976d2" />
              <Text style={styles.dataItemText}>Dados pessoais e do salão</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="calendar" size={hp('2%')} color="#1976d2" />
              <Text style={styles.dataItemText}>Histórico de agendamentos</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="users" size={hp('2%')} color="#1976d2" />
              <Text style={styles.dataItemText}>Lista de clientes</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="scissors" size={hp('2%')} color="#1976d2" />
              <Text style={styles.dataItemText}>Serviços e produtos</Text>
            </View>
            <View style={styles.dataItem}>
              <Feather name="check-circle" size={hp('2%')} color="#1976d2" />
              <Text style={styles.dataItemText}>Consentimentos e termos</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.exportButton, loading && styles.exportButtonDisabled]}
            onPress={handleNovaExportacao}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="download" size={hp('2.5%')} color="#fff" />
            )}
            <Text style={styles.exportButtonText}>
              {loading ? 'Iniciando...' : 'Solicitar Exportação'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Histórico */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico de Exportações</Text>
            <TouchableOpacity onPress={carregarExportacoes} disabled={refreshing}>
              <Feather name="refresh-cw" size={hp('2.5%')} color="#1976d2" />
            </TouchableOpacity>
          </View>
          
          {refreshing && (
            <View style={styles.refreshingContainer}>
              <ActivityIndicator size="small" color="#1976d2" />
              <Text style={styles.refreshingText}>Atualizando...</Text>
            </View>
          )}
          
          {exportacoes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={hp('8%')} color="#ccc" />
              <Text style={styles.emptyText}>Nenhuma exportação encontrada</Text>
              <Text style={styles.emptySubtext}>
                Suas solicitações de exportação aparecerão aqui
              </Text>
            </View>
          ) : (
            exportacoes.map(renderExportacao)
          )}
        </View>

        {/* Seção: Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Importantes</Text>
          
          <View style={styles.infoCard}>
            <Feather name="clock" size={hp('2.5%')} color="#ff9800" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Prazo de Processamento</Text>
              <Text style={styles.infoText}>
                As exportações são processadas em até 48 horas. Você receberá uma notificação quando estiver pronta.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Feather name="file-text" size={hp('2.5%')} color="#4caf50" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Formato dos Dados</Text>
              <Text style={styles.infoText}>
                Os dados são exportados em formato JSON estruturado, facilitando a leitura e processamento.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Feather name="shield" size={hp('2.5%')} color="#1976d2" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Segurança</Text>
              <Text style={styles.infoText}>
                Todos os dados são criptografados e o acesso é registrado para auditoria de conformidade.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

ExportarDadosScreen.displayName = 'ExportarDadosScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  section: {
    marginBottom: hp('3%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
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
  dataList: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  refreshingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
  },
  refreshingText: {
    marginLeft: wp('2%'),
    fontSize: hp('1.75%'),
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
  },
  emptyText: {
    fontSize: hp('2%'),
    color: '#666',
    marginTop: hp('2%'),
  },
  emptySubtext: {
    fontSize: hp('1.625%'),
    color: '#999',
    marginTop: hp('1%'),
    textAlign: 'center',
  },
  exportacaoCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  exportacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  exportacaoInfo: {
    flex: 1,
  },
  exportacaoTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
  },
  exportacaoDate: {
    fontSize: hp('1.5%'),
    color: '#666',
    marginTop: hp('0.25%'),
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: wp('2%'),
    borderRadius: wp('2%'),
    marginTop: hp('1%'),
  },
  errorText: {
    fontSize: hp('1.5%'),
    color: '#d32f2f',
    marginLeft: wp('2%'),
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: wp('2%'),
    borderRadius: wp('2%'),
    marginTop: hp('1%'),
  },
  successText: {
    fontSize: hp('1.5%'),
    color: '#2e7d32',
    marginLeft: wp('2%'),
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.5%'),
    marginTop: hp('1%'),
  },
  downloadButtonText: {
    color: '#1976d2',
    fontSize: hp('1.75%'),
    fontWeight: '600',
    marginLeft: wp('2%'),
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
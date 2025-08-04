import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { buscarConsentimentos, revogarConsentimento, salvarConsentimento } from '../services/privacidade';

export const TermosPrivacidadeScreen = React.memo(() => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [consentimentos, setConsentimentos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'termos' | 'privacidade' | 'consentimentos'>('termos');

  useEffect(() => {
    carregarConsentimentos();
  }, [user?.id]);

  const carregarConsentimentos = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await buscarConsentimentos(user.id);
      setConsentimentos(data);
    } catch (error) {
      console.error('Erro ao carregar consentimentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os consentimentos.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleConsentimento = useCallback(async (tipo: string, aceito: boolean) => {
    if (!user?.id) return;
    
    try {
      await salvarConsentimento(user.id, tipo, aceito, '1.0');
      await carregarConsentimentos();
      Alert.alert(
        'Sucesso', 
        aceito ? 'Consentimento registrado com sucesso.' : 'Consentimento revogado com sucesso.'
      );
    } catch (error) {
      console.error('Erro ao salvar consentimento:', error);
      Alert.alert('Erro', 'Falha na conexão. Verifique sua internet e tente novamente.');
    }
  }, [user?.id, carregarConsentimentos]);

  const handleRevogarConsentimento = useCallback(async (tipo: string) => {
    if (!user?.id) return;
    
    Alert.alert(
      'Revogar Consentimento',
      'Tem certeza que deseja revogar este consentimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revogarConsentimento(user.id, tipo);
              await carregarConsentimentos();
              Alert.alert('Sucesso', 'Consentimento revogado com sucesso.');
            } catch (error) {
              console.error('Erro ao revogar consentimento:', error);
              Alert.alert('Erro', 'Falha na conexão. Verifique sua internet e tente novamente.');
            }
          },
        },
      ]
    );
  }, [user?.id, carregarConsentimentos]);

  const renderTab = useCallback(({ 
    key, 
    title, 
    icon 
  }: any) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === key && styles.tabActive]}
      onPress={() => setActiveTab(key)}
    >
      <Feather name={icon} size={hp('2%')} color={activeTab === key ? '#1976d2' : '#666'} />
      <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  ), [activeTab]);

  const renderConsentimento = useCallback((consentimento: any) => {
    const getStatusColor = (aceito: boolean) => aceito ? '#4caf50' : '#f44336';
    const getStatusText = (aceito: boolean) => aceito ? 'Aceito' : 'Recusado';
    
    return (
      <View key={consentimento.id} style={styles.consentimentoCard}>
        <View style={styles.consentimentoHeader}>
          <Text style={styles.consentimentoTitle}>
            {consentimento.id === 'termos_uso' ? 'Termos de Uso' : 
             consentimento.id === 'politica_privacidade' ? 'Política de Privacidade' :
             consentimento.id === 'marketing' ? 'Marketing' :
             consentimento.id === 'cookies' ? 'Cookies' : consentimento.id}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(consentimento.aceito) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(consentimento.aceito)}</Text>
          </View>
        </View>
        
        <Text style={styles.consentimentoDate}>
          {consentimento.aceito ? 'Aceito em: ' : 'Recusado em: '}
          {new Date(consentimento.dataAceite).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        
        <Text style={styles.consentimentoVersion}>
          Versão: {consentimento.versao || '1.0'}
        </Text>
        
        <View style={styles.consentimentoActions}>
          {consentimento.aceito ? (
            <TouchableOpacity
              style={styles.revogarButton}
              onPress={() => handleRevogarConsentimento(consentimento.id)}
            >
              <Feather name="x-circle" size={hp('2%')} color="#f44336" />
              <Text style={styles.revogarButtonText}>Revogar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.aceitarButton}
              onPress={() => handleConsentimento(consentimento.id, true)}
            >
              <Feather name="check-circle" size={hp('2%')} color="#4caf50" />
              <Text style={styles.aceitarButtonText}>Aceitar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [handleConsentimento, handleRevogarConsentimento]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Termos e Privacidade" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Termos e Privacidade" />
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTab({ key: 'termos', title: 'Termos de Uso', icon: 'file-text' })}
        {renderTab({ key: 'privacidade', title: 'Política de Privacidade', icon: 'shield' })}
        {renderTab({ key: 'consentimentos', title: 'Consentimentos', icon: 'check-circle' })}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'termos' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TERMOS DE USO - AURA</Text>
            <Text style={styles.lastUpdated}>Última atualização: Janeiro 2025</Text>
            
            <View style={styles.termSection}>
              <Text style={styles.termTitle}>1. Aceitação dos Termos</Text>
              <Text style={styles.termText}>
                Ao acessar e usar o app Aura ("plataforma"), você concorda com estes Termos de Uso e com a Política de Privacidade vigente. Se não concordar, não utilize o app.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>2. Uso do Aplicativo</Text>
              <Text style={styles.termText}>
                Você se compromete a:
              </Text>
              <Text style={styles.termText}>
                • Utilizar o app para fins legais e legítimos;{'\n'}
                • Fornecer informações verdadeiras e atualizadas;{'\n'}
                • Manter sigilo sobre suas credenciais de acesso;{'\n'}
                • Não tentar acessar dados ou funcionalidades de outros usuários;{'\n'}
                • Respeitar direitos de terceiros.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>3. Planos e Assinaturas</Text>
              <Text style={styles.termText}>
                Atualmente, o Aura oferece:
              </Text>
              <Text style={styles.termText}>
                • Plano Trial: gratuito por 30 dias, com funcionalidades completas;{'\n'}
                • Plano Essencial: R$ 19,90/mês, com limite de 1 profissional e funcionalidades avançadas.
              </Text>
              <Text style={styles.termText}>
                A cobrança é mensal, automática via Stripe. Cancelamentos podem ser feitos pelo app ou contato com suporte.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>4. Cancelamentos e Reembolsos</Text>
              <Text style={styles.termText}>
                Você pode cancelar a assinatura a qualquer momento. Cancelamentos podem ter efeito imediato ou no término do período pago.
              </Text>
              <Text style={styles.termText}>
                Política de reembolso:
              </Text>
              <Text style={styles.termText}>
                • Novos usuários têm direito a reembolso em até 7 dias;{'\n'}
                • Cancelamentos no meio do período terão reembolso proporcional.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>5. Responsabilidades</Text>
              <Text style={styles.termText}>
                Do Usuário:
              </Text>
              <Text style={styles.termText}>
                • Manter atualizadas suas informações;{'\n'}
                • Usar o app com responsabilidade;{'\n'}
                • Responder por dados de clientes inseridos no app.
              </Text>
              <Text style={styles.termText}>
                Da Aura:
              </Text>
              <Text style={styles.termText}>
                • Manter a plataforma disponível e funcional;{'\n'}
                • Proteger dados pessoais e informações;{'\n'}
                • Oferecer suporte técnico;{'\n'}
                • Notificar mudanças importantes.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>6. Limitações e Isenções</Text>
              <Text style={styles.termText}>
                A Aura não se responsabiliza por:
              </Text>
              <Text style={styles.termText}>
                • Danos decorrentes de uso indevido do app;{'\n'}
                • Falhas ou interrupções fora de seu controle;{'\n'}
                • Perdas de dados causadas por fatores externos.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>7. Propriedade Intelectual</Text>
              <Text style={styles.termText}>
                Todo conteúdo e software do app são propriedade da Aura e protegidos por leis de direitos autorais.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>8. Alterações nos Termos</Text>
              <Text style={styles.termText}>
                Reservamo-nos o direito de modificar estes termos, avisando previamente os usuários com pelo menos 30 dias de antecedência.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>9. Legislação Aplicável e Foro</Text>
              <Text style={styles.termText}>
                Estes termos são regidos pela legislação brasileira. Qualquer litígio será resolvido no foro da comarca do usuário.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>10. Contato</Text>
              <Text style={styles.termText}>
                Dúvidas e suporte:
              </Text>
              <Text style={styles.termText}>
                E-mail: fale.aura@aurago.site
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'privacidade' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POLÍTICA DE PRIVACIDADE - AURA</Text>
            <Text style={styles.lastUpdated}>Última atualização: Janeiro 2025</Text>
            
            <View style={styles.termSection}>
              <Text style={styles.termTitle}>1. Introdução</Text>
              <Text style={styles.termText}>
                A Aura ("nós", "nosso", "empresa") respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações, conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
              </Text>
              <Text style={styles.termText}>
                Ao utilizar nosso aplicativo, você concorda com os termos aqui descritos.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>2. Dados Pessoais Coletados</Text>
              <Text style={styles.termText}>
                Coletamos os seguintes dados para que você possa utilizar o Aura com segurança e qualidade:
              </Text>
              <Text style={styles.termText}>
                Dados do Usuário:{'\n'}
                • Nome completo{'\n'}
                • E-mail{'\n'}
                • Senha (criptografada){'\n'}
                • Foto de perfil (opcional){'\n'}
                • Telefone{'\n'}
                • Endereço completo (CEP, logradouro, número, bairro, cidade, estado, complemento){'\n'}
                • Data de início e expiração do trial{'\n'}
                • Status da assinatura{'\n'}
                • Função (ex.: gerente, recepcionista){'\n'}
                • Identificação do salão
              </Text>
              <Text style={styles.termText}>
                Dados do Salão:{'\n'}
                • Nome e telefone do salão{'\n'}
                • Responsável pelo salão{'\n'}
                • Horário de funcionamento{'\n'}
                • Formas de pagamento aceitas{'\n'}
                • Mensagens personalizadas do WhatsApp{'\n'}
                • Plano contratado{'\n'}
                • Endereço completo
              </Text>
              <Text style={styles.termText}>
                Dados de Clientes (coletados pelo usuário):{'\n'}
                • Nome{'\n'}
                • Telefone{'\n'}
                • E-mail (opcional){'\n'}
                • Observações e histórico de agendamentos
              </Text>
              <Text style={styles.termText}>
                Dados de Agendamentos:{'\n'}
                • Data e horário{'\n'}
                • Cliente atendido{'\n'}
                • Profissional responsável{'\n'}
                • Serviços realizados{'\n'}
                • Status do agendamento (agendado, cancelado, no-show, concluído){'\n'}
                • Observações adicionais{'\n'}
                • Dados de pagamento, se aplicável
              </Text>
              <Text style={styles.termText}>
                Dados Técnicos:{'\n'}
                • Token de notificações push{'\n'}
                • Identificação do dispositivo{'\n'}
                • Logs de uso do app{'\n'}
                • Dados de sessão e timestamps
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>3. Finalidade do Tratamento dos Dados</Text>
              <Text style={styles.termText}>
                Utilizamos seus dados para:
              </Text>
              <Text style={styles.termText}>
                • Permitir o cadastro, autenticação e uso do app;{'\n'}
                • Gerenciar planos, cobranças e assinaturas;{'\n'}
                • Oferecer funcionalidades, como agendamento, gestão de clientes e serviços;{'\n'}
                • Enviar notificações, lembretes e mensagens importantes;{'\n'}
                • Melhorar nosso serviço e experiência do usuário;{'\n'}
                • Cumprir obrigações legais e regulatórias.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>4. Compartilhamento de Dados com Terceiros</Text>
              <Text style={styles.termText}>
                Seus dados podem ser compartilhados com parceiros confiáveis para execução dos serviços:
              </Text>
              <Text style={styles.termText}>
                • Google Firebase: Armazenamento, autenticação e envio de notificações;{'\n'}
                • Stripe: Processamento seguro de pagamentos;{'\n'}
                • Expo: Envio de notificações push;{'\n'}
                • Google Sign-In: Autenticação social, quando utilizada.
              </Text>
              <Text style={styles.termText}>
                Garantimos que esses parceiros possuem políticas rígidas de segurança e uso responsável.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>5. Armazenamento e Segurança</Text>
              <Text style={styles.termText}>
                Seus dados são armazenados com segurança em servidores na nuvem do Google (Google Cloud), com criptografia em trânsito e em repouso. Adotamos:
              </Text>
              <Text style={styles.termText}>
                • Controles de acesso restrito;{'\n'}
                • Monitoramento contínuo;{'\n'}
                • Backup automático (incluso no Plano Essencial);{'\n'}
                • Procedimentos para detecção e resposta a incidentes.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>6. Direitos do Titular dos Dados</Text>
              <Text style={styles.termText}>
                Você tem o direito de:
              </Text>
              <Text style={styles.termText}>
                • Acessar seus dados pessoais armazenados;{'\n'}
                • Corrigir informações incorretas ou desatualizadas;{'\n'}
                • Solicitar a exclusão de seus dados ou da conta (respeitando obrigações legais);{'\n'}
                • Solicitar a portabilidade dos seus dados para outro serviço;{'\n'}
                • Revogar consentimentos concedidos;{'\n'}
                • Ser informado sobre incidentes de segurança que envolvam seus dados.
              </Text>
              <Text style={styles.termText}>
                Para exercer seus direitos, entre em contato pelo e-mail privacidade@aurago.site.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>7. Cookies e Tecnologias Semelhantes</Text>
              <Text style={styles.termText}>
                Utilizamos cookies e tecnologias para:
              </Text>
              <Text style={styles.termText}>
                • Manter sua sessão ativa;{'\n'}
                • Personalizar preferências;{'\n'}
                • Analisar uso do app (Firebase Analytics, opcional).
              </Text>
              <Text style={styles.termText}>
                Você pode gerenciar ou bloquear cookies nas configurações do dispositivo, mas isso pode afetar a experiência.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>8. Consentimento e Atualizações</Text>
              <Text style={styles.termText}>
                Ao utilizar o app, você consente com esta política. Caso haja atualizações relevantes, notificaremos com antecedência.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>9. Contato</Text>
              <Text style={styles.termText}>
                Dúvidas sobre esta política ou privacidade podem ser enviadas para:
              </Text>
              <Text style={styles.termText}>
                Suporte geral: fale.aura@aurago.site{'\n'}
                Privacidade: privacidade@aurago.site
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'consentimentos' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gerenciar Consentimentos</Text>
            <Text style={styles.sectionDescription}>
              Aqui você pode visualizar e gerenciar todos os seus consentimentos:
            </Text>
            
            {consentimentos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="check-circle" size={hp('8%')} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum consentimento encontrado</Text>
                <Text style={styles.emptySubtext}>
                  Seus consentimentos aparecerão aqui quando você aceitar os termos
                </Text>
              </View>
            ) : (
              consentimentos.map(renderConsentimento)
            )}

            <View style={styles.infoCard}>
              <Feather name="info" size={hp('2.5%')} color="#1976d2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Sobre Consentimentos</Text>
                <Text style={styles.infoText}>
                  Você pode revogar qualquer consentimento a qualquer momento. 
                  A revogação não afeta a legalidade do processamento realizado 
                  antes da revogação.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

TermosPrivacidadeScreen.displayName = 'TermosPrivacidadeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: hp('1.75%'),
    color: '#666',
    marginLeft: wp('1%'),
  },
  tabTextActive: {
    color: '#1976d2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
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
  lastUpdated: {
    fontSize: hp('1.5%'),
    color: '#666',
    marginBottom: hp('2%'),
    fontStyle: 'italic',
  },
  sectionDescription: {
    fontSize: hp('1.875%'),
    color: '#666',
    marginBottom: hp('2%'),
    lineHeight: hp('2.5%'),
  },
  termSection: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  termTitle: {
    fontSize: hp('1.875%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('1%'),
  },
  termText: {
    fontSize: hp('1.625%'),
    color: '#666',
    lineHeight: hp('2.25%'),
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
  consentimentoCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  consentimentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  consentimentoTitle: {
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
  consentimentoDate: {
    fontSize: hp('1.5%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  consentimentoVersion: {
    fontSize: hp('1.375%'),
    color: '#999',
    marginBottom: hp('1.5%'),
  },
  consentimentoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  revogarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: wp('2%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
  },
  revogarButtonText: {
    color: '#f44336',
    fontSize: hp('1.5%'),
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
  aceitarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: wp('2%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
  },
  aceitarButtonText: {
    color: '#4caf50',
    fontSize: hp('1.5%'),
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginTop: hp('2%'),
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
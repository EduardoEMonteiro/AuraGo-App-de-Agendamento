import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';

export const PoliticaPrivacidadeScreen = React.memo(() => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <CustomHeader title="Política de Privacidade" showBackButton={true} />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          <Text style={styles.title}>POLÍTICA DE PRIVACIDADE - AURA</Text>
          
          <Text style={styles.paragraph}>
            Última atualização: Janeiro 2025
          </Text>

          <Text style={styles.sectionTitle}>1. Introdução</Text>
          <Text style={styles.paragraph}>
            A Aura ("nós", "nosso", "empresa") respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações, conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
          </Text>
          <Text style={styles.paragraph}>
            Ao utilizar nosso aplicativo, você concorda com os termos aqui descritos.
          </Text>

          <Text style={styles.sectionTitle}>2. Dados Pessoais Coletados</Text>
          <Text style={styles.paragraph}>
            Coletamos os seguintes dados para que você possa utilizar o Aura com segurança e qualidade:
          </Text>
          <Text style={styles.paragraph}>
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
          <Text style={styles.paragraph}>
            Dados do Salão:{'\n'}
            • Nome e telefone do salão{'\n'}
            • Responsável pelo salão{'\n'}
            • Horário de funcionamento{'\n'}
            • Formas de pagamento aceitas{'\n'}
            • Mensagens personalizadas do WhatsApp{'\n'}
            • Plano contratado{'\n'}
            • Endereço completo
          </Text>
          <Text style={styles.paragraph}>
            Dados de Clientes (coletados pelo usuário):{'\n'}
            • Nome{'\n'}
            • Telefone{'\n'}
            • E-mail (opcional){'\n'}
            • Observações e histórico de agendamentos
          </Text>
          <Text style={styles.paragraph}>
            Dados de Agendamentos:{'\n'}
            • Data e horário{'\n'}
            • Cliente atendido{'\n'}
            • Profissional responsável{'\n'}
            • Serviços realizados{'\n'}
            • Status do agendamento (agendado, cancelado, no-show, concluído){'\n'}
            • Observações adicionais{'\n'}
            • Dados de pagamento, se aplicável
          </Text>
          <Text style={styles.paragraph}>
            Dados Técnicos:{'\n'}
            • Token de notificações push{'\n'}
            • Identificação do dispositivo{'\n'}
            • Logs de uso do app{'\n'}
            • Dados de sessão e timestamps
          </Text>

          <Text style={styles.sectionTitle}>3. Finalidade do Tratamento dos Dados</Text>
          <Text style={styles.paragraph}>
            Utilizamos seus dados para:
          </Text>
          <Text style={styles.paragraph}>
            • Permitir o cadastro, autenticação e uso do app;{'\n'}
            • Gerenciar planos, cobranças e assinaturas;{'\n'}
            • Oferecer funcionalidades, como agendamento, gestão de clientes e serviços;{'\n'}
            • Enviar notificações, lembretes e mensagens importantes;{'\n'}
            • Melhorar nosso serviço e experiência do usuário;{'\n'}
            • Cumprir obrigações legais e regulatórias.
          </Text>

          <Text style={styles.sectionTitle}>4. Compartilhamento de Dados com Terceiros</Text>
          <Text style={styles.paragraph}>
            Seus dados podem ser compartilhados com parceiros confiáveis para execução dos serviços:
          </Text>
          <Text style={styles.paragraph}>
            • Google Firebase: Armazenamento, autenticação e envio de notificações;{'\n'}
            • Stripe: Processamento seguro de pagamentos;{'\n'}
            • Expo: Envio de notificações push;{'\n'}
            • Google Sign-In: Autenticação social, quando utilizada.
          </Text>
          <Text style={styles.paragraph}>
            Garantimos que esses parceiros possuem políticas rígidas de segurança e uso responsável.
          </Text>

          <Text style={styles.sectionTitle}>5. Armazenamento e Segurança</Text>
          <Text style={styles.paragraph}>
            Seus dados são armazenados com segurança em servidores na nuvem do Google (Google Cloud), com criptografia em trânsito e em repouso. Adotamos:
          </Text>
          <Text style={styles.paragraph}>
            • Controles de acesso restrito;{'\n'}
            • Monitoramento contínuo;{'\n'}
            • Backup automático (incluso no Plano Essencial);{'\n'}
            • Procedimentos para detecção e resposta a incidentes.
          </Text>

          <Text style={styles.sectionTitle}>6. Direitos do Titular dos Dados</Text>
          <Text style={styles.paragraph}>
            Você tem o direito de:
          </Text>
          <Text style={styles.paragraph}>
            • Acessar seus dados pessoais armazenados;{'\n'}
            • Corrigir informações incorretas ou desatualizadas;{'\n'}
            • Solicitar a exclusão de seus dados ou da conta (respeitando obrigações legais);{'\n'}
            • Solicitar a portabilidade dos seus dados para outro serviço;{'\n'}
            • Revogar consentimentos concedidos;{'\n'}
            • Ser informado sobre incidentes de segurança que envolvam seus dados.
          </Text>
          <Text style={styles.paragraph}>
            Para exercer seus direitos, entre em contato pelo e-mail privacidade@aurago.site.
          </Text>

          <Text style={styles.sectionTitle}>7. Cookies e Tecnologias Semelhantes</Text>
          <Text style={styles.paragraph}>
            Utilizamos cookies e tecnologias para:
          </Text>
          <Text style={styles.paragraph}>
            • Manter sua sessão ativa;{'\n'}
            • Personalizar preferências;{'\n'}
            • Analisar uso do app (Firebase Analytics, opcional).
          </Text>
          <Text style={styles.paragraph}>
            Você pode gerenciar ou bloquear cookies nas configurações do dispositivo, mas isso pode afetar a experiência.
          </Text>

          <Text style={styles.sectionTitle}>8. Consentimento e Atualizações</Text>
          <Text style={styles.paragraph}>
            Ao utilizar o app, você consente com esta política. Caso haja atualizações relevantes, notificaremos com antecedência.
          </Text>

          <Text style={styles.sectionTitle}>9. Contato</Text>
          <Text style={styles.paragraph}>
            Dúvidas sobre esta política ou privacidade podem ser enviadas para:
          </Text>
          <Text style={styles.paragraph}>
            Suporte geral: fale.aura@aurago.site{'\n'}
            Privacidade: privacidade@aurago.site
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

PoliticaPrivacidadeScreen.displayName = 'PoliticaPrivacidadeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: hp('5%'),
  },
  content: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  title: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: hp('3%'),
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: hp('3%'),
    marginBottom: hp('1%'),
  },
  paragraph: {
    fontSize: hp('1.8%'),
    color: '#444',
    lineHeight: hp('2.5%'),
    marginBottom: hp('2%'),
    textAlign: 'justify',
  },
  finalParagraph: {
    fontSize: hp('1.8%'),
    color: '#1976d2',
    fontWeight: 'bold',
    lineHeight: hp('2.5%'),
    marginTop: hp('3%'),
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  footer: {
    marginTop: hp('4%'),
    paddingTop: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: hp('1.5%'),
    color: '#666',
    textAlign: 'center',
  },
}); 
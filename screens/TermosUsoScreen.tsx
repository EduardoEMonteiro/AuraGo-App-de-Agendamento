import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';

export const TermosUsoScreen = React.memo(() => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <CustomHeader title="Termos de Uso" showBackButton={true} />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          <Text style={styles.title}>TERMOS DE USO - AURA</Text>
          
          <Text style={styles.paragraph}>
            Última atualização: Janeiro 2025
          </Text>

          <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.paragraph}>
            Ao acessar e usar o app Aura ("plataforma"), você concorda com estes Termos de Uso e com a Política de Privacidade vigente. Se não concordar, não utilize o app.
          </Text>

          <Text style={styles.sectionTitle}>2. Uso do Aplicativo</Text>
          <Text style={styles.paragraph}>
            Você se compromete a:
          </Text>
          <Text style={styles.paragraph}>
            • Utilizar o app para fins legais e legítimos;{'\n'}
            • Fornecer informações verdadeiras e atualizadas;{'\n'}
            • Manter sigilo sobre suas credenciais de acesso;{'\n'}
            • Não tentar acessar dados ou funcionalidades de outros usuários;{'\n'}
            • Respeitar direitos de terceiros.
          </Text>

          <Text style={styles.sectionTitle}>3. Planos e Assinaturas</Text>
          <Text style={styles.paragraph}>
            Atualmente, o Aura oferece:
          </Text>
          <Text style={styles.paragraph}>
            • Plano Trial: gratuito por 30 dias, com funcionalidades completas;{'\n'}
            • Plano Essencial: R$ 19,90/mês, com limite de 1 profissional e funcionalidades avançadas.
          </Text>
          <Text style={styles.paragraph}>
            A cobrança é mensal, automática via Stripe. Cancelamentos podem ser feitos pelo app ou contato com suporte.
          </Text>

          <Text style={styles.sectionTitle}>4. Cancelamentos e Reembolsos</Text>
          <Text style={styles.paragraph}>
            Você pode cancelar a assinatura a qualquer momento. Cancelamentos podem ter efeito imediato ou no término do período pago.
          </Text>
          <Text style={styles.paragraph}>
            Política de reembolso:
          </Text>
          <Text style={styles.paragraph}>
            • Novos usuários têm direito a reembolso em até 7 dias;{'\n'}
            • Cancelamentos no meio do período terão reembolso proporcional.
          </Text>

          <Text style={styles.sectionTitle}>5. Responsabilidades</Text>
          <Text style={styles.paragraph}>
            Do Usuário:
          </Text>
          <Text style={styles.paragraph}>
            • Manter atualizadas suas informações;{'\n'}
            • Usar o app com responsabilidade;{'\n'}
            • Responder por dados de clientes inseridos no app.
          </Text>
          <Text style={styles.paragraph}>
            Da Aura:
          </Text>
          <Text style={styles.paragraph}>
            • Manter a plataforma disponível e funcional;{'\n'}
            • Proteger dados pessoais e informações;{'\n'}
            • Oferecer suporte técnico;{'\n'}
            • Notificar mudanças importantes.
          </Text>

          <Text style={styles.sectionTitle}>6. Limitações e Isenções</Text>
          <Text style={styles.paragraph}>
            A Aura não se responsabiliza por:
          </Text>
          <Text style={styles.paragraph}>
            • Danos decorrentes de uso indevido do app;{'\n'}
            • Falhas ou interrupções fora de seu controle;{'\n'}
            • Perdas de dados causadas por fatores externos.
          </Text>

          <Text style={styles.sectionTitle}>7. Propriedade Intelectual</Text>
          <Text style={styles.paragraph}>
            Todo conteúdo e software do app são propriedade da Aura e protegidos por leis de direitos autorais.
          </Text>

          <Text style={styles.sectionTitle}>8. Alterações nos Termos</Text>
          <Text style={styles.paragraph}>
            Reservamo-nos o direito de modificar estes termos, avisando previamente os usuários com pelo menos 30 dias de antecedência.
          </Text>

          <Text style={styles.sectionTitle}>9. Legislação Aplicável e Foro</Text>
          <Text style={styles.paragraph}>
            Estes termos são regidos pela legislação brasileira. Qualquer litígio será resolvido no foro da comarca do usuário.
          </Text>

          <Text style={styles.sectionTitle}>10. Contato</Text>
          <Text style={styles.paragraph}>
            Dúvidas e suporte:
          </Text>
          <Text style={styles.paragraph}>
            E-mail: fale.aura@aurago.site
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

TermosUsoScreen.displayName = 'TermosUsoScreen';

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
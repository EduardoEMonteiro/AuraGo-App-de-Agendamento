import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import * as Yup from 'yup';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

// --- LÓGICA DE VALIDAÇÃO E DADOS (INALTERADA) ---
const validationSchema = Yup.object().shape({
  nome: Yup.string().required('Nome do salão obrigatório'),
  telefone: Yup.string().required('Telefone obrigatório'),
  cep: Yup.string().required('CEP obrigatório').matches(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  logradouro: Yup.string().required('Logradouro obrigatório'),
  numero: Yup.string().required('Número obrigatório'),
  bairro: Yup.string().required('Bairro obrigatório'),
  cidade: Yup.string().required('Cidade obrigatória'),
  estado: Yup.string().required('Estado obrigatório'),
  complemento: Yup.string().optional(),
});

const horariosPadrao = {
  segunda: '08:00-18:00',
  terca: '08:00-18:00',
  quarta: '08:00-18:00',
  quinta: '08:00-18:00',
  sexta: '08:00-18:00',
  sabado: '08:00-14:00',
  domingo: 'Fechado',
};

const formasPagamentoPadrao = [
  { nome: 'Dinheiro', ativo: true, taxa: 0 },
  { nome: 'Pix', ativo: true, taxa: 0 },
  { nome: 'Débito', ativo: true, taxa: 0 },
  { nome: 'Crédito', ativo: true, taxa: 0 },
  ...Array.from({ length: 11 }, (_, i) => ({ nome: `Crédito ${i + 2}x`, ativo: true, taxa: 0 })),
];

// --- COMPONENTE DE CAMPO DE FORMULÁRIO REUTILIZÁVEL ---
// Ajuda a limpar o JSX principal e a reutilizar estilos
const FormField = ({ label, error, touched, children }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error && touched && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function CadastroSalaoScreen() {
  const { user, setUser, updateUser } = useAuthStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  const planoEscolhido = params.plano as 'essencial' | 'pro';

  // --- FUNÇÃO DE SALVAR (CORRIGIDA) ---
  async function salvarSalao(values: any, { setSubmitting }: any) {
    try {
      const salaoRef = await addDoc(collection(db, 'saloes'), {
        nome: values.nome,
        telefone: values.telefone,
        responsavel: user?.nome || user?.email || '',
        plano: null,
        mensagemWhatsapp: 'Olá! Gostaria de agendar um horário.',
        horarioFuncionamento: horariosPadrao,
        endereco: {
          cep: values.cep,
          logradouro: values.logradouro,
          numero: values.numero,
          bairro: values.bairro,
          cidade: values.cidade,
          estado: values.estado,
          complemento: values.complemento || '',
        },
      });
      
      // Criar formas de pagamento padrão
      const batch = writeBatch(db);
      const formasPagamentoRef = collection(db, 'saloes', salaoRef.id, 'formasPagamento');
      formasPagamentoPadrao.forEach(f => {
        const docRef = doc(formasPagamentoRef, f.nome);
        batch.set(docRef, f);
      });
      
      // Criar mensagens padrão do WhatsApp
      const mensagensPadrao = {
        confirmacao: 'Olá [NOME]! 😊 Seu agendamento para [SERVIÇO] com [PROFISSIONAL] está confirmado para o dia [DATA] às [HORA]. Qualquer dúvida, estamos à disposição. 💇‍♀️✨ Endereço: [ENDEREÇO]',
        lembrete: 'Oi [NOME], tudo bem? Só passando pra lembrar do seu agendamento amanhã! 📍 [SERVIÇO] com [PROFISSIONAL] 📅 Data: [DATA] ⏰ Horário: [HORA] Qualquer mudança é só nos avisar com antecedência 💖 Endereço: [ENDEREÇO]'
      };
      const mensagensRef = doc(db, 'saloes', salaoRef.id, 'configuracoes', 'mensagensWhatsapp');
      batch.set(mensagensRef, mensagensPadrao);
      
      await batch.commit();
      
      const userId = user?.id || user?.uid;
      if (userId) {
        await updateDoc(doc(db, 'usuarios', userId), { idSalao: salaoRef.id });
        console.log('Usuário atualizado no Firestore com idSalao:', salaoRef.id);
        
        // --- LINHA CRÍTICA DA CORREÇÃO ---
        // Força a atualização do estado local no Zustand
        updateUser({ idSalao: salaoRef.id });
        console.log('Estado do usuário atualizado no Zustand com idSalao:', salaoRef.id);
        
        // REMOVIDO: Navegação imperativa. O RootLayout cuidará do roteamento.
        console.log('Salão cadastrado com sucesso. RootLayout redirecionará automaticamente para seleção de planos.');
      }
      Alert.alert('Sucesso', 'Salão cadastrado com sucesso! Redirecionando para seleção de planos...');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../assets/images/logo_aura.png')} style={styles.logo} />
            <Text style={styles.title}>Cadastro do Salão</Text>
            <Text style={styles.subtitle}>Preencha as informações para começar.</Text>
          </View>

          <Formik
            initialValues={{ nome: '', telefone: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '' }}
            validationSchema={validationSchema}
            onSubmit={salvarSalao}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
              isSubmitting,
            }) => {
              const [buscandoCep, setBuscandoCep] = useState(false);

              async function buscarCep(cep: string) {
                if (!cep || cep.replace(/\D/g, '').length !== 8) return;
                setBuscandoCep(true);
                try {
                  const cepLimpo = cep.replace(/\D/g, '');
                  const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                  const data = await res.json();
                  if (data.erro) throw new Error('CEP não encontrado');
                  setFieldValue('logradouro', data.logradouro || '');
                  setFieldValue('bairro', data.bairro || '');
                  setFieldValue('cidade', data.localidade || '');
                  setFieldValue('estado', data.uf || '');
                } catch (e) {
                  Alert.alert('Erro', 'CEP não encontrado. Preencha manualmente.');
                } finally {
                  setBuscandoCep(false);
                }
              }

              useEffect(() => {
                if (values.cep) {
                  buscarCep(values.cep);
                }
              }, [values.cep]);

              const planInfoStyle =
                planoEscolhido === 'pro'
                  ? {
                      backgroundColor: '#E8F5E9',
                      borderColor: '#388E3C',
                      textColor: '#388E3C',
                      text: `Plano Pro será ativado após pagamento`,
                    }
                  : {
                      backgroundColor: '#E3F2FD',
                      borderColor: '#1976D2',
                      textColor: '#1976D2',
                      text: `Plano Essencial será ativado após pagamento`,
                    };

              return (
                <>
                  <View style={[styles.infoBox, { backgroundColor: planInfoStyle.backgroundColor, borderColor: planInfoStyle.borderColor }]}>
                    <Text style={[styles.infoBoxText, { color: planInfoStyle.textColor }]}>
                      {planoEscolhido ? planInfoStyle.text : 'Plano será ativado após confirmação do pagamento'}
                    </Text>
                  </View>

                  {/* --- SEÇÃO: DADOS DO SALÃO --- */}
                  <Text style={styles.sectionTitle}>Dados do Salão</Text>
                  <FormField label="Nome do Salão" error={errors.nome} touched={touched.nome}>
                    <TextInput
                      style={styles.input}
                      value={values.nome}
                      onChangeText={handleChange('nome')}
                      onBlur={handleBlur('nome')}
                      placeholder="Ex: Salão da Maria"
                      placeholderTextColor="#9CA3AF"
                    />
                  </FormField>
                  <FormField label="Telefone / WhatsApp" error={errors.telefone} touched={touched.telefone}>
                    <TextInputMask
                      type={'cel-phone'}
                      options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
                      style={styles.input}
                      value={values.telefone}
                      onChangeText={text => setFieldValue('telefone', text)}
                      onBlur={handleBlur('telefone')}
                      placeholder="(99) 99999-9999"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                    />
                  </FormField>

                  {/* --- SEÇÃO: ENDEREÇO --- */}
                  <Text style={styles.sectionTitle}>Endereço</Text>
                  <FormField label="CEP" error={errors.cep} touched={touched.cep}>
                    <View>
                      <TextInput
                        style={styles.input}
                        value={values.cep}
                        onChangeText={text => setFieldValue('cep', text)}
                        onBlur={handleBlur('cep')}
                        placeholder="00000-000"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={9}
                      />
                      {buscandoCep && <ActivityIndicator size="small" color="#1976D2" style={styles.cepSpinner} />}
                    </View>
                  </FormField>
                  <FormField label="Logradouro" error={errors.logradouro} touched={touched.logradouro}>
                    <TextInput
                      style={styles.input}
                      value={values.logradouro}
                      onChangeText={handleChange('logradouro')}
                      onBlur={handleBlur('logradouro')}
                      placeholder="Ex: Avenida Paulista"
                      placeholderTextColor="#9CA3AF"
                    />
                  </FormField>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <FormField label="Número" error={errors.numero} touched={touched.numero}>
                        <TextInput style={styles.input} value={values.numero} onChangeText={handleChange('numero')} onBlur={handleBlur('numero')} keyboardType="numeric" />
                      </FormField>
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 2 }}>
                      <FormField label="Complemento" error={errors.complemento} touched={touched.complemento}>
                        <TextInput style={styles.input} value={values.complemento} onChangeText={handleChange('complemento')} onBlur={handleBlur('complemento')} placeholder="Apto, bloco (opcional)" />
                      </FormField>
                    </View>
                  </View>
                  <FormField label="Bairro" error={errors.bairro} touched={touched.bairro}>
                    <TextInput style={styles.input} value={values.bairro} onChangeText={handleChange('bairro')} onBlur={handleBlur('bairro')} />
                  </FormField>
                  <View style={styles.row}>
                    <View style={{ flex: 3 }}>
                      <FormField label="Cidade" error={errors.cidade} touched={touched.cidade}>
                        <TextInput style={styles.input} value={values.cidade} onChangeText={handleChange('cidade')} onBlur={handleBlur('cidade')} />
                      </FormField>
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                      <FormField label="Estado" error={errors.estado} touched={touched.estado}>
                        <TextInput style={styles.input} value={values.estado} onChangeText={handleChange('estado')} onBlur={handleBlur('estado')} maxLength={2} autoCapitalize="characters" />
                      </FormField>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit as any}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.buttonText}>{isSubmitting ? 'Salvando...' : 'Cadastrar e Avançar'}</Text>
                  </TouchableOpacity>
                </>
              );
            }}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- FOLHA DE ESTILOS CENTRALIZADA ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Cor de fundo mais suave
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 5,
  },
  infoBoxText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
  },
  cepSpinner: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
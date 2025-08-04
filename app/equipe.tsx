import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import { db } from '../services/firebase';
import { CustomHeader } from '../components/CustomHeader';
// Remover import do ModalPadrao
// import { ModalPadrao } from '../src/components/ModalPadrao';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
export interface Convite {
  id: string;
  nome: string;
  email: string;
  funcao: 'gerente' | 'recepcionista' | 'colaborador';
  status: 'pendente' | 'ativo';
  comissao: number;
  criadoEm: Timestamp;
  userId: string | null;
}

interface EditarMembroModalProps {
  membro: Convite;
  isVisible: boolean;
  onClose: () => void;
}

const funcoes = [
  { label: 'Gerente', value: 'gerente' },
  { label: 'Recepcionista', value: 'recepcionista' },
  { label: 'Colaborador', value: 'colaborador' },
];

export default function EquipeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { salaoInfo } = useSalaoInfo();
  const idSalao = user?.idSalao;

  // Estado do formulário
  const [enviando, setEnviando] = useState(false);
  const [membros, setMembros] = useState<Convite[]>([]);
  const [modalEditar, setModalEditar] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState<Convite | null>(null);

  const insets = useSafeAreaInsets(); // <-- MOVIDO PARA CÁ

  // Listener de membros
  useEffect(() => {
    if (!idSalao) return;
    const ref = collection(db, `saloes/${idSalao}/convites`);
    const unsub = onSnapshot(ref, snap => {
      setMembros(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Convite)));
    });
    return unsub;
  }, [idSalao]);

  // Formulário de convite
  const conviteSchema = Yup.object().shape({
    nome: Yup.string().required('Nome obrigatório'),
    email: Yup.string().email('E-mail inválido').required('E-mail obrigatório'),
    funcao: Yup.string().oneOf(['gerente', 'recepcionista', 'colaborador']).required('Função obrigatória'),
  });

  async function enviarConvite(values: { nome: string; email: string; funcao: string }, actions: any) {
    if (!idSalao) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, `saloes/${idSalao}/convites`), {
        nome: values.nome,
        email: values.email.toLowerCase(),
        funcao: values.funcao,
        status: 'pendente',
        comissao: 0,
        criadoEm: Timestamp.now(),
        userId: null,
      });
      actions.resetForm();
      Alert.alert('Convite enviado!', 'O membro receberá um e-mail com as instruções.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o convite.');
    } finally {
      setEnviando(false);
    }
  }

  // Modal de edição de membro
  function abrirEditarMembro(m: Convite) {
    setMembroSelecionado(m);
    setModalEditar(true);
  }

  async function salvarEdicaoMembro(valores: { comissao: number; status: 'pendente' | 'ativo' }) {
    if (!idSalao || !membroSelecionado) return;
    await updateDoc(doc(db, `saloes/${idSalao}/convites/${membroSelecionado.id}`), valores);
    setModalEditar(false);
    setMembroSelecionado(null);
  }

  async function excluirMembro() {
    if (!idSalao || !membroSelecionado) return;
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o membro "${membroSelecionado.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, `saloes/${idSalao}/convites/${membroSelecionado.id}`));
            setModalEditar(false);
            setMembroSelecionado(null);
          },
        },
      ]
    );
  }

  // Controle de acesso e loading (após todos os hooks)
  if (!salaoInfo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }
  if (user.role !== 'gerente') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <CustomHeader title="Equipe" showBackButton={false} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, textAlign: 'center', color: '#666' }}>
            Funcionalidade exclusiva para Gerentes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}
          pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { width: 48, height: 48, borderRadius: 24 }]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Feather name="arrow-left" size={24} color="#1976d2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equipe</Text>
          <View style={{ width: 32 }} />
        </View>
        {/* Formulário de convite */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Convidar Novo Membro</Text>
          <Formik
            initialValues={{ nome: '', email: '', funcao: 'colaborador' }}
            validationSchema={conviteSchema}
            onSubmit={enviarConvite}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <>
                <TextInput
                  placeholder="Nome*"
                  value={values.nome}
                  onChangeText={handleChange('nome')}
                  onBlur={handleBlur('nome')}
                  style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}
                />
                {errors.nome && touched.nome && <Text style={{ color: '#d32f2f', marginBottom: 4 }}>{errors.nome}</Text>}
                <TextInput
                  placeholder="E-mail*"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && touched.email && <Text style={{ color: '#d32f2f', marginBottom: 4 }}>{errors.email}</Text>}
                <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={{ padding: 12 }}
                    onPress={() => setFieldValue('funcao', 'gerente')}
                  >
                    <Text style={{ color: values.funcao === 'gerente' ? '#1976d2' : '#333' }}>Gerente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 12 }}
                    onPress={() => setFieldValue('funcao', 'recepcionista')}
                  >
                    <Text style={{ color: values.funcao === 'recepcionista' ? '#1976d2' : '#333' }}>Recepcionista</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 12 }}
                    onPress={() => setFieldValue('funcao', 'colaborador')}
                  >
                    <Text style={{ color: values.funcao === 'colaborador' ? '#1976d2' : '#333' }}>Colaborador</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handleSubmit as any}
                  style={{ backgroundColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 }}
                  disabled={enviando}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Enviar Convite</Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </View>
        {/* Lista de membros */}
        <View style={{ flex: 1, backgroundColor: '#fafbfc' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, margin: 16, marginBottom: 0 }}>Membros da Equipe</Text>
          <FlatList
            data={membros}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>Nenhum membro encontrado.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/equipe-editar', params: { membro: JSON.stringify(item) } })}
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.nome}</Text>
                  <Text style={{ color: '#555', marginTop: 2 }}>{item.funcao.charAt(0).toUpperCase() + item.funcao.slice(1)}</Text>
                </View>
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: item.status === 'pendente' ? '#ffe082' : '#c8e6c9' }}>
                  <Text style={{ color: item.status === 'pendente' ? '#bfa000' : '#388e3c', fontWeight: 'bold' }}>{item.status === 'pendente' ? 'Pendente' : 'Ativo'}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        {/* Remover qualquer uso de <ModalPadrao ...> se ainda existir */}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 100,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    zIndex: 101,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: -32,
  },
}); 
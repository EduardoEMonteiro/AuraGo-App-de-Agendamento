import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';
import { CadastroModal } from '../src/components/modals/CadastroModal';

const validationSchema = Yup.object().shape({
  nome: Yup.string().required('Nome obrigatório'),
  telefone: Yup.string()
    .required('Telefone obrigatório')
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido. Use o formato (99) 99999-9999'),
  email: Yup.string().email('E-mail inválido').optional(),
  observacoes: Yup.string().optional(),
});

export default function ClientesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role;
  const idSalao = user?.idSalao;
  const podeCadastrar = role === 'gerente' || role === 'recepcionista';

  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [historicoAgendamentos, setHistoricoAgendamentos] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    if (!idSalao) return;
    const q = query(collection(db, `saloes/${idSalao}/clientes`), orderBy('nome'));
    const unsub = onSnapshot(q, (snap) => {
      setClientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [idSalao]);

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || '').replace(/\D/g, '').includes(busca.replace(/\D/g, ''))
  );

  async function cadastrarCliente(values: any, actions: any) {
    if (!idSalao) return;
    await addDoc(collection(db, `saloes/${idSalao}/clientes`), {
      ...values,
      criadoEm: new Date(),
    });
    actions.resetForm();
    setModalCadastro(false);
  }

  function abrirEdicao(cliente: any) {
    setClienteSelecionado(cliente);
    setModalEdicao(true);
  }

  async function salvarEdicao(values: any, actions: any) {
    if (!idSalao || !clienteSelecionado) return;
    await updateDoc(doc(db, `saloes/${idSalao}/clientes/${clienteSelecionado.id}`), {
      ...values,
    });
    setModalEdicao(false);
    setClienteSelecionado(null);
  }

  // Função para buscar histórico do cliente
  async function abrirHistorico(cliente: any) {
    if (!idSalao || !cliente?.id) return;
    // Busca todos os agendamentos do cliente
    const q = query(collection(db, `saloes/${idSalao}/agendamentos`));
    const snap = await getDocs(q);
    const ags = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Filtra só os do cliente (campo correto: clienteId)
    const agsCliente = ags.filter((a: any) => a.clienteId === cliente.id);
    setHistoricoAgendamentos(agsCliente);
    setModalHistorico(true);
  }

  // Função de exclusão segura
  async function deletarCliente() {
    if (!idSalao || !clienteSelecionado) return;
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o cliente "${clienteSelecionado.nome}"? Todos os agendamentos e histórico relacionados podem ser afetados.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `saloes/${idSalao}/clientes/${clienteSelecionado.id}`));
              setModalEdicao(false);
              Alert.alert('Sucesso', 'Cliente excluído.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o cliente.');
            }
          }
        }
      ]
    );
  }

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={{ height: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#fff' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' }}>
          <TouchableOpacity
            onPress={() => router.replace('/cadastros')}
            style={{ position: 'absolute', left: 0, padding: 12, zIndex: 2 }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Feather name="arrow-left" size={24} color="#1976d2" />
          </TouchableOpacity>
          <Text style={[styles.title, { textAlign: 'center', flex: 1 }]}>Clientes</Text>
        </View>
      </SafeAreaView>
      <View style={styles.container}>
        <TextInput
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChangeText={setBusca}
          style={styles.input}
        />
        <FlatList
          data={clientesFiltrados}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => abrirEdicao(item)}>
              <Text style={styles.nome}>{item.nome}</Text>
              {item.telefone ? <Text style={styles.telefone}>{item.telefone}</Text> : null}
              {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 24, textAlign: 'center' }}>Nenhum cliente encontrado.</Text>}
          style={{ marginTop: 8 }}
        />
        {/* Modal Cadastro */}
        <Formik
          initialValues={{ nome: '', telefone: '', email: '', observacoes: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, actions) => {
            await cadastrarCliente(values, actions);
            Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue, isValid, dirty }) => (
            <CadastroModal
              isVisible={modalCadastro}
              onClose={() => setModalCadastro(false)}
              title="Novo Cliente"
              onSave={handleSubmit as any}
              isSaveDisabled={!(isValid && dirty)}
            >
              <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do cliente</Text>
              <TextInput
                placeholder="Nome*"
                value={values.nome || ''}
                onChangeText={handleChange('nome')}
                onBlur={handleBlur('nome')}
                style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
              />
              {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
              <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Telefone</Text>
              <TextInputMask
                type={'cel-phone'}
                options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
                value={values.telefone || ''}
                onChangeText={text => setFieldValue('telefone', text)}
                onBlur={handleBlur('telefone')}
                style={[styles.input, errors.telefone && touched.telefone ? { borderColor: 'red', borderWidth: 1 } : {}]}
                placeholder="Telefone*"
                keyboardType="phone-pad"
              />
              {errors.telefone && touched.telefone && typeof errors.telefone === 'string' && <Text style={styles.error}>{errors.telefone}</Text>}
              <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>E-mail</Text>
              <TextInput
                placeholder="E-mail (opcional)"
                value={values.email || ''}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                style={[styles.input, errors.email && touched.email ? { borderColor: 'red', borderWidth: 1 } : {}]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && touched.email && typeof errors.email === 'string' && <Text style={styles.error}>{errors.email}</Text>}
              <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Observações</Text>
              <TextInput
                placeholder="Observações (opcional)"
                value={values.observacoes || ''}
                onChangeText={handleChange('observacoes')}
                onBlur={handleBlur('observacoes')}
                style={[styles.input, errors.observacoes && touched.observacoes ? { borderColor: 'red', borderWidth: 1 } : {}]}
                multiline
                numberOfLines={3}
              />
              {errors.observacoes && touched.observacoes && typeof errors.observacoes === 'string' && <Text style={styles.error}>{errors.observacoes}</Text>}
            </CadastroModal>
          )}
        </Formik>
        {/* Modal Edição */}
        {clienteSelecionado && (
          <Formik
            initialValues={{
              nome: clienteSelecionado?.nome || '',
              telefone: clienteSelecionado?.telefone || '',
              email: clienteSelecionado?.email || '',
              observacoes: clienteSelecionado?.observacoes || '',
              // ...outros campos se houver
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, actions) => {
              await salvarEdicao(values, actions);
              Alert.alert('Sucesso', 'Cliente editado com sucesso!');
            }}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, values = {}, errors = {}, touched = {}, isValid, dirty, setFieldValue }) => (
              <CadastroModal
                isVisible={modalEdicao}
                onClose={() => setModalEdicao(false)}
                title={`Editando Cliente: ${clienteSelecionado?.nome}`}
                onSave={handleSubmit}
                isSaveDisabled={!(isValid && dirty)}
              >
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do cliente</Text>
                <TextInput
                  placeholder="Nome*"
                  value={values.nome || ''}
                  onChangeText={handleChange('nome')}
                  onBlur={handleBlur('nome')}
                  style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
                />
                {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Telefone</Text>
                <TextInputMask
                  type={'cel-phone'}
                  options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
                  value={values.telefone || ''}
                  onChangeText={text => setFieldValue('telefone', text)}
                  onBlur={handleBlur('telefone')}
                  style={[styles.input, errors.telefone && touched.telefone ? { borderColor: 'red', borderWidth: 1 } : {}]}
                  placeholder="Telefone*"
                  keyboardType="phone-pad"
                />
                {errors.telefone && touched.telefone && typeof errors.telefone === 'string' && <Text style={styles.error}>{errors.telefone}</Text>}
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>E-mail</Text>
                <TextInput
                  placeholder="E-mail (opcional)"
                  value={values.email || ''}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  style={[styles.input, errors.email && touched.email ? { borderColor: 'red', borderWidth: 1 } : {}]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && touched.email && typeof errors.email === 'string' && <Text style={styles.error}>{errors.email}</Text>}
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Observações</Text>
                <TextInput
                  placeholder="Observações (opcional)"
                  value={values.observacoes || ''}
                  onChangeText={handleChange('observacoes')}
                  onBlur={handleBlur('observacoes')}
                  style={[styles.input, errors.observacoes && touched.observacoes ? { borderColor: 'red', borderWidth: 1 } : {}]}
                  multiline
                  numberOfLines={3}
                />
                {errors.observacoes && touched.observacoes && typeof errors.observacoes === 'string' && <Text style={styles.error}>{errors.observacoes}</Text>}
                {/* Botão Histórico */}
                <TouchableOpacity onPress={() => abrirHistorico(clienteSelecionado)} style={{ marginTop: 16, backgroundColor: '#1976d2', borderRadius: 8, padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Histórico do Cliente</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deletarCliente} style={{ marginTop: 24 }}>
                  <Text style={styles.deleteButtonText}>Excluir Cliente</Text>
                </TouchableOpacity>
              </CadastroModal>
            )}
          </Formik>
        )}
        {/* Modal Histórico do Cliente */}
        <Modal visible={modalHistorico} animationType="slide" onRequestClose={() => setModalHistorico(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <TouchableOpacity onPress={() => setModalHistorico(false)} style={{ marginRight: 16 }}>
                <Feather name="arrow-left" size={24} color="#1976d2" />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Histórico do Cliente</Text>
            </View>
            <FlatList
              data={historicoAgendamentos}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>Nenhum agendamento encontrado.</Text>}
              renderItem={({ item }) => {
                // Data formatada
                const dataFormatada = item.data
                  ? new Date(item.data).toLocaleDateString('pt-BR')
                  : '-';
                // Valor pago: apenas finalPrice
                const valorPago = item.finalPrice ?? null;
                return (
                  <View style={{ backgroundColor: '#f7f7f7', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.servicoNome || 'Serviço'}</Text>
                    <Text style={{ color: '#555', marginTop: 2 }}>Data: {dataFormatada}</Text>
                    <Text style={{ color: '#555', marginTop: 2 }}>Valor pago: {valorPago !== null ? `R$ ${Number(valorPago).toFixed(2)}` : '-'}</Text>
                    <Text style={{ color: '#555', marginTop: 2 }}>Status: {item.status === 'no-show' ? 'No-show' : item.status === 'cancelado' ? 'Cancelado' : item.status === 'paid' || item.status === 'completed' ? 'Pago' : item.status}</Text>
                  </View>
                );
              }}
            />
          </SafeAreaView>
        </Modal>
        {/* FAB para adicionar cliente */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 32,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#1976d2',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
          onPress={() => setModalCadastro(true)}
        >
          <Feather name="plus" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

function formatarData(data: any) {
  if (!data) return '-';
  try {
    const d = data instanceof Date ? data : data.toDate ? data.toDate() : new Date(data);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
  } catch {
    return '-';
  }
}

function formatarDataSimples(data: any) {
  if (!data) return '-';
  try {
    const d = data instanceof Date ? data : data.toDate ? data.toDate() : new Date(data);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, flex: 1 },
  addBtn: { backgroundColor: '#1976d2', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: -2 },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: Spacing.buttonRadius,
    padding: Spacing.base * 2,
    ...Typography.Body,
    color: Colors.textPrimary,
    marginBottom: Spacing.base * 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    color: Colors.error,
    marginBottom: Spacing.base * 1.5,
    marginTop: -Spacing.base,
    marginLeft: Spacing.base,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.base * 2,
    borderRadius: Spacing.buttonRadius,
    alignItems: 'center',
    marginTop: Spacing.base * 2,
  },
  saveButtonText: {
    ...Typography.Button,
    color: Colors.background,
  },
  item: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 8, elevation: 1 },
  nome: { fontSize: 18, fontWeight: 'bold' },
  telefone: { fontSize: 16, color: '#555' },
  email: { fontSize: 15, color: '#888' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    width: '90%', 
    maxHeight: '80%', // Added maxHeight for ScrollView
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#888',
  },
  modalContent: {
    marginBottom: Spacing.base * 2, // Added margin bottom for footer
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.base * 2,
  },
  agendamento: { backgroundColor: '#f1f1f1', borderRadius: 8, padding: 10, marginBottom: 8 },
  agendamentoData: { fontWeight: 'bold', fontSize: 15 },
  agendamentoServico: { fontSize: 15 },
  agendamentoProfissional: { fontSize: 15, color: '#1976d2' },
  agendamentoValor: { fontSize: 15, color: '#388e3c' },
  agendamentoStatus: { fontSize: 15, color: '#888' },
  noShow: { borderColor: '#d32f2f', borderWidth: 2, backgroundColor: '#ffeaea' },
  deleteButtonText: {
    color: Colors.error,
    textAlign: 'center',
    padding: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
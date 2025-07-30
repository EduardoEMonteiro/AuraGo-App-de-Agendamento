import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Formik } from 'formik';
import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';
import { CustomHeader } from '../components/CustomHeader';
import { Colors } from '../constants/DesignSystem';
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

export const ClientesScreen = memo(() => {
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

  const cadastrarCliente = useCallback(async (values: any, actions: any) => {
    if (!idSalao) return;
    await addDoc(collection(db, `saloes/${idSalao}/clientes`), {
      ...values,
      criadoEm: new Date(),
    });
    actions.resetForm();
    setModalCadastro(false);
  }, [idSalao]);

  const abrirEdicao = useCallback((cliente: any) => {
    setClienteSelecionado(cliente);
    setModalEdicao(true);
  }, []);

  const salvarEdicao = useCallback(async (values: any, actions: any) => {
    if (!idSalao || !clienteSelecionado) return;
    await updateDoc(doc(db, `saloes/${idSalao}/clientes/${clienteSelecionado.id}`), {
      ...values,
    });
    setModalEdicao(false);
    setClienteSelecionado(null);
  }, [idSalao, clienteSelecionado]);

  // Função para buscar histórico do cliente
  const abrirHistorico = useCallback(async (cliente: any) => {
    if (!idSalao || !cliente?.id) return;
    // Busca todos os agendamentos do cliente
    const q = query(collection(db, `saloes/${idSalao}/agendamentos`));
    const snap = await getDocs(q);
    const ags = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Filtra só os do cliente (campo correto: clienteId)
    const agsCliente = ags.filter((a: any) => a.clienteId === cliente.id);
    setHistoricoAgendamentos(agsCliente);
    setModalHistorico(true);
  }, [idSalao]);

  // Função de exclusão segura
  const deletarCliente = useCallback(async () => {
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
  }, [idSalao, clienteSelecionado]);

  const handleBackPress = useCallback(() => {
    router.replace('/cadastros');
  }, [router]);

  const handleModalCadastroClose = useCallback(() => {
    setModalCadastro(false);
  }, []);

  const handleModalEdicaoClose = useCallback(() => {
    setModalEdicao(false);
  }, []);

  const handleModalHistoricoClose = useCallback(() => {
    setModalHistorico(false);
  }, []);

  const handleFabPress = useCallback(() => {
    setModalCadastro(true);
  }, []);

  const renderCliente = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={styles.item} onPress={() => abrirEdicao(item)}>
      <Text style={styles.nome}>{item.nome}</Text>
      {item.telefone ? <Text style={styles.telefone}>{item.telefone}</Text> : null}
      {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
    </TouchableOpacity>
  ), [abrirEdicao]);

  const renderHistoricoItem = useCallback(({ item }: { item: any }) => {
    // Data formatada
    const dataFormatada = item.data
      ? new Date(item.data).toLocaleDateString('pt-BR')
      : '-';
    // Valor pago: apenas finalPrice
    const valorPago = item.finalPrice ?? null;
    return (
      <View style={styles.historicoItem}>
        <Text style={styles.historicoServico}>{item.servicoNome || 'Serviço'}</Text>
        <Text style={styles.historicoData}>Data: {dataFormatada}</Text>
        <Text style={styles.historicoValor}>Valor pago: {valorPago !== null ? `R$ ${Number(valorPago).toFixed(2)}` : '-'}</Text>
        <Text style={styles.historicoStatus}>Status: {item.status === 'no-show' ? 'No-show' : item.status === 'cancelado' ? 'Cancelado' : item.status === 'paid' || item.status === 'completed' ? 'Pago' : item.status}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <CustomHeader title="Clientes" showBackButton={true} />

      <View style={styles.content}>
        <TextInput
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChangeText={setBusca}
          style={styles.searchInput}
        />
        <FlatList
          data={clientesFiltrados}
          keyExtractor={keyExtractor}
          renderItem={renderCliente}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
              onClose={handleModalCadastroClose}
              title="Novo Cliente"
              onSave={handleSubmit as any}
              isSaveDisabled={!(isValid && dirty)}
            >
              <Text style={styles.fieldLabel}>Nome do cliente</Text>
              <TextInput
                placeholder="Nome*"
                value={values.nome || ''}
                onChangeText={handleChange('nome')}
                onBlur={handleBlur('nome')}
                style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
              />
              {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
              <Text style={styles.fieldLabel}>Telefone</Text>
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
              <Text style={styles.fieldLabel}>E-mail</Text>
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
              <Text style={styles.fieldLabel}>Observações</Text>
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
                onClose={handleModalEdicaoClose}
                title={`Editando Cliente: ${clienteSelecionado?.nome}`}
                onSave={handleSubmit}
                isSaveDisabled={!(isValid && dirty)}
              >
                <Text style={styles.fieldLabel}>Nome do cliente</Text>
                <TextInput
                  placeholder="Nome*"
                  value={values.nome || ''}
                  onChangeText={handleChange('nome')}
                  onBlur={handleBlur('nome')}
                  style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
                />
                {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
                <Text style={styles.fieldLabel}>Telefone</Text>
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
                <Text style={styles.fieldLabel}>E-mail</Text>
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
                <Text style={styles.fieldLabel}>Observações</Text>
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
                <TouchableOpacity onPress={() => abrirHistorico(clienteSelecionado)} style={styles.historicoButton}>
                  <Text style={styles.historicoButtonText}>Histórico do Cliente</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deletarCliente} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Excluir Cliente</Text>
                </TouchableOpacity>
              </CadastroModal>
            )}
          </Formik>
        )}

        {/* Modal Histórico do Cliente */}
        <Modal visible={modalHistorico} animationType="slide" onRequestClose={handleModalHistoricoClose}>
          <SafeAreaView style={styles.historicoContainer}>
            <View style={styles.historicoHeader}>
              <TouchableOpacity onPress={handleModalHistoricoClose} style={styles.historicoBackButton}>
                <Feather name="arrow-left" size={hp('3%')} color="#1976d2" />
              </TouchableOpacity>
              <Text style={styles.historicoTitle}>Histórico do Cliente</Text>
            </View>
            <FlatList
              data={historicoAgendamentos}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.historicoListContent}
              ListEmptyComponent={<Text style={styles.historicoEmptyText}>Nenhum agendamento encontrado.</Text>}
              renderItem={renderHistoricoItem}
              showsVerticalScrollIndicator={false}
            />
          </SafeAreaView>
        </Modal>

        {/* FAB para adicionar cliente */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
        >
          <Feather name="plus" size={hp('4%')} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

ClientesScreen.displayName = 'ClientesScreen';

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
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? hp('2%') : hp('1%'),
    paddingBottom: hp('1%'),
    paddingHorizontal: wp('4%'),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: wp('3%'),
  },
  title: {
    fontSize: hp('2.75%'),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: wp('4%'),
  },
  searchInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    fontSize: hp('2%'),
    color: '#333',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyText: {
    marginTop: hp('5%'),
    textAlign: 'center',
    color: '#888',
    fontSize: hp('2%'),
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: hp('10%'), // Add padding for FAB
  },
  item: {
    backgroundColor: '#f9f9f9',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('1%'),
    elevation: 1,
  },
  nome: {
    fontSize: hp('2.25%'),
    fontWeight: 'bold',
  },
  telefone: {
    fontSize: hp('2%'),
    color: '#555',
  },
  email: {
    fontSize: hp('1.875%'),
    color: '#888',
  },
  fieldLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.5%'),
    fontSize: hp('1.75%'),
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    fontSize: hp('2%'),
    color: '#333',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    color: Colors.error,
    marginBottom: hp('1.5%'),
    marginTop: hp('-1%'),
    marginLeft: wp('2%'),
    fontSize: hp('1.5%'),
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: wp('4%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  saveButtonText: {
    fontSize: hp('2%'),
    fontWeight: '600',
    color: Colors.background,
  },
  modalBg: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalBox: { 
    backgroundColor: '#fff', 
    borderRadius: wp('3%'), 
    padding: wp('5%'), 
    width: '90%', 
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  modalTitle: {
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#888',
  },
  modalContent: {
    marginBottom: hp('2%'),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp('2%'),
  },
  agendamento: { 
    backgroundColor: '#f1f1f1', 
    borderRadius: wp('2%'), 
    padding: wp('2.5%'), 
    marginBottom: hp('1%') 
  },
  agendamentoData: { 
    fontWeight: 'bold', 
    fontSize: hp('1.875%') 
  },
  agendamentoServico: { 
    fontSize: hp('1.875%') 
  },
  agendamentoProfissional: { 
    fontSize: hp('1.875%'), 
    color: '#1976d2' 
  },
  agendamentoValor: { 
    fontSize: hp('1.875%'), 
    color: '#388e3c' 
  },
  agendamentoStatus: { 
    fontSize: hp('1.875%'), 
    color: '#888' 
  },
  noShow: { 
    borderColor: '#d32f2f', 
    borderWidth: 2, 
    backgroundColor: '#ffeaea' 
  },
  deleteButtonText: {
    color: Colors.error,
    textAlign: 'center',
    padding: wp('2%'),
    fontSize: hp('2%'),
    fontWeight: 'bold',
  },
  historicoItem: {
    backgroundColor: '#f7f7f7',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  historicoServico: {
    fontWeight: 'bold',
    fontSize: hp('2%'),
  },
  historicoData: {
    color: '#555',
    marginTop: hp('0.25%'),
    fontSize: hp('1.75%'),
  },
  historicoValor: {
    color: '#388e3c',
    marginTop: hp('0.25%'),
    fontSize: hp('1.75%'),
  },
  historicoStatus: {
    color: '#888',
    marginTop: hp('0.25%'),
    fontSize: hp('1.75%'),
  },
  historicoButton: {
    marginTop: hp('2%'),
    backgroundColor: '#1976d2',
    borderRadius: wp('2%'),
    padding: hp('1.5%'),
    alignItems: 'center',
  },
  historicoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: hp('2%'),
  },
  deleteButton: {
    marginTop: hp('3%'),
  },
  historicoContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historicoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historicoBackButton: {
    marginRight: wp('4%'),
  },
  historicoTitle: {
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
  },
  historicoListContent: {
    padding: wp('4%'),
  },
  historicoEmptyText: {
    textAlign: 'center',
    marginTop: hp('4%'),
    fontSize: hp('2%'),
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: hp('4%'),
    right: wp('6%'),
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
}); 
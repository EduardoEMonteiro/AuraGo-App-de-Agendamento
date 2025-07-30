import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';
import { CustomHeader } from '../components/CustomHeader';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import { db } from '../services/firebase';
import { ColorPickerModal } from '../src/components/ColorPickerModal';
import { ColorSelector } from '../src/components/ColorSelector';
import { CadastroModal } from '../src/components/modals/CadastroModal';

const validationSchema = Yup.object().shape({
  nome: Yup.string().required('Nome obrigatório'),
  valor: Yup.number().typeError('Valor inválido').required('Valor obrigatório'),
  duracao: Yup.number().typeError('Duração inválida').required('Duração obrigatória'),
  // Se houver campo de comissão, descomente a linha abaixo:
  // comissao: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').typeError('Comissão inválida').optional(),
});

export default function ServicosScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { salaoInfo, canAddMoreServicos, getLimitMessageFor } = useSalaoInfo();
  const role = user?.role;
  const idSalao = user?.idSalao;
  const podeEditar = role === 'gerente' || role === 'recepcionista';

  // Inicialização segura dos estados
  const [servicos, setServicos] = useState<any[]>([]); // sempre array
  const [busca, setBusca] = useState('');
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<any>(null); // sempre null ou objeto
  const [modalCorVisivel, setModalCorVisivel] = useState(false);
  // Inicializa com uma cor padrão GARANTIDA. Nunca vai ser undefined.
  const [corSugerida, setCorSugerida] = useState('#1976d2');

  // Substituir CORES por PALETA_CORES
  const PALETA_CORES = [
    '#d32f2f', '#c2185b', '#7b1fa2', '#512da8', '#303f9f', '#1976d2', 
    '#0288d1', '#0097a7', '#00796b', '#388e3c', '#689f38', '#afb42b', 
    '#fbc02d', '#ffa000', '#f57c00', '#e64a19', '#5d4037', '#616161'
  ];

  /**
   * Sugere a próxima cor disponível que não está na lista de serviços.
   * @param {Array} servicosCadastrados - A lista de serviços existentes.
   * @param {Array} paleta - A paleta de cores completa.
   * @returns {string} A primeira cor disponível ou a primeira cor da paleta se todas estiverem em uso.
   */
  function sugerirProximaCorDisponivel(servicosCadastrados: any, paleta: string[]) {
    // GARANTIA 1: Verifica se a paleta é válida.
    if (!Array.isArray(paleta) || paleta.length === 0) {
      console.error("sugerirProximaCorDisponivel: A paleta de cores é inválida!");
      return '#1976d2'; // Retorna um fallback super seguro.
    }
    // GARANTIA 2: Garante que 'servicosCadastrados' seja um array.
    const servicosValidos = Array.isArray(servicosCadastrados) ? servicosCadastrados : [];
    const coresEmUso = new Set(servicosValidos.map((s: any) => s.cor));
    const corDisponivel = paleta.find(cor => !coresEmUso.has(cor));
    // Retorna a cor encontrada ou a primeira cor da paleta como fallback
    return corDisponivel || paleta[0];
  }

  useEffect(() => {
    if (!idSalao) return;
    const q = query(collection(db, `saloes/${idSalao}/servicos`), orderBy('nome'));
    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServicos(dados);
    });
    return unsub;
  }, [idSalao]);

  useEffect(() => {
    if (modalCadastro) {
      const proximaCor = sugerirProximaCorDisponivel(servicos || [], PALETA_CORES);
      setCorSugerida(proximaCor);
    }
  }, [modalCadastro, servicos]);

  // Proteção ao filtrar serviços
  const servicosFiltrados = (servicos || [])
    .filter(s => s.nome?.toLowerCase().includes(busca.toLowerCase()));

  async function cadastrarServico(values: any, actions: any) {
    if (!idSalao) return;
    
    // Verifica se pode adicionar mais serviços
    if (!canAddMoreServicos(servicos.length)) {
      Alert.alert('Limite Atingido', getLimitMessageFor('servicos'));
      actions.setSubmitting(false);
      return;
    }

    await addDoc(collection(db, `saloes/${idSalao}/servicos`), {
      nome: values.nome,
      valor: Number(values.valor), // Converte para número
      duracao: Number(values.duracao), // Converte para número
      cor: values.cor,
      ativo: true,
      criadoEm: new Date(),
    });
    actions.resetForm();
    setModalCadastro(false);
  }

  function abrirEdicao(servico: any) {
    setServicoSelecionado(servico);
    setModalEdicao(true);
  }

  async function salvarEdicao(values: any, actions: any) {
    if (!idSalao || !servicoSelecionado) return;
    await updateDoc(doc(db, `saloes/${idSalao}/servicos/${servicoSelecionado.id}`), {
      nome: values.nome,
      valor: Number(values.valor), // Converte para número
      duracao: Number(values.duracao), // Converte para número
      cor: values.cor,
      ativo: values.ativo, // Adicionado!
    });
    setModalEdicao(false);
    setServicoSelecionado(null);
  }

  async function toggleAtivo(servico: any) {
    if (!idSalao) return;
    await updateDoc(doc(db, `saloes/${idSalao}/servicos/${servico.id}`), {
      ativo: !servico.ativo,
    });
  }

  async function deletarServico() {
    if (!idSalao || !servicoSelecionado) return;
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o serviço "${servicoSelecionado.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `saloes/${idSalao}/servicos/${servicoSelecionado.id}`));
              setModalEdicao(false);
              Alert.alert('Sucesso', 'Serviço excluído.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o serviço.');
            }
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="Serviços"
        showBackButton={true}
      />
      
      <View style={styles.content}>
        <TextInput
          placeholder="Buscar por nome"
          value={busca}
          onChangeText={setBusca}
          style={styles.input}
        />
        <FlatList
          data={servicosFiltrados}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => podeEditar && abrirEdicao(item)}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{
                  ...styles.nome,
                  color: item.ativo === false ? '#d32f2f' : '#000000',
                  fontWeight: item.ativo === false ? 'bold' : 'bold',
                  opacity: item.ativo === false ? 0.6 : 1,
                }}>
                  {item.nome} {item.ativo === false && '(Inativo)'}
                </Text>
                <Text style={styles.valor}>R$ {item.valor ? Number(item.valor).toFixed(2) : '0,00'}</Text>
              </View>
              {podeEditar && (
                <View style={{ alignItems: 'center', marginLeft: 12 }}>
                  <Text style={{ fontSize: 13, color: item.ativo ? '#388e3c' : '#d32f2f', marginBottom: 2 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                  <Switch value={item.ativo !== false} onValueChange={() => toggleAtivo(item)} />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 24, textAlign: 'center' }}>Nenhum serviço encontrado.</Text>}
          style={{ marginTop: 8 }}
        />
        {/* Modal Cadastro */}
        <Formik
          initialValues={{
            nome: '',
            valor: '',
            duracao: '',
            // 1. Tenta corSugerida. 2. Se falhar, tenta a 1ª da paleta. 3. Se tudo falhar, usa um valor fixo.
            cor: corSugerida || (PALETA_CORES && PALETA_CORES[0]) || '#1976d2',
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, actions) => {
            await cadastrarServico(values, actions);
            Alert.alert('Sucesso', 'Serviço cadastrado com sucesso!');
          }}
          enableReinitialize
        >
          {({ handleChange, handleBlur, handleSubmit, values = {}, errors = {}, touched = {}, isValid, dirty, setFieldValue }) => (
            <>
              <CadastroModal
                isVisible={modalCadastro}
                onClose={() => setModalCadastro(false)}
                title="Novo Serviço"
                onSave={handleSubmit}
                isSaveDisabled={!(isValid && dirty)}
              >
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do serviço</Text>
                <TextInput
                  placeholder="Nome do serviço*"
                  value={values.nome || ''}
                  onChangeText={handleChange('nome')}
                  onBlur={handleBlur('nome')}
                  style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
                />
                {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Valor (R$)</Text>
                <TextInput
                  placeholder="Valor (R$)*"
                  value={values.valor?.toString() || ''}
                  onChangeText={handleChange('valor')}
                  onBlur={handleBlur('valor')}
                  style={[styles.input, errors.valor && touched.valor ? { borderColor: 'red', borderWidth: 1 } : {}]}
                  keyboardType="numeric"
                />
                {errors.valor && touched.valor && typeof errors.valor === 'string' && <Text style={styles.error}>{errors.valor}</Text>}
                <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Duração (minutos)</Text>
                <TextInput
                  placeholder="Duração (min)*"
                  value={values.duracao?.toString() || ''}
                  onChangeText={handleChange('duracao')}
                  onBlur={handleBlur('duracao')}
                  style={[styles.input, errors.duracao && touched.duracao ? { borderColor: 'red', borderWidth: 1 } : {}]}
                  keyboardType="numeric"
                />
                {errors.duracao && touched.duracao && typeof errors.duracao === 'string' && <Text style={styles.error}>{errors.duracao}</Text>}
                <ColorSelector
                  label="Cor do Serviço"
                  selectedColor={values.cor || corSugerida || PALETA_CORES[0]}
                  onPress={() => setModalCorVisivel(true)}
                />
              </CadastroModal>
              <ColorPickerModal
                isVisible={modalCorVisivel}
                onClose={() => setModalCorVisivel(false)}
                colors={PALETA_CORES}
                selectedColor={values.cor || corSugerida || PALETA_CORES[0]}
                onSelect={(cor: string) => setFieldValue('cor', cor)}
              />
            </>
          )}
        </Formik>
        {/* Modal Edição */}
        {servicoSelecionado && (
          <Formik
            initialValues={{
              nome: servicoSelecionado?.nome || '',
              valor: servicoSelecionado?.valor?.toString() || '',
              duracao: servicoSelecionado?.duracao?.toString() || '',
              cor: servicoSelecionado?.cor || PALETA_CORES[0],
              ativo: servicoSelecionado?.ativo !== false,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, actions) => {
              await salvarEdicao(values, actions);
              Alert.alert('Sucesso', 'Serviço editado com sucesso!');
            }}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, values = {}, errors = {}, touched = {}, isValid, dirty, setFieldValue }) => (
              <>
                <CadastroModal
                  isVisible={modalEdicao}
                  onClose={() => setModalEdicao(false)}
                  title={`Editando: ${servicoSelecionado?.nome || ''}`}
                  onSave={handleSubmit as any}
                  isSaveDisabled={!dirty}
                >
                  <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do serviço</Text>
                  <TextInput
                    placeholder="Nome do serviço*"
                    value={values.nome || ''}
                    onChangeText={handleChange('nome')}
                    onBlur={handleBlur('nome')}
                    style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
                  />
                  {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
                  <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Valor (R$)</Text>
                  <TextInput
                    placeholder="Valor (R$)*"
                    value={values.valor?.toString() || ''}
                    onChangeText={handleChange('valor')}
                    onBlur={handleBlur('valor')}
                    style={[styles.input, errors.valor && touched.valor ? { borderColor: 'red', borderWidth: 1 } : {}]}
                    keyboardType="numeric"
                  />
                  {errors.valor && touched.valor && typeof errors.valor === 'string' && <Text style={styles.error}>{errors.valor}</Text>}
                  <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Duração (minutos)</Text>
                  <TextInput
                    placeholder="Duração (min)*"
                    value={values.duracao?.toString() || ''}
                    onChangeText={handleChange('duracao')}
                    onBlur={handleBlur('duracao')}
                    style={[styles.input, errors.duracao && touched.duracao ? { borderColor: 'red', borderWidth: 1 } : {}]}
                    keyboardType="numeric"
                  />
                  {errors.duracao && touched.duracao && typeof errors.duracao === 'string' && <Text style={styles.error}>{errors.duracao}</Text>}
                  {/* Controle de status centralizado */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F0F0', padding: 16, borderRadius: 8, marginBottom: 16, marginTop: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>Serviço Ativo</Text>
                    <Switch
                      value={values.ativo}
                      onValueChange={(value: boolean) => setFieldValue('ativo', value)}
                      trackColor={{ false: "#ccc", true: "#81b0ff" }}
                      thumbColor={values.ativo ? "#1976d2" : "#f4f3f4"}
                    />
                  </View>
                  <ColorSelector
                    label="Cor do Serviço"
                    selectedColor={values.cor || PALETA_CORES[0]}
                    onPress={() => setModalCorVisivel(true)}
                  />
                  {/* Botão de exclusão */}
                  <TouchableOpacity onPress={deletarServico} style={{ marginTop: 24 }}>
                    <Text style={styles.deleteButtonText}>Excluir Serviço</Text>
                  </TouchableOpacity>
                </CadastroModal>
                <ColorPickerModal
                  isVisible={modalCorVisivel}
                  onClose={() => setModalCorVisivel(false)}
                  colors={PALETA_CORES}
                  selectedColor={values.cor || PALETA_CORES[0]}
                  onSelect={(cor: string) => setFieldValue('cor', cor)}
                />
              </>
            )}
          </Formik>
        )}
        {/* FAB para adicionar serviço */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 16,
  },
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

  item: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 8, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  nome: { fontSize: 18, fontWeight: 'bold' },
  valor: { fontSize: 16, color: '#555' },
  duracao: { fontSize: 15, color: '#888' },
  addBtnDisabled: {
    backgroundColor: '#ccc',
  },
  addBtnTextDisabled: {
    color: '#999',
  },
  planoInfo: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  planoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: Colors.error,
    textAlign: 'center',
    padding: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
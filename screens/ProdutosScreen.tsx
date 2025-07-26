import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';
import { Colors, Spacing, Typography } from '../constants/DesignSystem';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';
import { CadastroModal } from '../src/components/modals/CadastroModal';

const validationSchema = Yup.object().shape({
  nome: Yup.string().required('Nome obrigatório'),
  precoCompra: Yup.number().typeError('Preço inválido').required('Preço de compra obrigatório'),
  precoVenda: Yup.number().typeError('Preço inválido').required('Preço de venda obrigatório'),
});

export default function ProdutosScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role;
  const idSalao = user?.idSalao;
  const podeEditar = role === 'gerente' || role === 'recepcionista';

  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!idSalao) return;
    const q = query(collection(db, `saloes/${idSalao}/produtos`), orderBy('nome'));
    const unsub = onSnapshot(q, (snap) => {
      setProdutos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [idSalao]);

  // Só mostra produtos ativos
  const produtosFiltrados = produtos
    .filter(p => p.ativo !== false)
    .filter(p => p.nome?.toLowerCase().includes(busca.toLowerCase()));

  // Ao vender um produto, o valor de venda vai para a receita e o valor de compra será lançado como despesa (implementar no fluxo de venda)
  async function cadastrarProduto(values: any, actions: any) {
    if (!idSalao) return;
    const { nome, precoCompra, precoVenda } = values;
    await addDoc(collection(db, `saloes/${idSalao}/produtos`), {
      nome,
      precoCompra,
      precoVenda,
      ativo: true,
      criadoEm: new Date(),
    });
    actions.resetForm();
    setModalCadastro(false);
  }

  function abrirEdicao(produto: any) {
    setProdutoSelecionado(produto);
    setModalEdicao(true);
  }

  async function abrirHistorico(produto: any) {
    setProdutoSelecionado(produto);
    setModalHistorico(true);
    setLoadingHistorico(true);
    if (!idSalao || !produto) return;
    const movsSnap = await getDocs(collection(db, `saloes/${idSalao}/produtos/${produto.id}/movimentacoes`));
    const movs: any[] = [];
    movsSnap.forEach(docMov => movs.push({ id: docMov.id, ...docMov.data() }));
    movs.sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
    setMovimentacoes(movs);
    setLoadingHistorico(false);
  }

  async function salvarEdicao(values: any, actions: any) {
    if (!idSalao || !produtoSelecionado) return;
    await updateDoc(doc(db, `saloes/${idSalao}/produtos/${produtoSelecionado.id}`), {
      ...values,
    });
    setModalEdicao(false);
    setProdutoSelecionado(null);
  }

  // Função de exclusão segura
  async function deletarProduto() {
    if (!idSalao || !produtoSelecionado) return;
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o produto "${produtoSelecionado.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `saloes/${idSalao}/produtos/${produtoSelecionado.id}`));
              setModalEdicao(false);
              Alert.alert('Sucesso', 'Produto excluído.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o produto.');
            }
          }
        }
      ]
    );
  }

  async function toggleAtivo(produto: any) {
    if (!idSalao) return;
    await updateDoc(doc(db, `saloes/${idSalao}/produtos/${produto.id}`), {
      ativo: !produto.ativo,
    });
  }

  function estoqueBaixo(produto: any) {
    return produto.estoque !== undefined && produto.estoque <= (produto.estoqueMin || 1);
  }

  // Checagem periódica de estoque baixo
  useEffect(() => {
    const interval = setInterval(() => {
      produtos.forEach(p => {
        if (p.ativo !== false && p.estoque !== undefined && p.estoque <= (p.estoqueMin || 1) && !p.notificadoEstoqueBaixo) {
          addNotification({
            tipo: 'estoque',
            titulo: 'Estoque baixo',
            mensagem: `Produto ${p.nome} está com estoque baixo (${p.estoque}).`,
          });
          p.notificadoEstoqueBaixo = true; // Marcar para não notificar de novo
        }
      });
    }, 60000); // a cada 1 min
    return () => clearInterval(interval);
  }, [produtos]);

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
          <Text style={[styles.title, { textAlign: 'center', flex: 1 }]}>Produtos</Text>
        </View>
      </SafeAreaView>
      <View style={styles.container}>
        <TextInput
          placeholder="Buscar por nome"
          value={busca}
          onChangeText={setBusca}
          style={styles.input}
        />
        <FlatList
          data={produtosFiltrados}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => podeEditar && abrirEdicao(item)}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.nome}>{item.nome}</Text>
                  <Text style={styles.valor}>R$ {item.precoVenda ? Number(item.precoVenda).toFixed(2) : '0,00'}</Text>
                  {/* Estoque removido temporariamente */}
                </View>
              </View>
              {podeEditar && (
                <View style={{ alignItems: 'center', marginLeft: 12 }}>
                  <Text style={{ fontSize: 13, color: item.ativo ? '#388e3c' : '#d32f2f', marginBottom: 2 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                  <Switch value={item.ativo !== false} onValueChange={() => toggleAtivo(item)} />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 24, textAlign: 'center' }}>Nenhum produto encontrado.</Text>}
          style={{ marginTop: 8 }}
        />
        {/* Modal Cadastro */}
        <Formik
          initialValues={{ nome: '', precoCompra: '', precoVenda: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, actions) => {
            await cadastrarProduto(values, actions);
            Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid, dirty }) => (
            <CadastroModal
              isVisible={modalCadastro}
              onClose={() => setModalCadastro(false)}
              title="Novo Produto"
              onSave={handleSubmit as any}
              isSaveDisabled={!(isValid && dirty)}
            >
              <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do produto</Text>
              <TextInput
                placeholder="Nome*"
                value={values.nome || ''}
                onChangeText={handleChange('nome')}
                onBlur={handleBlur('nome')}
                style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
              />
              {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
              <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Valor (R$)</Text>
              <TextInput
                placeholder="Valor (R$)*"
                value={values.precoVenda?.toString() || ''}
                onChangeText={handleChange('precoVenda')}
                onBlur={handleBlur('precoVenda')}
                style={[styles.input, errors.precoVenda && touched.precoVenda && styles.inputError]}
                keyboardType="numeric"
              />
              {errors.precoVenda && touched.precoVenda && <Text style={styles.error}>{errors.precoVenda}</Text>}
            </CadastroModal>
          )}
        </Formik>
        {/* Modal Edição */}
        <Modal visible={modalEdicao} animationType="slide" transparent>
          <TouchableOpacity 
            style={styles.modalBg} 
            activeOpacity={1} 
            onPress={() => setModalEdicao(false)}
          >
            <TouchableOpacity 
              style={styles.modalBox} 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Produto</Text>
                <TouchableOpacity onPress={() => setModalEdicao(false)}>
                  <Text style={styles.closeButton}>X</Text>
                </TouchableOpacity>
              </View>
              {produtoSelecionado ? (
                <Formik
                  initialValues={{
                    nome: produtoSelecionado.nome || '',
                    precoCompra: produtoSelecionado.precoCompra?.toString() || '',
                    precoVenda: produtoSelecionado.precoVenda?.toString() || '',
                  }}
                  validationSchema={validationSchema}
                  onSubmit={async (values, actions) => {
                    await salvarEdicao(values, actions);
                    Alert.alert('Sucesso', 'Produto editado com sucesso!');
                  }}
                  enableReinitialize
                >
                  {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid, dirty }) => (
                    <>
                      <ScrollView style={styles.modalContent}>
                        <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do produto</Text>
                        <TextInput
                          placeholder="Nome*"
                          value={values.nome || ''}
                          onChangeText={handleChange('nome')}
                          onBlur={handleBlur('nome')}
                          style={[styles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
                        />
                        {errors.nome && touched.nome && typeof errors.nome === 'string' && <Text style={styles.error}>{errors.nome}</Text>}
                        <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 }}>Valor (R$)</Text>
                        <TextInput
                          placeholder="Valor (R$)*"
                          value={values.precoVenda?.toString() || ''}
                          onChangeText={handleChange('precoVenda')}
                          onBlur={handleBlur('precoVenda')}
                          style={[styles.input, errors.precoVenda && touched.precoVenda ? { borderColor: 'red', borderWidth: 1 } : {}]}
                          keyboardType="numeric"
                        />
                        {errors.precoVenda && touched.precoVenda && <Text style={styles.error}>{errors.precoVenda}</Text>}
                      </ScrollView>
                      <View style={styles.modalFooter}>
                        <Button title="Cancelar" color="#888" onPress={() => setModalEdicao(false)} />
                        <Button title="Salvar" onPress={handleSubmit as any} disabled={!(isValid && dirty)} />
                      </View>
                      <Button title="Ver Histórico de Movimentação" color="#1976d2" onPress={() => { setModalEdicao(false); abrirHistorico(produtoSelecionado); }} />
                      <TouchableOpacity onPress={deletarProduto} style={{ marginTop: 24 }}>
                        <Text style={styles.deleteButtonText}>Excluir Produto</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </Formik>
              ) : (
                <Text style={styles.noProductsMessage}>Nenhum produto selecionado para edição.</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
        {/* Modal Histórico de Movimentação */}
        <Modal visible={modalHistorico} animationType="slide" transparent>
          <TouchableOpacity 
            style={styles.modalBg} 
            activeOpacity={1} 
            onPress={() => setModalHistorico(false)}
          >
            <TouchableOpacity 
              style={styles.modalBox} 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.modalContent, { maxHeight: '80%' }]}> 
                <Text style={styles.modalTitle}>Histórico de Movimentação</Text>
                {loadingHistorico ? (
                  <Text>Carregando...</Text>
                ) : (
                  movimentacoes.length === 0 ? (
                    <Text>Nenhuma movimentação encontrada.</Text>
                  ) : (
                    <FlatList
                      data={movimentacoes}
                      keyExtractor={item => item.id}
                      renderItem={({ item }) => (
                        <View style={styles.movItem}>
                          <Text style={styles.movTipo}>{item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</Text>
                          <Text style={styles.movQtd}>Qtd: {item.quantidade}</Text>
                          <Text style={styles.movData}>{formatarData(item.data)}</Text>
                          {item.obs && <Text style={styles.movObs}>{item.obs}</Text>}
                        </View>
                      )}
                      style={{ marginTop: 8 }}
                    />
                  )
                )}
                <Button title="Fechar" color="#888" onPress={() => { setModalHistorico(false); setProdutoSelecionado(null); setMovimentacoes([]); }} />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
        {/* FAB para adicionar produto */}
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceColumn: {
    flex: 1,
    marginRight: Spacing.base,
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
  item: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 8, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  nome: { fontSize: 18, fontWeight: 'bold' },
  valor: { fontSize: 16, color: '#555' },
  estoque: { fontSize: 15, color: '#888' },
  estoqueBaixo: { color: '#d32f2f', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base * 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: '#888',
  },
  modalContent: {
    maxHeight: '60%', // Adjust as needed for content height
    marginBottom: Spacing.base * 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.base * 2,
  },
  noProductsMessage: {
    textAlign: 'center',
    color: '#888',
    marginTop: Spacing.base * 2,
  },
  movItem: { backgroundColor: '#f1f1f1', borderRadius: 8, padding: 10, marginBottom: 8 },
  movTipo: { fontWeight: 'bold', fontSize: 15 },
  movQtd: { fontSize: 15 },
  movData: { fontSize: 13, color: '#888' },
  movObs: { fontSize: 13, color: '#1976d2' },
  deleteButtonText: {
    color: Colors.error,
    textAlign: 'center',
    padding: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

function formatarData(data: any) {
  if (!data) return '-';
  try {
    const d = data instanceof Date ? data : data.toDate ? data.toDate() : new Date(data);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
  } catch {
    return '-';
  }
} 
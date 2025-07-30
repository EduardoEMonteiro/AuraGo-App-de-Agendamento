import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

const FORMAS_PADRAO = [
  { nome: 'Dinheiro', ativo: true, taxa: 0 },
  { nome: 'Pix', ativo: true, taxa: 0 },
  { nome: 'Débito', ativo: true, taxa: 0 },
  { nome: 'Crédito', ativo: true, taxa: 0 },
  ...Array.from({ length: 11 }, (_, i) => ({ nome: `Crédito ${i + 2}x`, ativo: true, taxa: 0 })),
];

// Ordem desejada para exibição
const ORDEM_FORMAS = [
  'Dinheiro',
  'Pix',
  'Débito',
  'Crédito',
  ...Array.from({ length: 11 }, (_, i) => `Crédito ${i + 2}x`),
];

export default function PagamentosScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formas, setFormas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user?.idSalao) return;
    const ref = collection(db, 'saloes', user.idSalao, 'formasPagamento');
    const unsub = onSnapshot(ref, async (snap) => {
      // Excluir 'Crédito 1x' se existir
      const credito1xDoc = snap.docs.find(d => d.id === 'Crédito 1x');
      if (credito1xDoc) {
        await deleteDoc(doc(db, 'saloes', user.idSalao, 'formasPagamento', 'Crédito 1x'));
      }
      if (snap.empty) {
        await criarFormasDePagamentoPadrao();
        return;
      }
      const formasData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Formas de pagamento carregadas do Firestore:', formasData.map(f => ({
        id: f.id,
        nome: (f as any).nome,
        ativo: (f as any).ativo,
        taxa: (f as any).taxa
      })));
      setFormas(formasData);
      setLoading(false);
    });
    return unsub;
  }, [user?.idSalao]);

  async function criarFormasDePagamentoPadrao() {
    if (!user?.idSalao) return;
    setLoading(true);
    const batch = writeBatch(db);
    const ref = collection(db, 'saloes', user.idSalao, 'formasPagamento');
    FORMAS_PADRAO.forEach(f => {
      const docRef = doc(ref, f.nome);
      batch.set(docRef, f);
    });
    await batch.commit();
    setLoading(false);
  }

  // Função para migrar salões existentes que não têm as formas de pagamento corretas
  async function migrarFormasPagamento() {
    if (!user?.idSalao) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const ref = collection(db, 'saloes', user.idSalao, 'formasPagamento');
      
      // Verificar se já existem formas de pagamento
      const snap = await getDocs(ref);
      const formasExistentes = snap.docs.map(doc => doc.id);
      
      // Adicionar apenas as formas que não existem
      FORMAS_PADRAO.forEach(f => {
        if (!formasExistentes.includes(f.nome)) {
          const docRef = doc(ref, f.nome);
          batch.set(docRef, f);
        }
      });
      
      await batch.commit();
      console.log('Migração de formas de pagamento concluída');
    } catch (e) {
      console.error('Erro na migração:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitch(id: string, value: boolean) {
    setUpdatingId(id);
    try {
      const ref = doc(db, 'saloes', user.idSalao, 'formasPagamento', id);
      await updateDoc(ref, { ativo: value });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleTaxaChange(id: string, taxa: string) {
    setUpdatingId(id);
    try {
      const taxaNumerica = Number(taxa.replace(',', '.'));
      console.log(`Salvando taxa para ${id}: ${taxaNumerica}%`);
      
      const ref = doc(db, 'saloes', user.idSalao, 'formasPagamento', id);
      await updateDoc(ref, { taxa: taxaNumerica });
      
      console.log(`Taxa salva com sucesso para ${id}: ${taxaNumerica}%`);
    } catch (e) {
      console.error('Erro ao salvar taxa:', e);
      Alert.alert('Erro', 'Não foi possível atualizar a taxa.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header customizado */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.back())} style={styles.backButton} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Feather name="arrow-left" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formas de Pagamento</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#1976d2" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Botão de migração para salões existentes */}
          {formas.length === 0 && (
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#1976d2', 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 16,
                alignItems: 'center'
              }}
              onPress={migrarFormasPagamento}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Migrar Formas de Pagamento
              </Text>
            </TouchableOpacity>
          )}
          
          {formas
            .slice()
            .sort((a, b) => ORDEM_FORMAS.indexOf(a.nome) - ORDEM_FORMAS.indexOf(b.nome))
            .map((f) => (
              <View key={f.id || f.nome} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.nome}>{f.nome}</Text>
                  <View style={styles.switchRow}>
                    {updatingId === (f.id || f.nome) ? (
                      <ActivityIndicator size={18} color="#1976d2" />
                    ) : (
                      <Switch
                        value={!!f.ativo}
                        onValueChange={v => handleSwitch(f.id || f.nome, v)}
                        trackColor={{ false: '#ccc', true: '#1976d2' }}
                        thumbColor="#fff"
                      />
                    )}
                  </View>
                </View>
                {f.nome !== 'Dinheiro' && (
                  <View style={styles.taxaRow}>
                    <Text style={styles.taxaLabel}>Taxa da operadora (%)</Text>
                    <TextInput
                      style={styles.taxaInput}
                      placeholder="Ex: 1.99"
                      keyboardType="decimal-pad"
                      defaultValue={String(f.taxa)}
                      onEndEditing={e => handleTaxaChange(f.id || f.nome, e.nativeEvent.text)}
                      editable={updatingId !== (f.id || f.nome)}
                    />
                  </View>
                )}
              </View>
            ))}
        </ScrollView>
      )}
      {/*
        TODO: Lógica de Integração com o Checkout
        Ao finalizar um pagamento no checkout com uma forma de pagamento que possui taxa:
        1. Obter o valor total da venda (ex: R$ 100,00).
        2. Obter a 'taxa' desta forma de pagamento (ex: 3%).
        3. Calcular o valor da taxa: valorTaxa = valorTotal * (taxa / 100) -> (100 * 0.03 = R$ 3,00).
        4. Calcular a receita líquida: receitaLiquida = valorTotal - valorTaxa -> (100 - 3 = R$ 97,00).
        5. Criar um documento na coleção 'receitas' com o valor de R$ 97,00.
        6. Criar um documento na coleção 'despesas' com o nome "Taxa de Cartão" e o valor de R$ 3,00.
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  headerTitle: {
    fontSize: 18, // igual ao HorarioFuncionamentoScreen
    fontWeight: 'bold',
    color: '#222',
  },
  card: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 18, marginBottom: 14, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  switchRow: { marginLeft: 12 },
  taxaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  taxaLabel: { fontSize: 15, color: '#666', flex: 1 },
  taxaInput: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, height: 40, fontSize: 15, minWidth: 80, textAlign: 'right' },
}); 
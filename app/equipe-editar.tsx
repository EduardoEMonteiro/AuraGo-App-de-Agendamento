import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

interface Membro {
  id: string;
  nome: string;
  email: string;
  funcao: 'gerente' | 'recepcionista' | 'colaborador';
  status: 'pendente' | 'ativo';
  comissao: number;
  criadoEm: any;
  userId: string | null;
}

export default function EquipeEditarScreen() {
  const router = useRouter();
  const { membro: membroParam } = useLocalSearchParams<{ membro: string }>();
  const membro: Membro = membroParam ? JSON.parse(membroParam) : null;
  const { user } = useAuthStore();
  const idSalao = user?.idSalao;

  const [comissao, setComissao] = useState<number>(membro?.comissao ?? 0);
  const [status, setStatus] = useState<'pendente' | 'ativo'>(membro?.status ?? 'pendente');
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!idSalao || !membro) return;
    setSalvando(true);
    try {
      await updateDoc(doc(db, `saloes/${idSalao}/convites/${membro.id}`), {
        comissao,
        status,
      });
      router.back();
      setTimeout(() => {
        Alert.alert('Sucesso', 'Membro atualizado!');
      }, 100);
    } catch (e) {
      Alert.alert('Erro ao salvar', e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!idSalao || !membro) return;
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o membro "${membro.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, `saloes/${idSalao}/convites/${membro.id}`));
            router.back();
            setTimeout(() => {
              Alert.alert('Membro excluído!');
            }, 100);
          },
        },
      ]
    );
  }

  async function handleCancelarConvite() {
    if (!idSalao || !membro) return;
    Alert.alert(
      'Cancelar Convite',
      `Tem certeza que deseja cancelar o convite para "${membro.nome}"?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, `saloes/${idSalao}/convites/${membro.id}`), { status: 'cancelado' });
              router.back();
              setTimeout(() => {
                Alert.alert('Convite cancelado!');
              }, 100);
            } catch (e) {
              Alert.alert('Erro ao cancelar', e instanceof Error ? e.message : String(e));
            }
          },
        },
      ]
    );
  }

  async function handleReenviarConvite() {
    if (!idSalao || !membro) return;
    try {
      await updateDoc(doc(db, `saloes/${idSalao}/convites/${membro.id}`), {
        criadoEm: new Date(),
      });
      Alert.alert('Convite reenviado!', 'O convite foi reenviado para o email do membro.');
    } catch (e) {
      Alert.alert('Erro ao reenviar convite', e instanceof Error ? e.message : String(e));
    }
  }

  if (!membro) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#888' }}>Membro não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16 }}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editando: {membro.nome}</Text>
        <View style={{ width: 32 }} />
      </View>
      {/* Conteúdo */}
      <View style={{ flex: 1, padding: 24 }}>
        {membro.status === 'ativo' ? (
          <>
            <Text style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>Comissão (%)</Text>
            <TextInput
              placeholder="Comissão"
              value={String(comissao)}
              onChangeText={text => setComissao(Number(text))}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 24 }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 16, color: '#333', marginRight: 12 }}>Ativo</Text>
              <Switch
                value={status === 'ativo'}
                onValueChange={v => setStatus(v ? 'ativo' : 'pendente')}
                trackColor={{ false: '#ccc', true: '#81b0ff' }}
                thumbColor={status === 'ativo' ? '#1976d2' : '#f4f3f4'}
              />
            </View>
          </>
        ) : (
          <Text style={{ color: '#888', fontSize: 16, marginBottom: 24 }}>Convite pendente de aceitação.</Text>
        )}
        {membro.status === 'pendente' && (
          <>
            <TouchableOpacity onPress={handleCancelarConvite} style={{ marginTop: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d32f2f', padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 16 }}>Cancelar Convite</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReenviarConvite} style={{ marginTop: 8, backgroundColor: '#1976d2', borderRadius: 8, borderWidth: 1, borderColor: '#1976d2', padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Reenviar Convite</Text>
            </TouchableOpacity>
          </>
        )}
        {membro.status === 'ativo' && (
          <TouchableOpacity onPress={handleExcluir} style={{ marginTop: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d32f2f', padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 16 }}>Excluir Membro</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Rodapé */}
      {membro.status === 'ativo' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 
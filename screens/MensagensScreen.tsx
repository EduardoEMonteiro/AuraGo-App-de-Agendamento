import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

const EXEMPLO_CONFIRMACAO = `Olá [NOME]! 😊 Seu agendamento para [SERVIÇO] com [PROFISSIONAL] está confirmado para o dia [DATA] às [HORA]. Qualquer dúvida, estamos à disposição. 💇‍♀️✨ Endereço: [ENDEREÇO]`;
const EXEMPLO_LEMBRETE = `Oi [NOME], tudo bem? Só passando pra lembrar do seu agendamento amanhã! 📍 [SERVIÇO] com [PROFISSIONAL] 📅 Data: [DATA] ⏰ Horário: [HORA] Qualquer mudança é só nos avisar com antecedência 💖 Endereço: [ENDEREÇO]`;

export default function MensagensScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [mensagens, setMensagens] = useState({ confirmacao: '', lembrete: '' });
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'confirmacao' | 'lembrete'>('confirmacao');
  const confirmacaoRef = useRef<TextInput>(null);
  const lembreteRef = useRef<TextInput>(null);
  const [salvando, setSalvando] = useState(false);
  const TAGS_WHATS = [
    { tag: '[NOME]', desc: 'Nome do cliente' },
    { tag: '[SERVIÇO]', desc: 'Nome do serviço agendado' },
    { tag: '[PROFISSIONAL]', desc: 'Nome do profissional que atenderá' },
    { tag: '[DATA]', desc: 'Data do agendamento' },
    { tag: '[HORA]', desc: 'Horário do agendamento' },
    { tag: '[ENDEREÇO]', desc: 'Endereço do seu estabelecimento' },
  ];

  useEffect(() => {
    async function fetchMsgs() {
      console.log('Buscando mensagens automáticas do Firestore...');
      if (!user?.idSalao) {
        setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
        setLoading(false);
        return;
      }
      
      // Primeiro, tentar buscar da estrutura correta
      const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'mensagensWhatsapp');
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        const data = snap.data();
        setMensagens({
          confirmacao: data.confirmacao || EXEMPLO_CONFIRMACAO,
          lembrete: data.lembrete || EXEMPLO_LEMBRETE,
        });
        console.log('Mensagem carregada do Firestore (estrutura correta):', data);
      } else {
        // Se não existir na estrutura correta, tentar migrar do local antigo
        console.log('Tentando migrar mensagens do local antigo...');
        try {
          const refAntigo = doc(db, 'configuracoes', `mensagensWhatsapp_${user.idSalao}`);
          const snapAntigo = await getDoc(refAntigo);
          
          if (snapAntigo.exists()) {
            const dataAntigo = snapAntigo.data();
            const mensagensMigradas = {
              confirmacao: dataAntigo.confirmacao || EXEMPLO_CONFIRMACAO,
              lembrete: dataAntigo.lembrete || EXEMPLO_LEMBRETE,
            };
            
            // Salvar na estrutura correta
            await setDoc(ref, mensagensMigradas, { merge: true });
            
            // Deletar do local antigo
            await deleteDoc(refAntigo);
            
            setMensagens(mensagensMigradas);
            console.log('Migração concluída com sucesso!');
          } else {
            setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
            console.log('Mensagem padrão usada (não havia dados para migrar).');
          }
        } catch (error) {
          console.log('Erro na migração:', error);
          setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
        }
      }
      setLoading(false);
    }
    fetchMsgs();
  }, [user?.idSalao]);

  useEffect(() => {
    if (!user?.idSalao) {
      Alert.alert('Erro', 'ID do salão não encontrado. Não é possível editar mensagens automáticas.');
    }
  }, [user?.idSalao]);

  function handleInsertTag(tag: string) {
    const textInputRef = abaAtiva === 'confirmacao' ? confirmacaoRef.current : lembreteRef.current;
    if (!textInputRef) return;
    textInputRef.focus();
    setMensagens(prev => {
        const currentValue = prev[abaAtiva];
        const newText = currentValue + tag;
        return { ...prev, [abaAtiva]: newText };
    });
  }

  async function handleSalvar() {
    if (!user?.idSalao) {
      Alert.alert('Erro', 'Salão não identificado.');
      return;
    }
    Keyboard.dismiss();
    setSalvando(true);
    try {
      // Corrigido: Salvar dentro da estrutura do salão
      const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'mensagensWhatsapp');
      await setDoc(ref, mensagens, { merge: true });
      Alert.alert('Sucesso', 'Mensagens salvas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as mensagens.');
      console.log('ERRO AO SALVAR:', error instanceof Error ? error.message : String(error), error);
    } finally {
      setSalvando(false);
    }
  }

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#1976d2" style={{ flex: 1 }} />;
    }
    const activeRef = abaAtiva === 'confirmacao' ? confirmacaoRef : lembreteRef;
    const activeValue = mensagens[abaAtiva];
    const activePlaceholder = abaAtiva === 'confirmacao' ? EXEMPLO_CONFIRMACAO : EXEMPLO_LEMBRETE;
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        <TextInput
          ref={activeRef}
          value={activeValue}
          onChangeText={text => setMensagens(m => ({ ...m, [abaAtiva]: text }))}
          style={styles.textInput}
          multiline
          placeholder={activePlaceholder}
          textAlignVertical="top"
        />
        <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>O que são as variáveis?</Text>
            <Text style={styles.infoText}>
                As variáveis (ex: [NOME]) são substituídas automaticamente pelas informações corretas do agendamento quando a mensagem é enviada.
            </Text>
        </View>
        <View>
            <Text style={styles.sectionTitle}>Clique para adicionar:</Text>
            <View style={styles.tagsContainer}>
                {TAGS_WHATS.map(({ tag }) => (
                    <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => handleInsertTag(tag)}>
                        <Text style={styles.tagChipText}>{tag}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header com seta para voltar */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }] }>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1976d2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mensagens Automáticas</Text>
          <View style={{ width: 32 }} />
        </View>
        {/* Abas */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabButton, abaAtiva === 'confirmacao' && styles.tabButtonActive]}
            onPress={() => setAbaAtiva('confirmacao')}
          >
            <Text style={[styles.tabText, abaAtiva === 'confirmacao' && styles.tabTextActive]}>📩 Confirmação</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, abaAtiva === 'lembrete' && styles.tabButtonActive]}
            onPress={() => setAbaAtiva('lembrete')}
          >
            <Text style={[styles.tabText, abaAtiva === 'lembrete' && styles.tabTextActive]}>⏰ Lembrete</Text>
          </TouchableOpacity>
        </View>
        {/* Conteúdo */}
        {renderContent()}
        {/* Botão Salvar */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }] }>
          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={salvando}>
            {salvando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f7f7f7',
    paddingTop: 8,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    minHeight: 150,
    lineHeight: 22,
  },
  infoSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#eef5ff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipText: {
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
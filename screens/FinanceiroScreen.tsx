import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button, Dimensions, FlatList, Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertaSaudeFinanceira } from '../components/AlertaSaudeFinanceira';
import { CustomHeader } from '../components/CustomHeader';
import { FormasPagamentoCard } from '../components/FormasPagamentoCard';
import { IndicadoresFinanceirosCard } from '../components/IndicadoresFinanceirosCard';
import { MetaFaturamentoCard } from '../components/MetaFaturamentoCard';
import { PendenciasFinanceirasCard } from '../components/PendenciasFinanceirasCard';
import { useAuthStore } from '../contexts/useAuthStore';
import { useFinanceiroIndicadores } from '../hooks/useFinanceiroIndicadores';
import { db } from '../services/firebase';

// --- Constantes ---
const Colors = { background: '#F7F7F7', cardBackground: '#FFFFFF', textPrimary: '#1A1A1A', textSecondary: '#6E6E73', textOnPrimary: '#FFFFFF', primary: '#007AFF', border: '#E5E5EA', success: '#34C759', error: '#FF3B30' };
const Typography = { H1: { fontSize: 28, fontWeight: 'bold' as 'bold' }, H2: { fontSize: 20, fontWeight: '600' as '600' }, Body: { fontSize: 16, fontWeight: '400' as '400' }, BodySemibold: { fontSize: 16, fontWeight: '600' as '600' }, Caption: { fontSize: 14, fontWeight: '400' as '400' } };
const Spacing = { screenPadding: 16, base: 8, buttonRadius: 12 };
const Shadows = { card: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 } };
const screenWidth = Dimensions.get('window').width;

type Lancamento = { id: string; nome: string; tipo: 'despesa' | 'receita'; valor: number; categoria?: string; data?: any; };

const CATEGORIAS_DESPESA = ['Aluguel', 'Água', 'Luz', 'Fornecedor', 'Materiais de Limpeza', 'Equipamentos', 'Outros'];

// Utilitário para zerar hora
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}
function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

const PERIOD_OPTIONS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Mês atual', value: 'currentMonth' },
  { label: 'Mês anterior', value: 'lastMonth' },
  { label: 'Ano atual', value: 'currentYear' },
  { label: 'Período específico', value: 'custom' },
];

interface PeriodoFinanceiroFiltroProps {
  period: string;
  setPeriod: (v: string) => void;
  customStart: Date | null;
  setCustomStart: (d: Date) => void;
  customEnd: Date | null;
  setCustomEnd: (d: Date) => void;
}
function PeriodoFinanceiroFiltro({period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd}: PeriodoFinanceiroFiltroProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  // Fluxo automático ao selecionar período específico
  const handleSelectPeriod = (value: string) => {
    setPeriod(value);
    if (value === 'custom') {
      setModalVisible(false);
      setTimeout(() => setShowStartPicker(true), 300);
    } else {
      setModalVisible(false);
    }
  };
  const handleStartDate = (e: any, d?: Date) => {
    setShowStartPicker(false);
    if (d) {
      setCustomStart(d);
      setTimeout(() => setShowEndPicker(true), 300);
    }
  };
  const handleEndDate = (e: any, d?: Date) => {
    setShowEndPicker(false);
    if (d) {
      setCustomEnd(d);
    }
  };
  // Quando ambos definidos, já filtra
  React.useEffect(() => {
    if (period === 'custom' && customStart && customEnd) {
      // Força re-render para aplicar filtro
    }
  }, [customStart, customEnd, period]);
  return (
    <View style={{marginBottom: 16}}>
      <TouchableOpacity style={{backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}} onPress={() => setModalVisible(true)}>
        <Text style={{color: Colors.textPrimary, fontWeight: '600'}}>Filtrar por período</Text>
        <Feather name="chevron-down" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={{flex:1, backgroundColor:'rgba(0,0,0,0.2)'}} onPress={() => setModalVisible(false)} />
        <View style={{position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:24}}>
          <Text style={{fontSize:18, fontWeight:'bold', marginBottom:16}}>Selecione o período</Text>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={{paddingVertical:12}} onPress={() => handleSelectPeriod(opt.value)}>
              <Text style={{fontSize:16, color: period === opt.value ? Colors.primary : Colors.textPrimary, fontWeight: period === opt.value ? 'bold' : 'normal'}}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      {/* Pickers automáticos para período específico */}
      {showStartPicker && (
        <DateTimePicker
          value={customStart || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDate}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={customEnd || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDate}
        />
      )}
    </View>
  );
}

// --- Componente Principal ---
export let addReceitaGlobal: ((nome: string, valor: number, categoria?: string, data?: any) => void) | null = null;
export default function FinanceiroScreen() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'resumo' | 'lancamentos'>('resumo');
    const [totalReceita, setTotalReceita] = useState(0);
    const [totalDespesa, setTotalDespesa] = useState(0);
    const [saldo, setSaldo] = useState(0);
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    const [addExpenseSheetVisible, setAddExpenseSheetVisible] = useState(false);

    // Estado do filtro de período
    const [period, setPeriod] = useState('today');
    const [customStart, setCustomStart] = useState<Date|null>(null);
    const [customEnd, setCustomEnd] = useState<Date|null>(null);
    const [receitasPeriodo, setReceitasPeriodo] = useState<any[]>([]);
    const [despesasPeriodo, setDespesasPeriodo] = useState<any[]>([]);

    // Estado para armazenar receitas de agendamentos e extras em memória
    const [receitasAgendamentos, setReceitasAgendamentos] = useState<any[]>([]);
    const [receitasExtras, setReceitasExtras] = useState<any[]>([]);

    // Buscar receitas de agendamentos e receitas extras em tempo real
    useEffect(() => {
        if (!user?.idSalao) return;
        // Listener para receitas de agendamentos
        const agendamentosRef = collection(db, 'saloes', user.idSalao, 'agendamentos');
        const qAgendamentos = query(agendamentosRef, orderBy('data'));
        const unsubscribeAg = onSnapshot(qAgendamentos, (snapshot) => {
            const receitasAg = snapshot.docs
                .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
                .filter(ag => ag.status === 'paid' || ag.status === 'completed');
            setReceitasAgendamentos(receitasAg);
        });
        // Listener para receitas extras
        const receitasRef = collection(db, 'saloes', user.idSalao, 'receitas');
        const unsubscribeRec = onSnapshot(receitasRef, (snapshot) => {
            const receitasExtras = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            setReceitasExtras(receitasExtras);
        });
        return () => {
            unsubscribeAg();
            unsubscribeRec();
        };
    }, [user?.idSalao]);

    // Buscar despesas do Firestore em tempo real (já estava correto)
    useEffect(() => {
        if (!user?.idSalao) return;
        const despesasRef = collection(db, 'saloes', user.idSalao, 'despesas');
        const q = query(despesasRef, orderBy('data', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const despesas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLancamentos(despesas as any);
        });
        return unsubscribe;
    }, [user?.idSalao]);

    // Buscar receitas e despesas filtradas por período em tempo real
    useEffect(() => {
      if (!user?.idSalao) return;
      let start: Date, end: Date;
      const now = new Date();
      if (period === 'today') {
        start = startOfDay(now);
        end = endOfDay(now);
      } else if (period === 'currentMonth') {
        start = startOfMonth(now);
        end = endOfMonth(now);
      } else if (period === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
      } else if (period === 'currentYear') {
        start = startOfYear(now);
        end = endOfYear(now);
      } else if (period === 'custom' && customStart && customEnd) {
        start = startOfDay(customStart);
        end = endOfDay(customEnd);
      } else {
        return;
      }
      // Filtrar receitas de agendamentos e extras já em memória
      const receitasFiltradas = [...receitasAgendamentos, ...receitasExtras].filter(ag => {
        let dataAg: Date | null = null;
        if ('data' in ag && ag.data) {
          const dataField = ag.data as any;
          if (dataField && typeof dataField === 'object' && 'toDate' in dataField && typeof dataField.toDate === 'function') dataAg = dataField.toDate();
          else if (typeof dataField === 'string' || typeof dataField === 'number') dataAg = new Date(dataField);
          else if (dataField instanceof Date) dataAg = dataField;
        }
        if (!dataAg) return false;
        return dataAg >= start && dataAg <= end;
      });
      
      // Remover duplicatas baseado no ID e tipo de receita
      const receitasUnicas = receitasFiltradas.filter((item, index, self) => {
        // Para agendamentos, usar ID do agendamento
        if (item.status) {
          // É um agendamento
          return index === self.findIndex(t => t.id === item.id && t.status);
        } else {
          // É uma receita extra - verificar se não corresponde a um agendamento
          const nomeReceita = item.nome || '';
          const valorReceita = Number(item.valor) || 0;
          
          // Verificar se existe um agendamento com mesmo valor e cliente
          const agendamentoCorrespondente = receitasAgendamentos.find(ag => {
            const valorAgendamento = Number(ag.finalPrice ?? ag.servicoValor) || 0;
            const nomeCliente = ag.clienteNome || '';
            
            // Se a receita extra tem nome "Agendamento: [cliente]" e mesmo valor, é duplicata
            if (nomeReceita.startsWith('Agendamento: ') && 
                valorReceita === valorAgendamento &&
                nomeReceita.includes(nomeCliente.trim())) {
              return true;
            }
            
            return false;
          });
          
          // Se encontrou agendamento correspondente, remover a receita extra
          if (agendamentoCorrespondente) {
            return false;
          }
          
          return index === self.findIndex(t => t.id === item.id && !t.status);
        }
      });
      
      setReceitasPeriodo(receitasUnicas);
      // Listener para despesas filtradas
      const despesasRef = collection(db, 'saloes', user.idSalao, 'despesas');
      const qDespesas = query(despesasRef, orderBy('data', 'desc'));
      const unsubscribe = onSnapshot(qDespesas, (snapshot) => {
        const despesas = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(d => {
            let dataDesp: Date | null = null;
            if ('data' in d && d.data) {
              const dataField = d.data as any;
              if (dataField && typeof dataField === 'object' && 'toDate' in dataField && typeof dataField.toDate === 'function') dataDesp = dataField.toDate();
              else if (typeof dataField === 'string' || typeof dataField === 'number') dataDesp = new Date(dataField);
              else if (dataField instanceof Date) dataDesp = dataField;
            }
            if (!dataDesp) return false;
            return dataDesp >= start && dataDesp <= end;
          });
        setDespesasPeriodo(despesas);
      });
      return unsubscribe;
    }, [user?.idSalao, period, customStart, customEnd, receitasAgendamentos, receitasExtras]);

    // Função para adicionar receita (usada pelo fluxo de checkout)
    function addReceita(nome: string, valor: number, categoria?: string, data?: any) {
        // Não adiciona receita como despesa, apenas para compatibilidade
        setTotalReceita(prev => prev + valor);
    }
    addReceitaGlobal = addReceita;

    const router = useRouter();

    // Calcular período para os indicadores
    const getPeriodoFiltro = () => {
      let start: Date, end: Date;
      const now = new Date();
      
      if (period === 'today') {
        start = startOfDay(now);
        end = endOfDay(now);
      } else if (period === 'currentMonth') {
        start = startOfMonth(now);
        end = endOfMonth(now);
      } else if (period === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
      } else if (period === 'currentYear') {
        start = startOfYear(now);
        end = endOfYear(now);
      } else if (period === 'custom' && customStart && customEnd) {
        start = startOfDay(customStart);
        end = endOfDay(customEnd);
      } else {
        // Quando não há filtro aplicado, mostrar o dia atual
        start = startOfDay(now);
        end = endOfDay(now);
      }
      
      return { start, end };
    };

    const { indicadores, loading: indicadoresLoading } = useFinanceiroIndicadores(getPeriodoFiltro());

    const renderResumo = () => {
      // Cálculo filtrado
      const totalReceitaFiltro = receitasPeriodo.reduce((acc, ag) => {
        let valor = 0;
        if (typeof ag.valor !== 'undefined') {
          // Receita extra (venda rápida)
          valor = Number(ag.valor) || 0;
        } else {
          // Receita de agendamento
          valor = Number(ag.finalPrice ?? ag.servicoValor) || 0;
        }
        
        return acc + valor;
      }, 0);
      
      console.log('📊 TOTAL RECEITAS:', totalReceitaFiltro, 'Quantidade:', receitasPeriodo.length);
      
      const totalDespesaFiltro = despesasPeriodo.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
      const saldoFiltro = totalReceitaFiltro - totalDespesaFiltro;
      
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <PeriodoFinanceiroFiltro
            period={period}
            setPeriod={setPeriod}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
          />

          {/* Cards originais */}
          <View style={styles.summaryCardsContainer}>
            <SummaryCard title="Receitas" value={totalReceitaFiltro} color={Colors.success} icon="arrow-up-circle" />
            <SummaryCard title="Despesas" value={totalDespesaFiltro} color={Colors.error} icon="arrow-down-circle" />
          </View>
          
          <View style={[styles.saldoCard, { backgroundColor: saldoFiltro >= 0 ? Colors.primary : Colors.error }]}> 
            <Text style={styles.saldoTitle}>Lucro Real do Período</Text>
            <Text style={styles.saldoValue}>R$ {saldoFiltro.toFixed(2).replace('.', ',')}</Text>
          </View>
          
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 18, marginTop: 12 }}
            onPress={() => router.push('/historico-receitas')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Histórico de Receitas</Text>
          </TouchableOpacity>

          {/* ===== NOVOS COMPONENTES ABAIXO DOS EXISTENTES ===== */}
          
          {/* Alerta de Saúde Financeira */}
          <AlertaSaudeFinanceira alertaSaudeFinanceira={indicadores.alertaSaudeFinanceira} />

          {/* Indicadores Financeiros */}
          <IndicadoresFinanceirosCard
            ticketMedio={indicadores.ticketMedio}
            totalAtendimentos={indicadores.totalAtendimentos}
            variacaoReceita={indicadores.variacaoReceita}
          />

          {/* Meta de Faturamento */}
          <MetaFaturamentoCard metaMensal={indicadores.metaMensal} />

          {/* Resumo por Forma de Pagamento */}
          <FormasPagamentoCard receitasPorFormaPagamento={indicadores.receitasPorFormaPagamento} />

          {/* Pendências Financeiras */}
          <PendenciasFinanceirasCard
            agendamentosPendentes={indicadores.agendamentosPendentes}
            naoCompareceram={indicadores.naoCompareceram}
          />
          
          {(receitasPeriodo.length === 0 && despesasPeriodo.length === 0) && (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Feather name="info" size={32} color={Colors.textSecondary} />
              <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Nenhum dado encontrado para esse período.</Text>
            </View>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
    );
    };
    const renderLancamentos = () => (
      <>
        <PeriodoFinanceiroFiltro
          period={period}
          setPeriod={setPeriod}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
        <FlatList
          data={despesasPeriodo}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <LancamentoItem item={item} />}
          ListHeaderComponent={<View style={styles.listHeader}><Text style={styles.sectionTitle}>Todas as Despesas</Text></View>}
          ListEmptyComponent={<View style={styles.emptyContainer}><Feather name="file-text" size={48} color={Colors.textSecondary} /><Text style={styles.emptyText}>Nenhuma despesa</Text><Text style={styles.emptySubtext}>Adicione suas despesas para começar a organizar</Text></View>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomHeader title="Painel Financeiro" showBackButton={false} />
            <View style={styles.container}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'resumo' && styles.activeTab]} onPress={() => setActiveTab('resumo')}><Text style={[styles.tabText, activeTab === 'resumo' && styles.activeTabText]}>Resumo</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'lancamentos' && styles.activeTab]} onPress={() => setActiveTab('lancamentos')}><Text style={[styles.tabText, activeTab === 'lancamentos' && styles.activeTabText]}>Despesas</Text></TouchableOpacity>
                </View>

                {activeTab === 'resumo' ? renderResumo() : renderLancamentos()}

                <TouchableOpacity style={styles.fab} onPress={() => setAddExpenseSheetVisible(true)}>
                    <Feather name="plus" size={28} color={Colors.textOnPrimary} />
                    </TouchableOpacity>

                <AddExpenseSheet isVisible={addExpenseSheetVisible} onClose={() => setAddExpenseSheetVisible(false)} />
            </View>
        </SafeAreaView>
    );
}

// --- Componente do Formulário (BottomSheet) ---
const AddExpenseSheet = ({ isVisible, onClose }: { isVisible: boolean, onClose: () => void }) => {
    // Estados do formulário com os padrões corretos
    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [categoria, setCategoria] = useState(CATEGORIAS_DESPESA[0]);
    // LÓGICA REFINADA: Recorrência começa desmarcada.
    const [isRecurrent, setIsRecurrent] = useState(false);
    const [parcelas, setParcelas] = useState('');
    // LÓGICA REFINADA: Vencimento fixo começa marcado.
    const [vencimentoFixo, setVencimentoFixo] = useState(true);
    
    const [isCategoriaModalVisible, setCategoriaModalVisible] = useState(false);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [dataVencimento, setDataVencimento] = useState(new Date());
    const [vencimentosIndividuais, setVencimentosIndividuais] = useState<(Date | null)[]>([]);
    const [editingParcelaIndex, setEditingParcelaIndex] = useState(0);

    // LÓGICA REFINADA: Atualiza o array de vencimentos individuais sempre que o número de parcelas mudar.
    useEffect(() => {
        const numParcelas = parseInt(parcelas, 10) || 0;
        // Cria um array com o tamanho correto (parcelas - 1), preenchido com null.
        setVencimentosIndividuais(Array(Math.max(0, numParcelas - 1)).fill(null));
    }, [parcelas]);

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setDatePickerVisible(false);
        if (event.type === 'set' && selectedDate) {
            // Se o vencimento é fixo ou estamos editando a primeira parcela
            if (editingParcelaIndex === 1) {
                setDataVencimento(selectedDate);
            } else {
                // Atualiza a data da parcela específica no array de vencimentos individuais
                const novosVencimentos = [...vencimentosIndividuais];
                // O índice do array é `parcelaIndex - 2` (ex: Parcela 2 está no índice 0)
                novosVencimentos[editingParcelaIndex - 2] = selectedDate;
                setVencimentosIndividuais(novosVencimentos);
            }
        }
    };
    
    const openDatePickerForParcela = (index: number) => {
        setEditingParcelaIndex(index);
        setDatePickerVisible(true);
    };

    // UI DINÂMICA: Gera os campos de data para cada parcela se o vencimento não for fixo
    const renderIndividualDueDates = () => {
        const numParcelas = parseInt(parcelas) || 0;
        if (numParcelas <= 1) return null;

        // Gera `numParcelas - 1` campos, para as parcelas 2, 3, 4...
        return Array.from({ length: numParcelas - 1 }).map((_, index) => {
            const parcelaNumero = index + 2; // Parcela 2, 3, 4...
            const dataAtual = vencimentosIndividuais[index] || null;
            return (
                <View key={parcelaNumero}>
                    <Text style={styles.label}>Vencimento da Parcela {parcelaNumero}</Text>
                    <TouchableOpacity style={styles.customPickerButton} onPress={() => openDatePickerForParcela(parcelaNumero)}>
                        <Text style={styles.bodyText}>{dataAtual ? dataAtual.toLocaleDateString('pt-BR') : 'Selecione a data'}</Text>
                        <Feather name="calendar" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            );
        });
    };
    
    // LÓGICA REFINADA: O rótulo da data principal muda dinamicamente para maior clareza.
    const vencimentoLabel = isRecurrent && !vencimentoFixo ? 'Vencimento da Parcela 1' : 'Data de Vencimento';

    const { user } = useAuthStore();
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!user?.idSalao) {
            Alert.alert('Erro', 'Sua sessão pode ter expirado ou houve um erro ao carregar os dados. Por favor, faça o login novamente para continuar.');
            return;
        }
        if (!nome || !valor) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
            return;
        }
        setSaving(true);
        try {
            const despesasRef = collection(db, 'saloes', user.idSalao, 'despesas');
            const docRef = await addDoc(despesasRef, {
                nome,
                valor: Number(valor),
                categoria,
                data: new Date(),
                recorrente: isRecurrent,
                parcelas: isRecurrent ? Number(parcelas) : 1,
                vencimentoFixo,
                dataVencimento: dataVencimento,
                vencimentosIndividuais: isRecurrent && !vencimentoFixo ? vencimentosIndividuais : [],
            });
            console.log('Despesa salva com id:', docRef.id);
            // Limpar campos
            setNome('');
            setValor('');
            setCategoria(CATEGORIAS_DESPESA[0]);
            setIsRecurrent(false);
            setParcelas('');
            setVencimentoFixo(true);
            setDataVencimento(new Date());
            setVencimentosIndividuais([]);
            onClose();
        } catch (e) {
            console.log('Erro ao salvar despesa:', e);
            Alert.alert('Erro', 'Não foi possível salvar a despesa. Verifique sua conexão e se todos os campos foram preenchidos corretamente.');
        } finally {
            setSaving(false);
        }
    }
    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <Pressable style={styles.bottomSheetBackdrop} onPress={onClose} />
            <View style={styles.bottomSheetContainer}>
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Nova Despesa</Text>
                    <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={Colors.textSecondary} /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.base * 4 }}>
                    <Text style={styles.label}>Nome da Despesa</Text>
                    <TextInput
                      placeholder="Ex: Aluguel do Escritório"
                      placeholderTextColor="#6B7280"
                      style={[styles.input, { color: '#000' }]}
                      value={nome}
                      onChangeText={setNome}
                    />
                    <Text style={styles.label}>Valor</Text>
                    <TextInput
                      placeholder="R$ 0,00"
                      placeholderTextColor="#6B7280"
                      style={[styles.input, { color: '#000' }]}
                      keyboardType="numeric"
                      value={valor}
                      onChangeText={setValor}
                    />
                    <Text style={styles.label}>Categoria</Text>
                    <TouchableOpacity style={styles.customPickerButton} onPress={() => setCategoriaModalVisible(true)}>
                        <Text style={styles.bodyText}>{categoria}</Text>
                        <Feather name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.switchRow}>
                        <Text style={styles.labelNoMargin}>Despesa recorrente?</Text>
                        <Switch value={isRecurrent} onValueChange={setIsRecurrent} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.cardBackground} />
                    </View>
                    {isRecurrent && (
                        <View style={styles.recurrentBlock}>
                            <Text style={styles.label}>Quantidade de parcelas</Text>
                            <TextInput
                              placeholder="Ex: 12"
                              placeholderTextColor="#6B7280"
                              style={[styles.input, { color: '#000' }]}
                              keyboardType="numeric"
                              value={parcelas}
                              onChangeText={setParcelas}
                            />
                            <Text style={styles.label}>{vencimentoLabel}</Text>
                            <TouchableOpacity style={styles.customPickerButton} onPress={() => openDatePickerForParcela(1)}>
                                <Text style={styles.bodyText}>{dataVencimento.toLocaleDateString('pt-BR')}</Text>
                                <Feather name="calendar" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <View style={[styles.switchRow, { marginTop: Spacing.base * 2 }]}>
                                <Text style={[styles.labelNoMargin, { flex: 1 }]}>Vencimentos sempre no mesmo dia?</Text>
                                <Switch value={vencimentoFixo} onValueChange={setVencimentoFixo} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.cardBackground}/>
                            </View>
                            {!vencimentoFixo && renderIndividualDueDates()}
                        </View>
                    )}
                </ScrollView>
                <View style={styles.bottomSheetFooter}>
                    <Button title={saving ? 'Salvando...' : 'Salvar Despesa'} onPress={handleSave} color={Colors.primary} disabled={saving} />
                </View>
            </View>

            {/* CORREÇÃO: O modal de seleção agora está corretamente ligado e funcional */}
            <SelectionModal 
                isVisible={isCategoriaModalVisible}
                onClose={() => setCategoriaModalVisible(false)}
                options={CATEGORIAS_DESPESA}
                onSelect={(option) => {
                    setCategoria(option);
                    setCategoriaModalVisible(false);
                }}
            />

            {isDatePickerVisible && (
                <DateTimePicker
                    value={editingParcelaIndex === 1 ? dataVencimento : vencimentosIndividuais[editingParcelaIndex - 2] || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </Modal>
    );
};

// --- Componentes Auxiliares ---
const SelectionModal = ({ isVisible, onClose, options, onSelect }: { isVisible: boolean, onClose: () => void, options: string[], onSelect: (option: string) => void }) => (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
            <View style={styles.modalContent}>
                {options.map(option => (
                    <TouchableOpacity key={option} style={styles.modalOption} onPress={() => onSelect(option)}>
                        <Text style={styles.modalOptionText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Pressable>
    </Modal>
);

const SummaryCard = ({ title, value, color, icon }: any) => ( <View style={styles.summaryCard}><View style={[styles.summaryIconContainer, { backgroundColor: `${color}20` }]}><Feather name={icon} size={24} color={color} /></View><View><Text style={styles.summaryTitle}>{title}</Text><Text style={[styles.summaryValue, { color }]}>R$ {Number(value).toFixed(2).replace('.', ',')}</Text></View></View> );
const LancamentoItem = ({ item }: { item: Lancamento }) => ( <TouchableOpacity style={styles.lancItem}><View style={[styles.lancIcon, { backgroundColor: Colors.error+'20' }]}><Feather name='arrow-down' size={20} color={Colors.error} /></View><View style={styles.lancDetails}><Text style={styles.lancCategory}>{item.nome}</Text><Text style={styles.lancObs}>{item.categoria}</Text></View><Text style={[styles.lancValue, { color: Colors.error }]}>- R$ {Number(item.valor).toFixed(2).replace('.', ',')}</Text></TouchableOpacity> );

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:Colors.background},container:{flex:1,padding:Spacing.screenPadding,backgroundColor:Colors.background},title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },sectionTitle:{...Typography.H2,color:Colors.textPrimary,alignSelf:'flex-start',marginBottom:Spacing.base*1.5},label:{...Typography.BodySemibold,color:Colors.textPrimary,marginBottom:Spacing.base,marginTop:Spacing.base*2},labelNoMargin:{...Typography.BodySemibold,color:Colors.textPrimary},bodyText:{...Typography.Body},input:{backgroundColor:'#FFFFFF',borderRadius:Spacing.buttonRadius,paddingHorizontal:Spacing.base*2,height:50,...Typography.Body,borderWidth:1,borderColor:Colors.border},tabContainer:{flexDirection:'row',backgroundColor:'#E5E5EA',borderRadius:Spacing.buttonRadius,padding:4,marginBottom:Spacing.base*2},tab:{flex:1,paddingVertical:Spacing.base,borderRadius:8},activeTab:{backgroundColor:Colors.cardBackground,shadowColor:"#000",shadowOffset:{width:0,height:1},shadowOpacity:0.1,shadowRadius:4,elevation:3},tabText:{...Typography.Body,color:Colors.textSecondary,textAlign:'center'},activeTabText:{...Typography.BodySemibold,color:Colors.primary},summaryCardsContainer:{flexDirection:'row',justifyContent:'space-between',marginHorizontal:-Spacing.base/2},summaryCard:{flex:1,backgroundColor:Colors.cardBackground,borderRadius:Spacing.buttonRadius,padding:Spacing.base*2,marginHorizontal:Spacing.base/2,...Shadows.card},summaryIconContainer:{width:40,height:40,borderRadius:20,justifyContent:'center',alignItems:'center',marginBottom:Spacing.base},summaryTitle:{...Typography.Caption,color:Colors.textSecondary},summaryValue:{...Typography.H2,marginTop:4},saldoCard:{borderRadius:Spacing.buttonRadius,padding:Spacing.base*2,marginTop:Spacing.base*2,alignItems:'center',...Shadows.card},saldoTitle:{...Typography.Body,color:`${Colors.textOnPrimary}99`},saldoValue:{...Typography.H1,color:Colors.textOnPrimary,fontSize:32},chartContainer:{backgroundColor:Colors.cardBackground,borderRadius:Spacing.buttonRadius,padding:Spacing.base*2,alignItems:'center',...Shadows.card},chartTitle:{...Typography.BodySemibold,color:Colors.textPrimary,marginBottom:Spacing.base},listHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:Spacing.base},lancItem:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.cardBackground,padding:Spacing.base*1.5,borderRadius:Spacing.buttonRadius,marginBottom:Spacing.base,...Shadows.card},lancIcon:{width:40,height:40,borderRadius:20,justifyContent:'center',alignItems:'center',marginRight:Spacing.base*1.5},lancDetails:{flex:1},lancCategory:{...Typography.BodySemibold},lancObs:{...Typography.Caption,color:Colors.textSecondary,marginTop:2},lancValue:{...Typography.BodySemibold,fontSize:16},emptyContainer:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:Spacing.base*8},emptyText:{...Typography.H2,color:Colors.textPrimary,marginTop:Spacing.base*2},emptySubtext:{...Typography.Body,color:Colors.textSecondary,marginTop:Spacing.base,textAlign:'center',paddingHorizontal:20},fab:{position:'absolute',bottom:32,right:24,width:60,height:60,borderRadius:30,backgroundColor:Colors.primary,justifyContent:'center',alignItems:'center',...Shadows.card},bottomSheetBackdrop:{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.4)'},bottomSheetContainer:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:Colors.background,borderTopLeftRadius:20,borderTopRightRadius:20,padding:Spacing.screenPadding,paddingBottom:0,maxHeight:'90%',...Shadows.card},bottomSheetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingBottom:Spacing.base,borderBottomWidth:1,borderColor:Colors.border},bottomSheetTitle:{...Typography.H2},bottomSheetFooter:{paddingTop:Spacing.base*2,paddingBottom:Spacing.base*4,backgroundColor:Colors.background,borderTopWidth:1,borderColor:Colors.border,marginTop:Spacing.base*2},customPickerButton:{backgroundColor:'#FFFFFF',borderRadius:Spacing.buttonRadius,paddingHorizontal:Spacing.base*2,height:50,borderWidth:1,borderColor:Colors.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:Spacing.base*2.5,backgroundColor:Colors.cardBackground,padding:Spacing.screenPadding,borderRadius:Spacing.buttonRadius,borderWidth:1,borderColor:Colors.border},recurrentBlock:{marginTop:Spacing.base,padding:Spacing.base*2,backgroundColor:`${Colors.primary}10`,borderRadius:Spacing.buttonRadius,borderWidth:1,borderColor:`${Colors.primary}30`},modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:40},modalContent:{backgroundColor:Colors.cardBackground,borderRadius:Spacing.buttonRadius,padding:Spacing.base,width:'100%',...Shadows.card},modalOption:{paddingVertical:Spacing.base*1.8,paddingHorizontal:Spacing.base*2,borderBottomWidth:1,borderBottomColor:Colors.border},modalOptionText:{...Typography.Body,textAlign:'center'},
});
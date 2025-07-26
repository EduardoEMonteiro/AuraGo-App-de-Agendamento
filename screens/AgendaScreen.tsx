import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';
// Certifique-se que os caminhos dos imports estão corretos para o seu projeto
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';
import { buscarAgendamentosFirestore } from '../services/firestoreAgendamentos';
import { adicionarPendente, Agendamento, buscarAgendamentosLocal, buscarPendentes, salvarAgendamentosLocal, sincronizarPendentes } from '../services/offlineAgendamentos';

// Mock de horários bloqueados (ex: almoço)
const horariosBloqueados = [
  { inicio: '12:00', fim: '13:00', motivo: 'Almoço' },
];

function gerarHorarios() {
  const horarios = [];
  for (let h = 7; h < 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      horarios.push(hora);
    }
  }
  return horarios;
}

// Schema de validação para agendamento
const agendamentoSchema = Yup.object().shape({
  cliente: Yup.string().required('Cliente obrigatório'),
  inicio: Yup.string().required('Horário obrigatório'),
  duracao: Yup.number().required('Duração obrigatória'),
  servico: Yup.string().required('Serviço obrigatório'),
  valor: Yup.number().required('Valor obrigatório'),
  formaPagamento: Yup.string().required('Forma de pagamento obrigatória'),
});

export default function AgendaScreen() {
  const { user } = useAuthStore();
  const role = user?.role;
  const profissionalId = user?.id || user?.uid;
  const idSalao = user?.idSalao;

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('todos');
  const [modalAgendamento, setModalAgendamento] = useState<any>(null);
  const [modalData, setModalData] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [offline, setOffline] = useState(false);
  const [pendentes, setPendentes] = useState<Agendamento[]>([]);
  const [profissionais, setProfissionais] = useState<{id: string, nome: string}[]>([]);
  const [clientes, setClientes] = useState<{id: string, nome: string}[]>([]);
  const [servicos, setServicos] = useState<{id: string, nome: string, duracao: number, valor: number}[]>([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [showServicosDropdown, setShowServicosDropdown] = useState(false);
  const [showHorasDropdown, setShowHorasDropdown] = useState(false);
  const [showMinutosDropdown, setShowMinutosDropdown] = useState(false);
  const horarios = gerarHorarios();
  
  // Arrays para horas e minutos
  const horas = Array.from({length: 16}, (_, i) => (i + 7).toString().padStart(2, '0')); // 07 a 22
  const minutos = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // Adicionar estado para modal de criação
  const [modalCriar, setModalCriar] = useState(false);
  // Adicionar estado para modal de edição
  const [modalEditar, setModalEditar] = useState<Agendamento | null>(null);
  // Adicionar estado para conflito
  const [conflito, setConflito] = useState<{local: Agendamento, remoto: Agendamento} | null>(null);

  // Funções para navegar entre datas
  function irParaDataAnterior() {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() - 1);
    setDataSelecionada(novaData);
  }

  function irParaDataPosterior() {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + 1);
    setDataSelecionada(novaData);
  }

  const { addNotification } = useNotifications();

  // Função para buscar profissionais/membros do Firestore
  async function carregarProfissionais() {
    if (!idSalao) return;
    
    try {
      const q = query(collection(db, `saloes/${idSalao}/membros`));
      const snapshot = await getDocs(q);
      const membros = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || 'Sem nome'
      }));
      
      let nomeUsuario = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
      
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user?.id || user?.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.nome) {
            nomeUsuario = userData.nome;
          }
        }
      } catch (error) {
        console.log('Erro ao buscar nome do usuário:', error);
      }
      
      const usuarioAtual = {
        id: user?.id || user?.uid,
        nome: nomeUsuario
      };
      
      const todosMembros = [usuarioAtual];
      
      membros.forEach(membro => {
        if (membro.id !== usuarioAtual.id) {
          todosMembros.push(membro);
        }
      });
      
      setProfissionais(todosMembros);
      
      if (profissionalSelecionado === 'todos') {
        setProfissionalSelecionado(usuarioAtual.id);
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      const usuarioAtual = {
        id: user?.id || user?.uid,
        nome: user?.displayName || user?.email?.split('@')[0] || 'Usuário'
      };
      setProfissionais([usuarioAtual]);
      setProfissionalSelecionado(usuarioAtual.id);
    }
  }

  // Função para carregar clientes do Firestore
  async function carregarClientes() {
    if (!idSalao) return;
    
    try {
      const q = query(collection(db, `saloes/${idSalao}/clientes`));
      const snapshot = await getDocs(q);
      const clientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || 'Sem nome'
      }));
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }

  // Função para carregar serviços do Firestore
  async function carregarServicos() {
    if (!idSalao) return;
    
    try {
      const q = query(collection(db, `saloes/${idSalao}/servicos`));
      const snapshot = await getDocs(q);
      const servicosData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || 'Sem nome',
        duracao: doc.data().duracao || 30,
        valor: doc.data().valor || 0
      }));
      setServicos(servicosData);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function checkConnection() {
      const status = await Network.getNetworkStateAsync();
      if (!isMounted) return;
      setOffline(!status.isConnected);
      if (status.isConnected && idSalao) {
        await sincronizarPendentes(idSalao);
        carregarAgendamentos();
        carregarProfissionais();
        carregarClientes();
        carregarServicos();
      }
    }
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    carregarAgendamentos();
    carregarPendentes();
    carregarProfissionais();
    carregarClientes();
    carregarServicos();
    return () => { isMounted = false; clearInterval(interval); };
  }, [idSalao]);

  async function carregarAgendamentos() {
    if (offline) {
      const local = await buscarAgendamentosLocal();
      setAgendamentos(local);
    } else if (idSalao) {
      const remotos = await buscarAgendamentosFirestore(idSalao);
      await salvarAgendamentosLocal(remotos);
      setAgendamentos(remotos);
      const pend = await buscarPendentes();
      for (const p of pend) {
        const remoto = remotos.find(r => r.id === p.id);
        if (remoto && p.updatedAt > remoto.updatedAt) {
          setConflito({ local: p, remoto });
          break;
        }
      }
    }
  }

  async function carregarPendentes() {
    const p = await buscarPendentes();
    setPendentes(p);
  }

  async function criarAgendamentoOffline(ag: Omit<Agendamento, 'id' | 'updatedAt' | 'offline'>) {
    const novo: Agendamento = {
      ...ag,
      id: 'offline-' + Date.now(),
      updatedAt: Date.now(),
      offline: true,
    };
    await adicionarPendente(novo);
    const local = await buscarAgendamentosLocal();
    await salvarAgendamentosLocal([...local, novo]);
    setAgendamentos([...local, novo]);
    setPendentes(await buscarPendentes());
    alert('Agendamento salvo offline e será sincronizado quando houver conexão.');
  }

  useEffect(() => {
    if (pendentes.length > 0) {
      alert('Existem agendamentos pendentes de sincronização!');
    }
  }, [pendentes.length]);

  async function notificarNovoAgendamento(ag: any) {
    addNotification({
      tipo: 'agendamento',
      titulo: 'Novo agendamento',
      mensagem: `Agendamento para ${ag.cliente} às ${ag.inicio}.`,
    });
  }
  
  async function notificarEdicaoAgendamento(ag: any) {
    addNotification({
      tipo: 'agendamento',
      titulo: 'Agendamento alterado',
      mensagem: `Agendamento de ${ag.cliente} foi alterado.`,
    });
  }
  
  async function notificarNoShow(ag: any) {
    addNotification({
      tipo: 'no-show',
      titulo: 'No-show registrado',
      mensagem: `Cliente ${ag.cliente} não compareceu ao horário ${ag.inicio}.`,
    });
  }
  
  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date();
      agendamentos.forEach(ag => {
        if (ag.status === 'agendado') {
          const [h, m] = ag.inicio.split(':').map(Number);
          const agDate = new Date(dataSelecionada);
          agDate.setHours(h, m, 0, 0);
          if (agDate < agora && !(ag as any).lidaAtraso) {
            addNotification({
              tipo: 'atraso',
              titulo: 'Agendamento atrasado',
              mensagem: `Agendamento de ${ag.cliente} (${ag.inicio}) está atrasado!`,
            });
            (ag as any).lidaAtraso = true;
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [agendamentos, dataSelecionada]);

  let agsFiltrados = agendamentos.filter(a => {
    if (role === 'colaborador') return a.profissionalId === profissionalId;
    if (profissionalSelecionado && profissionalSelecionado !== 'todos') return a.profissionalId === profissionalSelecionado;
    return true;
  });

  function isBloqueado(hora: string) {
    return horariosBloqueados.some(b => hora >= b.inicio && hora < b.fim);
  }

  function agendamentoNoHorario(hora: string) {
    return agsFiltrados.find(a => a.inicio === hora);
  }

  function gerarDiasDoMes(data: Date) {
    const ano = data.getFullYear();
    const mes = data.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const inicioSemana = primeiroDia.getDay();
    const diasNoMes = ultimoDia.getDate();
    
    const hoje = new Date();
    const dataSelecionada = new Date(data);
    
    const dias = [];
    
    for (let i = 0; i < inicioSemana; i++) {
      const diaAnterior = new Date(ano, mes, -inicioSemana + i + 1);
      dias.push({
        day: diaAnterior.getDate(),
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }
    
    for (let i = 1; i <= diasNoMes; i++) {
      const diaAtual = new Date(ano, mes, i);
      const isToday = diaAtual.toDateString() === hoje.toDateString();
      const isSelected = diaAtual.toDateString() === dataSelecionada.toDateString();
      
      dias.push({
        day: i,
        isCurrentMonth: true,
        isSelected,
        isToday
      });
    }
    
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push({
        day: i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }
    
    return dias;
  }

  function calcularHoraFim(inicio: string, duracao: number) {
    const [h, m] = inicio.split(':').map(Number);
    const totalMin = h * 60 + m + duracao;
    const hf = Math.floor(totalMin / 60);
    const mf = totalMin % 60;
    return `${hf.toString().padStart(2, '0')}:${mf.toString().padStart(2, '0')}`;
  }

  // O PanGestureHandler foi removido pois não é ideal dentro de um ScrollView.
  // A navegação de datas agora é feita apenas pelos botões.

  return (
    <>
      <View style={{ height: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#fff' }} />
      <ScrollView style={styles.container}>
        
        {/* --- CABEÇALHO DA AGENDA --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={irParaDataAnterior} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalData(true)} style={styles.dateContainer}>
            <Text style={styles.title}>
              {dataSelecionada.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: 'short'
              })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={irParaDataPosterior} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalData(true)} style={styles.calendarButton}>
            <Ionicons name="calendar" size={24} color="#1976d2" />
          </TouchableOpacity>
        </View>

        {/* --- FILTRO DE PROFISSIONAIS --- */}
        {(role === 'gerente' || role === 'recepcionista') && profissionais.length > 1 && (
          <View style={{ marginBottom: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {profissionais.map(p => (
                <TouchableOpacity key={p.id} onPress={() => setProfissionalSelecionado(p.id)} style={[styles.profBtn, profissionalSelecionado === p.id && styles.profBtnAtivo]}>
                  <Text style={profissionalSelecionado === p.id ? styles.profBtnAtivoTxt : styles.profBtnTxt}>{p.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* --- LISTA DE HORÁRIOS --- */}
        {horarios.map(hora => {
          const bloqueado = isBloqueado(hora);
          const ag = agendamentoNoHorario(hora);
          return (
            <View key={hora} style={[styles.linhaHorario, bloqueado && styles.linhaBloqueada]}>
              <Text style={styles.horaTxt}>{hora}</Text>
              {ag && (
                <TouchableOpacity style={[styles.agendamento, { height: (ag.duracao / 15) * 40 }]} onPress={() => setModalAgendamento(ag)}>
                  <Text style={styles.agendamentoTxt}>{ag.cliente} - {ag.servico}</Text>
                  <Text style={styles.agendamentoSub}>{ag.inicio} - {calcularHoraFim(ag.inicio, ag.duracao)}</Text>
                </TouchableOpacity>
              )}
              {bloqueado && !ag && (
                <View style={styles.bloqueadoOverlay}>
                  <Text style={styles.bloqueadoTxt}>Bloqueado</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* --- MODAIS (permanecem fora da área de rolagem para cobrir a tela inteira) --- */}
      </ScrollView>

      {/* Botão flutuante e Modais precisam ficar fora do ScrollView */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalCriar(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal de seleção de data */}
      <Modal visible={modalData} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalBg} 
          activeOpacity={1} 
          onPress={() => setModalData(false)}
        >
          <TouchableOpacity 
            style={styles.calendarModal} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.calendarTitle}>Selecionar Data</Text>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => {
                  const novaData = new Date(dataSelecionada);
                  novaData.setMonth(novaData.getMonth() - 1);
                  setDataSelecionada(novaData);
                }}>
                  <Ionicons name="chevron-back" size={24} color="#1976d2" />
                </TouchableOpacity>
                <Text style={styles.calendarMonth}>
                  {dataSelecionada.toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
                <TouchableOpacity onPress={() => {
                  const novaData = new Date(dataSelecionada);
                  novaData.setMonth(novaData.getMonth() + 1);
                  setDataSelecionada(novaData);
                }}>
                  <Ionicons name="chevron-forward" size={24} color="#1976d2" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.weekDays}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <Text key={day} style={styles.weekDay}>{day}</Text>
                ))}
              </View>
              
              <View style={styles.daysContainer}>
                {gerarDiasDoMes(dataSelecionada).map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      day.isCurrentMonth && styles.currentMonthDay,
                      day.isSelected && styles.selectedDay,
                      day.isToday && styles.todayDay
                    ]}
                    onPress={() => {
                      if (day.isCurrentMonth) {
                        const novaData = new Date(dataSelecionada);
                        novaData.setDate(day.day);
                        setDataSelecionada(novaData);
                        setModalData(false);
                      }
                    }}
                  >
                    <Text style={[
                      styles.dayText,
                      day.isCurrentMonth && styles.currentMonthDayText,
                      day.isSelected && styles.selectedDayText,
                      day.isToday && styles.todayDayText
                    ]}>
                      {day.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalData(false)}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Outros Modais (detalhes, criação, edição, conflito) aqui... */}
      
    </>
  );
}

const styles = StyleSheet.create({
  // Adicionei um padding geral ao container
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginTop não é mais necessário aqui, o espaçador no topo cuida disso
    paddingVertical: 8,
    backgroundColor: '#fff',
    // Removi a borda para um visual mais limpo dentro do scroll
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 0 }, // Removido margin bottom
  profBtn: { 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eee', 
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profBtnAtivo: { backgroundColor: '#1976d2' },
  profBtnTxt: { color: '#444', fontSize: 13 },
  profBtnAtivoTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  linhaHorario: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    borderBottomWidth: 1, 
    borderColor: '#eee', 
    minHeight: 40, 
    position: 'relative' 
  },
  horaTxt: { 
    width: 60, 
    color: '#888', 
    fontSize: 15, 
    paddingTop: 10 
  },
  agendamento: { 
    backgroundColor: '#e3f2fd', 
    borderRadius: 8, 
    padding: 8, 
    marginLeft: 8, 
    marginVertical: 2, 
    flex: 1, 
    minHeight: 40, 
    justifyContent: 'center' 
  },
  agendamentoTxt: { fontWeight: 'bold', color: '#1976d2' },
  agendamentoSub: { color: '#1976d2', fontSize: 13 },
  linhaBloqueada: { backgroundColor: '#f8f8f8' },
  bloqueadoOverlay: { 
    position: 'absolute', 
    left: 70, 
    right: 8, 
    top: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  bloqueadoTxt: { color: '#bdbdbd', fontStyle: 'italic', fontSize: 13 },
  fab: { 
    position: 'absolute', 
    right: 24, 
    bottom: 32, 
    backgroundColor: '#1976d2', 
    borderRadius: 32, 
    width: 56, 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4 
  },
  modalBg: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    width: '90%', 
    alignItems: 'center' 
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
  navButton: {
    padding: 5,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  calendarButton: {
    padding: 5,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    maxHeight: '80%',
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  calendarContainer: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  weekDay: {
    fontSize: 14,
    color: '#555',
    width: '14%',
    textAlign: 'center'
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.2%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#ccc',
  },
  currentMonthDay: {},
  currentMonthDayText: {
    color: '#000',
  },
  selectedDay: {
    backgroundColor: '#1976d2',
  },
  selectedDayText: {
    color: '#fff',
  },
  todayDay: {
    borderColor: '#1976d2',
    borderWidth: 1,
  },
  todayDayText: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  selectionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  selectionArrow: {
    fontSize: 16,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#555',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1000,
  },
  dropdownScroll: {
    borderRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  horarioContainer: {
    marginTop: 10,
    marginBottom: 10,
    zIndex: 500,
  },
  horarioLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  horarioBox: {
    width: '45%',
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  horarioSeparator: {
    fontSize: 20,
    color: '#666',
  },
});
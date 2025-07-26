import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CheckoutModal } from '../../components/CheckoutModal';
import { useAuthStore } from '../../contexts/useAuthStore';
import { useSalaoInfo } from '../../hooks/useSalaoInfo';
import { db } from '../../services/firebase';
import { lancarVendaProdutoFinanceiro } from '../../utils/lancamentoFinanceiro';
import { AppointmentDetailsSheet } from '../components/modals/AppointmentDetailsSheet';
import { EditAppointmentModal } from '../components/modals/EditAppointmentModal';
import { NewAppointmentModal } from '../components/modals/NewAppointmentModal';
import { ScheduleBlockModal } from '../components/modals/ScheduleBlockModal';
import TimeGridBackground from '../components/TimeGridBackground';
import { Colors, Shadows, Spacing, Typography } from '../constants/DesignSystem';
// ... Interfaces (Appointment, Professional, etc.) ...

const HOUR_HEIGHT = 80;
const START_HOUR = 7;
const END_HOUR = 22;

// Função utilitária para agrupar agendamentos sobrepostos e atribuir colunas
function getAppointmentColumns(appointments: any[]): { col: number; totalCols: number }[] {
  // Ordena por início
  const sorted = appointments.map((appt, idx) => ({...appt, _idx: idx})).sort((a, b) => {
    const aStart = new Date(a.data);
    const bStart = new Date(b.data);
    return aStart.getTime() - bStart.getTime();
  });
  const columns = Array(sorted.length).fill(0);
  const groups: number[][] = [];
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const aStart = new Date(a.data);
    const aEnd = new Date(aStart.getTime() + (Number(a.servicoDuracao) || 60) * 60000);
    let group: number[] = [i];
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue;
      const b = sorted[j];
      const bStart = new Date(b.data);
      const bEnd = new Date(bStart.getTime() + (Number(b.servicoDuracao) || 60) * 60000);
      if (aStart < bEnd && aEnd > bStart) {
        group.push(j);
      }
    }
    group = Array.from(new Set(group)).sort();
    // Só adiciona se não for subconjunto de outro grupo
    if (!groups.some(g => group.every(idx => g.includes(idx)))) {
      groups.push(group);
    }
  }
  // Para cada grupo, atribuir colunas
  groups.forEach(group => {
    group.forEach((idx, colIdx) => {
      columns[idx] = Math.max(columns[idx], colIdx);
    });
  });
  // Para cada agendamento, retorna {col, totalCols}
  const colInfo = sorted.map((appt, idx) => {
    // Descobrir a qual grupo pertence
    const group = groups.find(g => g.includes(idx)) || [idx];
    return {
      col: columns[idx],
      totalCols: group.length,
      originalIdx: appt._idx,
    };
  });
  // Mapear de volta para a ordem original
  const result = Array(appointments.length);
  colInfo.forEach(info => {
    result[info.originalIdx] = { col: info.col, totalCols: info.totalCols };
  });
  return result;
}

// Utilitário para converter HEX para RGBA
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const DailyAgendaScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [newAppointmentModalVisible, setNewAppointmentModalVisible] = useState(false);
  const [editAppointmentModalVisible, setEditAppointmentModalVisible] = useState(false);
  const [scheduleBlockModalVisible, setScheduleBlockModalVisible] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; duration: number; cor?: string; valor: number }[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [editBlockModal, setEditBlockModal] = useState<{ visible: boolean, block: any | null }>({ visible: false, block: null });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [vendaRapidaVisible, setVendaRapidaVisible] = useState(false);

  // Estado para horário de funcionamento
  const [horarioFuncionamento, setHorarioFuncionamento] = useState<any[]>([]);
  const [loadingHorario, setLoadingHorario] = useState(true);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { user } = useAuthStore();
  const { salaoInfo } = useSalaoInfo();

  useEffect(() => {
    if (!user?.idSalao) return;
    // Buscar clientes do salão do usuário logado
    const clientesRef = collection(db, 'saloes', user.idSalao, 'clientes');
    const unsubscribe = onSnapshot(clientesRef, snapshot => {
      setClients(snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, name: data.name || data.nome, telefone: data.telefone || '' };
      }));
    });
    // Buscar serviços do salão do usuário logado
    const servicosRef = collection(db, 'saloes', user.idSalao, 'servicos');
    const unsubscribeServicos = onSnapshot(servicosRef, snapshot => {
      const servicosAtivos = snapshot.docs
        .map(doc => {
          const data = doc.data();
          if (data.ativo === false) return null;
          return doc;
        })
        .filter(Boolean) as typeof snapshot.docs;
      setServices(servicosAtivos.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.nome,
          duration: data.duracao || 60,
          cor: data.cor,
          valor: data.valor || 0,
        };
      }));
    });
    return () => {
      unsubscribe();
      unsubscribeServicos();
    };
  }, [user?.idSalao]);

  // Buscar bloqueios do dia ao abrir/alterar a data
  useEffect(() => {
    setLoadingBlocks(true);
    const dateStr = currentDate.toISOString().split('T')[0];
    const q = query(collection(db, 'bloqueios'), where('date', '==', dateStr));
    getDocs(q).then(snapshot => {
      setScheduleBlocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingBlocks(false);
    });
  }, [currentDate]);

  // Buscar horário de funcionamento ao carregar agenda
  useEffect(() => {
    if (!user?.idSalao) return setLoadingHorario(false);
    const ref = doc(db, 'configuracoes', `horario_funcionamento_${user.idSalao}`);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.dias)) {
          // Ordenar dias: domingo=0, segunda=1, ..., sábado=6
          const ordem = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
          const diasOrdenados = ordem.map(diaKey => data.dias.find((d: any) => d.dia === diaKey) || { dia: diaKey, ativo: false, inicio: '08:00', fim: '18:00' });
          setHorarioFuncionamento(diasOrdenados);
        }
      }
      setLoadingHorario(false);
    });
    return () => unsubscribe();
  }, [user?.idSalao]);

  // Carregar agendamentos do dia selecionado
  useEffect(() => {
    if (!user?.idSalao) return;
    
    setLoadingAppointments(true);
    
    // Formatar data para filtro
    const dateStr = currentDate.toLocaleDateString('pt-BR').split('/').reverse().join('-');
    
    const agendamentosRef = collection(db, 'saloes', user.idSalao, 'agendamentos');
    
    // Buscar todos os agendamentos e filtrar por data no cliente
    const unsubscribe = onSnapshot(agendamentosRef, (snapshot) => {
      const agendamentos = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
      
      // Filtrar agendamentos do dia selecionado
      const agendamentosDoDia = agendamentos
         .filter((agendamento: any) => {
           // Só mostrar agendamentos ativos (não cancelados)
           if (agendamento.status === 'cancelado') {
             return false;
           }
           
           // Converter a data para verificar se é do dia selecionado
           let agendamentoDate;
           if (agendamento.data.includes('Z')) {
             // Data em UTC, converter para local
             agendamentoDate = new Date(agendamento.data);
           } else {
             // Data já em horário local - criar data local
             const [datePart, timePart] = agendamento.data.split('T');
             const [year, month, day] = datePart.split('-').map(Number);
             const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
             agendamentoDate = new Date(year, month - 1, day, hour, minute, second);
           }
           
           // Comparar apenas a data (sem timezone)
           const agendamentoDateStr = agendamentoDate.toLocaleDateString('pt-BR').split('/').reverse().join('-');
           
           return agendamentoDateStr === dateStr;
         });
      
      setAppointments(agendamentosDoDia);
      setLoadingAppointments(false);
    });
    
    return unsubscribe;
  }, [currentDate, user?.idSalao]);

  // Usar estados reais
  const allAppointments = appointments;
  const allScheduleBlocks = scheduleBlocks;
  const professionals: any[] = [{ id: '1', name: 'Maria Silva' }, { id: '2', name: 'João Santos' }];

  // Remover os arrays mocks de clients e services

  // Ao abrir o painel de detalhes, mapear os campos corretamente
  const handleAppointmentPress = (appointment: any) => {
    setSelectedAppointment({
      ...appointment,
      clienteNome: appointment.clienteNome || appointment.cliente || '',
      servicoNome: appointment.servicoNome || appointment.servico || '',
      telefone: appointment.telefone || '',
      profissionalNome: appointment.profissionalNome || appointment.profissional || '',
      data: appointment.data,
    });
    bottomSheetModalRef.current?.present();
  };

  const handleDateChange = (offset: number) => {
    setShowFABMenu(false);
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + offset);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    // Usar data diretamente sem conversão de timezone
    const localDate = new Date(date);
    
    // Mapeamento de meses em português
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Mapeamento de dias da semana em português
    const diasSemana = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    
    const dia = localDate.getDate();
    const mes = meses[localDate.getMonth()];
    const diaSemana = diasSemana[localDate.getDay()];
    
    return `${diaSemana}, ${dia} de ${mes}`;
  };

  // Handlers dos FABs
  const handleNovoAgendamento = () => {
    setShowFABMenu(false);
    // Verificar se o dia está ativo
    if (!loadingHorario && horarioFuncionamento.length > 0) {
      const diaSemana = currentDate.getDay(); // 0=domingo, 1=segunda...
      const diaConfig = horarioFuncionamento[diaSemana];
      if (!diaConfig?.ativo) {
        Alert.alert(
          'Fora do Horário de Funcionamento',
          'Este dia está marcado como sem expediente. Deseja prosseguir?',
          [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', style: 'default', onPress: () => setNewAppointmentModalVisible(true) },
          ]
        );
        return;
      }
    }
    setNewAppointmentModalVisible(true);
  };
  const handleBloquearHorario = () => {
    setShowFABMenu(false);
    setScheduleBlockModalVisible(true);
  };
  const handleVendaRapida = () => {
    setShowFABMenu(false);
    setVendaRapidaVisible(true);
  };

  // Fechamento do painel de detalhes
  const handleCloseDetails = () => {
    setSelectedAppointment(null);
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current.close();
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !user?.idSalao) return;
    
    try {
      console.log('🗑️ Cancelando agendamento:', selectedAppointment.id);
      
      // Atualizar status para cancelado
      const agendamentoRef = doc(db, 'saloes', user.idSalao, 'agendamentos', selectedAppointment.id);
      await updateDoc(agendamentoRef, {
        status: 'cancelado',
        canceladoEm: new Date(),
        canceladoPor: user.email || user.uid,
      });
      
      console.log('✅ Agendamento cancelado com sucesso');
      handleCloseDetails();
      
    } catch (error: any) {
      console.error('❌ Erro ao cancelar agendamento:', error);
      alert('Erro ao cancelar agendamento: ' + (error.message || error));
    }
  };

  const handleNoShow = async () => {
    if (!selectedAppointment || !user?.idSalao) return;
    
    try {
      console.log('❌ Marcando agendamento como No-Show:', selectedAppointment.id);
      
      // Atualizar status para no-show e adicionar observação
      const agendamentoRef = doc(db, 'saloes', user.idSalao, 'agendamentos', selectedAppointment.id);
      const observacaoAtual = selectedAppointment.observacoes || '';
      const novaObservacao = observacaoAtual 
        ? `${observacaoAtual}\n\n[NO-SHOW] Cliente não compareceu - ${new Date().toLocaleString('pt-BR')}`
        : `[NO-SHOW] Cliente não compareceu - ${new Date().toLocaleString('pt-BR')}`;
      
      await updateDoc(agendamentoRef, {
        status: 'no-show',
        observacoes: novaObservacao,
        noShowEm: new Date(),
        noShowPor: user.email || user.uid,
      });
      
      console.log('✅ Agendamento marcado como No-Show com sucesso');
      handleCloseDetails();
      
    } catch (error: any) {
      console.error('❌ Erro ao marcar No-Show:', error);
      alert('Erro ao marcar No-Show: ' + (error.message || error));
    }
  };

  const handleEditAppointment = () => {
    setEditAppointmentModalVisible(true);
    handleCloseDetails();
  };

  const handleSaveEditAppointment = async (appointmentData: any) => {
    try {
      console.log('✏️ Editando agendamento:', appointmentData);
      
      if (!user?.idSalao) {
        console.error('❌ idSalao não encontrado');
        return;
      }

      // Buscar dados do cliente e serviço
      const cliente = clients.find(c => c.id === appointmentData.clientId);
      const servico = services.find(s => s.id === appointmentData.serviceId);
      
      if (!cliente || !servico) {
        console.error('❌ Cliente ou serviço não encontrado');
        return;
      }

      // Atualizar documento do agendamento
      const agendamentoRef = doc(db, 'saloes', user.idSalao, 'agendamentos', appointmentData.id);
      await updateDoc(agendamentoRef, {
        clienteId: appointmentData.clientId,
        clienteNome: cliente.name,
        servicoId: appointmentData.serviceId,
        servicoNome: servico.name,
        servicoDuracao: servico.duration,
        data: appointmentData.date,
        observacoes: appointmentData.notes || '',
        editadoEm: new Date(),
        editadoPor: user.email || user.uid,
      });
      
      console.log('✅ Agendamento editado com sucesso!');
      setEditAppointmentModalVisible(false);
      
    } catch (error: any) {
      console.error('❌ Erro ao editar agendamento:', error);
      alert('Erro ao editar agendamento: ' + (error.message || error));
    }
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    try {
      if (!user?.idSalao) {
        console.error('❌ idSalao não encontrado');
        return;
      }
      // Buscar dados do cliente e serviço
      const cliente = clients.find(c => c.id === appointmentData.clientId);
      const servico = services.find(s => s.id === appointmentData.serviceId);
      if (!cliente || !servico) {
        console.error('❌ Cliente ou serviço não encontrado');
        return;
      }
      // --- VERIFICAÇÃO DE HORÁRIO DE FUNCIONAMENTO ---
      if (!loadingHorario && horarioFuncionamento.length > 0) {
        const dataAg = new Date(appointmentData.date);
        const diaSemana = dataAg.getDay();
        const diaConfig = horarioFuncionamento[diaSemana];
        const horaAg = dataAg.getHours();
        const minAg = dataAg.getMinutes();
        let podeAgendar = true;
        if (!diaConfig?.ativo) {
          podeAgendar = false;
        } else {
          // Verifica se está dentro do horário
          const [inicioH, inicioM] = (diaConfig.inicio || '08:00').split(':').map(Number);
          const [fimH, fimM] = (diaConfig.fim || '18:00').split(':').map(Number);
          const agMin = horaAg * 60 + minAg;
          const iniMin = inicioH * 60 + inicioM;
          const fimMin = fimH * 60 + fimM;
          if (agMin < iniMin || agMin >= fimMin) {
            podeAgendar = false;
          }
        }
        if (!podeAgendar) {
          let continuar = false;
          await new Promise(resolve => {
            Alert.alert(
              'Fora do Horário de Funcionamento',
              'Este horário está fora do expediente. Deseja prosseguir?',
              [
                { text: 'Não', style: 'cancel', onPress: () => { continuar = false; resolve(null); } },
                { text: 'Sim', style: 'default', onPress: () => { continuar = true; resolve(null); } },
              ]
            );
          });
          if (!continuar) return;
        }
      }
      // --- VERIFICAÇÃO DE CONFLITO DE HORÁRIO ---
      const newStart = new Date(appointmentData.date);
      const newEnd = new Date(newStart.getTime() + (servico.duration || 60) * 60000);
      const conflito = appointments.some(appt => {
        if (appt.status === 'cancelado') return false;
        let apptStart;
        if (appt.data.includes('Z')) {
          apptStart = new Date(appt.data);
        } else {
          const [datePart, timePart] = appt.data.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
          apptStart = new Date(year, month - 1, day, hour, minute, second);
        }
        const apptEnd = new Date(apptStart.getTime() + (Number(appt.servicoDuracao) || 60) * 60000);
        return newStart < apptEnd && newEnd > apptStart;
      });
      if (conflito) {
        let continuar = false;
        await new Promise(resolve => {
          Alert.alert(
            'Conflito de Horário',
            'Já existe um agendamento nesse horário. Deseja continuar mesmo assim?',
            [
              { text: 'Não', style: 'cancel', onPress: () => { continuar = false; resolve(null); } },
              { text: 'Sim', style: 'default', onPress: () => { continuar = true; resolve(null); } },
            ]
          );
        });
        if (!continuar) return;
      }
      // --- FIM VERIFICAÇÃO DE CONFLITO ---
      const agendamentoData = {
        clienteId: appointmentData.clientId,
        clienteNome: cliente.name,
        servicoId: appointmentData.serviceId,
        servicoNome: servico.name,
        servicoDuracao: servico.duration,
        servicoValor: appointmentData.servicoValor ?? servico.valor,
        data: appointmentData.date,
        observacoes: appointmentData.notes || '',
        status: 'agendado',
        criadoEm: new Date(),
        criadoPor: user.email || user.uid,
      };
      const agendamentosRef = collection(db, 'saloes', user.idSalao, 'agendamentos');
      const docRef = await addDoc(agendamentosRef, agendamentoData);
      setNewAppointmentModalVisible(false);

      // --- INTEGRAÇÃO WHATSAPP ---
      try {
        // Buscar mensagem de confirmação personalizada (caminho novo)
        const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'mensagensWhatsapp');
        const snap = await getDoc(ref);
        if (!snap.exists() || !snap.data().confirmacao) {
          alert('Nenhuma mensagem de confirmação configurada. Edite em Configurações > Mensagens Automáticas.');
          return;
        }
        let mensagem = snap.data().confirmacao;
        // Substituir tags
        const dataAg = new Date(appointmentData.date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const dataFormatada = `${pad(dataAg.getDate())}/${pad(dataAg.getMonth()+1)}/${dataAg.getFullYear()}`;
        const horaFormatada = `${pad(dataAg.getHours())}:${pad(dataAg.getMinutes())}`;
        mensagem = mensagem
          .replace(/\[NOME\]/g, cliente.name)
          .replace(/\[SERVIÇO\]/g, servico.name)
          .replace(/\[PROFISSIONAL\]/g, (servico as any).profissional || '')
          .replace(/\[DATA\]/g, dataFormatada)
          .replace(/\[HORA\]/g, horaFormatada)
          .replace(/\[ENDEREÇO\]/g, (salaoInfo && (salaoInfo as any).endereco) || '');
        // Montar link WhatsApp
        let numero = (cliente as any).telefone || (cliente as any).celular || '';
        numero = numero.replace(/\D/g, '');
        // Aceitar números com 10 (fixo) ou 11 (celular) dígitos
        if (numero.length === 10 || numero.length === 11) {
          numero = '55' + numero;
        } else if ((numero.length === 12 || numero.length === 13) && numero.startsWith('55')) {
          // já está correto
        } else {
          alert('Telefone do cliente inválido para WhatsApp: ' + ((cliente as any).telefone || ''));
          console.log('Telefone do cliente inválido:', (cliente as any).telefone);
          return;
        }
        const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
        console.log('DEBUG url WhatsApp:', url);
        Linking.openURL(url);
      } catch (e) {
        console.warn('Não foi possível abrir o WhatsApp:', e);
      }
    } catch (error: any) {
      alert('Erro ao salvar agendamento: ' + (error.message || error));
    }
  };

  const handleSaveBlock = async (blockData: any) => {
    try {
      // Garante o formato correto do campo date
      const dateStr = (blockData.date || currentDate.toISOString().split('T')[0]).slice(0, 10);
      await addDoc(collection(db, 'bloqueios'), { ...blockData, date: dateStr });
    } catch (e: any) {
      alert('Erro ao salvar bloqueio: ' + (e.message || e));
    }
  };

  const handleBlockPress = (block: any) => {
    setEditBlockModal({ visible: true, block });
  };

  const handleUpdateBlock = async (updatedBlock: any) => {
    if (!updatedBlock.id) return;
    // Garante que o campo date está correto
    const dateStr = (updatedBlock.date || currentDate.toISOString().split('T')[0]).slice(0, 10);
    const ref = doc(db, 'bloqueios', updatedBlock.id);
    await updateDoc(ref, { ...updatedBlock, date: dateStr });
    setEditBlockModal({ visible: false, block: null });
  };
  const handleDeleteBlock = async (block: any) => {
    if (!block.id) return;
    try {
      const ref = doc(db, 'bloqueios', block.id);
      await deleteDoc(ref);
      setEditBlockModal({ visible: false, block: null });
      // Forçar recarregamento dos bloqueios
      const dateStr = currentDate.toISOString().split('T')[0];
      const q = query(collection(db, 'bloqueios'), where('date', '==', dateStr));
      const snapshot = await getDocs(q);
      setScheduleBlocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) {
      alert('Erro ao excluir bloqueio: ' + (e.message || e));
    }
  };

  // Antes do appointments.map
  const appointmentColumns = getAppointmentColumns(appointments);

  // Função para garantir o valor correto do serviço no checkout
  const getCheckoutValue = () => {
    if (checkoutData?.servicoValor && Number(checkoutData.servicoValor) > 0) {
      return Number(checkoutData.servicoValor);
    }
    const servico = services.find(s => s.id === checkoutData?.servicoId);
    return servico?.valor || 0;
  };

  // Formas de pagamento dinâmicas do Firestore
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.idSalao) return;
    const paymentIcons: Record<string, string> = {
      Dinheiro: 'dollar-sign',
      Pix: 'smartphone',
      Débito: 'credit-card',
      Crédito: 'credit-card',
    };
    for (let i = 2; i <= 12; i++) paymentIcons[`Crédito ${i}x`] = 'credit-card';
    const formasPagamentoRef = collection(db, 'saloes', user.idSalao, 'formasPagamento');
    const q = query(formasPagamentoRef, where('ativo', '==', true));
    getDocs(q).then(snapshot => {
      setFormasPagamento(snapshot.docs.map(doc => ({
        id: doc.id,
        label: doc.data().nome,
        icon: paymentIcons[doc.data().nome] || 'credit-card',
        taxa: doc.data().taxa ?? 0, // Corrigido: inclui o campo taxa
      })));
    });
  }, [user?.idSalao]);

  // Componente Venda Rápida
  const VendaRapidaModal = ({ visible, onClose, idSalao, formasPgto, userId }: { visible: boolean, onClose: () => void, idSalao: string, formasPgto: any[], userId: string }) => {
    const [produtos, setProdutos] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
    const [valorVenda, setValorVenda] = useState('');
    const [formaPgto, setFormaPgto] = useState(formasPgto[0] || null);
    const [loading, setLoading] = useState(false);
    // Buscar produtos ao abrir
    React.useEffect(() => {
      if (!visible || !idSalao) return;
      async function fetchProdutos() {
        const q = query(collection(db, 'saloes', idSalao, 'produtos'), orderBy('nome'));
        const snap = await getDocs(q);
        setProdutos(snap.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          precoVenda: Number(doc.data().precoVenda) || 0,
          precoCompra: Number(doc.data().precoCompra) || 0,
        })));
      }
      fetchProdutos();
      setProdutoSelecionado(null);
      setValorVenda('');
    }, [visible, idSalao]);
    const handleConcluir = async () => {
      if (!produtoSelecionado || !valorVenda || !formaPgto) return;
      setLoading(true);
      const valorTotalDaVenda = Number(valorVenda);
      const formaDePagamentoSelecionada = formaPgto;
      let valorDaTaxa = 0;
      const taxaRaw = Number(formaDePagamentoSelecionada.taxa);
      if (!isNaN(taxaRaw) && taxaRaw > 0) {
        const taxaPercentual = taxaRaw / 100;
        valorDaTaxa = valorTotalDaVenda * taxaPercentual;
      }
      // Lançar receita BRUTA
      await lancarVendaProdutoFinanceiro({
        nome: produtoSelecionado.nome,
        valorVenda: valorTotalDaVenda,
        valorCompra: produtoSelecionado.precoCompra,
        idSalao,
        data: new Date(),
        userId,
      });
      // Lançar despesa de taxa, se houver
      if (valorDaTaxa > 0.0001 && idSalao) {
        const despesasRef = collection(db, 'saloes', idSalao, 'despesas');
        await addDoc(despesasRef, {
          nome: `Taxa - ${formaDePagamentoSelecionada.label}`,
          valor: valorDaTaxa,
          categoria: 'Taxas de Operadora',
          data: new Date(),
        });
      }
      setLoading(false);
      onClose();
    };
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Venda Rápida</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Produto</Text>
          <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 16 }}>
            <Picker
              selectedValue={produtoSelecionado?.id || ''}
              onValueChange={id => {
                const p = produtos.find(prod => prod.id === id);
                setProdutoSelecionado(p || null);
                setValorVenda(p ? String(p.precoVenda) : '');
              }}
              style={{ height: 48, fontSize: 13 }}
              itemStyle={{ fontSize: 13 }}
            >
              <Picker.Item label="Selecione um produto..." value="" style={{ fontSize: 13 }} />
              {produtos.map(p => (
                <Picker.Item key={p.id} label={`${p.nome} (Venda: R$${Number(p.precoVenda).toFixed(2)} | Custo: R$${Number(p.precoCompra).toFixed(2)})`} value={p.id} style={{ fontSize: 13 }} />
              ))}
            </Picker>
          </View>
          {produtoSelecionado && (
            <>
              <Text style={{ marginTop: 16, fontWeight: 'bold' }}>Valor de Venda</Text>
              <TextInput
                value={valorVenda}
                onChangeText={setValorVenda}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, marginBottom: 12, marginTop: 4 }}
              />
            </>
          )}
          {/* Seleção de forma de pagamento */}
          <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Forma de Pagamento</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {formasPgto.map(f => (
              <TouchableOpacity key={f.id} style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: formaPgto?.id === f.id ? Colors.primary : Colors.border, marginRight: 8, marginBottom: 8, backgroundColor: formaPgto?.id === f.id ? Colors.primary + '22' : '#fff' }} onPress={() => setFormaPgto(f)}>
                <Text style={{ color: formaPgto?.id === f.id ? Colors.primary : Colors.textPrimary }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title={loading ? 'Salvando...' : 'Concluir Venda'} onPress={handleConcluir} color={Colors.success} disabled={!produtoSelecionado || !valorVenda || !formaPgto || loading} />
          <Button title="Fechar" onPress={onClose} color={Colors.primary} />
        </View>
      </Modal>
    );
  };

  // Overlay visual para dias inativos
  const diaSemanaAtual = currentDate.getDay();
  const diaConfigAtual = horarioFuncionamento[diaSemanaAtual];
  const isDiaInativo = !loadingHorario && horarioFuncionamento.length > 0 && !diaConfigAtual?.ativo;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          {/* HEADER ... igual ao anterior ... */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
                <Text style={styles.headerTitle}>Agenda</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => setCalendarVisible(true)}>
                        <Feather name="calendar" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: 16 }}>
                        <Feather name="bell" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.dateSelector}>
              <TouchableOpacity onPress={() => handleDateChange(-1)} style={styles.arrowButton}>
                  <Feather name="chevron-left" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
              <TouchableOpacity onPress={() => handleDateChange(1)} style={styles.arrowButton}>
                  <Feather name="chevron-right" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* CORPO DA AGENDA */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {isDiaInativo && (
              <View style={{
                position: 'absolute',
                left: 0, right: 0, top: 0, bottom: 0,
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                {/* Linhas diagonais suaves */}
                {[...Array(20)].map((_, i) => (
                  <View key={i} style={{
                    position: 'absolute',
                    left: -400 + i * 40,
                    top: 0,
                    width: 2,
                    height: '100%',
                    backgroundColor: '#e0e0e0',
                    opacity: 0.25,
                    transform: [{ rotate: '20deg' }],
                  }} />
                ))}
                <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
                  <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 18, backgroundColor: '#fff8', padding: 8, borderRadius: 8 }}>Dia sem expediente</Text>
                </View>
              </View>
            )}
            <View style={{ minHeight: (END_HOUR - START_HOUR) * HOUR_HEIGHT + 100, position: 'relative' }}>
              <TimeGridBackground startHour={START_HOUR} endHour={END_HOUR} hourHeight={HOUR_HEIGHT} topOffset={50} />
              {/* Renderizar bloqueios do dia */}
              {loadingBlocks ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Carregando bloqueios...</Text>
                </View>
              ) : (
                scheduleBlocks.map((block, idx) => {
                  // Calcular posição e altura
                  const [startHour, startMinute] = block.startTime.split(':').map(Number);
                  const [endHour, endMinute] = block.endTime.split(':').map(Number);
                  const startY = ((startHour + startMinute / 60) - START_HOUR) * HOUR_HEIGHT + 50;
                  const endY = ((endHour + endMinute / 60) - START_HOUR) * HOUR_HEIGHT + 50;
                  const height = Math.max(20, endY - startY);
                  return (
                    <View key={block.id || idx} style={{ position: 'absolute', left: 76, right: 16, top: startY, height }}>
                      <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }} onPress={() => handleBlockPress(block)}>
                        <View style={{
                          flexDirection: 'row',
                          backgroundColor: Colors.cardBackground,
                          borderRadius: 12,
                          marginVertical: 2,
                          ...Shadows.card,
                          alignItems: 'center',
                          height: '100%',
                          overflow: 'hidden',
                          borderLeftWidth: 4,
                          borderLeftColor: '#B0B0B0',
                        }}>
                          <View style={{ padding: 16, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Feather name="lock" size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                              <Text style={{ ...Typography.BodySemibold, color: Colors.textPrimary }}>{block.reason}</Text>
                            </View>
                            <Text style={{ ...Typography.Caption, color: Colors.textSecondary }}>
                              {block.startTime} - {block.endTime}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
              
              {/* Renderizar agendamentos do dia */}
              {loadingAppointments ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Carregando agendamentos...</Text>
                </View>
                            ) : (
                appointments.map((appointment, idx) => {
                  // Calcular posição e altura baseado na data do agendamento
                  // Se a data não tem Z, é horário local, se tem Z, converter para local
                  let appointmentDate;
                  if (appointment.data.includes('Z')) {
                    // Data em UTC, converter para local
                    appointmentDate = new Date(appointment.data);
                  } else {
                    // Data já em horário local - criar data local
                    const [datePart, timePart] = appointment.data.split('T');
                    const [year, month, day] = datePart.split('-').map(Number);
                    const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
                    appointmentDate = new Date(year, month - 1, day, hour, minute, second);
                  }
                  
                  const startHour = appointmentDate.getHours();
                  const startMinute = appointmentDate.getMinutes();
                  const duration = Number(appointment.servicoDuracao) || 60; // duração em minutos
                  
                  const startY = ((startHour + startMinute / 60) - START_HOUR) * HOUR_HEIGHT + 50;
                  const endY = ((startHour + (startMinute + duration) / 60) - START_HOUR) * HOUR_HEIGHT + 50;
                  const height = Math.max(20, endY - startY);
                  
                  const colInfo = appointmentColumns[idx] || { col: 0, totalCols: 1 };
                  const totalWidth = 320; // ajuste conforme largura real disponível (right - left)
                  const colWidth = totalWidth / colInfo.totalCols;
                  const leftOffset = 76 + colInfo.col * colWidth;
                  
                  // Buscar cor do serviço
                  const servico = services.find(s => s.id === appointment.servicoId);
                  const corServico = servico && servico.cor ? servico.cor : Colors.primary;
                  const corSuave = hexToRgba(corServico, 0.5);
                  return (
                    <View key={appointment.id || idx} style={{ position: 'absolute', left: leftOffset, width: colWidth - 8, right: undefined, top: startY, height }}>
                      <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }} onPress={() => handleAppointmentPress(appointment)}>
                        <View style={{
                          flexDirection: 'row',
                          backgroundColor: appointment.status === 'no-show' ? '#EF4444' : corSuave,
                          borderRadius: 12,
                          marginVertical: 2,
                          ...Shadows.card,
                          alignItems: 'center',
                          height: '100%',
                          overflow: 'hidden',
                          borderLeftWidth: 4,
                          borderLeftColor: appointment.status === 'no-show' ? '#DC2626' : corSuave,
                        }}>
                          <View style={{ padding: 16, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Feather 
                                name={appointment.status === 'no-show' ? 'user-x' : 'calendar'} 
                                size={16} 
                                color="#fff" 
                                style={{ marginRight: 6 }} 
                              />
                              <Text style={{ ...Typography.BodySemibold, color: '#fff' }}>
                                {appointment.clienteNome}
                                {appointment.status === 'no-show' && ' (No-Show)'}
                              </Text>
                            </View>
                            <Text style={{ ...Typography.Caption, color: '#fff', opacity: 0.9 }}>
                              {appointment.servicoNome} • {appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* FAB */}
          <View style={styles.fabContainer}>
            {showFABMenu && (
              <View style={styles.fabMenu}>
                <TouchableOpacity style={styles.fabMenuItem} onPress={handleNovoAgendamento}>
                  <Text style={styles.fabMenuItemText}>Novo Agendamento</Text>
                  <View style={styles.fabIconWrapper}><Feather name="calendar" size={20} color={Colors.primary} /></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabMenuItem} onPress={handleBloquearHorario}>
                  <Text style={styles.fabMenuItemText}>Bloquear Horário</Text>
                  <View style={styles.fabIconWrapper}><Feather name="lock" size={20} color={Colors.primary} /></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabMenuItem} onPress={handleVendaRapida}>
                  <Text style={styles.fabMenuItemText}>Venda Rápida</Text>
                  <View style={styles.fabIconWrapper}><Feather name="shopping-cart" size={20} color={Colors.primary} /></View>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.fab} onPress={() => setShowFABMenu(!showFABMenu)}>
              <Feather name={showFABMenu ? "x" : "plus"} size={28} color={Colors.textOnPrimary} />
            </TouchableOpacity>
          </View>

          {/* MODAIS */}
          <NewAppointmentModal
            isVisible={newAppointmentModalVisible}
            onClose={() => setNewAppointmentModalVisible(false)}
            onSave={handleSaveAppointment}
            clients={clients}
            services={services}
            selectedDate={currentDate}
          />
          <EditAppointmentModal
            isVisible={editAppointmentModalVisible}
            onClose={() => setEditAppointmentModalVisible(false)}
            onSave={handleSaveEditAppointment}
            clients={clients}
            services={services}
            appointment={selectedAppointment}
          />
          <ScheduleBlockModal
            isVisible={scheduleBlockModalVisible}
            onClose={() => setScheduleBlockModalVisible(false)}
            onSave={handleSaveBlock}
          />
          <Modal transparent visible={calendarVisible} onRequestClose={() => setCalendarVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' }}>
                <Text style={{ ...Typography.H2, color: Colors.textPrimary, marginBottom: 16 }}>Selecionar Data</Text>
                
                {/* Calendário Personalizado em Português */}
                <View style={styles.customCalendar}>
                  {/* Header do Mês */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity 
                      onPress={() => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setCurrentDate(newDate);
                      }}
                      style={styles.calendarArrow}
                    >
                      <Feather name="chevron-left" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.calendarMonthText}>
                      {(() => {
                        const meses = [
                          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                        ];
                        return `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                      })()}
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setCurrentDate(newDate);
                      }}
                      style={styles.calendarArrow}
                    >
                      <Feather name="chevron-right" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Dias da Semana */}
                  <View style={styles.calendarWeekDays}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                      <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
                    ))}
                  </View>
                  
                  {/* Dias do Mês */}
                  <View style={styles.calendarDays}>
                    {(() => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay());
                      
                      const days = [];
                      const today = new Date();
                      const selectedDateStr = currentDate.toLocaleDateString('pt-BR').split('/').reverse().join('-');
                      
                      for (let i = 0; i < 42; i++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + i);
                        
                        const isCurrentMonth = date.getMonth() === month;
                        const isToday = date.toDateString() === today.toDateString();
                        const isSelected = date.toDateString() === currentDate.toDateString();
                        
                        days.push(
                          <TouchableOpacity
                            key={i}
                            onPress={() => {
                              setCurrentDate(date);
                              setCalendarVisible(false);
                            }}
                            style={[
                              styles.calendarDay,
                              isCurrentMonth && styles.calendarDayCurrentMonth,
                              isToday && styles.calendarDayToday,
                              isSelected && styles.calendarDaySelected
                            ]}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              isCurrentMonth && styles.calendarDayTextCurrentMonth,
                              isToday && styles.calendarDayTextToday,
                              isSelected && styles.calendarDayTextSelected
                            ]}>
                              {date.getDate()}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      return days;
                    })()}
                  </View>
                </View>
                
                <TouchableOpacity onPress={() => setCalendarVisible(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
                  <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* PAINEL DE DETALHES */}
          <AppointmentDetailsSheet
            ref={bottomSheetModalRef}
            appointment={selectedAppointment ? {
              clientName: selectedAppointment.clienteNome || selectedAppointment.clientName || '',
              serviceName: selectedAppointment.servicoNome || selectedAppointment.serviceName || '',
              value: selectedAppointment.valor || selectedAppointment.value || '',
              time: selectedAppointment.data || selectedAppointment.time || '',
              telefone: selectedAppointment.telefone || (clients.find(c => c.id === selectedAppointment.clienteId) as any)?.telefone || '',
              profissionalNome: selectedAppointment.profissionalNome || '',
              ...selectedAppointment,
            } : undefined}
            onDismiss={handleCloseDetails}
            onCheckoutRequest={(appointment) => {
              setCheckoutData(appointment);
              setCheckoutModalVisible(true);
            }}
            onCheckout={handleCloseDetails}
            onNoShow={handleNoShow}
            onEdit={typeof handleEditAppointment === 'function' && selectedAppointment?.status !== 'completed' ? handleEditAppointment : undefined}
            onCancel={handleCancelAppointment}
            onSendConfirmation={async () => {
              if (!selectedAppointment) return;
              try {
                // Buscar mensagem de lembrete personalizada (caminho novo)
                const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'mensagensWhatsapp');
                const snap = await getDoc(ref);
                if (!snap.exists() || !snap.data().lembrete) {
                  Alert.alert('Nenhuma mensagem de lembrete configurada. Edite em Configurações > Mensagens Automáticas.');
                  return;
                }
                let mensagem = snap.data().lembrete;
                // Substituir tags
                const dataAg = new Date(selectedAppointment.data);
                const pad = (n: number) => n.toString().padStart(2, '0');
                const dataFormatada = `${pad(dataAg.getDate())}/${pad(dataAg.getMonth()+1)}/${dataAg.getFullYear()}`;
                const horaFormatada = `${pad(dataAg.getHours())}:${pad(dataAg.getMinutes())}`;
                mensagem = mensagem
                  .replace(/\[NOME\]/g, selectedAppointment.clienteNome)
                  .replace(/\[SERVIÇO\]/g, selectedAppointment.servicoNome)
                  .replace(/\[PROFISSIONAL\]/g, selectedAppointment.profissionalNome || '')
                  .replace(/\[DATA\]/g, dataFormatada)
                  .replace(/\[HORA\]/g, horaFormatada)
                  .replace(/\[ENDEREÇO\]/g, (salaoInfo && (salaoInfo as any).endereco) || '');
                // Montar link WhatsApp
                let numero = selectedAppointment.telefone || (clients.find(c => c.id === selectedAppointment.clienteId) as any)?.telefone || '';
                numero = numero.replace(/\D/g, '');
                if (numero.length === 10 || numero.length === 11) {
                  numero = '55' + numero;
                } else if ((numero.length === 12 || numero.length === 13) && numero.startsWith('55')) {
                  // já está correto
                } else {
                  Alert.alert('Telefone do cliente inválido para WhatsApp: ' + (selectedAppointment.telefone || ''));
                  return;
                }
                const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
                Linking.openURL(url);
              } catch (e) {
                Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
              }
            }}
          />

          {/* Modal de edição/exclusão de bloqueio */}
          {editBlockModal.visible && editBlockModal.block && (
            <Modal visible transparent animationType="slide" onRequestClose={() => setEditBlockModal({ visible: false, block: null })}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' }}>
                  <Text style={{ ...Typography.H2, color: Colors.textPrimary, marginBottom: 16 }}>Editar Bloqueio</Text>
                  <TextInput
                    style={{ ...Typography.Body, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, marginBottom: 16 }}
                    value={editBlockModal.block.reason}
                    onChangeText={txt => setEditBlockModal(modal => ({ ...modal, block: { ...modal.block, reason: txt } }))}
                    placeholder="Motivo"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TextInput
                      style={{ ...Typography.Body, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, flex: 1, marginRight: 8 }}
                      value={editBlockModal.block.startTime}
                      onChangeText={txt => setEditBlockModal(modal => ({ ...modal, block: { ...modal.block, startTime: txt } }))}
                      placeholder="Início (hh:mm)"
                    />
                    <TextInput
                      style={{ ...Typography.Body, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, flex: 1 }}
                      value={editBlockModal.block.endTime}
                      onChangeText={txt => setEditBlockModal(modal => ({ ...modal, block: { ...modal.block, endTime: txt } }))}
                      placeholder="Fim (hh:mm)"
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                    <TouchableOpacity onPress={() => setEditBlockModal({ visible: false, block: null })} style={{ padding: 12 }}>
                      <Text style={{ color: Colors.textSecondary }}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => { await handleUpdateBlock(editBlockModal.block); }} style={{ backgroundColor: Colors.primary, padding: 12, borderRadius: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => { await handleDeleteBlock(editBlockModal.block); }} style={{ backgroundColor: Colors.error, padding: 12, borderRadius: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* MODAL DE CHECKOUT GLOBAL */}
          <CheckoutModal
            isVisible={checkoutModalVisible}
            onClose={() => setCheckoutModalVisible(false)}
            clientName={checkoutData?.clienteNome || ''}
            totalValue={getCheckoutValue()}
            formasPgto={formasPagamento}
            idSalao={user?.idSalao}
            onFinishCheckout={async ({ finalPrice, paymentMethod, produtosVendidos }) => {
              // Atualizar status do agendamento para paid e salvar valor final e forma de pagamento
              if (checkoutData?.id && user?.idSalao) {
                const agendamentoRef = doc(db, 'saloes', user.idSalao, 'agendamentos', checkoutData.id);
                await updateDoc(agendamentoRef, {
                  status: 'paid',
                  clienteNome: checkoutData.clienteNome,
                  finalPrice: finalPrice,
                  paymentMethod: paymentMethod,
                  produtosVendidos: produtosVendidos || [],
                });
                // Lançar receita/despesa para cada produto vendido
                if (Array.isArray(produtosVendidos)) {
                  for (const p of produtosVendidos) {
                    await lancarVendaProdutoFinanceiro({
                      nome: p.nome,
                      valorVenda: p.valorEditado ?? p.precoVenda,
                      valorCompra: p.precoCompra,
                      idSalao: user.idSalao,
                      data: new Date(),
                      userId: user.id,
                    });
                  }
                }
              }
              Alert.alert('Agendamento Finalizado com Sucesso');
              setCheckoutModalVisible(false);
            }}
          />

          {/* Modal de Venda Rápida */}
          <VendaRapidaModal
            visible={vendaRapidaVisible}
            onClose={() => setVendaRapidaVisible(false)}
            idSalao={user?.idSalao}
            formasPgto={formasPagamento}
            userId={user?.id}
          />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.screenPadding, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.cardBackground },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base * 2 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
    dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.base * 2 },
    arrowButton: { padding: Spacing.base },
    dateText: { ...Typography.BodySemibold, fontSize: 18, color: Colors.textPrimary },
    fabContainer: { position: 'absolute', bottom: 32, right: 24, alignItems: 'flex-end' },
    fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.card },
    fabMenu: { alignItems: 'flex-end', marginBottom: Spacing.base * 2 },
    fabMenuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBackground, padding: Spacing.base * 1.5, borderRadius: Spacing.buttonRadius, marginBottom: Spacing.base * 1.5, ...Shadows.card },
    fabMenuItemText: { ...Typography.BodySemibold, color: Colors.textPrimary, marginRight: Spacing.base * 1.5 },
    fabIconWrapper: { backgroundColor: '#E5E5EA', borderRadius: 6, padding: 4 },

    // Estilos para o calendário personalizado
    customCalendar: {
      width: '100%',
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    calendarMonthText: {
      ...Typography.H2,
      color: Colors.textPrimary,
      fontWeight: 'bold',
    },
    calendarArrow: {
      padding: 8,
    },
    calendarWeekDays: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    calendarWeekDay: {
      ...Typography.BodySemibold,
      color: Colors.textSecondary,
      width: '14%', // Para 7 dias da semana
      textAlign: 'center',
    },
    calendarDays: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    calendarDay: {
      width: '14%', // Para 7 dias da semana
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      marginVertical: 4,
    },
    calendarDayCurrentMonth: {
      backgroundColor: Colors.cardBackground,
    },
    calendarDayToday: {
      backgroundColor: '#E3F2FD',
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    calendarDaySelected: {
      backgroundColor: Colors.primary,
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    calendarDayText: {
      ...Typography.Body,
      color: Colors.textSecondary,
    },
    calendarDayTextCurrentMonth: {
      color: Colors.textPrimary,
    },
    calendarDayTextToday: {
      color: '#fff',
    },
    calendarDayTextSelected: {
      color: '#fff',
    },
});

export default DailyAgendaScreen; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, doc, getFirestore, updateDoc } from 'firebase/firestore';

const AGENDAMENTOS_KEY = 'agendamentos_offline';
const PENDENTES_KEY = 'agendamentos_pendentes';

// Estrutura essencial do agendamento
export type Agendamento = {
  id: string;
  profissionalId: string;
  cliente: string;
  inicio: string;
  duracao: number;
  servico: string;
  valor: number;
  status: string;
  formaPagamento: string;
  obs: string;
  updatedAt: number; // timestamp para controle de conflito
  offline?: boolean; // indica se foi criado/editado offline
};

// Salva todos os agendamentos localmente
export async function salvarAgendamentosLocal(ags: Agendamento[]) {
  await AsyncStorage.setItem(AGENDAMENTOS_KEY, JSON.stringify(ags));
}

// Busca todos os agendamentos locais
export async function buscarAgendamentosLocal(): Promise<Agendamento[]> {
  const data = await AsyncStorage.getItem(AGENDAMENTOS_KEY);
  return data ? JSON.parse(data) : [];
}

// Adiciona agendamento à fila de pendentes
export async function adicionarPendente(ag: Agendamento) {
  const pendentes = await buscarPendentes();
  pendentes.push(ag);
  await AsyncStorage.setItem(PENDENTES_KEY, JSON.stringify(pendentes));
}

// Busca fila de pendentes
export async function buscarPendentes(): Promise<Agendamento[]> {
  const data = await AsyncStorage.getItem(PENDENTES_KEY);
  return data ? JSON.parse(data) : [];
}

// Remove agendamento da fila de pendentes
export async function removerPendente(id: string) {
  const pendentes = await buscarPendentes();
  const novos = pendentes.filter(a => a.id !== id);
  await AsyncStorage.setItem(PENDENTES_KEY, JSON.stringify(novos));
}

// Sincroniza pendentes com Firestore
export async function sincronizarPendentes(idSalao: string) {
  const pendentes = await buscarPendentes();
  if (!pendentes.length) return;
  const db = getFirestore();
  for (const ag of pendentes) {
    try {
      if (ag.id.startsWith('offline-')) {
        // Novo agendamento
        await addDoc(collection(db, `saloes/${idSalao}/agendamentos`), { ...ag, offline: false });
      } else {
        // Edição
        await updateDoc(doc(db, `saloes/${idSalao}/agendamentos/${ag.id}`), { ...ag, offline: false });
      }
      await removerPendente(ag.id);
    } catch (e) {
      // Se falhar, mantém na fila
      console.error('Erro ao sincronizar agendamento:', ag.id, e);
    }
  }
}

// Detecta conflitos entre local e remoto
export function detectarConflito(local: Agendamento, remoto: Agendamento) {
  return local.updatedAt > remoto.updatedAt;
}

// Exemplo de uso: await sincronizarPendentes(idSalao) ao reconectar 
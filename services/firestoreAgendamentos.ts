import { addDoc, collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore';
import { Agendamento } from './offlineAgendamentos';

// Busca todos os agendamentos do salão no Firestore
export async function buscarAgendamentosFirestore(idSalao: string): Promise<Agendamento[]> {
  const db = getFirestore();
  const snap = await getDocs(collection(db, `saloes/${idSalao}/agendamentos`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Agendamento[];
}

// Cria novo agendamento no Firestore
export async function criarAgendamentoFirestore(idSalao: string, ag: Omit<Agendamento, 'id'>): Promise<string> {
  const db = getFirestore();
  const ref = await addDoc(collection(db, `saloes/${idSalao}/agendamentos`), ag);
  return ref.id;
}

// Edita agendamento existente no Firestore
export async function editarAgendamentoFirestore(idSalao: string, ag: Agendamento) {
  const db = getFirestore();
  await updateDoc(doc(db, `saloes/${idSalao}/agendamentos/${ag.id}`), ag);
} 
// Utilitário para lançar receita e despesa de venda de produto no Firestore
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

interface LancarVendaProdutoParams {
  nome: string;
  valorVenda: number;
  valorCompra: number;
  idSalao: string;
  data?: Date;
  userId?: string;
}

export async function lancarVendaProdutoFinanceiro({ nome, valorVenda, idSalao, data, userId }: LancarVendaProdutoParams) {
  const dataLanc = data || new Date();
  // Receita
  await addDoc(collection(db, 'saloes', idSalao, 'receitas'), {
    nome: `Venda: ${nome}`,
    valor: valorVenda,
    categoria: 'Venda de Produto',
    data: dataLanc,
    criadoPor: userId || null,
  });
} 
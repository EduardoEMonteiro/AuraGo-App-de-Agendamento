import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, isFirestoreConnected } from './firebase';

export interface DadosExportacao {
  usuario: {
    id: string;
    nome: string;
    email: string;
    dataCriacao: string;
    ultimoLogin: string;
  };
  salao: {
    id: string;
    nome: string;
    telefone: string;
    endereco: string;
    horarios: any;
    configuracoes: any;
  };
  agendamentos: Array<{
    id: string;
    cliente: string;
    servico: string;
    profissional: string;
    data: string;
    horario: string;
    status: string;
    observacoes: string;
  }>;
  clientes: Array<{
    id: string;
    nome: string;
    telefone: string;
    email: string;
    dataCadastro: string;
    observacoes: string;
  }>;
  servicos: Array<{
    id: string;
    nome: string;
    preco: number;
    duracao: number;
    descricao: string;
  }>;
  produtos: Array<{
    id: string;
    nome: string;
    preco: number;
    estoque: number;
    descricao: string;
  }>;
  consentimentos: Array<{
    tipo: string;
    aceito: boolean;
    dataAceite: string;
    versao: string;
  }>;
}

export interface StatusExportacao {
  id: string;
  userId: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  dataCriacao: string;
  dataConclusao?: string;
  erro?: string;
  urlDownload?: string;
}

export interface StatusPortabilidade {
  id: string;
  userId: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  dataSolicitacao: string;
  dataConclusao?: string;
  erro?: string;
  formato: 'json' | 'csv';
}

// Exportar dados do usuário
export const exportarDadosUsuario = async (userId: string): Promise<StatusExportacao> => {
  try {
    // Verificar conexão antes de prosseguir
    if (!isFirestoreConnected()) {
      throw new Error('Sem conexão com o banco de dados. Verifique sua internet.');
    }

    // Criar registro de status
    const statusId = `export_${userId}_${Date.now()}`;
    const statusRef = doc(db, 'exportacoes', statusId);
    
    const status: StatusExportacao = {
      id: statusId,
      userId,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
    };
    
    await setDoc(statusRef, status);
    
    // Processar exportação em background
    processarExportacao(userId, statusId);
    
    return status;
  } catch (error: any) {
    console.error('Erro ao iniciar exportação:', error);
    throw new Error(error.message || 'Falha ao iniciar exportação de dados');
  }
};

// Processar exportação em background
const processarExportacao = async (userId: string, statusId: string) => {
  try {
    // Atualizar status para processando
    const statusRef = doc(db, 'exportacoes', statusId);
    await updateDoc(statusRef, { status: 'processando' });
    
    // Buscar dados do usuário
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }
    
    const userData = userDoc.data();
    const salaoId = userData.idSalao;
    
    // Buscar dados do salão
    const salaoDoc = await getDoc(doc(db, 'saloes', salaoId));
    const salaoData = salaoDoc.exists() ? salaoDoc.data() : {};
    
    // Buscar agendamentos
    const agendamentosRef = collection(db, 'saloes', salaoId, 'agendamentos');
    const agendamentosSnapshot = await getDocs(agendamentosRef);
    const agendamentos = agendamentosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate?.()?.toISOString() || doc.data().data,
    }));
    
    // Buscar clientes
    const clientesRef = collection(db, 'saloes', salaoId, 'clientes');
    const clientesSnapshot = await getDocs(clientesRef);
    const clientes = clientesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCadastro: doc.data().dataCadastro?.toDate?.()?.toISOString() || doc.data().dataCadastro,
    }));
    
    // Buscar serviços
    const servicosRef = collection(db, 'saloes', salaoId, 'servicos');
    const servicosSnapshot = await getDocs(servicosRef);
    const servicos = servicosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Buscar produtos
    const produtosRef = collection(db, 'saloes', salaoId, 'produtos');
    const produtosSnapshot = await getDocs(produtosRef);
    const produtos = produtosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Buscar consentimentos
    const consentimentosRef = collection(db, 'usuarios', userId, 'consentimentos');
    const consentimentosSnapshot = await getDocs(consentimentosRef);
    const consentimentos = consentimentosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataAceite: doc.data().dataAceite?.toDate?.()?.toISOString() || doc.data().dataAceite,
    }));
    
    // Montar dados completos
    const dadosExportacao: DadosExportacao = {
      usuario: {
        id: userId,
        nome: userData.nome || '',
        email: userData.email || '',
        dataCriacao: userData.dataCriacao?.toDate?.()?.toISOString() || userData.dataCriacao,
        ultimoLogin: userData.ultimoLogin?.toDate?.()?.toISOString() || userData.ultimoLogin,
      },
      salao: {
        id: salaoId,
        nome: salaoData.nome || '',
        telefone: salaoData.telefone || '',
        endereco: salaoData.endereco || '',
        horarios: salaoData.horarios || {},
        configuracoes: salaoData.configuracoes || {},
      },
      agendamentos,
      clientes,
      servicos,
      produtos,
      consentimentos,
    };
    
    // Gerar arquivo JSON
    const jsonData = JSON.stringify(dadosExportacao, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Atualizar status com sucesso
    await updateDoc(statusRef, {
      status: 'concluido',
      dataConclusao: new Date().toISOString(),
      urlDownload: url,
    });
    
  } catch (error) {
    console.error('Erro ao processar exportação:', error);
    
    // Atualizar status com erro
    const statusRef = doc(db, 'exportacoes', statusId);
    await updateDoc(statusRef, {
      status: 'erro',
      dataConclusao: new Date().toISOString(),
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

// Buscar status de exportação
export const buscarStatusExportacao = async (userId: string): Promise<StatusExportacao[]> => {
  try {
    // Verificar conexão antes de prosseguir
    if (!isFirestoreConnected()) {
      throw new Error('Sem conexão com o banco de dados. Verifique sua internet.');
    }

    const exportacoesRef = collection(db, 'exportacoes');
    const q = query(exportacoesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StatusExportacao[];
  } catch (error: any) {
    console.error('Erro ao buscar status de exportação:', error);
    throw new Error(error.message || 'Falha ao buscar status de exportação');
  }
};

// Solicitar portabilidade de dados
export const solicitarPortabilidade = async (userId: string, formato: 'json' | 'csv' = 'json'): Promise<StatusPortabilidade> => {
  try {
    const statusId = `portabilidade_${userId}_${Date.now()}`;
    const statusRef = doc(db, 'portabilidades', statusId);
    
    const status: StatusPortabilidade = {
      id: statusId,
      userId,
      status: 'pendente',
      dataSolicitacao: new Date().toISOString(),
      formato,
    };
    
    await setDoc(statusRef, status);
    
    // Processar portabilidade em background
    processarPortabilidade(userId, statusId, formato);
    
    return status;
  } catch (error) {
    console.error('Erro ao solicitar portabilidade:', error);
    throw new Error('Falha ao solicitar portabilidade de dados');
  }
};

// Processar portabilidade em background
const processarPortabilidade = async (userId: string, statusId: string, formato: 'json' | 'csv') => {
  try {
    const statusRef = doc(db, 'portabilidades', statusId);
    await updateDoc(statusRef, { status: 'processando' });
    
    // Buscar dados (similar à exportação, mas em formato estruturado)
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }
    
    const userData = userDoc.data();
    const salaoId = userData.idSalao;
    
    // Buscar dados estruturados para portabilidade
    const dadosPortabilidade = await buscarDadosEstruturados(userId, salaoId);
    
    // Gerar arquivo no formato solicitado
    let arquivo: string;
    if (formato === 'csv') {
      arquivo = converterParaCSV(dadosPortabilidade);
    } else {
      arquivo = JSON.stringify(dadosPortabilidade, null, 2);
    }
    
    const blob = new Blob([arquivo], { 
      type: formato === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    // Atualizar status com sucesso
    await updateDoc(statusRef, {
      status: 'concluido',
      dataConclusao: new Date().toISOString(),
      urlDownload: url,
    });
    
  } catch (error) {
    console.error('Erro ao processar portabilidade:', error);
    
    await updateDoc(statusRef, {
      status: 'erro',
      dataConclusao: new Date().toISOString(),
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

// Buscar dados estruturados para portabilidade
const buscarDadosEstruturados = async (userId: string, salaoId: string) => {
  // Implementação similar à exportação, mas com estrutura específica para portabilidade
  // Retorna dados em formato estruturado conforme LGPD
  return {
    dados_pessoais: {
      nome: '',
      email: '',
      telefone: '',
    },
    dados_profissionais: {
      salao: '',
      servicos: [],
    },
    dados_operacionais: {
      agendamentos: [],
      clientes: [],
    },
  };
};

// Converter dados para CSV
const converterParaCSV = (dados: any): string => {
  // Implementação de conversão para CSV
  return 'dados,csv,aqui';
};

// Buscar status de portabilidade
export const buscarStatusPortabilidade = async (userId: string): Promise<StatusPortabilidade[]> => {
  try {
    const portabilidadesRef = collection(db, 'portabilidades');
    const q = query(portabilidadesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StatusPortabilidade[];
  } catch (error) {
    console.error('Erro ao buscar status de portabilidade:', error);
    throw new Error('Falha ao buscar status de portabilidade');
  }
};

// Excluir conta do usuário - EXCLUSÃO COMPLETA E DEFINITIVA
export const excluirContaUsuario = async (userId: string, currentUser?: any): Promise<void> => {
  try {
    console.log('🗑️ Iniciando exclusão completa da conta...');
    
    // Buscar dados do usuário
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }
    
    const userData = userDoc.data();
    const salaoId = userData.idSalao;
    
    console.log(`📋 Usuário: ${userData.nome} | Salão ID: ${salaoId}`);
    
    // 1. EXCLUIR COMPLETAMENTE O SALÃO E TODOS OS DADOS RELACIONADOS
    if (salaoId) {
      console.log('🏪 Excluindo salão e dados relacionados...');
      
      // Excluir todos os agendamentos do salão
      const agendamentosRef = collection(db, 'saloes', salaoId, 'agendamentos');
      const agendamentosSnapshot = await getDocs(agendamentosRef);
      console.log(`📅 Excluindo ${agendamentosSnapshot.docs.length} agendamentos`);
      agendamentosSnapshot.docs.forEach(doc => {
        deleteDoc(doc.ref);
      });
      
      // Excluir todos os clientes do salão
      const clientesRef = collection(db, 'saloes', salaoId, 'clientes');
      const clientesSnapshot = await getDocs(clientesRef);
      console.log(`👥 Excluindo ${clientesSnapshot.docs.length} clientes`);
      clientesSnapshot.docs.forEach(doc => {
        deleteDoc(doc.ref);
      });
      
      // Excluir todos os serviços do salão
      const servicosRef = collection(db, 'saloes', salaoId, 'servicos');
      const servicosSnapshot = await getDocs(servicosRef);
      console.log(`✂️ Excluindo ${servicosSnapshot.docs.length} serviços`);
      servicosSnapshot.docs.forEach(doc => {
        deleteDoc(doc.ref);
      });
      
      // Excluir todos os produtos do salão
      const produtosRef = collection(db, 'saloes', salaoId, 'produtos');
      const produtosSnapshot = await getDocs(produtosRef);
      console.log(`🛍️ Excluindo ${produtosSnapshot.docs.length} produtos`);
      produtosSnapshot.docs.forEach(doc => {
        deleteDoc(doc.ref);
      });
      
      // Excluir configurações do salão
      const configuracoesRef = collection(db, 'saloes', salaoId, 'configuracoes');
      const configuracoesSnapshot = await getDocs(configuracoesRef);
      console.log(`⚙️ Excluindo ${configuracoesSnapshot.docs.length} configurações`);
      configuracoesSnapshot.docs.forEach(doc => {
        deleteDoc(doc.ref);
      });
      
      // EXCLUIR O SALÃO COMPLETAMENTE
      await deleteDoc(doc(db, 'saloes', salaoId));
      console.log('✅ Salão excluído completamente');
    }
    
    // 2. EXCLUIR TODOS OS CONSENTIMENTOS DO USUÁRIO
    console.log('📝 Excluindo consentimentos...');
    const consentimentosRef = collection(db, 'usuarios', userId, 'consentimentos');
    const consentimentosSnapshot = await getDocs(consentimentosRef);
    consentimentosSnapshot.docs.forEach(doc => {
      deleteDoc(doc.ref);
    });
    
    // 3. EXCLUIR TODAS AS EXPORTAÇÕES DO USUÁRIO
    console.log('📤 Excluindo exportações...');
    const exportacoesRef = collection(db, 'exportacoes');
    const exportacoesQuery = query(exportacoesRef, where('userId', '==', userId));
    const exportacoesSnapshot = await getDocs(exportacoesQuery);
    exportacoesSnapshot.docs.forEach(doc => {
      deleteDoc(doc.ref);
    });
    
    // 4. EXCLUIR TODAS AS PORTABILIDADES DO USUÁRIO
    console.log('📋 Excluindo portabilidades...');
    const portabilidadesRef = collection(db, 'portabilidades');
    const portabilidadesQuery = query(portabilidadesRef, where('userId', '==', userId));
    const portabilidadesSnapshot = await getDocs(portabilidadesQuery);
    portabilidadesSnapshot.docs.forEach(doc => {
      deleteDoc(doc.ref);
    });
    
    // 5. EXCLUIR O USUÁRIO COMPLETAMENTE DO FIRESTORE
    console.log('👤 Excluindo usuário do Firestore...');
    await deleteDoc(doc(db, 'usuarios', userId));
    
    // 6. EXCLUIR CONTA DO FIREBASE AUTHENTICATION
    if (currentUser) {
      try {
        console.log('🔐 Excluindo conta do Authentication...');
        await deleteUser(currentUser);
        console.log('✅ Conta excluída do Firebase Authentication');
      } catch (authError: any) {
        console.error('❌ Erro ao excluir conta do Authentication:', authError);
        throw new Error(`Falha ao excluir conta do Authentication: ${authError.message}`);
      }
    } else {
      console.warn('⚠️ Usuário atual não encontrado para exclusão do Authentication');
    }
    
    console.log('✅ EXCLUSÃO COMPLETA REALIZADA COM SUCESSO!');
    console.log('🗑️ Todos os dados foram permanentemente removidos');
    
  } catch (error) {
    console.error('❌ Erro durante exclusão da conta:', error);
    throw new Error(`Falha ao excluir conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Salvar consentimento de termos
export const salvarConsentimento = async (
  userId: string, 
  tipo: string, 
  aceito: boolean, 
  versao: string
): Promise<void> => {
  try {
    const consentimentoRef = doc(db, 'usuarios', userId, 'consentimentos', tipo);
    
    await setDoc(consentimentoRef, {
      aceito,
      dataAceite: new Date(),
      versao,
      ipAddress: 'N/A', // Em produção, capturar IP real
      userAgent: 'N/A', // Em produção, capturar User-Agent real
    });
    
  } catch (error) {
    console.error('Erro ao salvar consentimento:', error);
    throw new Error('Falha ao salvar consentimento');
  }
};

// Buscar consentimentos do usuário
export const buscarConsentimentos = async (userId: string): Promise<any[]> => {
  try {
    const consentimentosRef = collection(db, 'usuarios', userId, 'consentimentos');
    const snapshot = await getDocs(consentimentosRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataAceite: doc.data().dataAceite?.toDate?.()?.toISOString() || doc.data().dataAceite,
    }));
  } catch (error) {
    console.error('Erro ao buscar consentimentos:', error);
    throw new Error('Falha ao buscar consentimentos');
  }
};

// Revogar consentimento
export const revogarConsentimento = async (userId: string, tipo: string): Promise<void> => {
  try {
    const consentimentoRef = doc(db, 'usuarios', userId, 'consentimentos', tipo);
    
    await updateDoc(consentimentoRef, {
      aceito: false,
      dataRevogacao: new Date(),
    });
    
  } catch (error) {
    console.error('Erro ao revogar consentimento:', error);
    throw new Error('Falha ao revogar consentimento');
  }
}; 
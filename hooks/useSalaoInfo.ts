import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';
import {
    canAddCliente,
    canAddProduto,
    canAddProfissional,
    canAddServico,
    getLimitMessage,
    getPlanoInfo,
    hasAgendamentoAvancado,
    hasBackupAutomatico,
    hasIntegracaoWhatsapp,
    hasRelatoriosAvancados
} from '../utils/planLimitations';

interface SalaoInfo {
  id: string;
  nome: string;
  telefone: string;
  responsavel: string;
  plano: string;
  mensagemWhatsapp: string;
  horarioFuncionamento: any;
  formasPagamento: string[];
  stripeCustomerId?: string;
  statusAssinatura?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento?: string;
  };
}

export function useSalaoInfo() {
  const { user, updateUserPlano } = useAuthStore();
  const [salaoInfo, setSalaoInfo] = useState<SalaoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reloadCountRef = useRef(0);

  const loadSalaoInfo = useCallback(async () => {
    console.log('SalaoInfo - loadSalaoInfo chamado, user.idSalao:', user?.idSalao);
    if (!user?.idSalao) {
      console.log('SalaoInfo - Usuário sem idSalao, finalizando');
      setLoading(false);
      setSalaoInfo(null);
      return;
    }

    try {
      const salaoDoc = await getDoc(doc(db, 'saloes', user.idSalao));
      if (salaoDoc.exists()) {
        const data = { id: salaoDoc.id, ...salaoDoc.data() } as SalaoInfo;
        console.log('SalaoInfo - Dados do salão carregados:', data);
        setSalaoInfo(data);
        
        // Atualiza o plano do usuário no Zustand baseado nos dados do salão
        updateUserPlano(data);
        
        // REMOVIDO: Recarregamento automático que causava loop
        // Se o salão não tem plano ativo, não recarrega automaticamente
        console.log('SalaoInfo - Dados carregados, sem recarregamento automático');
      } else {
        setError('Salão não encontrado');
        setSalaoInfo(null);
      }
    } catch (err) {
      setError('Erro ao carregar informações do salão');
      console.error('Erro ao carregar salão:', err);
      setSalaoInfo(null);
    } finally {
      setLoading(false);
    }
  }, [user?.idSalao]);

  useEffect(() => {
    console.log('SalaoInfo - useEffect disparado, user.idSalao:', user?.idSalao);
    loadSalaoInfo();
    
    // Cleanup function para limpar timer quando componente desmontar
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, [loadSalaoInfo]);

  // Funções de verificação de limitações
  const canAddMoreProfissionais = (quantidadeAtual: number) => {
    if (!salaoInfo?.plano) return false;
    return canAddProfissional(salaoInfo.plano, quantidadeAtual);
  };

  const canAddMoreClientes = (quantidadeAtual: number) => {
    if (!salaoInfo?.plano) return false;
    return canAddCliente(salaoInfo.plano, quantidadeAtual);
  };

  const canAddMoreServicos = (quantidadeAtual: number) => {
    if (!salaoInfo?.plano) return false;
    return canAddServico(salaoInfo.plano, quantidadeAtual);
  };

  const canAddMoreProdutos = (quantidadeAtual: number) => {
    if (!salaoInfo?.plano) return false;
    return canAddProduto(salaoInfo.plano, quantidadeAtual);
  };

  // Funções de verificação de recursos
  const hasAdvancedReports = () => {
    if (!salaoInfo?.plano) return false;
    return hasRelatoriosAvancados(salaoInfo.plano);
  };

  const hasWhatsAppIntegration = () => {
    if (!salaoInfo?.plano) return false;
    return hasIntegracaoWhatsapp(salaoInfo.plano);
  };

  const hasAutomaticBackup = () => {
    if (!salaoInfo?.plano) return false;
    return hasBackupAutomatico(salaoInfo.plano);
  };

  const hasAdvancedScheduling = () => {
    if (!salaoInfo?.plano) return false;
    return hasAgendamentoAvancado(salaoInfo.plano);
  };

  // Funções de mensagens
  const getLimitMessageFor = (tipo: 'profissionais' | 'clientes' | 'servicos' | 'produtos') => {
    if (!salaoInfo?.plano) return 'Plano não encontrado';
    return getLimitMessage(salaoInfo.plano, tipo);
  };

  const getCurrentPlanoInfo = () => {
    if (!salaoInfo?.plano) return null;
    return getPlanoInfo(salaoInfo.plano);
  };

  return {
    salaoInfo,
    loading,
    error,
    loadSalaoInfo,
    // Funções de verificação
    canAddMoreProfissionais,
    canAddMoreClientes,
    canAddMoreServicos,
    canAddMoreProdutos,
    // Funções de recursos
    hasAdvancedReports,
    hasWhatsAppIntegration,
    hasAutomaticBackup,
    hasAdvancedScheduling,
    // Funções de mensagens
    getLimitMessageFor,
    getCurrentPlanoInfo,
  };
} 
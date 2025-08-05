import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { useAuthStore } from '../contexts/useAuthStore';
import { cacheManager } from '../services/cacheManager';
import { performanceAnalytics } from '../services/performanceAnalytics';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  observacoes?: string;
  criadoEm: any;
  criadoPor: string;
}

interface Servico {
  id: string;
  nome: string;
  valor: number;
  duracao: number;
  cor: string;
  ativo: boolean;
  criadoEm: any;
  criadoPor: string;
}

interface DadosEstaticos {
  clientes: Cliente[];
  servicos: Servico[];
}

export function useDadosEstaticos() {
  const { user } = useAuthStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const cacheKey = `dados_estaticos_${user?.idSalao}`;

  const loadDadosEstaticos = useCallback(async () => {
    if (!user?.idSalao) {
      setLoading(false);
      setClientes([]);
      setServicos([]);
      return;
    }

    const timerId = performanceAnalytics.startTimer('dados_estaticos_loading');

    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cached = await cacheManager.get<DadosEstaticos>(cacheKey);
      if (cached) {
        performanceAnalytics.recordCacheHit();
        setClientes(cached.clientes);
        setServicos(cached.servicos);
        setLoading(false);
        setLastUpdate(new Date());
        performanceAnalytics.endTimer(timerId, { cacheHit: true });
        return;
      }

      performanceAnalytics.recordCacheMiss();

      // Buscar dados do Firestore
      const [clientesSnap, servicosSnap] = await Promise.all([
        getDocs(collection(db, 'saloes', user.idSalao, 'clientes')),
        getDocs(query(
          collection(db, 'saloes', user.idSalao, 'servicos'),
          where('ativo', '==', true),
          orderBy('nome', 'asc')
        ))
      ]);

      const clientesData = clientesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cliente[];

      const servicosData = servicosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Servico[];

      // Salvar no cache
      const dadosEstaticos: DadosEstaticos = {
        clientes: clientesData,
        servicos: servicosData
      };

      await cacheManager.set(cacheKey, dadosEstaticos, 60 * 60 * 1000); // 1 hora

      setClientes(clientesData);
      setServicos(servicosData);
      setLoading(false);
      setLastUpdate(new Date());

      performanceAnalytics.endTimer(timerId, { 
        cacheHit: false, 
        clientesCount: clientesData.length,
        servicosCount: servicosData.length
      });

      console.log(`📊 Dados estáticos carregados: ${clientesData.length} clientes, ${servicosData.length} serviços`);
    } catch (error) {
      console.error('❌ Erro ao carregar dados estáticos:', error);
      setError('Erro ao carregar dados estáticos');
      setLoading(false);
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
    }
  }, [user?.idSalao, cacheKey]);

  useEffect(() => {
    loadDadosEstaticos();
  }, [loadDadosEstaticos]);

  const refreshDadosEstaticos = useCallback(async () => {
    // Invalidar cache e recarregar
    await cacheManager.remove(cacheKey);
    await loadDadosEstaticos();
  }, [cacheKey, loadDadosEstaticos]);

  const addCliente = useCallback(async (novoCliente: Omit<Cliente, 'id' | 'criadoEm' | 'criadoPor'>) => {
    // Implementar adição de cliente
    // Por enquanto, apenas invalidar cache
    await cacheManager.remove(cacheKey);
    await loadDadosEstaticos();
  }, [cacheKey, loadDadosEstaticos]);

  const addServico = useCallback(async (novoServico: Omit<Servico, 'id' | 'criadoEm' | 'criadoPor'>) => {
    // Implementar adição de serviço
    // Por enquanto, apenas invalidar cache
    await cacheManager.remove(cacheKey);
    await loadDadosEstaticos();
  }, [cacheKey, loadDadosEstaticos]);

  return {
    clientes,
    servicos,
    loading,
    error,
    lastUpdate,
    refreshDadosEstaticos,
    addCliente,
    addServico
  };
} 